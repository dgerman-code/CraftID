-- Phase 2 remediation: make the public registry readable again and repair the
-- public contact-request permission chain.
--
-- Covers audit findings:
--   H-2  anonymous visitors got 404 on every published CraftID profile, because
--         profiles, claims and privacy_settings have no policy or grant for anon
--   H-3  public.submit_contact_request is SECURITY INVOKER and calls an impl
--         revoked from anon and authenticated, so the public contact form always
--         failed with permission denied
--   M-11 (incidentally) logged-in visitors saw no public contact links either,
--         because the only safe-link policy on entity_contact_points is `to anon`
--   L-5  (incidentally) the Mark badge showed "CraftID" instead of the real name
--         for anonymous visitors, for the same reason as H-2
--
-- Design notes:
--   * No read policy or grant is added to any base table: the public projection
--     is served by one SECURITY DEFINER function that returns a curated result.
--     Row-level security therefore keeps its current shape, and nothing becomes
--     readable column-wise that was not readable before.
--   * The projection is a deny-by-default allowlist: every field is named
--     explicitly, and privacy flags are applied inside the function rather than
--     trusted to the caller.
--   * Deliberately absent from the projection: owner_user_id, professional_email
--     and phone contact points, exact business addresses, evidence and storage
--     paths, reviewer private notes, claim descriptions, internal timestamps.

------------------------------------------------------------------------------
-- H-2: curated public projection for a published CraftID
------------------------------------------------------------------------------

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
  -- Reject anything that is not a well-formed CraftID before touching a table.
  if p_craftid_number is null or p_craftid_number < 1 or p_check_digits is null then
    return null;
  end if;

  if p_check_digits <> public.craftid_check_digits(p_craftid_number) then
    return null;
  end if;

  -- Only published entities exist as far as this function is concerned. A draft,
  -- suspended or archived CraftID is indistinguishable from a missing one.
  select e.id, e.entity_type, e.craftid_number, e.craftid_check_digits
    into v_entity_id, v_entity_type, v_number, v_check
  from public.craftid_entities e
  where e.craftid_number = p_craftid_number
    and e.craftid_check_digits = p_check_digits
    and e.public_status = 'published';

  if v_entity_id is null then
    return null;
  end if;

  select ps.show_profile_photo, ps.show_languages, ps.location_precision
    into v_show_photo, v_show_languages, v_precision
  from public.privacy_settings ps
  where ps.entity_id = v_entity_id;

  -- Absent privacy settings fall back to the column defaults of the table.
  v_show_photo := coalesce(v_show_photo, true);
  v_show_languages := coalesce(v_show_languages, true);
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

  -- Location is disclosed at the precision the owner chose, never finer.
  v_location := case v_precision
    when 'country' then v_country
    when 'region' then array_to_string(array_remove(array[v_region, v_country], null), ', ')
    else array_to_string(array_remove(array[v_city, v_region, v_country], null), ', ')
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
    and c.visibility = 'public';

  -- Same predicate as public.public_contact_links: opted-in links of a safe
  -- type only. professional_email and phone can never appear here.
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
    and cp.contact_type in ('website','linkedin','portfolio');

  return jsonb_build_object(
    'craftid_number', v_number,
    'craftid_check_digits', v_check,
    'entity_type', v_entity_type,
    'display_name', v_display_name,
    'professional_title', case when v_entity_type = 'professional' then v_role_label end,
    'craft_sector', case when v_entity_type = 'workshop' then v_role_label end,
    'location', nullif(v_location, ''),
    'about', v_about,
    -- The profile-images bucket is private, so the storage path itself is never
    -- disclosed; callers learn only whether a photo may be shown at all.
    'has_public_photo', v_show_photo and v_photo_path is not null,
    'languages', case when v_show_languages then to_jsonb(coalesce(v_languages, '{}'::text[])) else '[]'::jsonb end,
    'claims', v_claims,
    'links', v_links
  );
end;
$$;

revoke all on function public.public_craftid_profile(bigint,text) from public;
grant execute on function public.public_craftid_profile(bigint,text) to anon, authenticated;

------------------------------------------------------------------------------
-- H-3: repair the public contact-request permission chain
------------------------------------------------------------------------------
-- The wrapper was SECURITY INVOKER while its impl stayed revoked from anon and
-- authenticated, so every caller failed on the inner function. Granting the
-- impl to anon would also mean opening schema private to anon, so the wrapper
-- becomes SECURITY DEFINER instead and the impl stays locked away. All
-- validation (field checks, published-entity check, per-email rate limit) lives
-- in the impl and is unchanged.

create or replace function public.submit_contact_request(
  p_craftid_number bigint,
  p_requester_name text,
  p_requester_email text,
  p_requester_organisation text default null,
  p_requester_role text default null,
  p_purpose text default 'professional_enquiry',
  p_message text default null
)
returns uuid
language sql
security definer
set search_path = pg_catalog, private
as $$
  select private.submit_contact_request_impl(
    p_craftid_number,
    p_requester_name,
    p_requester_email,
    p_requester_organisation,
    p_requester_role,
    p_purpose,
    p_message
  );
$$;

revoke all on function public.submit_contact_request(bigint,text,text,text,text,text,text) from public;
grant execute on function public.submit_contact_request(bigint,text,text,text,text,text,text)
  to anon, authenticated;

------------------------------------------------------------------------------
-- Rollback reference (do not run unless reverting this migration)
------------------------------------------------------------------------------
-- drop function if exists public.public_craftid_profile(bigint,text);
-- Re-running the definition from 20260920222157 restores the SECURITY INVOKER
-- wrapper for public.submit_contact_request (which re-breaks H-3).
