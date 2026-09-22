-- Harden account/entity ownership and add durable archived CraftID resolution.
-- This migration closes direct entity creation, makes lineage immutable, and
-- separates account closure from permanent CraftID identifier resolution.

-------------------------------------------------------------------------------
-- 1. CraftID identifiers and ownership are immutable after creation
-------------------------------------------------------------------------------

create or replace function private.protect_craftid_entity_identity()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, auth
as $
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
    -- The only ownership mutation allowed is FK-driven detachment when the
    -- authentication account itself is removed. End users cannot satisfy the
    -- entity UPDATE RLS check with owner_user_id = null.
    if not (new.owner_user_id is null and old.owner_user_id is not null and (select auth.uid()) is null) then
      raise exception 'CraftID owner cannot be changed through ordinary updates';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_craftid_entity_identity()
from public, anon, authenticated;

drop trigger if exists craftid_entities_protect_identity on public.craftid_entities;
create trigger craftid_entities_protect_identity
before update on public.craftid_entities
for each row execute function private.protect_craftid_entity_identity();

-------------------------------------------------------------------------------
-- 2. Claims and evidence cannot be silently re-parented between CraftIDs
-------------------------------------------------------------------------------

create or replace function private.protect_claim_entity_parent()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.entity_id is distinct from old.entity_id then
    raise exception 'claim entity_id is immutable';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_claim_entity_parent()
from public, anon, authenticated;

drop trigger if exists claims_protect_entity_parent on public.claims;
create trigger claims_protect_entity_parent
before update on public.claims
for each row execute function private.protect_claim_entity_parent();

create or replace function private.protect_evidence_entity_parent()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.owner_entity_id is distinct from old.owner_entity_id then
    raise exception 'evidence owner_entity_id is immutable';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_evidence_entity_parent()
from public, anon, authenticated;

drop trigger if exists evidence_items_protect_entity_parent on public.evidence_items;
create trigger evidence_items_protect_entity_parent
before update on public.evidence_items
for each row execute function private.protect_evidence_entity_parent();

-------------------------------------------------------------------------------
-- 3. Entity creation is RPC-only; clients cannot mint published records
-------------------------------------------------------------------------------

drop policy if exists "users can create their own entities" on public.craftid_entities;
revoke insert on public.craftid_entities from anon, authenticated;

-- The allocation sequence is an internal implementation detail.
revoke all privileges on sequence public.craftid_public_number_seq from anon, authenticated;

-- Future sequences created by postgres in public must not inherit client rights.
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

-------------------------------------------------------------------------------
-- 4. Archived CraftIDs survive deletion of the authentication account
-------------------------------------------------------------------------------

alter table public.craftid_entities
  add column if not exists archived_at timestamptz,
  add column if not exists archived_reason text,
  add column if not exists historical_resolver_enabled boolean not null default false,
  add column if not exists historical_display_name text,
  add column if not exists historical_country_code text;

alter table public.craftid_entities
  alter column owner_user_id drop not null;

do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
  from pg_constraint
  where conrelid = 'public.craftid_entities'::regclass
    and contype = 'f'
    and pg_get_constraintdef(oid) ilike '%owner_user_id%auth.users%';

  if v_constraint is not null then
    execute format('alter table public.craftid_entities drop constraint %I', v_constraint);
  end if;
end;
$$;

alter table public.craftid_entities
  add constraint craftid_entities_owner_user_id_fkey
  foreign key (owner_user_id)
  references auth.users(id)
  on delete set null;

create index if not exists craftid_entities_historical_resolver_idx
  on public.craftid_entities(historical_resolver_enabled, public_status, craftid_number);

-------------------------------------------------------------------------------
-- 5. Account closure archives records immediately but preserves a minimal
--    direct resolver for CraftID numbers already printed on products/documents.
-------------------------------------------------------------------------------

create or replace function private.close_my_craftid_account_impl()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  -- Snapshot only the minimum historical identity needed for direct CraftID
  -- resolution. Contacts, photos, biography, claims and evidence are not copied.
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

  -- Remove all public/partner contact disclosure immediately.
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

  -- Relationships belonging to the closing account stop being public.
  update public.professional_workshop_relationships r
  set status = case when r.status in ('active','pending') then 'ended' else r.status end,
      visibility = 'private',
      ends_on = coalesce(
        r.ends_on,
        case when r.starts_on is not null and r.starts_on > current_date then r.starts_on else current_date end
      ),
      updated_at = now()
  where exists (
      select 1 from public.craftid_entities e
      where e.id = r.professional_entity_id and e.owner_user_id = v_user_id
    )
    or exists (
      select 1 from public.craftid_entities e
      where e.id = r.workshop_entity_id and e.owner_user_id = v_user_id
    );

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_user_id,
    'craftid_account_closed',
    jsonb_build_object(
      'archived_entity_count', v_count,
      'historical_resolver_retained', true,
      'login_account_deleted', true
    )
  );

  -- Delete the authentication account only after the CraftID records have been
  -- archived and public disclosures switched off. The CraftID FK uses SET NULL,
  -- so the immutable identifiers remain as historical registry records.
  delete from auth.users where id = v_user_id;

  return v_count;
end;
$;

revoke all on function private.close_my_craftid_account_impl()
from public, anon, authenticated;
grant execute on function private.close_my_craftid_account_impl()
to authenticated;

create or replace function public.close_my_craftid_account()
returns integer
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.close_my_craftid_account_impl();
$$;

revoke all on function public.close_my_craftid_account()
from public, anon;
grant execute on function public.close_my_craftid_account()
to authenticated;

-------------------------------------------------------------------------------
-- 6. Minimal direct historical resolver; archived records remain absent from
--    Registry, Discover and Map because those surfaces use published entities.
-------------------------------------------------------------------------------

create or replace function public.historical_craftid_record(
  p_craftid_number bigint,
  p_check_digits text
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when e.id is null then null
    else jsonb_build_object(
      'craftid_number', e.craftid_number,
      'craftid_check_digits', e.craftid_check_digits,
      'entity_type', e.entity_type,
      'display_name', e.historical_display_name,
      'country_code', e.historical_country_code,
      'created_at', e.created_at,
      'archived_at', e.archived_at,
      'status', 'archived'
    )
  end
  from public.craftid_entities e
  where p_craftid_number is not null
    and p_craftid_number >= 1
    and p_check_digits is not null
    and p_check_digits = public.craftid_check_digits(p_craftid_number)
    and e.craftid_number = p_craftid_number
    and e.craftid_check_digits = p_check_digits
    and e.public_status = 'archived'
    and e.historical_resolver_enabled = true
  limit 1;
$$;

revoke all on function public.historical_craftid_record(bigint,text)
from public;
grant execute on function public.historical_craftid_record(bigint,text)
to anon, authenticated;

comment on function public.historical_craftid_record(bigint,text) is
  'Minimal direct resolver for archived CraftIDs retained for provenance. Archived records remain excluded from registry discovery and maps.';
