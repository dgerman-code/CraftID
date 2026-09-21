-- Public profile photo delivery for published CraftIDs.
--
-- The profile-images bucket stays private and public.public_craftid_profile
-- keeps returning only the has_public_photo flag, never a storage path. This
-- migration adds the two pieces the server-side photo route needs:
--
--   1. public.is_public_profile_photo(object_name) — the predicate the storage
--      policy below applies. It is SECURITY DEFINER because the policy runs as
--      the visitor, and a visitor cannot read privacy_settings or the profile
--      tables to judge whether an object is publicly visible.
--   2. public.public_profile_photo_object(number, check) — resolves a CraftID to
--      the object name of its public photo, so the route can stream the bytes.
--      It returns null unless the entity is published and show_profile_photo is
--      on, which is exactly the condition under which the object is readable.
--
-- Only these two objects and one SELECT policy on storage.objects are added.
-- Nothing is granted on the profile tables, no existing policy is relaxed, and
-- no bucket changes visibility.

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
      and coalesce(ps.show_profile_photo, true)
      and coalesce(pp.profile_photo_path, wp.profile_photo_path) = p_object_name
  );
$$;

revoke all on function public.is_public_profile_photo(text) from public;
grant execute on function public.is_public_profile_photo(text) to anon, authenticated;

-- Read-only, object-scoped exposure: a visitor may read exactly the file that
-- is the current photo of a published profile whose owner left the photo
-- toggle on. Superseded uploads left in the same folder stay private, because
-- the predicate compares against profile_photo_path.
drop policy if exists "published profile photos are publicly readable" on storage.objects;
create policy "published profile photos are publicly readable"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'profile-images'
  and public.is_public_profile_photo(name)
);

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
    and coalesce(ps.show_profile_photo, true)
  limit 1;
$$;

revoke all on function public.public_profile_photo_object(bigint,text) from public;
grant execute on function public.public_profile_photo_object(bigint,text) to anon, authenticated;

------------------------------------------------------------------------------
-- Rollback reference (do not run unless reverting this migration)
------------------------------------------------------------------------------
-- drop policy if exists "published profile photos are publicly readable" on storage.objects;
-- drop function if exists public.public_profile_photo_object(bigint,text);
-- drop function if exists public.is_public_profile_photo(text);
