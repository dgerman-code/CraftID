-- Harden CraftID RPC exposure.
-- Privileged implementations live in a non-exposed schema; the public Data API
-- exposes only SECURITY INVOKER wrappers with narrowly scoped signatures.

create schema if not exists api_internal;
revoke all on schema api_internal from public;
grant usage on schema api_internal to anon, authenticated, service_role;

alter function public.historical_craftid_record(bigint, text)
  set schema api_internal;
alter function public.is_public_profile_photo(text)
  set schema api_internal;
alter function public.public_craftid_certificate(text)
  set schema api_internal;
alter function public.public_craftid_profile(bigint, text)
  set schema api_internal;
alter function public.public_partner_organisations()
  set schema api_internal;
alter function public.public_profile_photo_object(bigint, text)
  set schema api_internal;
alter function public.submit_contact_request(bigint, text, text, text, text, text, text)
  set schema api_internal;
alter function public.admin_partner_organisations()
  set schema api_internal;
alter function public.publication_gate_status(uuid)
  set schema api_internal;

revoke all on function api_internal.historical_craftid_record(bigint, text)
  from public, anon, authenticated;
revoke all on function api_internal.is_public_profile_photo(text)
  from public, anon, authenticated;
revoke all on function api_internal.public_craftid_certificate(text)
  from public, anon, authenticated;
revoke all on function api_internal.public_craftid_profile(bigint, text)
  from public, anon, authenticated;
revoke all on function api_internal.public_partner_organisations()
  from public, anon, authenticated;
revoke all on function api_internal.public_profile_photo_object(bigint, text)
  from public, anon, authenticated;
revoke all on function api_internal.submit_contact_request(bigint, text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function api_internal.admin_partner_organisations()
  from public, anon, authenticated;
revoke all on function api_internal.publication_gate_status(uuid)
  from public, anon, authenticated;

grant execute on function api_internal.historical_craftid_record(bigint, text)
  to anon, authenticated, service_role;
grant execute on function api_internal.is_public_profile_photo(text)
  to anon, authenticated, service_role;
grant execute on function api_internal.public_craftid_certificate(text)
  to anon, authenticated, service_role;
grant execute on function api_internal.public_craftid_profile(bigint, text)
  to anon, authenticated, service_role;
grant execute on function api_internal.public_partner_organisations()
  to anon, authenticated, service_role;
grant execute on function api_internal.public_profile_photo_object(bigint, text)
  to anon, authenticated, service_role;
grant execute on function api_internal.submit_contact_request(bigint, text, text, text, text, text, text)
  to anon, authenticated, service_role;
grant execute on function api_internal.admin_partner_organisations()
  to authenticated, service_role;
grant execute on function api_internal.publication_gate_status(uuid)
  to authenticated, service_role;

create function public.historical_craftid_record(
  p_craftid_number bigint,
  p_check_digits text
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select api_internal.historical_craftid_record(p_craftid_number, p_check_digits);
$$;

create function public.is_public_profile_photo(p_object_name text)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select api_internal.is_public_profile_photo(p_object_name);
$$;

create function public.public_craftid_certificate(p_certificate_code text)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select api_internal.public_craftid_certificate(p_certificate_code);
$$;

create function public.public_craftid_profile(
  p_craftid_number bigint,
  p_check_digits text
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select api_internal.public_craftid_profile(p_craftid_number, p_check_digits);
$$;

create function public.public_partner_organisations()
returns table(
  id uuid,
  legal_name_en text,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text,
  partner_role text,
  website_url text,
  description_en text,
  description_uk text,
  sort_order integer
)
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select * from api_internal.public_partner_organisations();
$$;

create function public.public_profile_photo_object(
  p_craftid_number bigint,
  p_check_digits text
)
returns text
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select api_internal.public_profile_photo_object(p_craftid_number, p_check_digits);
$$;

create function public.submit_contact_request(
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
security invoker
set search_path = pg_catalog, api_internal
as $$
  select api_internal.submit_contact_request(
    p_craftid_number,
    p_requester_name,
    p_requester_email,
    p_requester_organisation,
    p_requester_role,
    p_purpose,
    p_message
  );
$$;

create function public.admin_partner_organisations()
returns table(
  id uuid,
  legal_name_en text,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text,
  partner_role text,
  status text,
  agreement_status text,
  website_url text,
  description_en text,
  description_uk text,
  scope_note text,
  is_public boolean,
  sort_order integer,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select * from api_internal.admin_partner_organisations();
$$;

create function public.publication_gate_status(p_entity_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, api_internal
as $$
  select api_internal.publication_gate_status(p_entity_id);
$$;

revoke all on function public.historical_craftid_record(bigint, text)
  from public, anon, authenticated;
revoke all on function public.is_public_profile_photo(text)
  from public, anon, authenticated;
revoke all on function public.public_craftid_certificate(text)
  from public, anon, authenticated;
revoke all on function public.public_craftid_profile(bigint, text)
  from public, anon, authenticated;
revoke all on function public.public_partner_organisations()
  from public, anon, authenticated;
revoke all on function public.public_profile_photo_object(bigint, text)
  from public, anon, authenticated;
revoke all on function public.submit_contact_request(bigint, text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_partner_organisations()
  from public, anon, authenticated;
revoke all on function public.publication_gate_status(uuid)
  from public, anon, authenticated;

grant execute on function public.historical_craftid_record(bigint, text)
  to anon, authenticated, service_role;
grant execute on function public.is_public_profile_photo(text)
  to anon, authenticated, service_role;
grant execute on function public.public_craftid_certificate(text)
  to anon, authenticated, service_role;
grant execute on function public.public_craftid_profile(bigint, text)
  to anon, authenticated, service_role;
grant execute on function public.public_partner_organisations()
  to anon, authenticated, service_role;
grant execute on function public.public_profile_photo_object(bigint, text)
  to anon, authenticated, service_role;
grant execute on function public.submit_contact_request(bigint, text, text, text, text, text, text)
  to anon, authenticated, service_role;
grant execute on function public.admin_partner_organisations()
  to authenticated, service_role;
grant execute on function public.publication_gate_status(uuid)
  to authenticated, service_role;
