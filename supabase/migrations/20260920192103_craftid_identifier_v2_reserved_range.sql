-- CraftID public identifier v2
-- Numbers 1..100 are reserved for explicit administrator assignment.
-- Automatic self-service allocation begins at 101.
-- Public display uses an immutable sequence number plus two MOD-97 check digits.

create or replace function public.craftid_check_digits(p_number bigint)
returns text
language sql
immutable
strict
security invoker
set search_path = pg_catalog
as $$
  select lpad((98 - (p_number % 97))::text, 2, '0');
$$;

revoke all on function public.craftid_check_digits(bigint) from public;
grant execute on function public.craftid_check_digits(bigint) to anon, authenticated;

alter table public.craftid_entities
  add column if not exists craftid_check_digits text
  generated always as (public.craftid_check_digits(craftid_number)) stored;

alter sequence public.craftid_public_number_seq restart with 101;

revoke insert, update on public.craftid_entities from authenticated;
grant insert (entity_type, owner_user_id, public_status) on public.craftid_entities to authenticated;
grant update (entity_type, public_status, updated_at) on public.craftid_entities to authenticated;
revoke usage, select on sequence public.craftid_public_number_seq from authenticated;

create or replace function private.prevent_craftid_number_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.craftid_number is distinct from old.craftid_number then
    raise exception 'CraftID number is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists craftid_entities_prevent_number_change on public.craftid_entities;
create trigger craftid_entities_prevent_number_change
before update on public.craftid_entities
for each row execute function private.prevent_craftid_number_change();

create or replace function public.create_own_craftid(
  p_entity_type text,
  p_display_name text default null
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_entity public.craftid_entities%rowtype;
  v_name text;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  if exists (
    select 1 from public.craftid_entities e
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

  insert into public.craftid_entities(entity_type, owner_user_id)
  values (p_entity_type, v_user_id)
  returning * into v_entity;

  if v_entity.craftid_number between 1 and 100 then
    raise exception 'automatic allocation entered reserved range';
  end if;

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

revoke all on function public.create_own_craftid(text,text) from public;
grant execute on function public.create_own_craftid(text,text) to authenticated;

create or replace function public.admin_assign_reserved_craftid(
  p_owner_user_id uuid,
  p_entity_type text,
  p_reserved_number bigint,
  p_display_name text
)
returns table(entity_id uuid, craftid_number bigint, craftid_check_digits text)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_entity public.craftid_entities%rowtype;
  v_name text := nullif(btrim(coalesce(p_display_name, '')), '');
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_reserved_number < 1 or p_reserved_number > 100 then
    raise exception 'reserved CraftID number must be between 1 and 100';
  end if;

  if p_entity_type not in ('professional','workshop') then
    raise exception 'invalid entity type';
  end if;

  if v_name is null then
    raise exception 'display name required';
  end if;

  if exists (
    select 1 from public.craftid_entities
    where craftid_number = p_reserved_number
  ) then
    raise exception 'reserved CraftID number already assigned';
  end if;

  if exists (
    select 1 from public.craftid_entities
    where owner_user_id = p_owner_user_id
      and public_status <> 'archived'
  ) then
    raise exception 'owner already has an active CraftID';
  end if;

  insert into public.craftid_entities(craftid_number, entity_type, owner_user_id)
  values (p_reserved_number, p_entity_type, p_owner_user_id)
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

  insert into public.audit_events(actor_user_id, entity_id, action, metadata)
  values (
    (select auth.uid()),
    v_entity.id,
    'reserved_craftid_assigned',
    jsonb_build_object('reserved_number', p_reserved_number)
  );

  return query
  select v_entity.id, v_entity.craftid_number,
         public.craftid_check_digits(v_entity.craftid_number);
end;
$$;

revoke all on function public.admin_assign_reserved_craftid(uuid,text,bigint,text) from public;
grant execute on function public.admin_assign_reserved_craftid(uuid,text,bigint,text) to authenticated;
