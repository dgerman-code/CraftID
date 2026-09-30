-- Admin staff lookup by exact email.
-- Keeps auth.users inaccessible to the client while allowing Platform Admin
-- to find an existing CraftID authentication account before granting a role.

create or replace function private.admin_find_auth_user_by_email_impl(
  p_email text
)
returns table(
  user_id uuid,
  email text,
  staff_role text,
  created_at timestamptz,
  email_confirmed boolean
)
language plpgsql
security definer
set search_path = pg_catalog, auth, private
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'valid email is required';
  end if;

  return query
  select
    u.id,
    u.email::text,
    sr.role,
    u.created_at,
    (u.email_confirmed_at is not null)
  from auth.users u
  left join private.staff_roles sr on sr.user_id = u.id
  where lower(coalesce(u.email,'')) = v_email
  order by u.created_at asc
  limit 1;
end;
$$;

revoke all on function private.admin_find_auth_user_by_email_impl(text)
from public, anon, authenticated;

create or replace function public.admin_find_auth_user_by_email(
  p_email text
)
returns table(
  user_id uuid,
  email text,
  staff_role text,
  created_at timestamptz,
  email_confirmed boolean
)
language sql
security definer
set search_path = pg_catalog, private
as $$
  select * from private.admin_find_auth_user_by_email_impl(p_email);
$$;

revoke all on function public.admin_find_auth_user_by_email(text)
from public, anon;
grant execute on function public.admin_find_auth_user_by_email(text)
to authenticated;
