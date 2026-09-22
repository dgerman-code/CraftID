-- Permanent CraftID identity lifecycle:
-- * one entity keeps one CraftID number for its lifetime;
-- * archived records are recovered, never replaced, when the same verified
--   account identity returns;
-- * raw email is never stored in the CraftID identity registry;
-- * recovery uses an HMAC fingerprint with a DB-local random secret;
-- * ordinary owner changes remain prohibited.

-------------------------------------------------------------------------------
-- 1. Private identity continuity registry
-------------------------------------------------------------------------------

create table if not exists private.craftid_identity_secret (
  singleton boolean primary key default true check (singleton),
  secret bytea not null,
  created_at timestamptz not null default now()
);

insert into private.craftid_identity_secret(singleton, secret)
values (true, extensions.gen_random_bytes(32))
on conflict (singleton) do nothing;

revoke all on table private.craftid_identity_secret
from public, anon, authenticated;

create table if not exists private.craftid_identity_anchors (
  entity_id uuid primary key references public.craftid_entities(id) on delete restrict,
  entity_type text not null check (entity_type in ('professional','workshop')),
  recovery_email_fingerprint text not null,
  created_at timestamptz not null default now(),
  last_bound_at timestamptz not null default now(),
  last_recovered_at timestamptz
);

create unique index if not exists craftid_identity_anchors_fingerprint_type_uidx
on private.craftid_identity_anchors(recovery_email_fingerprint, entity_type);

revoke all on table private.craftid_identity_anchors
from public, anon, authenticated;

create or replace function private.craftid_identity_fingerprint(p_email text)
returns text
language sql
stable
security definer
set search_path = pg_catalog, private, extensions
as $$
  select case
    when nullif(lower(btrim(coalesce(p_email, ''))), '') is null then null
    else encode(
      extensions.hmac(
        convert_to(lower(btrim(p_email)), 'UTF8'),
        s.secret,
        'sha256'
      ),
      'hex'
    )
  end
  from private.craftid_identity_secret s
  where s.singleton = true;
$$;

revoke all on function private.craftid_identity_fingerprint(text)
from public, anon, authenticated;

-------------------------------------------------------------------------------
-- 2. Capture/refresh identity anchor whenever a CraftID is bound to an account
-------------------------------------------------------------------------------

create or replace function private.capture_craftid_identity_anchor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_email text;
  v_fingerprint text;
begin
  if new.owner_user_id is null then
    return new;
  end if;

  select u.email
    into v_email
  from auth.users u
  where u.id = new.owner_user_id;

  v_fingerprint := private.craftid_identity_fingerprint(v_email);

  if v_fingerprint is null then
    return new;
  end if;

  insert into private.craftid_identity_anchors(
    entity_id,
    entity_type,
    recovery_email_fingerprint,
    last_bound_at
  )
  values (
    new.id,
    new.entity_type,
    v_fingerprint,
    now()
  )
  on conflict (entity_id) do update
  set entity_type = excluded.entity_type,
      recovery_email_fingerprint = excluded.recovery_email_fingerprint,
      last_bound_at = now();

  return new;
end;
$$;

revoke all on function private.capture_craftid_identity_anchor()
from public, anon, authenticated;

drop trigger if exists craftid_entities_capture_identity_anchor
on public.craftid_entities;

create trigger craftid_entities_capture_identity_anchor
after insert or update of owner_user_id on public.craftid_entities
for each row execute function private.capture_craftid_identity_anchor();

-- Backfill all currently account-bound CraftIDs.
insert into private.craftid_identity_anchors(
  entity_id,
  entity_type,
  recovery_email_fingerprint,
  last_bound_at
)
select
  e.id,
  e.entity_type,
  private.craftid_identity_fingerprint(u.email),
  now()
from public.craftid_entities e
join auth.users u on u.id = e.owner_user_id
where private.craftid_identity_fingerprint(u.email) is not null
on conflict (entity_id) do update
set entity_type = excluded.entity_type,
    recovery_email_fingerprint = excluded.recovery_email_fingerprint,
    last_bound_at = now();

-------------------------------------------------------------------------------
-- 3. Entity identity fields stay immutable; account re-binding is recovery,
--    not transfer.
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
begin
  if new.id is distinct from old.id then
    raise exception 'CraftID entity id is immutable';
  end if;

  if new.craftid_number is distinct from old.craftid_number then
    raise exception 'CraftID number is immutable';
  end if;

  if new.craftid_check_digits is distinct from old.craftid_check_digits then
    raise exception 'CraftID check digits are immutable';
  end if;

  if new.entity_type is distinct from old.entity_type then
    raise exception 'CraftID entity type is immutable';
  end if;

  if new.owner_user_id is distinct from old.owner_user_id then
    -- FK-driven detachment is allowed only after the old auth account has
    -- actually been deleted.
    if new.owner_user_id is null and old.owner_user_id is not null then
      if exists (
        select 1 from auth.users u where u.id = old.owner_user_id
      ) then
        raise exception 'CraftID owner cannot be detached while the account exists';
      end if;

      return new;
    end if;

    -- Recovery is allowed only for an archived, ownerless CraftID and only
    -- back to an authenticated account with the same verified email
    -- fingerprint captured before account deletion.
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
-- 4. Same-owner Professional <-> Workshop relationship may be restored
-------------------------------------------------------------------------------

create or replace function private.link_same_owner_counterpart(
  p_owner_user_id uuid,
  p_new_entity_id uuid,
  p_new_entity_type text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_counterpart uuid;
  v_professional uuid;
  v_workshop uuid;
begin
  if p_new_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  select e.id
    into v_counterpart
  from public.craftid_entities e
  where e.owner_user_id = p_owner_user_id
    and e.entity_type <> p_new_entity_type
    and e.public_status <> 'archived'
  order by e.created_at asc
  limit 1;

  if v_counterpart is null then
    return;
  end if;

  if p_new_entity_type = 'professional' then
    v_professional := p_new_entity_id;
    v_workshop := v_counterpart;
  else
    v_professional := v_counterpart;
    v_workshop := p_new_entity_id;
  end if;

  insert into public.professional_workshop_relationships(
    professional_entity_id,
    workshop_entity_id,
    relationship_role,
    status,
    visibility,
    provenance_status,
    initiated_by_user_id,
    professional_confirmed_at,
    workshop_confirmed_at,
    source_note
  )
  values (
    v_professional,
    v_workshop,
    'owner',
    'active',
    'private',
    'self_declared',
    (select auth.uid()),
    now(),
    now(),
    'Both CraftID records are controlled by the same authenticated account.'
  )
  on conflict (professional_entity_id, workshop_entity_id, relationship_role)
  do update
  set status = 'active',
      visibility = 'private',
      ends_on = null,
      initiated_by_user_id = excluded.initiated_by_user_id,
      professional_confirmed_at = excluded.professional_confirmed_at,
      workshop_confirmed_at = excluded.workshop_confirmed_at,
      source_note = excluded.source_note,
      updated_at = now();
end;
$$;

revoke all on function private.link_same_owner_counterpart(uuid,uuid,text)
from public, anon, authenticated;

-------------------------------------------------------------------------------
-- 5. Creating a CraftID first checks for permanent identity continuity
-------------------------------------------------------------------------------

create or replace function private.create_own_craftid_impl(
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
  v_entity public.craftid_entities%rowtype;
  v_name text;
  v_number bigint;
  v_email text;
  v_email_confirmed_at timestamptz;
  v_fingerprint text;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  select u.email, u.email_confirmed_at
    into v_email, v_email_confirmed_at
  from auth.users u
  where u.id = v_user_id;

  v_fingerprint := private.craftid_identity_fingerprint(v_email);

  if exists (
    select 1
    from public.craftid_entities e
    where e.owner_user_id = v_user_id
      and e.entity_type = p_entity_type
      and e.public_status <> 'archived'
  ) then
    raise exception 'active CraftID of this type already exists';
  end if;

  -- A matching permanent identity anchor means this entity already has a
  -- CraftID. Never issue a replacement number.
  if v_fingerprint is not null then
    select e.*
      into v_entity
    from private.craftid_identity_anchors a
    join public.craftid_entities e on e.id = a.entity_id
    where a.recovery_email_fingerprint = v_fingerprint
      and a.entity_type = p_entity_type
    order by e.created_at asc
    limit 1;

    if v_entity.id is not null then
      if v_entity.public_status <> 'archived' then
        if v_entity.owner_user_id = v_user_id then
          raise exception 'active CraftID of this type already exists';
        end if;

        raise exception 'this identity already has an active CraftID';
      end if;

      if v_entity.owner_user_id is not null
         and v_entity.owner_user_id <> v_user_id then
        raise exception 'archived CraftID remains linked to another account';
      end if;

      if v_email_confirmed_at is null then
        raise exception 'confirm your email before recovering your archived CraftID';
      end if;

      update public.craftid_entities
      set owner_user_id = v_user_id,
          public_status = 'draft',
          archived_at = null,
          archived_reason = null,
          historical_resolver_enabled = false,
          updated_at = now()
      where id = v_entity.id
      returning * into v_entity;

      -- Recovery never silently republishes old privacy choices.
      update public.privacy_settings
      set show_profile_photo = false,
          show_city = false,
          show_languages = false,
          show_portfolio = false,
          show_qualifications = false,
          location_precision = 'country',
          updated_at = now()
      where entity_id = v_entity.id;

      update private.craftid_identity_anchors
      set last_bound_at = now(),
          last_recovered_at = now()
      where entity_id = v_entity.id;

      perform private.link_same_owner_counterpart(
        v_user_id,
        v_entity.id,
        p_entity_type
      );

      insert into public.audit_events(
        actor_user_id,
        entity_id,
        action,
        metadata
      )
      values (
        v_user_id,
        v_entity.id,
        'craftid_identity_recovered',
        jsonb_build_object(
          'same_craftid_retained', true,
          'public_status', 'draft',
          'privacy_reset_for_review', true
        )
      );

      return query
      select
        v_entity.id,
        v_entity.craftid_number,
        public.craftid_check_digits(v_entity.craftid_number);
      return;
    end if;
  end if;

  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  if v_name is null then
    v_name := case
      when p_entity_type = 'professional' then 'New professional'
      else 'New workshop'
    end;
  end if;

  v_number := private.next_available_craftid_number();

  insert into public.craftid_entities(craftid_number, entity_type, owner_user_id)
  values (v_number, p_entity_type, v_user_id)
  returning * into v_entity;

  if p_entity_type = 'professional' then
    insert into public.professional_profiles(entity_id, display_name)
    values (v_entity.id, v_name);
  else
    insert into public.workshop_profiles(entity_id, display_name)
    values (v_entity.id, v_name);
  end if;

  insert into public.privacy_settings(entity_id)
  values (v_entity.id);

  perform private.link_same_owner_counterpart(
    v_user_id,
    v_entity.id,
    p_entity_type
  );

  return query
  select
    v_entity.id,
    v_entity.craftid_number,
    public.craftid_check_digits(v_entity.craftid_number);
end;
$$;

revoke all on function private.create_own_craftid_impl(text,text)
from public, anon, authenticated;
grant execute on function private.create_own_craftid_impl(text,text)
to authenticated;

-------------------------------------------------------------------------------
-- 6. Account closure refreshes the recovery anchor before auth deletion
-------------------------------------------------------------------------------

create or replace function private.close_my_craftid_account_impl()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_fingerprint text;
  v_count integer := 0;
  v_address_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select u.email
    into v_email
  from auth.users u
  where u.id = v_user_id;

  v_fingerprint := private.craftid_identity_fingerprint(v_email);

  if v_fingerprint is null then
    raise exception 'account email is required to preserve CraftID recovery continuity';
  end if;

  insert into private.craftid_identity_anchors(
    entity_id,
    entity_type,
    recovery_email_fingerprint,
    last_bound_at
  )
  select
    e.id,
    e.entity_type,
    v_fingerprint,
    now()
  from public.craftid_entities e
  where e.owner_user_id = v_user_id
  on conflict (entity_id) do update
  set entity_type = excluded.entity_type,
      recovery_email_fingerprint = excluded.recovery_email_fingerprint,
      last_bound_at = now();

  update public.craftid_entities e
  set historical_display_name = coalesce(
        (select pp.display_name from public.professional_profiles pp where pp.entity_id = e.id),
        (select wp.display_name from public.workshop_profiles wp where wp.entity_id = e.id)
      ),
      historical_country_code = coalesce(
        (select pp.country_code from public.professional_profiles pp where pp.entity_id = e.id),
        (select wp.country_code from public.workshop_profiles wp where wp.entity_id = e.id)
      ),
      historical_resolver_enabled = true,
      archived_at = coalesce(e.archived_at, now()),
      archived_reason = 'account_closed',
      public_status = 'archived',
      updated_at = now()
  where e.owner_user_id = v_user_id
    and e.public_status <> 'archived';

  get diagnostics v_count = row_count;

  update public.entity_contact_points cp
  set show_in_public_profile = false,
      public_consent_at = null,
      share_with_institutional_partners = false,
      partner_sharing_consent_at = null,
      updated_at = now()
  where exists (
    select 1
    from public.craftid_entities e
    where e.id = cp.entity_id
      and e.owner_user_id = v_user_id
  );

  delete from public.entity_business_addresses a
  where exists (
    select 1
    from public.craftid_entities e
    where e.id = a.entity_id
      and e.owner_user_id = v_user_id
  );

  get diagnostics v_address_count = row_count;

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
  where exists (
      select 1
      from public.craftid_entities e
      where e.id = r.professional_entity_id
        and e.owner_user_id = v_user_id
    )
    or exists (
      select 1
      from public.craftid_entities e
      where e.id = r.workshop_entity_id
        and e.owner_user_id = v_user_id
    );

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_user_id,
    'craftid_account_closed',
    jsonb_build_object(
      'archived_entity_count', v_count,
      'exact_addresses_deleted', v_address_count,
      'historical_resolver_retained', true,
      'permanent_identity_anchor_retained', true,
      'login_account_deleted', true
    )
  );

  delete from auth.users where id = v_user_id;

  return v_count;
end;
$$;

revoke all on function private.close_my_craftid_account_impl()
from public, anon, authenticated;
grant execute on function private.close_my_craftid_account_impl()
to authenticated;
