-- Simplify CraftID partner organisation categories for the pilot.
-- Platform access remains admin/reviewer in private.staff_roles.
-- Partner organisations are either a national operator or a general partner.

update public.partner_organisations
set partner_role = case
  when partner_role = 'national_coordinating_partner' then 'national_operator'
  else 'partner'
end,
updated_at = now()
where partner_role not in ('national_operator','partner');

alter table public.partner_organisations
  drop constraint if exists partner_organisations_partner_role_check;

alter table public.partner_organisations
  add constraint partner_organisations_partner_role_check
  check (partner_role in ('national_operator','partner'));

create unique index if not exists partner_organisations_one_confirmed_national_operator_per_country
on public.partner_organisations(country_code)
where partner_role = 'national_operator'
  and status = 'confirmed';
