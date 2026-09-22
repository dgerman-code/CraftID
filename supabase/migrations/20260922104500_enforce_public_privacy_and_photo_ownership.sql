-- Enforce public privacy choices consistently and bind public profile photos
-- to the owning CraftID entity.

-------------------------------------------------------------------------------
-- 1. Profile photo paths must belong to the authenticated owner + entity.
-------------------------------------------------------------------------------

create or replace function private.validate_profile_photo_path()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public
as $$
declare
  v_owner uuid;
  v_path text;
begin
  if tg_table_name = 'professional_profiles' then
    v_path := new.profile_photo_path;
  else
    v_path := new.profile_photo_path;
  end if;

  if v_path is null then
    return new;
  end if;

  select e.owner_user_id into v_owner
  from public.craftid_entities e
  where e.id = new.entity_id;

  if v_owner is null then
    raise exception 'profile photo cannot be attached to an ownerless CraftID';
  end if;

  if v_path !~ ('^' || v_owner::text || '/' || new.entity_id::text || '/[^/]+$') then
    raise exception 'profile photo path must belong to this CraftID owner and entity';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_profile_photo_path()
from public, anon, authenticated;

drop trigger if exists professional_profiles_validate_photo_path
  on public.professional_profiles;
create trigger professional_profiles_validate_photo_path
before insert or update of profile_photo_path on public.professional_profiles
for each row execute function private.validate_profile_photo_path();

drop trigger if exists workshop_profiles_validate_photo_path
  on public.workshop_profiles;
create trigger workshop_profiles_validate_photo_path
before insert or update of profile_photo_path on public.workshop_profiles
for each row execute function private.validate_profile_photo_path();

create or replace function public.is_public_profile_photo(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.craftid_entities e
    left join public.privacy_settings ps on ps.entity_id = e.id
    left join public.professional_profiles pp on pp.entity_id = e.id
    left join public.workshop_profiles wp on wp.entity_id = e.id
    where e.public_status = 'published'
      and e.owner_user_id is not null
      and coalesce(ps.show_profile_photo, true)
      and coalesce(pp.profile_photo_path, wp.profile_photo_path) = p_object_name
      and p_object_name ~ ('^' || e.owner_user_id::text || '/' || e.id::text || '/[^/]+$')
  );
$$;

revoke all on function public.is_public_profile_photo(text) from public;
grant execute on function public.is_public_profile_photo(text) to anon, authenticated;

create or replace function public.public_profile_photo_object(
  p_craftid_number bigint,
  p_check_digits text
)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(pp.profile_photo_path, wp.profile_photo_path)
  from public.craftid_entities e
  left join public.privacy_settings ps on ps.entity_id = e.id
  left join public.professional_profiles pp on pp.entity_id = e.id
  left join public.workshop_profiles wp on wp.entity_id = e.id
  where p_craftid_number is not null
    and p_craftid_number >= 1
    and p_check_digits is not null
    and p_check_digits = public.craftid_check_digits(p_craftid_number)
    and e.craftid_number = p_craftid_number
    and e.craftid_check_digits = p_check_digits
    and e.public_status = 'published'
    and e.owner_user_id is not null
    and coalesce(ps.show_profile_photo, true)
    and coalesce(pp.profile_photo_path, wp.profile_photo_path)
        ~ ('^' || e.owner_user_id::text || '/' || e.id::text || '/[^/]+$')
  limit 1;
$$;

revoke all on function public.public_profile_photo_object(bigint,text) from public;
grant execute on function public.public_profile_photo_object(bigint,text)
to anon, authenticated;

-------------------------------------------------------------------------------
-- 2. Public profile projection must respect every public-facing privacy flag.
-------------------------------------------------------------------------------

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
  v_show_city boolean;
  v_show_languages boolean;
  v_show_portfolio boolean;
  v_show_qualifications boolean;
  v_precision text;
  v_display_name text;
  v_role_label text;
  v_about text;
  v_country text;
  v_region text;
  v_city text;
  v_photo_path text;
  v_languages text[];
  v_location text;
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
    ps.show_city,
    ps.show_languages,
    ps.show_portfolio,
    ps.show_qualifications,
    ps.location_precision
  into
    v_show_photo,
    v_show_city,
    v_show_languages,
    v_show_portfolio,
    v_show_qualifications,
    v_precision
  from public.privacy_settings ps
  where ps.entity_id = v_entity_id;

  v_show_photo := coalesce(v_show_photo, true);
  v_show_city := coalesce(v_show_city, true);
  v_show_languages := coalesce(v_show_languages, true);
  v_show_portfolio := coalesce(v_show_portfolio, true);
  v_show_qualifications := coalesce(v_show_qualifications, true);
  v_precision := coalesce(v_precision, 'city');

  if v_entity_type = 'professional' then
    select pp.display_name, pp.professional_title, pp.about,
           pp.country_code, pp.region, pp.city, pp.profile_photo_path, pp.languages
      into v_display_name, v_role_label, v_about,
           v_country, v_region, v_city, v_photo_path, v_languages
    from public.professional_profiles pp
    where pp.entity_id = v_entity_id;
  else
    select wp.display_name, wp.craft_sector, wp.about,
           wp.country_code, wp.region, wp.city, wp.profile_photo_path, null::text[]
      into v_display_name, v_role_label, v_about,
           v_country, v_region, v_city, v_photo_path, v_languages
    from public.workshop_profiles wp
    where wp.entity_id = v_entity_id;
  end if;

  if v_display_name is null then
    return null;
  end if;

  v_location := case
    when v_precision = 'country' then v_country
    when v_precision = 'region' then
      array_to_string(array_remove(array[v_region, v_country], null), ', ')
    when v_show_city then
      array_to_string(array_remove(array[v_city, v_region, v_country], null), ', ')
    else
      array_to_string(array_remove(array[v_region, v_country], null), ', ')
  end;

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
    'location', nullif(v_location, ''),
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

-------------------------------------------------------------------------------
-- 3. Public contact rows must belong to published entities and anon receives
--    only the safe columns needed for link rendering.
-------------------------------------------------------------------------------

drop policy if exists "anon can read only public safe links"
  on public.entity_contact_points;

create policy "anon can read only published public safe links"
on public.entity_contact_points for select
to anon
using (
  show_in_public_profile = true
  and contact_type in ('website','linkedin','portfolio')
  and exists (
    select 1
    from public.craftid_entities e
    where e.id = entity_contact_points.entity_id
      and e.public_status = 'published'
  )
);

revoke select on public.entity_contact_points from anon;
grant select (
  id,
  entity_id,
  contact_type,
  value,
  verification_level,
  verified_at,
  last_checked_at,
  verification_expires_at
) on public.entity_contact_points to anon;

create or replace view public.public_contact_links
with (security_invoker = true)
as
select
  cp.id,
  cp.entity_id,
  cp.contact_type,
  cp.value,
  cp.verification_level,
  cp.verified_at,
  cp.last_checked_at,
  cp.verification_expires_at
from public.entity_contact_points cp
join public.craftid_entities e on e.id = cp.entity_id
where cp.show_in_public_profile = true
  and cp.contact_type in ('website','linkedin','portfolio')
  and e.public_status = 'published';

grant select on public.public_contact_links to anon, authenticated;
