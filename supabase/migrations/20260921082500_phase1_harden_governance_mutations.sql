-- Phase 1 remediation: close direct-write paths around governed state.
--
-- Covers audit findings:
--   H-1  owners could publish/suspend their own CraftID directly
--   H-4  the last admin could demote themselves (or the last peer) to reviewer
--   M-1  last-admin removal was a read-then-write race
--   M-7  owners could rewrite requester-controlled contact_request fields
--   M-8  referral recipients could rewrite requester-controlled referral fields
--   M-9  owners could change entity_type after the profile row was created
--
-- Design notes:
--   * Column-level grants are the primary control; triggers are the hard
--     boundary that survives a future over-broad grant.
--   * Governed status changes stay possible only through
--     public.admin_set_entity_public_status, which keeps the existing
--     row lock, mandatory reason and audit_events entry.
--   * No RLS policy is relaxed by this migration.

------------------------------------------------------------------------------
-- H-1 / M-9: craftid_entities governance fields
------------------------------------------------------------------------------

-- No application code updates craftid_entities directly; publication runs
-- through admin_set_entity_public_status and creation through
-- create_own_craftid / admin_assign_craftid_number (both SECURITY DEFINER).
revoke update on public.craftid_entities from authenticated;

create or replace function private.protect_entity_governance_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  -- entity_type is immutable once the entity exists: the matching profile row
  -- lives in a type-specific table and cannot follow a type change.
  if new.entity_type is distinct from old.entity_type then
    raise exception 'entity_type is immutable after creation';
  end if;

  -- public_status may only change inside admin_set_entity_public_status_impl,
  -- which sets the transaction-local marker below, or from a session with no
  -- end-user JWT (service_role / SQL console break-glass, already privileged).
  if new.public_status is distinct from old.public_status
     and coalesce(current_setting('craftid.governance_action', true), '') <> 'public_status'
     and (select auth.uid()) is not null then
    raise exception 'public_status may only be changed through admin_set_entity_public_status';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_entity_governance_fields() from public;

drop trigger if exists craftid_entities_protect_governance_fields on public.craftid_entities;
create trigger craftid_entities_protect_governance_fields
before update on public.craftid_entities
for each row execute function private.protect_entity_governance_fields();

-- Re-create the admin workflow so it announces itself to the trigger.
-- Behaviour is otherwise identical to 20260920233415.
create or replace function private.admin_set_entity_public_status_impl(
  p_entity_id uuid,
  p_new_status text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_old_status text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_new_status not in ('draft','published','suspended','archived') then
    raise exception 'invalid public status';
  end if;

  if v_reason is null then
    raise exception 'reason required';
  end if;

  select public_status into v_old_status
  from public.craftid_entities
  where id = p_entity_id
  for update;

  if v_old_status is null then
    raise exception 'CraftID entity not found';
  end if;

  if v_old_status = p_new_status then
    return;
  end if;

  -- Transaction-local marker consumed by
  -- private.protect_entity_governance_fields(). Reset immediately after the
  -- statement so it cannot cover any later update in the same transaction.
  perform set_config('craftid.governance_action', 'public_status', true);

  update public.craftid_entities
  set public_status = p_new_status,
      updated_at = now()
  where id = p_entity_id;

  perform set_config('craftid.governance_action', '', true);

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
    p_entity_id,
    'public_status_changed',
    v_old_status,
    p_new_status,
    jsonb_build_object('reason', v_reason)
  );
end;
$$;

revoke all on function private.admin_set_entity_public_status_impl(uuid,text,text) from public;
grant execute on function private.admin_set_entity_public_status_impl(uuid,text,text) to authenticated;

------------------------------------------------------------------------------
-- H-4 / M-1: last-admin protection, serialized
------------------------------------------------------------------------------
-- 90612026 is the CraftID advisory-lock key for private.staff_roles mutations.
-- A transaction-level advisory lock serializes every promote / demote / remove,
-- so the admin count read below cannot be stale by the time we write.

create or replace function private.admin_set_staff_role_impl(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_old_role text;
  v_admin_count integer;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_role not in ('reviewer','admin') then
    raise exception 'invalid staff role';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user not found';
  end if;

  perform pg_advisory_xact_lock(90612026);

  select role into v_old_role from private.staff_roles where user_id = p_user_id;

  -- Demoting an admin (including self-demotion) must leave at least one admin.
  if v_old_role = 'admin' and p_role <> 'admin' then
    select count(*) into v_admin_count from private.staff_roles where role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'cannot demote the last admin';
    end if;
  end if;

  insert into private.staff_roles(user_id, role)
  values (p_user_id, p_role)
  on conflict (user_id) do update set role = excluded.role;

  insert into public.audit_events(actor_user_id, action, old_status, new_status, metadata)
  values (
    (select auth.uid()),
    'staff_role_changed',
    v_old_role,
    p_role,
    jsonb_build_object('target_user_id', p_user_id)
  );
end;
$$;

revoke all on function private.admin_set_staff_role_impl(uuid,text) from public;
grant execute on function private.admin_set_staff_role_impl(uuid,text) to authenticated;

create or replace function private.admin_remove_staff_role_impl(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_old_role text;
  v_admin_count integer;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  perform pg_advisory_xact_lock(90612026);

  select role into v_old_role from private.staff_roles where user_id = p_user_id;
  if v_old_role is null then
    return;
  end if;

  if v_old_role = 'admin' then
    select count(*) into v_admin_count from private.staff_roles where role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'cannot remove the last admin';
    end if;
  end if;

  delete from private.staff_roles where user_id = p_user_id;

  insert into public.audit_events(actor_user_id, action, old_status, metadata)
  values (
    (select auth.uid()),
    'staff_role_removed',
    v_old_role,
    jsonb_build_object('target_user_id', p_user_id)
  );
end;
$$;

revoke all on function private.admin_remove_staff_role_impl(uuid) from public;
grant execute on function private.admin_remove_staff_role_impl(uuid) to authenticated;

------------------------------------------------------------------------------
-- M-7: contact_requests stay as the requester wrote them
------------------------------------------------------------------------------

revoke update on public.contact_requests from authenticated;
grant update (status, handled_at, handled_by, owner_notes)
  on public.contact_requests to authenticated;

create or replace function private.protect_contact_request_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id
    or new.target_entity_id is distinct from old.target_entity_id
    or new.requester_name is distinct from old.requester_name
    or new.requester_email is distinct from old.requester_email
    or new.requester_organisation is distinct from old.requester_organisation
    or new.requester_role is distinct from old.requester_role
    or new.message is distinct from old.message
    or new.purpose is distinct from old.purpose
    or new.submitted_at is distinct from old.submitted_at
    or new.created_at is distinct from old.created_at
  then
    raise exception 'contact request content is immutable; only handling fields may change';
  end if;

  -- Handling must be attributed to the acting user.
  if new.handled_by is distinct from old.handled_by
     and new.handled_by is not null
     and (select auth.uid()) is not null
     and new.handled_by <> (select auth.uid()) then
    raise exception 'handled_by must reference the acting user';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_contact_request_fields() from public;

drop trigger if exists contact_requests_protect_fields on public.contact_requests;
create trigger contact_requests_protect_fields
before update on public.contact_requests
for each row execute function private.protect_contact_request_fields();

------------------------------------------------------------------------------
-- M-8: institutional_referrals stay as the issuing admin wrote them
------------------------------------------------------------------------------

revoke update on public.institutional_referrals from authenticated;
grant update (status, owner_response_note, responded_at, responded_by)
  on public.institutional_referrals to authenticated;

create or replace function private.protect_referral_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id
    or new.target_entity_id is distinct from old.target_entity_id
    or new.created_by is distinct from old.created_by
    or new.requester_organisation is distinct from old.requester_organisation
    or new.requester_contact_name is distinct from old.requester_contact_name
    or new.requester_contact_email is distinct from old.requester_contact_email
    or new.opportunity_type is distinct from old.opportunity_type
    or new.title is distinct from old.title
    or new.message is distinct from old.message
    or new.response_deadline is distinct from old.response_deadline
    or new.created_at is distinct from old.created_at
  then
    raise exception 'referral invitation content is immutable; only response fields may change';
  end if;

  if new.responded_by is distinct from old.responded_by
     and new.responded_by is not null
     and (select auth.uid()) is not null
     and new.responded_by <> (select auth.uid()) then
    raise exception 'responded_by must reference the acting user';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_referral_fields() from public;

drop trigger if exists institutional_referrals_protect_fields on public.institutional_referrals;
create trigger institutional_referrals_protect_fields
before update on public.institutional_referrals
for each row execute function private.protect_referral_fields();

------------------------------------------------------------------------------
-- Rollback reference (do not run unless reverting this migration)
------------------------------------------------------------------------------
-- drop trigger if exists craftid_entities_protect_governance_fields on public.craftid_entities;
-- drop trigger if exists contact_requests_protect_fields on public.contact_requests;
-- drop trigger if exists institutional_referrals_protect_fields on public.institutional_referrals;
-- drop function if exists private.protect_entity_governance_fields();
-- drop function if exists private.protect_contact_request_fields();
-- drop function if exists private.protect_referral_fields();
-- grant update (entity_type, public_status, updated_at) on public.craftid_entities to authenticated;
-- grant update on public.contact_requests to authenticated;
-- grant update on public.institutional_referrals to authenticated;
-- The four SECURITY DEFINER functions revert by re-running their previous
-- definitions from 20260920233415 and 20260920233940.
