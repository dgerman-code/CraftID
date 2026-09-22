-- Allow one active professional and one active workshop CraftID per account.
-- When both exist under the same owner, create a self-declared owner relationship.

create or replace function private.create_own_craftid_impl(
  p_entity_type text,
  p_display_name text default null
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_entity public.craftid_entities%rowtype;
  v_name text;
  v_number bigint;
  v_counterpart uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  if exists (
    select 1
    from public.craftid_entities e
    where e.owner_user_id = v_user_id
      and e.entity_type = p_entity_type
      and e.public_status <> 'archived'
  ) then
    raise exception 'active CraftID of this type already exists';
  end if;

  v_name := nullif(btrim(coalesce(p_display_name, '')), '');
  if v_name is null then
    v_name := case
      when p_entity_type = 'professional' then 'New professional'
      else 'New workshop'
    end;
  end if;

  v_number := private.next_available_craftid_number();

  insert into public.craftid_entities(craftid_number, entity_type, owner_user_id)
  values (v_number, p_entity_type, v_user_id)
  returning * into v_entity;

  if p_entity_type = 'professional' then
    insert into public.professional_profiles(entity_id, display_name)
    values (v_entity.id, v_name);

    select id into v_counterpart
    from public.craftid_entities
    where owner_user_id = v_user_id
      and entity_type = 'workshop'
      and public_status <> 'archived'
    order by created_at asc
    limit 1;

    if v_counterpart is not null then
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
        v_entity.id,
        v_counterpart,
        'owner',
        'active',
        'private',
        'self_declared',
        v_user_id,
        now(),
        now(),
        'Both CraftID records are owned by the same authenticated account.'
      )
      on conflict (professional_entity_id, workshop_entity_id, relationship_role) do nothing;
    end if;
  else
    insert into public.workshop_profiles(entity_id, display_name)
    values (v_entity.id, v_name);

    select id into v_counterpart
    from public.craftid_entities
    where owner_user_id = v_user_id
      and entity_type = 'professional'
      and public_status <> 'archived'
    order by created_at asc
    limit 1;

    if v_counterpart is not null then
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
        v_counterpart,
        v_entity.id,
        'owner',
        'active',
        'private',
        'self_declared',
        v_user_id,
        now(),
        now(),
        'Both CraftID records are owned by the same authenticated account.'
      )
      on conflict (professional_entity_id, workshop_entity_id, relationship_role) do nothing;
    end if;
  end if;

  insert into public.privacy_settings(entity_id)
  values (v_entity.id);

  return query
  select v_entity.id, v_entity.craftid_number,
         public.craftid_check_digits(v_entity.craftid_number);
end;
$$;

revoke all on function private.create_own_craftid_impl(text,text) from public, anon, authenticated;
grant execute on function private.create_own_craftid_impl(text,text) to authenticated;
