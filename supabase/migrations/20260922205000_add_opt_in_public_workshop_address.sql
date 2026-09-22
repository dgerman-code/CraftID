-- Optional publication of an exact Workshop business address.
-- Exact address storage and public disclosure remain separate decisions.
-- Professionals cannot publish an exact address through this mechanism.
-- The public Craft Skills Map remains aggregate/coarse and never consumes this field.

alter table public.entity_business_addresses
  add column if not exists show_in_public_profile boolean not null default false,
  add column if not exists public_consent_at timestamptz;

update public.entity_business_addresses
set show_in_public_profile = false,
    public_consent_at = null
where show_in_public_profile is distinct from false
   or public_consent_at is not null;

alter table public.entity_business_addresses
  drop constraint if exists entity_business_addresses_public_consent_check;

alter table public.entity_business_addresses
  add constraint entity_business_addresses_public_consent_check
  check (
    (show_in_public_profile = false and public_consent_at is null)
    or
    (show_in_public_profile = true and public_consent_at is not null)
  );

create or replace function private.validate_public_business_address()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_entity_type text;
begin
  if not new.show_in_public_profile then
    new.public_consent_at := null;
    return new;
  end if;

  select e.entity_type
    into v_entity_type
  from public.craftid_entities e
  where e.id = new.entity_id;

  if v_entity_type is distinct from 'workshop' then
    raise exception 'exact public address is available only for Workshop CraftID';
  end if;

  if nullif(btrim(coalesce(new.address_line1, '')), '') is null
     or nullif(btrim(coalesce(new.locality, '')), '') is null
     or new.country_code is null
     or new.country_code !~ '^[A-Z]{2}$' then
    raise exception 'public workshop address requires address line 1, locality and ISO country code';
  end if;

  if new.public_consent_at is null then
    raise exception 'explicit consent timestamp is required to publish exact workshop address';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_public_business_address()
from public, anon, authenticated;

drop trigger if exists entity_business_addresses_validate_publication
on public.entity_business_addresses;

create trigger entity_business_addresses_validate_publication
before insert or update on public.entity_business_addresses
for each row execute function private.validate_public_business_address();

-- Extend the existing privacy-safe public projection. Exact address is returned
-- only for a published Workshop with explicit address-level consent.
create or replace function public.public_craftid_profile(
  p_craftid_number bigint,
  p_check_digits text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_entity_id uuid;
  v_entity_type text;
  v_number bigint;
  v_check text;
  v_show_photo boolean;
  v_show_languages boolean;
  v_show_portfolio boolean;
  v_show_qualifications boolean;
  v_display_name text;
  v_role_label text;
  v_about text;
  v_photo_path text;
  v_languages text[];
  v_geo_country text;
  v_geo_region text;
  v_geo_city text;
  v_geo_precision text;
  v_location text;
  v_exact_address jsonb;
  v_claims jsonb;
  v_links jsonb;
begin
  if p_craftid_number is null or p_craftid_number < 1 or p_check_digits is null then
    return null;
  end if;

  if p_check_digits <> public.craftid_check_digits(p_craftid_number) then
    return null;
  end if;

  select e.id, e.entity_type, e.craftid_number, e.craftid_check_digits
    into v_entity_id, v_entity_type, v_number, v_check
  from public.craftid_entities e
  where e.craftid_number = p_craftid_number
    and e.craftid_check_digits = p_check_digits
    and e.public_status = 'published';

  if v_entity_id is null then
    return null;
  end if;

  select
    ps.show_profile_photo,
    ps.show_languages,
    ps.show_portfolio,
    ps.show_qualifications
  into
    v_show_photo,
    v_show_languages,
    v_show_portfolio,
    v_show_qualifications
  from public.privacy_settings ps
  where ps.entity_id = v_entity_id;

  v_show_photo := coalesce(v_show_photo, false);
  v_show_languages := coalesce(v_show_languages, false);
  v_show_portfolio := coalesce(v_show_portfolio, false);
  v_show_qualifications := coalesce(v_show_qualifications, false);

  if v_entity_type = 'professional' then
    select
      pp.display_name,
      pp.professional_title,
      pp.about,
      pp.profile_photo_path,
      pp.languages
    into
      v_display_name,
      v_role_label,
      v_about,
      v_photo_path,
      v_languages
    from public.professional_profiles pp
    where pp.entity_id = v_entity_id;
  else
    select
      wp.display_name,
      wp.craft_sector,
      wp.about,
      wp.profile_photo_path,
      null::text[]
    into
      v_display_name,
      v_role_label,
      v_about,
      v_photo_path,
      v_languages
    from public.workshop_profiles wp
    where wp.entity_id = v_entity_id;
  end if;

  if v_display_name is null then
    return null;
  end if;

  select
    g.country_code,
    g.region,
    g.city,
    g.disclosure_precision,
    g.public_label
  into
    v_geo_country,
    v_geo_region,
    v_geo_city,
    v_geo_precision,
    v_location
  from private.public_geography_projection(v_entity_id) g;

  if v_entity_type = 'workshop' then
    select jsonb_build_object(
      'address_line1', a.address_line1,
      'address_line2', a.address_line2,
      'postal_code', a.postal_code,
      'locality', a.locality,
      'country_code', a.country_code
    )
      into v_exact_address
    from public.entity_business_addresses a
    where a.entity_id = v_entity_id
      and a.show_in_public_profile = true
      and a.public_consent_at is not null;
  end if;

  select coalesce(
           jsonb_agg(jsonb_build_object(
             'id', c.id,
             'claim_type', c.claim_type,
             'title', c.title,
             'status', c.status
           ) order by c.created_at),
           '[]'::jsonb)
    into v_claims
  from public.claims c
  where c.entity_id = v_entity_id
    and c.visibility = 'public'
    and (v_show_qualifications or c.claim_type <> 'qualification');

  select coalesce(
           jsonb_agg(jsonb_build_object(
             'contact_type', cp.contact_type,
             'value', cp.value,
             'verification_level', cp.verification_level
           ) order by cp.contact_type),
           '[]'::jsonb)
    into v_links
  from public.entity_contact_points cp
  where cp.entity_id = v_entity_id
    and cp.show_in_public_profile = true
    and cp.contact_type in ('website','linkedin','portfolio')
    and (v_show_portfolio or cp.contact_type <> 'portfolio');

  return jsonb_build_object(
    'craftid_number', v_number,
    'craftid_check_digits', v_check,
    'entity_type', v_entity_type,
    'display_name', v_display_name,
    'professional_title', case when v_entity_type = 'professional' then v_role_label end,
    'craft_sector', case when v_entity_type = 'workshop' then v_role_label end,
    'location', v_location,
    'location_country_code', v_geo_country,
    'location_region', v_geo_region,
    'location_city', v_geo_city,
    'location_precision', v_geo_precision,
    'exact_business_address', v_exact_address,
    'about', v_about,
    'has_public_photo',
      v_show_photo
      and v_photo_path is not null
      and public.is_public_profile_photo(v_photo_path),
    'languages',
      case when v_show_languages
        then to_jsonb(coalesce(v_languages, '{}'::text[]))
        else '[]'::jsonb
      end,
    'claims', v_claims,
    'links', v_links
  );
end;
$$;

revoke all on function public.public_craftid_profile(bigint,text) from public;
grant execute on function public.public_craftid_profile(bigint,text)
to anon, authenticated;
