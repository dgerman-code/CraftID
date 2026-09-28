-- Account integrity phase 1
-- - keep permanent CraftID records attached when a user changes login email;
-- - refresh the private recovery fingerprint only after Supabase Auth accepts
--   the email change;
-- - give Platform Admins a private account/entity integrity overview;
-- - never infer or auto-merge people across different email accounts.

-------------------------------------------------------------------------------
-- 1. Keep identity recovery continuity in sync with the current login email
-------------------------------------------------------------------------------

create or replace function private.sync_craftid_identity_anchor_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_fingerprint text;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;

  v_fingerprint := private.craftid_identity_fingerprint(new.email);

  if v_fingerprint is null then
    return new;
  end if;

  -- A verified login email may not silently take over an identity anchor
  -- already used by another account/entity of the same type.
  if exists (
    select 1
    from private.craftid_identity_anchors a
    join public.craftid_entities e on e.id = a.entity_id
    where a.recovery_email_fingerprint = v_fingerprint
      and e.owner_user_id is distinct from new.id
  ) then
    raise exception 'this email is already linked to another CraftID identity';
  end if;

  insert into private.craftid_identity_anchors(
    entity_id,
    entity_type,
    recovery_email_fingerprint,
    created_at,
    last_bound_at
  )
  select
    e.id,
    e.entity_type,
    v_fingerprint,
    now(),
    now()
  from public.craftid_entities e
  where e.owner_user_id = new.id
  on conflict (entity_id) do update
  set entity_type = excluded.entity_type,
      recovery_email_fingerprint = excluded.recovery_email_fingerprint,
      last_bound_at = now();

  insert into public.audit_events(
    actor_user_id,
    action,
    metadata
  )
  values (
    new.id,
    'account_email_changed',
    jsonb_build_object(
      'identity_anchor_refreshed', true,
      'craftid_numbers_unchanged', true
    )
  );

  return new;
end;
$$;

revoke all on function private.sync_craftid_identity_anchor_email()
from public, anon, authenticated;

drop trigger if exists craftid_auth_email_continuity
on auth.users;

create trigger craftid_auth_email_continuity
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.sync_craftid_identity_anchor_email();

-------------------------------------------------------------------------------
-- 2. Admin-only account/entity integrity overview
-------------------------------------------------------------------------------

create or replace function public.admin_list_account_integrity()
returns table(
  user_id uuid,
  email text,
  email_confirmed boolean,
  account_created_at timestamptz,
  last_sign_in_at timestamptz,
  active_entity_count bigint,
  archived_entity_count bigint,
  professional_entity_id uuid,
  professional_craftid_number bigint,
  professional_check_digits text,
  professional_status text,
  workshop_entity_id uuid,
  workshop_craftid_number bigint,
  workshop_check_digits text,
  workshop_status text
)
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
begin
  if not exists (
    select 1
    from private.staff_roles sr
    where sr.user_id = (select auth.uid())
      and sr.role = 'admin'
  ) then
    raise exception 'admin access required';
  end if;

  return query
  select
    u.id,
    u.email::text,
    (u.email_confirmed_at is not null),
    u.created_at,
    u.last_sign_in_at,
    (
      select count(*)
      from public.craftid_entities e
      where e.owner_user_id = u.id
        and e.public_status <> 'archived'
    )::bigint,
    (
      select count(*)
      from public.craftid_entities e
      where e.owner_user_id = u.id
        and e.public_status = 'archived'
    )::bigint,
    p.id,
    p.craftid_number,
    p.craftid_check_digits,
    p.public_status,
    w.id,
    w.craftid_number,
    w.craftid_check_digits,
    w.public_status
  from auth.users u
  left join lateral (
    select
      e.id,
      e.craftid_number,
      e.craftid_check_digits,
      e.public_status
    from public.craftid_entities e
    where e.owner_user_id = u.id
      and e.entity_type = 'professional'
      and e.public_status <> 'archived'
    order by e.created_at asc
    limit 1
  ) p on true
  left join lateral (
    select
      e.id,
      e.craftid_number,
      e.craftid_check_digits,
      e.public_status
    from public.craftid_entities e
    where e.owner_user_id = u.id
      and e.entity_type = 'workshop'
      and e.public_status <> 'archived'
    order by e.created_at asc
    limit 1
  ) w on true
  where exists (
    select 1
    from public.craftid_entities e
    where e.owner_user_id = u.id
  )
  order by u.created_at asc;
end;
$$;

revoke all on function public.admin_list_account_integrity()
from public, anon;

grant execute on function public.admin_list_account_integrity()
to authenticated;

comment on function public.admin_list_account_integrity() is
  'Admin-only overview of authentication accounts and their active/archived CraftID records. Used for account-integrity review; it does not infer or merge identities.';
