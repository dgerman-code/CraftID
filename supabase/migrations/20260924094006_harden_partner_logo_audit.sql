-- Reproduce the post-deploy partner-logo hardening present in production.
-- Keep the storage object under the partner organisation's own folder while
-- preserving audit history for logo replacement/removal.

create or replace function private.admin_set_partner_logo_impl(
  p_partner_id uuid,
  p_logo_path text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old_path text;
  v_new_path text := nullif(btrim(coalesce(p_logo_path,'')), '');
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if not exists (
    select 1 from public.partner_organisations po where po.id = p_partner_id
  ) then
    raise exception 'partner organisation not found';
  end if;

  if v_new_path is not null
     and split_part(v_new_path, '/', 1) <> p_partner_id::text then
    raise exception 'invalid partner logo path';
  end if;

  select po.logo_path into v_old_path
  from public.partner_organisations po
  where po.id = p_partner_id
  for update;

  update public.partner_organisations
  set logo_path = v_new_path,
      updated_by = v_actor,
      updated_at = now()
  where id = p_partner_id;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    case when v_new_path is null then 'partner_logo_removed' else 'partner_logo_updated' end,
    jsonb_build_object(
      'partner_organisation_id', p_partner_id,
      'old_logo_path', v_old_path,
      'new_logo_path', v_new_path
    )
  );

  return v_old_path;
end;
$$;

revoke all on function private.admin_set_partner_logo_impl(uuid,text)
from public, anon, authenticated;
grant execute on function private.admin_set_partner_logo_impl(uuid,text)
to authenticated;
