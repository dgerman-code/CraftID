-- Keep administrative revocation reasons internal.
-- Public certificate verification exposes revocation status but not internal notes.

create or replace function public.public_craftid_certificate(
  p_certificate_code text
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'certificate_id', c.id,
    'certificate_code', c.certificate_code,
    'version_no', c.version_no,
    'certificate_status', c.status,
    'issued_at', c.issued_at,
    'revoked_at', c.revoked_at,
    'revoked_reason', null,
    'issued_display_name', c.issued_display_name,
    'issued_role_label', c.issued_role_label,
    'issued_country_code', c.issued_country_code,
    'entity_type', c.entity_type,
    'craftid_number', c.craftid_number,
    'craftid_check_digits', c.craftid_check_digits,
    'entity_created_at', c.entity_created_at,
    'current_craftid_status', e.public_status,
    'current_profile_available', e.public_status = 'published'
  )
  from public.craftid_certificates c
  join public.craftid_entities e on e.id = c.entity_id
  where upper(c.certificate_code) = upper(btrim(coalesce(p_certificate_code, '')))
  limit 1;
$$;

revoke all on function public.public_craftid_certificate(text) from public;
grant execute on function public.public_craftid_certificate(text) to anon, authenticated;
