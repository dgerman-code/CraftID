-- Fix Partner Opportunity save RPC permissions.
-- The public wrapper must execute as its owner so authenticated partner users
-- do not need direct EXECUTE privilege on the private implementation.

create or replace function public.partner_save_opportunity(
  p_id uuid,
  p_partner_organisation_id uuid,
  p_title text,
  p_summary text,
  p_opportunity_type text,
  p_content_language text,
  p_target_entity text,
  p_location_mode text,
  p_location_country_code text,
  p_location_city text,
  p_eligibility_scope text,
  p_eligible_countries text[],
  p_starts_on date,
  p_ends_on date,
  p_deadline_date date,
  p_external_apply_url text,
  p_public_contact_name text,
  p_public_contact_email text,
  p_allow_interest boolean,
  p_is_published boolean
)
returns uuid
language sql
security definer
set search_path = pg_catalog, private
as $$
  select private.partner_save_opportunity_impl(
    p_id,
    p_partner_organisation_id,
    p_title,
    p_summary,
    p_opportunity_type,
    p_content_language,
    p_target_entity,
    p_location_mode,
    p_location_country_code,
    p_location_city,
    p_eligibility_scope,
    p_eligible_countries,
    p_starts_on,
    p_ends_on,
    p_deadline_date,
    p_external_apply_url,
    p_public_contact_name,
    p_public_contact_email,
    p_allow_interest,
    p_is_published
  );
$$;

revoke all on function public.partner_save_opportunity(
  uuid,uuid,text,text,text,text,text,text,text,text,text,text[],date,date,date,text,text,text,boolean,boolean
) from public, anon;

grant execute on function public.partner_save_opportunity(
  uuid,uuid,text,text,text,text,text,text,text,text,text,text[],date,date,date,text,text,text,boolean,boolean
) to authenticated;

comment on function public.partner_save_opportunity(
  uuid,uuid,text,text,text,text,text,text,text,text,text,text[],date,date,date,text,text,text,boolean,boolean
) is
  'Authenticated partner/admin opportunity save entry point. Executes as owner while the private implementation enforces auth.uid() and partner access.';
