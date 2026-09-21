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
--   * Privileges are the authorization boundary: end-user roles lose the
--     grants that made these writes possible.
--   * Triggers are used only for invariants that no role may break
--     (immutable identity and immutable requester-authored content).
--   * public.admin_set_entity_public_status (SECURITY DEFINER, unchanged by
--     this migration) remains the only application path that changes
--     public_status; it keeps its row lock, mandatory reason and audit entry.
--   * No RLS policy is relaxed or removed by this migration.

------------------------------------------------------------------------------
-- H-1 / M-9: craftid_entities governance fields
------------------------------------------------------------------------------

-- H-1: no application code updates craftid_entities directly. Publication runs
-- through admin_set_entity_public_status and creation through
-- create_own_craftid / admin_assign_craftid_number, all SECURITY DEFINER and
-- therefore unaffected by this revoke.
revoke update on public.craftid_entities from authenticated;

-- M-9: entity_type is an invariant, not a permission question. The matching
-- profile row lives in a type-specific table and cannot follow a type change,
-- so no role may rewrite it.
create or replace function private.protect_entity_identity_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.entity_type is distinct from old.entity_type then
    raise exception 'entity_type is immutable after creation';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_entity_identity_fields() from public;

drop trigger if exists craftid_entities_protect_identity_fields on public.craftid_entities;
create trigger craftid_entities_protect_identity_fields
before update on public.craftid_entities
for each row execute function private.protect_entity_identity_fields();

------------------------------------------------------------------------------
-- H-4 / M-1: last-admin protection, serialized
------------------------------------------------------------------------------
-- Advisory lock key 90612026 is the CraftID staff-role governance lock: every
-- function that promotes, demotes or removes a row in private.staff_roles takes
-- it at transaction scope before counting admins, so two concurrent role
-- changes cannot both observe the same pre-change admin count and each leave
-- the platform with zero admins. The key is used only by the two functions
-- below.

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
-- Owners decide the outcome and may annotate it. handled_by / handled_at are
-- withheld from every end-user role and assigned by the trigger below, so a
-- client can neither name another actor nor invent a handling time.
grant update (status, owner_notes)
  on public.contact_requests to authenticated;

create or replace function private.protect_contact_request_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, auth
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

  -- Handling attribution is database-owned. Client-supplied values are always
  -- overwritten: on a status transition with the acting user and the server
  -- clock, otherwise with the values already stored.
  if new.status is distinct from old.status then
    new.handled_by := (select auth.uid());
    new.handled_at := now();
  else
    new.handled_by := old.handled_by;
    new.handled_at := old.handled_at;
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
-- Recipients decide the response and may annotate it. responded_by /
-- responded_at are withheld from every end-user role and assigned by the
-- trigger below.
grant update (status, owner_response_note)
  on public.institutional_referrals to authenticated;

create or replace function private.protect_referral_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, auth
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

  -- Response attribution is database-owned, on the same terms as
  -- contact_requests above.
  if new.status is distinct from old.status then
    new.responded_by := (select auth.uid());
    new.responded_at := now();
  else
    new.responded_by := old.responded_by;
    new.responded_at := old.responded_at;
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
-- drop trigger if exists craftid_entities_protect_identity_fields on public.craftid_entities;
-- drop trigger if exists contact_requests_protect_fields on public.contact_requests;
-- drop trigger if exists institutional_referrals_protect_fields on public.institutional_referrals;
-- drop function if exists private.protect_entity_identity_fields();
-- drop function if exists private.protect_contact_request_fields();
-- drop function if exists private.protect_referral_fields();
-- grant update (entity_type, public_status, updated_at) on public.craftid_entities to authenticated;
-- grant update on public.contact_requests to authenticated;
-- grant update on public.institutional_referrals to authenticated;
-- (the pre-phase-1 shape was table-wide UPDATE on both tables)
-- The two staff-role functions revert by re-running their previous definitions
-- from 20260920233940.
