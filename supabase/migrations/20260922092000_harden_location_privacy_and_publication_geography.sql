-- Location/privacy hardening:
-- * exact business addresses remain private data, not a public precision mode;
-- * location precision is limited to country/region/city;
-- * country codes are normalised/validated;
-- * users can explicitly clear stored business addresses;
-- * publication requires geography compatible with the chosen public precision.

-------------------------------------------------------------------------------
-- 1. Exact addresses remain private; remove misleading public precision state
-------------------------------------------------------------------------------

update public.privacy_settings
set location_precision = 'city',
    updated_at = now()
where location_precision = 'exact_business_location';

alter table public.privacy_settings
  drop constraint if exists privacy_settings_location_precision_check;

alter table public.privacy_settings
  add constraint privacy_settings_location_precision_check
  check (location_precision in ('country','region','city'));

-------------------------------------------------------------------------------
-- 2. Validate ISO alpha-2 country codes where supplied
-------------------------------------------------------------------------------

alter table public.professional_profiles
  drop constraint if exists professional_profiles_country_code_check;
alter table public.professional_profiles
  add constraint professional_profiles_country_code_check
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

alter table public.workshop_profiles
  drop constraint if exists workshop_profiles_country_code_check;
alter table public.workshop_profiles
  add constraint workshop_profiles_country_code_check
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

alter table public.entity_business_addresses
  drop constraint if exists entity_business_addresses_country_code_check;
alter table public.entity_business_addresses
  add constraint entity_business_addresses_country_code_check
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

-------------------------------------------------------------------------------
-- 3. Owners can clear optional exact business-address data
-------------------------------------------------------------------------------

drop policy if exists "owners can delete business address"
  on public.entity_business_addresses;
create policy "owners can delete business address"
on public.entity_business_addresses for delete
to authenticated
using (
  exists (
    select 1
    from public.craftid_entities e
    where e.id = entity_business_addresses.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

grant delete on public.entity_business_addresses to authenticated;

-------------------------------------------------------------------------------
-- 4. Publication geography must match public precision
-------------------------------------------------------------------------------

create or replace function private.publication_gate_failures(p_entity_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_type text;
  v_display_name text;
  v_role text;
  v_country text;
  v_region text;
  v_city text;
  v_precision text;
  v_failures text[] := array[]::text[];
begin
  select e.entity_type
    into v_type
  from public.craftid_entities e
  where e.id = p_entity_id;

  if v_type is null then
    return array['entity_not_found'];
  end if;

  if v_type = 'professional' then
    select pp.display_name, pp.professional_title, pp.country_code, pp.region, pp.city
      into v_display_name, v_role, v_country, v_region, v_city
    from public.professional_profiles pp
    where pp.entity_id = p_entity_id;
  else
    select wp.display_name, wp.craft_sector, wp.country_code, wp.region, wp.city
      into v_display_name, v_role, v_country, v_region, v_city
    from public.workshop_profiles wp
    where wp.entity_id = p_entity_id;
  end if;

  select ps.location_precision
    into v_precision
  from public.privacy_settings ps
  where ps.entity_id = p_entity_id;

  if nullif(btrim(coalesce(v_display_name, '')), '') is null then
    v_failures := array_append(v_failures, 'display_name');
  end if;

  if nullif(btrim(coalesce(v_role, '')), '') is null then
    v_failures := array_append(v_failures, 'professional_title_or_craft_sector');
  end if;

  if v_country is null or v_country !~ '^[A-Z]{2}$' then
    v_failures := array_append(v_failures, 'country_code');
  end if;

  if v_precision is null then
    v_failures := array_append(v_failures, 'privacy_settings');
  elsif v_precision = 'region'
        and nullif(btrim(coalesce(v_region, '')), '') is null then
    v_failures := array_append(v_failures, 'public_region');
  elsif v_precision = 'city'
        and nullif(btrim(coalesce(v_city, '')), '') is null then
    v_failures := array_append(v_failures, 'public_city');
  end if;

  if not exists (
    select 1
    from public.claims c
    where c.entity_id = p_entity_id
      and c.claim_type = 'skill'
  ) then
    v_failures := array_append(v_failures, 'skill_claim');
  end if;

  return v_failures;
end;
$$;

revoke all on function private.publication_gate_failures(uuid)
from public, anon;
grant execute on function private.publication_gate_failures(uuid)
to authenticated;
