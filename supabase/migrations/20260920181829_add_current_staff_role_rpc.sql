create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, private
as $$
  select sr.role
  from private.staff_roles sr
  where sr.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_staff_role() from public;
grant execute on function public.current_staff_role() to authenticated;
