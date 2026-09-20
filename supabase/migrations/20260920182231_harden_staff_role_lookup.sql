alter table private.staff_roles enable row level security;

revoke all on private.staff_roles from authenticated;
grant select on private.staff_roles to authenticated;

drop policy if exists "users can read own staff role" on private.staff_roles;
create policy "users can read own staff role"
on private.staff_roles for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.current_staff_role()
returns text
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select sr.role
  from private.staff_roles sr
  where sr.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_staff_role() from public;
grant execute on function public.current_staff_role() to authenticated;
