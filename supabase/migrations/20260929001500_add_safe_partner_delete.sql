-- Partner admin UX hardening
-- Adds a safe Platform Admin delete operation for partner organisations.
-- Deletion is blocked when the organisation already owns opportunities so that
-- holder interaction history cannot be removed accidentally.

create or replace function private.admin_delete_partner_organisation_impl(
  p_partner_organisation_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_partner public.partner_organisations%rowtype;
  v_opportunity_count bigint;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  select *
    into v_partner
  from public.partner_organisations po
  where po.id = p_partner_organisation_id
  for update;

  if v_partner.id is null then
    raise exception 'partner organisation not found';
  end if;

  select count(*)
    into v_opportunity_count
  from public.opportunities o
  where o.partner_organisation_id = p_partner_organisation_id;

  if v_opportunity_count > 0 then
    raise exception
      'This organisation cannot be deleted because it has % opportunity record(s). Remove or reassign those opportunities first.',
      v_opportunity_count;
  end if;

  insert into public.audit_events(
    actor_user_id,
    action,
    metadata
  )
  values (
    v_actor,
    'partner_organisation_deleted',
    jsonb_build_object(
      'partner_organisation_id', v_partner.id,
      'legal_name_en', v_partner.legal_name_en,
      'country_code', v_partner.country_code,
      'partner_role', v_partner.partner_role,
      'was_public', v_partner.is_public,
      'reason', nullif(btrim(coalesce(p_reason,'')), '')
    )
  );

  delete from public.partner_organisations
  where id = p_partner_organisation_id;

  return v_partner.logo_path;
end;
$$;

revoke all on function private.admin_delete_partner_organisation_impl(uuid,text)
from public, anon, authenticated;
grant execute on function private.admin_delete_partner_organisation_impl(uuid,text)
to authenticated;

create or replace function public.admin_delete_partner_organisation(
  p_partner_organisation_id uuid,
  p_reason text default null
)
returns text
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_delete_partner_organisation_impl(
    p_partner_organisation_id,
    p_reason
  );
$$;

revoke all on function public.admin_delete_partner_organisation(uuid,text)
from public, anon;
grant execute on function public.admin_delete_partner_organisation(uuid,text)
to authenticated;
