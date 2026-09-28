-- Controlled duplicate-account resolution
-- Preserves CraftID permanence while allowing a Platform Admin to consolidate
-- access after an explicit identity/account review.
--
-- The workflow never merges Professional with Workshop records and never moves
-- claims/evidence between CraftID entities. One entity is retained as canonical;
-- the duplicate CraftID is archived as a minimal historical resolver.

-------------------------------------------------------------------------------
-- 1. Superseded login accounts
-------------------------------------------------------------------------------

create table if not exists private.account_supersessions (
  source_user_id uuid primary key references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete restrict,
  resolved_by_user_id uuid,
  reason text not null,
  created_at timestamptz not null default now(),
  check (source_user_id <> target_user_id)
);

revoke all on table private.account_supersessions
from public, anon, authenticated;

create index if not exists account_supersessions_target_idx
on private.account_supersessions(target_user_id);

create or replace function private.current_account_superseded_impl()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, private
as $$
  select exists (
    select 1
    from private.account_supersessions s
    where s.source_user_id = (select auth.uid())
  );
$$;

revoke all on function private.current_account_superseded_impl()
from public, anon, authenticated;

create or replace function public.current_account_superseded()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select private.current_account_superseded_impl();
$$;

revoke all on function public.current_account_superseded()
from public, anon;
grant execute on function public.current_account_superseded()
to authenticated;

-------------------------------------------------------------------------------
-- 2. Block new CraftIDs from a superseded login account
-------------------------------------------------------------------------------

create or replace function private.create_own_craftid_guarded(
  p_entity_type text,
  p_display_name text default null
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if exists (
    select 1
    from private.account_supersessions s
    where s.source_user_id = v_user_id
  ) then
    raise exception 'this login account has been consolidated; sign in with the retained CraftID account';
  end if;

  return query
  select *
  from private.create_own_craftid_impl(p_entity_type, p_display_name);
end;
$$;

revoke all on function private.create_own_craftid_guarded(text,text)
from public, anon, authenticated;

create or replace function public.create_own_craftid(
  p_entity_type text,
  p_display_name text default null
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select * from private.create_own_craftid_guarded(p_entity_type, p_display_name);
$$;

revoke all on function public.create_own_craftid(text,text)
from public, anon;
grant execute on function public.create_own_craftid(text,text)
to authenticated;

-------------------------------------------------------------------------------
-- 3. Allow owner re-binding only inside the guarded admin resolution RPC
-------------------------------------------------------------------------------

create or replace function private.protect_craftid_entity_identity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_request_user uuid := (select auth.uid());
  v_email text;
  v_email_confirmed_at timestamptz;
  v_fingerprint text;
  v_resolution_entity text := current_setting('craftid.account_resolution_entity', true);
begin
  if new.id is distinct from old.id then
    raise exception 'CraftID entity id is immutable';
  end if;

  if new.craftid_number is distinct from old.craftid_number then
    raise exception 'CraftID number is immutable';
  end if;

  if new.entity_type is distinct from old.entity_type then
    raise exception 'CraftID entity type is immutable';
  end if;

  if new.owner_user_id is distinct from old.owner_user_id then
    -- Explicit Platform Admin duplicate-resolution context. This is the only
    -- live-account-to-live-account ownership re-binding allowed by CraftID.
    if v_resolution_entity = old.id::text
       and private.has_staff_role(array['admin']) then
      return new;
    end if;

    if new.owner_user_id is null and old.owner_user_id is not null then
      if exists (
        select 1 from auth.users u where u.id = old.owner_user_id
      ) then
        raise exception 'CraftID owner cannot be detached while the account exists';
      end if;

      return new;
    end if;

    if old.owner_user_id is null
       and new.owner_user_id = v_request_user
       and old.public_status = 'archived' then

      select u.email, u.email_confirmed_at
        into v_email, v_email_confirmed_at
      from auth.users u
      where u.id = v_request_user;

      if v_email_confirmed_at is null then
        raise exception 'confirm your email before recovering an archived CraftID';
      end if;

      v_fingerprint := private.craftid_identity_fingerprint(v_email);

      if v_fingerprint is null or not exists (
        select 1
        from private.craftid_identity_anchors a
        where a.entity_id = old.id
          and a.entity_type = old.entity_type
          and a.recovery_email_fingerprint = v_fingerprint
      ) then
        raise exception 'archived CraftID identity does not match this account';
      end if;

      return new;
    end if;

    raise exception 'CraftID owner cannot be changed through ordinary updates';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_craftid_entity_identity()
from public, anon, authenticated;

-------------------------------------------------------------------------------
-- 4. Admin-only duplicate resolver
-------------------------------------------------------------------------------

create or replace function private.admin_resolve_duplicate_craftid_impl(
  p_keep_entity_id uuid,
  p_archive_entity_id uuid,
  p_target_user_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_keep public.craftid_entities%rowtype;
  v_archive public.craftid_entities%rowtype;
  v_keep_owner_before uuid;
  v_archive_owner_before uuid;
  v_source_user_id uuid;
  v_target_email text;
  v_target_confirmed_at timestamptz;
  v_rebound boolean := false;
  v_source_superseded boolean := false;
  v_keep_display_name text;
  v_keep_country_code text;
  v_archive_display_name text;
  v_archive_country_code text;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_keep_entity_id is null
     or p_archive_entity_id is null
     or p_target_user_id is null
     or p_keep_entity_id = p_archive_entity_id then
    raise exception 'keep, archive and target account selections are required';
  end if;

  if length(btrim(coalesce(p_reason,''))) < 12 then
    raise exception 'a clear administrative reason is required';
  end if;

  select *
    into v_keep
  from public.craftid_entities
  where id = p_keep_entity_id
  for update;

  select *
    into v_archive
  from public.craftid_entities
  where id = p_archive_entity_id
  for update;

  if v_keep.id is null or v_archive.id is null then
    raise exception 'CraftID record not found';
  end if;

  if v_keep.public_status = 'archived'
     or v_archive.public_status = 'archived' then
    raise exception 'duplicate resolution requires two non-archived CraftID records';
  end if;

  if v_keep.entity_type <> v_archive.entity_type then
    raise exception 'only duplicate CraftIDs of the same entity type can be resolved';
  end if;

  if v_keep.owner_user_id is null or v_archive.owner_user_id is null then
    raise exception 'both CraftID records must still be attached to login accounts';
  end if;

  if v_keep.owner_user_id = v_archive.owner_user_id then
    raise exception 'the two CraftID records already belong to the same login account';
  end if;

  if p_target_user_id <> v_keep.owner_user_id
     and p_target_user_id <> v_archive.owner_user_id then
    raise exception 'the retained login account must own one of the two CraftID records';
  end if;

  select u.email, u.email_confirmed_at
    into v_target_email, v_target_confirmed_at
  from auth.users u
  where u.id = p_target_user_id;

  if v_target_email is null then
    raise exception 'target login account not found';
  end if;

  if v_target_confirmed_at is null then
    raise exception 'target login email must be confirmed before duplicate resolution';
  end if;

  -- An issued certificate is a durable document. Force the administrator to
  -- review/revoke it explicitly before declaring its CraftID a duplicate.
  if exists (
    select 1
    from public.craftid_certificates c
    where c.entity_id = v_archive.id
      and c.status = 'issued'
  ) then
    raise exception 'duplicate CraftID has an issued certificate; review or revoke the certificate before resolution';
  end if;

  v_keep_owner_before := v_keep.owner_user_id;
  v_archive_owner_before := v_archive.owner_user_id;

  select
    coalesce(pp.display_name, wp.display_name),
    coalesce(pp.country_code, wp.country_code)
    into v_archive_display_name, v_archive_country_code
  from public.craftid_entities e
  left join public.professional_profiles pp on pp.entity_id = e.id
  left join public.workshop_profiles wp on wp.entity_id = e.id
  where e.id = v_archive.id;

  select
    coalesce(pp.display_name, wp.display_name),
    coalesce(pp.country_code, wp.country_code)
    into v_keep_display_name, v_keep_country_code
  from public.craftid_entities e
  left join public.professional_profiles pp on pp.entity_id = e.id
  left join public.workshop_profiles wp on wp.entity_id = e.id
  where e.id = v_keep.id;

  -- Archive the duplicate first. This frees the target account's unique
  -- Professional/Workshop slot before a canonical record is rebound.
  update public.craftid_entities
  set historical_display_name = coalesce(v_archive_display_name, historical_display_name),
      historical_country_code = coalesce(v_archive_country_code, historical_country_code),
      historical_resolver_enabled = true,
      archived_at = coalesce(archived_at, now()),
      archived_reason = 'duplicate_account_resolution',
      public_status = 'archived',
      updated_at = now()
  where id = v_archive.id;

  update public.entity_contact_points
  set show_in_public_profile = false,
      public_consent_at = null,
      share_with_institutional_partners = false,
      partner_sharing_consent_at = null,
      updated_at = now()
  where entity_id = v_archive.id;

  update public.professional_workshop_relationships r
  set status = case when r.status in ('active','pending') then 'ended' else r.status end,
      visibility = 'private',
      ends_on = coalesce(
        r.ends_on,
        case
          when r.starts_on is not null and r.starts_on > current_date
            then r.starts_on
          else current_date
        end
      ),
      updated_at = now()
  where r.professional_entity_id = v_archive.id
     or r.workshop_entity_id = v_archive.id;

  -- A duplicate archived CraftID remains historically resolvable but is not a
  -- future account-recovery anchor.
  delete from private.craftid_identity_anchors
  where entity_id = v_archive.id;

  if v_keep.owner_user_id <> p_target_user_id then
    if exists (
      select 1
      from public.craftid_entities e
      where e.owner_user_id = p_target_user_id
        and e.entity_type = v_keep.entity_type
        and e.public_status <> 'archived'
        and e.id <> v_archive.id
    ) then
      raise exception 'target account already has another active CraftID of this type';
    end if;

    perform set_config(
      'craftid.account_resolution_entity',
      v_keep.id::text,
      true
    );

    update public.craftid_entities
    set owner_user_id = p_target_user_id,
        public_status = 'draft',
        archived_at = null,
        archived_reason = null,
        historical_resolver_enabled = false,
        updated_at = now()
    where id = v_keep.id;

    -- A cross-account rebind never silently carries forward old disclosure
    -- consent. The CraftID itself stays the same; publication/privacy is reset.
    update public.privacy_settings
    set show_profile_photo = false,
        show_city = false,
        show_languages = false,
        show_portfolio = false,
        show_qualifications = false,
        location_precision = 'country',
        updated_at = now()
    where entity_id = v_keep.id;

    update public.entity_contact_points
    set show_in_public_profile = false,
        public_consent_at = null,
        share_with_institutional_partners = false,
        partner_sharing_consent_at = null,
        updated_at = now()
    where entity_id = v_keep.id;

    v_rebound := true;
  end if;

  -- End old same-owner links that no longer match account control.
  update public.professional_workshop_relationships r
  set status = case when r.status in ('active','pending') then 'ended' else r.status end,
      visibility = 'private',
      ends_on = coalesce(
        r.ends_on,
        case
          when r.starts_on is not null and r.starts_on > current_date
            then r.starts_on
          else current_date
        end
      ),
      updated_at = now()
  where r.relationship_role = 'owner'
    and (
      r.professional_entity_id = v_keep.id
      or r.workshop_entity_id = v_keep.id
    )
    and exists (
      select 1
      from public.craftid_entities other
      where other.id = case
        when r.professional_entity_id = v_keep.id then r.workshop_entity_id
        else r.professional_entity_id
      end
        and other.owner_user_id is distinct from p_target_user_id
    );

  perform private.link_same_owner_counterpart(
    p_target_user_id,
    v_keep.id,
    v_keep.entity_type
  );

  v_source_user_id := case
    when v_keep_owner_before = p_target_user_id
      then v_archive_owner_before
    else v_keep_owner_before
  end;

  -- Once the old login controls no active CraftID and is not a staff account,
  -- mark it as superseded so it cannot mint a new replacement identity later.
  if v_source_user_id is not null
     and not exists (
       select 1
       from public.craftid_entities e
       where e.owner_user_id = v_source_user_id
         and e.public_status <> 'archived'
     )
     and not exists (
       select 1
       from private.staff_roles sr
       where sr.user_id = v_source_user_id
     ) then

    insert into private.account_supersessions(
      source_user_id,
      target_user_id,
      resolved_by_user_id,
      reason
    )
    values (
      v_source_user_id,
      p_target_user_id,
      (select auth.uid()),
      btrim(p_reason)
    )
    on conflict (source_user_id) do update
    set target_user_id = excluded.target_user_id,
        resolved_by_user_id = excluded.resolved_by_user_id,
        reason = excluded.reason,
        created_at = now();

    v_source_superseded := true;
  end if;

  insert into public.audit_events(
    actor_user_id,
    entity_id,
    action,
    old_status,
    new_status,
    metadata
  )
  values (
    (select auth.uid()),
    v_archive.id,
    'craftid_duplicate_archived',
    v_archive.public_status,
    'archived',
    jsonb_build_object(
      'canonical_entity_id', v_keep.id,
      'target_user_id', p_target_user_id,
      'source_user_id', v_source_user_id,
      'reason', btrim(p_reason),
      'historical_resolver_retained', true,
      'claims_evidence_merged', false
    )
  );

  insert into public.audit_events(
    actor_user_id,
    entity_id,
    action,
    metadata
  )
  values (
    (select auth.uid()),
    v_keep.id,
    'craftid_duplicate_resolution_canonical',
    jsonb_build_object(
      'archived_duplicate_entity_id', v_archive.id,
      'previous_owner_user_id', v_keep_owner_before,
      'target_user_id', p_target_user_id,
      'owner_rebound', v_rebound,
      'public_status_reset_to_draft', v_rebound,
      'privacy_reset_for_review', v_rebound,
      'claims_evidence_merged', false,
      'reason', btrim(p_reason)
    )
  );

  if v_source_superseded then
    insert into public.audit_events(
      actor_user_id,
      action,
      metadata
    )
    values (
      (select auth.uid()),
      'craftid_login_account_superseded',
      jsonb_build_object(
        'source_user_id', v_source_user_id,
        'target_user_id', p_target_user_id,
        'reason', btrim(p_reason)
      )
    );
  end if;

  return jsonb_build_object(
    'kept_entity_id', v_keep.id,
    'archived_entity_id', v_archive.id,
    'target_user_id', p_target_user_id,
    'source_user_id', v_source_user_id,
    'owner_rebound', v_rebound,
    'source_account_superseded', v_source_superseded
  );
end;
$$;

revoke all on function private.admin_resolve_duplicate_craftid_impl(uuid,uuid,uuid,text)
from public, anon, authenticated;

create or replace function public.admin_resolve_duplicate_craftid(
  p_keep_entity_id uuid,
  p_archive_entity_id uuid,
  p_target_user_id uuid,
  p_reason text
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_resolve_duplicate_craftid_impl(
    p_keep_entity_id,
    p_archive_entity_id,
    p_target_user_id,
    p_reason
  );
$$;

revoke all on function public.admin_resolve_duplicate_craftid(uuid,uuid,uuid,text)
from public, anon;
grant execute on function public.admin_resolve_duplicate_craftid(uuid,uuid,uuid,text)
to authenticated;

-------------------------------------------------------------------------------
-- 5. Admin visibility into superseded accounts
-------------------------------------------------------------------------------

create or replace function public.admin_list_account_supersessions()
returns table(
  source_user_id uuid,
  source_email text,
  target_user_id uuid,
  target_email text,
  reason text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, auth, private
as $$
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  return query
  select
    s.source_user_id,
    source_user.email::text,
    s.target_user_id,
    target_user.email::text,
    s.reason,
    s.created_at
  from private.account_supersessions s
  left join auth.users source_user on source_user.id = s.source_user_id
  left join auth.users target_user on target_user.id = s.target_user_id
  order by s.created_at desc;
end;
$$;

revoke all on function public.admin_list_account_supersessions()
from public, anon;
grant execute on function public.admin_list_account_supersessions()
to authenticated;

comment on function public.admin_resolve_duplicate_craftid(uuid,uuid,uuid,text) is
  'Platform Admin only. Archives one duplicate same-type CraftID as historical, optionally rebinds the canonical CraftID to the retained login account, resets disclosure consent after rebind, and never merges claims/evidence.';
