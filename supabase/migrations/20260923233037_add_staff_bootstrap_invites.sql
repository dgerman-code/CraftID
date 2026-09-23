-- One-time staff bootstrap invitations without storing raw email addresses.
-- A pending invitation is matched only after Supabase has confirmed ownership
-- of the account email. The pending fingerprint is deleted after consumption.

create table if not exists private.pending_staff_bootstrap (
  recovery_email_fingerprint text primary key,
  role text not null check (role in ('reviewer','admin')),
  created_at timestamptz not null default now()
);

revoke all on table private.pending_staff_bootstrap
from public, anon, authenticated;

create or replace function private.consume_pending_staff_bootstrap()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, private
as $$
declare
  v_fingerprint text;
  v_role text;
begin
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;

  v_fingerprint := private.craftid_identity_fingerprint(new.email);

  if v_fingerprint is null then
    return new;
  end if;

  select p.role
    into v_role
  from private.pending_staff_bootstrap p
  where p.recovery_email_fingerprint = v_fingerprint;

  if v_role is null then
    return new;
  end if;

  insert into private.staff_roles(user_id, role)
  values (new.id, v_role)
  on conflict (user_id) do update
  set role = excluded.role;

  delete from private.pending_staff_bootstrap
  where recovery_email_fingerprint = v_fingerprint;

  return new;
end;
$$;

revoke all on function private.consume_pending_staff_bootstrap()
from public, anon, authenticated;

drop trigger if exists auth_users_consume_staff_bootstrap on auth.users;

create trigger auth_users_consume_staff_bootstrap
after insert or update of email, email_confirmed_at on auth.users
for each row execute function private.consume_pending_staff_bootstrap();
