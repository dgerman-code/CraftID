drop view if exists public.public_contact_links;

create policy "anon can read only public safe links"
on public.entity_contact_points for select
to anon
using (
  show_in_public_profile = true
  and contact_type in ('website','linkedin','portfolio')
);

grant select on public.entity_contact_points to anon;

create view public.public_contact_links
with (security_invoker = true, security_barrier = true)
as
select
  id,
  entity_id,
  contact_type,
  value,
  verification_level,
  verified_at,
  last_checked_at,
  verification_expires_at
from public.entity_contact_points
where show_in_public_profile = true
  and contact_type in ('website','linkedin','portfolio');

grant select on public.public_contact_links to anon, authenticated;
