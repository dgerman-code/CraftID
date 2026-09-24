-- Restore execute grants after partner RPCs were recreated with logo_path.
-- Keep public wrappers SECURITY INVOKER-compatible with api_internal implementations.

revoke all on function api_internal.public_partner_organisations()
from public, anon, authenticated;
grant execute on function api_internal.public_partner_organisations()
to anon, authenticated, service_role;

revoke all on function api_internal.admin_partner_organisations()
from public, anon, authenticated;
grant execute on function api_internal.admin_partner_organisations()
to authenticated, service_role;

revoke all on function public.public_partner_organisations()
from public, anon, authenticated;
grant execute on function public.public_partner_organisations()
to anon, authenticated, service_role;

revoke all on function public.admin_partner_organisations()
from public, anon, authenticated;
grant execute on function public.admin_partner_organisations()
to authenticated, service_role;
