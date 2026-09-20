create or replace function private.admin_set_entity_public_status_impl(
  p_entity_id uuid,
  p_new_status text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_old_status text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_new_status not in ('draft','published','suspended','archived') then
    raise exception 'invalid public status';
  end if;

  if v_reason is null then
    raise exception 'reason required';
  end if;

  select public_status into v_old_status
  from public.craftid_entities
  where id = p_entity_id
  for update;

  if v_old_status is null then
    raise exception 'CraftID entity not found';
  end if;

  if v_old_status = p_new_status then
    return;
  end if;

  update public.craftid_entities
  set public_status = p_new_status,
      updated_at = now()
  where id = p_entity_id;

  insert into public.audit_events(
    actor_user_id,
    entity_id,
    action,
    old_status,
    new_status,
    metadata
  )
  values (
    (select auth.uid()),
    p_entity_id,
    'public_status_changed',
    v_old_status,
    p_new_status,
    jsonb_build_object('reason', v_reason)
  );
end;
$$;

revoke all on function private.admin_set_entity_public_status_impl(uuid,text,text) from public;
grant execute on function private.admin_set_entity_public_status_impl(uuid,text,text) to authenticated;

create or replace function public.admin_set_entity_public_status(
  p_entity_id uuid,
  p_new_status text,
  p_reason text
)
returns void
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_set_entity_public_status_impl(p_entity_id, p_new_status, p_reason);
$$;

revoke all on function public.admin_set_entity_public_status(uuid,text,text) from public;
grant execute on function public.admin_set_entity_public_status(uuid,text,text) to authenticated;
