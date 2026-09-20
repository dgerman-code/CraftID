-- Generalise administrator number assignment and make automatic allocation
-- safely skip any numbers that were assigned manually in advance.

create or replace function private.next_available_craftid_number()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_candidate bigint;
begin
  loop
    v_candidate := nextval('public.craftid_public_number_seq');

    if v_candidate <= 100 then
      continue;
    end if;

    exit when not exists (
      select 1
      from public.craftid_entities e
      where e.craftid_number = v_candidate
    );
  end loop;

  return v_candidate;
end;
$$;

revoke all on function private.next_available_craftid_number() from public, anon, authenticated;

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
      and e.public_status <> 'archived'
  ) then
    raise exception 'active CraftID already exists';
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
  else
    insert into public.workshop_profiles(entity_id, display_name)
    values (v_entity.id, v_name);
  end if;

  insert into public.privacy_settings(entity_id)
  values (v_entity.id);

  return query
  select v_entity.id, v_entity.craftid_number,
         public.craftid_check_digits(v_entity.craftid_number);
end;
$$;

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
      and e.public_status <> 'archived'
  ) then
    raise exception 'owner already has an active CraftID';
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

create or replace function public.admin_assign_craftid_number(
  p_owner_user_id uuid,
  p_entity_type text,
  p_requested_number bigint,
  p_display_name text,
  p_reason text
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select * from private.admin_assign_craftid_number_impl(
    p_owner_user_id,
    p_entity_type,
    p_requested_number,
    p_display_name,
    p_reason
  );
$$;

revoke all on function public.admin_assign_craftid_number(uuid,text,bigint,text,text) from public;
grant execute on function public.admin_assign_craftid_number(uuid,text,bigint,text,text) to authenticated;
