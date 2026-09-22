-- Map/privacy lifecycle hardening:
-- * exact business addresses remain private data, not a public map precision;
-- * one canonical geography projection drives public profile + publication gate;
-- * public geography is structured so map code never parses display strings;
-- * exact addresses can be explicitly cleared and are erased on account closure;
-- * manual/admin entity creation follows the same one-active-entity-per-type model.

-------------------------------------------------------------------------------
-- 1. Canonical public location precision
-------------------------------------------------------------------------------

update public.privacy_settings
set location_precision = 'city',
    updated_at = now()
where location_precision = 'exact_business_location';

-- Preserve the previous "hide city" intent by converting it to region-level
-- precision before making location_precision the single public authority.
update public.privacy_settings
set location_precision = 'region',
    updated_at = now()
where location_precision = 'city'
  and show_city = false;

update public.privacy_settings
set show_city = (location_precision = 'city'),
    updated_at = now()
where show_city is distinct from (location_precision = 'city');

alter table public.privacy_settings
  drop constraint if exists privacy_settings_location_precision_check;

alter table public.privacy_settings
  add constraint privacy_settings_location_precision_check
  check (location_precision in ('country','region','city'));

alter table public.privacy_settings
  drop constraint if exists privacy_settings_city_precision_consistency_check;

alter table public.privacy_settings
  add constraint privacy_settings_city_precision_consistency_check
  check (show_city = (location_precision = 'city'));

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
-- 3. Owners can explicitly clear optional exact business-address data
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
-- 4. One privacy-clipped, structured public-geography projection
-------------------------------------------------------------------------------

create or replace function private.public_geography_projection(p_entity_id uuid)
returns table(
  country_code text,
  region text,
  city text,
  precision text,
  public_label text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with source as (
    select
      case
        when e.entity_type = 'professional' then pp.country_code
        else wp.country_code
      end as country_code,
      case
        when e.entity_type = 'professional' then pp.region
        else wp.region
      end as region,
      case
        when e.entity_type = 'professional' then pp.city
        else wp.city
      end as city,
      coalesce(ps.location_precision, 'country') as precision
    from public.craftid_entities e
    left join public.privacy_settings ps on ps.entity_id = e.id
    left join public.professional_profiles pp
      on pp.entity_id = e.id and e.entity_type = 'professional'
    left join public.workshop_profiles wp
      on wp.entity_id = e.id and e.entity_type = 'workshop'
    where e.id = p_entity_id
  ),
  clipped as (
    select
      nullif(btrim(country_code), '') as country_code,
      case
        when precision in ('region','city') then nullif(btrim(region), '')
        else null
      end as region,
      case
        when precision = 'city' then nullif(btrim(city), '')
        else null
      end as city,
      precision
    from source
  )
  select
    country_code,
    region,
    city,
    precision,
    nullif(
      case
        when precision = 'country' then country_code
        when precision = 'region' then
          array_to_string(array_remove(array[region, country_code], null), ', ')
        else
          array_to_string(array_remove(array[city, region, country_code], null), ', ')
      end,
      ''
    ) as public_label
  from clipped;
$$;

revoke all on function private.public_geography_projection(uuid)
from public, anon, authenticated;

-------------------------------------------------------------------------------
-- 5. Public profile exposes only the privacy-clipped structured geography
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

  -- Missing privacy settings fail closed for optional public disclosures.
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
    g.precision,
    g.public_label
  into
    v_geo_country,
    v_geo_region,
    v_geo_city,
    v_geo_precision,
    v_location
  from private.public_geography_projection(v_entity_id) g;

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
-- 6. Publication gate validates the same public geography projection
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
  v_public_label text;
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
    select pp.display_name, pp.professional_title
      into v_display_name, v_role
    from public.professional_profiles pp
    where pp.entity_id = p_entity_id;
  else
    select wp.display_name, wp.craft_sector
      into v_display_name, v_role
    from public.workshop_profiles wp
    where wp.entity_id = p_entity_id;
  end if;

  if nullif(btrim(coalesce(v_display_name, '')), '') is null then
    v_failures := array_append(v_failures, 'display_name');
  end if;

  if nullif(btrim(coalesce(v_role, '')), '') is null then
    v_failures := array_append(v_failures, 'professional_title_or_craft_sector');
  end if;

  if not exists (
    select 1 from public.privacy_settings ps where ps.entity_id = p_entity_id
  ) then
    v_failures := array_append(v_failures, 'privacy_settings');
  end if;

  select
    g.country_code,
    g.region,
    g.city,
    g.precision,
    g.public_label
  into
    v_country,
    v_region,
    v_city,
    v_precision,
    v_public_label
  from private.public_geography_projection(p_entity_id) g;

  if v_country is null or v_country !~ '^[A-Z]{2}$' then
    v_failures := array_append(v_failures, 'country_code');
  end if;

  if v_precision = 'region'
     and nullif(btrim(coalesce(v_region, '')), '') is null then
    v_failures := array_append(v_failures, 'public_region');
  elsif v_precision = 'city'
     and nullif(btrim(coalesce(v_city, '')), '') is null then
    v_failures := array_append(v_failures, 'public_city');
  end if;

  if nullif(btrim(coalesce(v_public_label, '')), '') is null then
    v_failures := array_append(v_failures, 'public_location');
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

-------------------------------------------------------------------------------
-- 7. Account closure erases exact business addresses immediately
-------------------------------------------------------------------------------

create or replace function private.close_my_craftid_account_impl()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer := 0;
  v_address_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  update public.craftid_entities e
  set historical_display_name = coalesce(
        (select pp.display_name from public.professional_profiles pp where pp.entity_id = e.id),
        (select wp.display_name from public.workshop_profiles wp where wp.entity_id = e.id)
      ),
      historical_country_code = coalesce(
        (select pp.country_code from public.professional_profiles pp where pp.entity_id = e.id),
        (select wp.country_code from public.workshop_profiles wp where wp.entity_id = e.id)
      ),
      historical_resolver_enabled = true,
      archived_at = coalesce(e.archived_at, now()),
      archived_reason = 'account_closed',
      public_status = 'archived',
      updated_at = now()
  where e.owner_user_id = v_user_id
    and e.public_status <> 'archived';

  get diagnostics v_count = row_count;

  update public.entity_contact_points cp
  set show_in_public_profile = false,
      public_consent_at = null,
      share_with_institutional_partners = false,
      partner_sharing_consent_at = null,
      updated_at = now()
  where exists (
    select 1
    from public.craftid_entities e
    where e.id = cp.entity_id
      and e.owner_user_id = v_user_id
  );

  -- Exact addresses are operational/private data and are not needed by the
  -- historical CraftID resolver. Erase them at account closure.
  delete from public.entity_business_addresses a
  where exists (
    select 1
    from public.craftid_entities e
    where e.id = a.entity_id
      and e.owner_user_id = v_user_id
  );

  get diagnostics v_address_count = row_count;

  update public.professional_workshop_relationships r
  set status = case when r.status in ('active','pending') then 'ended' else r.status end,
      visibility = 'private',
      ends_on = coalesce(
        r.ends_on,
        case when r.starts_on is not null and r.starts_on > current_date then r.starts_on else current_date end
      ),
      updated_at = now()
  where exists (
      select 1 from public.craftid_entities e
      where e.id = r.professional_entity_id and e.owner_user_id = v_user_id
    )
    or exists (
      select 1 from public.craftid_entities e
      where e.id = r.workshop_entity_id and e.owner_user_id = v_user_id
    );

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_user_id,
    'craftid_account_closed',
    jsonb_build_object(
      'archived_entity_count', v_count,
      'exact_addresses_deleted', v_address_count,
      'historical_resolver_retained', true,
      'login_account_deleted', true
    )
  );

  delete from auth.users where id = v_user_id;

  return v_count;
end;
$$;

revoke all on function private.close_my_craftid_account_impl()
from public, anon, authenticated;
grant execute on function private.close_my_craftid_account_impl()
to authenticated;

-------------------------------------------------------------------------------
-- 8. Admin/manual assignment follows the same owner + entity-type model
-------------------------------------------------------------------------------

create or replace function private.link_same_owner_counterpart(
  p_owner_user_id uuid,
  p_new_entity_id uuid,
  p_new_entity_type text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_counterpart uuid;
  v_professional uuid;
  v_workshop uuid;
begin
  if p_new_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  select e.id
    into v_counterpart
  from public.craftid_entities e
  where e.owner_user_id = p_owner_user_id
    and e.entity_type <> p_new_entity_type
    and e.public_status <> 'archived'
  order by e.created_at asc
  limit 1;

  if v_counterpart is null then
    return;
  end if;

  if p_new_entity_type = 'professional' then
    v_professional := p_new_entity_id;
    v_workshop := v_counterpart;
  else
    v_professional := v_counterpart;
    v_workshop := p_new_entity_id;
  end if;

  insert into public.professional_workshop_relationships(
    professional_entity_id,
    workshop_entity_id,
    relationship_role,
    status,
    visibility,
    provenance_status,
    initiated_by_user_id,
    professional_confirmed_at,
    workshop_confirmed_at,
    source_note
  )
  values (
    v_professional,
    v_workshop,
    'owner',
    'active',
    'private',
    'self_declared',
    (select auth.uid()),
    now(),
    now(),
    'Both CraftID records are assigned to the same account.'
  )
  on conflict (professional_entity_id, workshop_entity_id, relationship_role)
  do nothing;
end;
$$;

revoke all on function private.link_same_owner_counterpart(uuid,uuid,text)
from public, anon, authenticated;

create or replace function private.admin_assign_craftid_number_impl(
  p_owner_user_id uuid,
  p_entity_type text,
  p_requested_number bigint,
  p_display_name text,
  p_reason text
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_entity public.craftid_entities%rowtype;
  v_name text := nullif(btrim(coalesce(p_display_name, '')), '');
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_assignment_type text;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_requested_number < 1 then
    raise exception 'CraftID number must be positive';
  end if;

  if p_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  if v_name is null then
    raise exception 'display name required';
  end if;

  if v_reason is null then
    raise exception 'assignment reason required';
  end if;

  if exists (
    select 1
    from public.craftid_entities e
    where e.craftid_number = p_requested_number
  ) then
    raise exception 'requested CraftID number is already assigned';
  end if;

  if exists (
    select 1
    from public.craftid_entities e
    where e.owner_user_id = p_owner_user_id
      and e.entity_type = p_entity_type
      and e.public_status <> 'archived'
  ) then
    raise exception 'owner already has an active CraftID of this type';
  end if;

  v_assignment_type := case
    when p_requested_number between 1 and 100 then 'reserved'
    else 'exceptional_manual'
  end;

  insert into public.craftid_entities(
    craftid_number, entity_type, owner_user_id
  )
  values (
    p_requested_number, p_entity_type, p_owner_user_id
  )
  returning * into v_entity;

  if p_entity_type = 'professional' then
    insert into public.professional_profiles(entity_id, display_name)
    values (v_entity.id, v_name);
  else
    insert into public.workshop_profiles(entity_id, display_name)
    values (v_entity.id, v_name);
  end if;

  insert into public.privacy_settings(entity_id)
  values (v_entity.id);

  perform private.link_same_owner_counterpart(
    p_owner_user_id,
    v_entity.id,
    p_entity_type
  );

  insert into public.audit_events(
    actor_user_id, entity_id, action, metadata
  )
  values (
    (select auth.uid()),
    v_entity.id,
    'manual_craftid_assigned',
    jsonb_build_object(
      'requested_number', p_requested_number,
      'assignment_type', v_assignment_type,
      'reason', v_reason
    )
  );

  return query
  select v_entity.id, v_entity.craftid_number,
         public.craftid_check_digits(v_entity.craftid_number);
end;
$$;

revoke all on function private.admin_assign_craftid_number_impl(uuid,text,bigint,text,text)
from public, anon, authenticated;
grant execute on function private.admin_assign_craftid_number_impl(uuid,text,bigint,text,text)
to authenticated;

create or replace function private.admin_assign_reserved_craftid_impl(
  p_owner_user_id uuid,
  p_entity_type text,
  p_reserved_number bigint,
  p_display_name text
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_entity public.craftid_entities%rowtype;
  v_name text := nullif(btrim(coalesce(p_display_name, '')), '');
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_reserved_number < 1 or p_reserved_number > 100 then
    raise exception 'reserved CraftID number must be between 1 and 100';
  end if;

  if p_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  if v_name is null then
    raise exception 'display name required';
  end if;

  if exists (
    select 1
    from public.craftid_entities e
    where e.craftid_number = p_reserved_number
  ) then
    raise exception 'reserved CraftID number already assigned';
  end if;

  if exists (
    select 1
    from public.craftid_entities e
    where e.owner_user_id = p_owner_user_id
      and e.entity_type = p_entity_type
      and e.public_status <> 'archived'
  ) then
    raise exception 'owner already has an active CraftID of this type';
  end if;

  insert into public.craftid_entities(craftid_number, entity_type, owner_user_id)
  values (p_reserved_number, p_entity_type, p_owner_user_id)
  returning * into v_entity;

  if p_entity_type = 'professional' then
    insert into public.professional_profiles(entity_id, display_name)
    values (v_entity.id, v_name);
  else
    insert into public.workshop_profiles(entity_id, display_name)
    values (v_entity.id, v_name);
  end if;

  insert into public.privacy_settings(entity_id)
  values (v_entity.id);

  perform private.link_same_owner_counterpart(
    p_owner_user_id,
    v_entity.id,
    p_entity_type
  );

  insert into public.audit_events(actor_user_id, entity_id, action, metadata)
  values (
    (select auth.uid()),
    v_entity.id,
    'reserved_craftid_assigned',
    jsonb_build_object('reserved_number', p_reserved_number)
  );

  return query
  select v_entity.id, v_entity.craftid_number,
         public.craftid_check_digits(v_entity.craftid_number);
end;
$$;

revoke all on function private.admin_assign_reserved_craftid_impl(uuid,text,bigint,text)
from public, anon, authenticated;
grant execute on function private.admin_assign_reserved_craftid_impl(uuid,text,bigint,text)
to authenticated;
