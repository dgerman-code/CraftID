-- Enforce a minimum publication gate for CraftID registry records.
--
-- This gate protects public-record integrity only. It does NOT certify a person,
-- require evidence review, or convert CraftID into a qualification authority.
-- A record may be published with self-declared claims, but it must contain the
-- minimum information needed to be a meaningful public registry entry.

create or replace function private.publication_gate_failures(p_entity_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_type text;
  v_display_name text;
  v_role text;
  v_country text;
  v_region text;
  v_city text;
  v_failures text[] := array[]::text[];
begin
  select entity_type
    into v_type
  from public.craftid_entities
  where id = p_entity_id;

  if v_type is null then
    return array['entity_not_found'];
  end if;

  if v_type = 'professional' then
    select display_name, professional_title, country_code, region, city
      into v_display_name, v_role, v_country, v_region, v_city
    from public.professional_profiles
    where entity_id = p_entity_id;
  else
    select display_name, craft_sector, country_code, region, city
      into v_display_name, v_role, v_country, v_region, v_city
    from public.workshop_profiles
    where entity_id = p_entity_id;
  end if;

  if nullif(btrim(coalesce(v_display_name, '')), '') is null then
    v_failures := array_append(v_failures, 'display_name');
  end if;

  if nullif(btrim(coalesce(v_role, '')), '') is null then
    v_failures := array_append(v_failures, 'professional_title_or_craft_sector');
  end if;

  if nullif(btrim(coalesce(v_country, '')), '') is null
     and nullif(btrim(coalesce(v_region, '')), '') is null
     and nullif(btrim(coalesce(v_city, '')), '') is null then
    v_failures := array_append(v_failures, 'public_location');
  end if;

  if not exists (
    select 1
    from public.claims c
    where c.entity_id = p_entity_id
      and c.claim_type = 'skill'
  ) then
    v_failures := array_append(v_failures, 'skill_claim');
  end if;

  if not exists (
    select 1
    from public.privacy_settings ps
    where ps.entity_id = p_entity_id
  ) then
    v_failures := array_append(v_failures, 'privacy_settings');
  end if;

  return v_failures;
end;
$$;

revoke all on function private.publication_gate_failures(uuid) from public;
grant execute on function private.publication_gate_failures(uuid) to authenticated;

create or replace function public.publication_gate_status(p_entity_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, private
as $$
  select jsonb_build_object(
    'pass', coalesce(cardinality(private.publication_gate_failures(p_entity_id)), 0) = 0,
    'failures', to_jsonb(private.publication_gate_failures(p_entity_id))
  );
$$;

revoke all on function public.publication_gate_status(uuid) from public;
grant execute on function public.publication_gate_status(uuid) to authenticated;

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
  v_failures text[];
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

  if p_new_status = 'published' then
    v_failures := private.publication_gate_failures(p_entity_id);
    if coalesce(cardinality(v_failures), 0) > 0 then
      raise exception 'publication gate blocked: %', array_to_string(v_failures, ', ');
    end if;
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
    jsonb_build_object(
      'reason', v_reason,
      'publication_gate_checked', p_new_status = 'published'
    )
  );
end;
$$;

revoke all on function private.admin_set_entity_public_status_impl(uuid,text,text) from public;
grant execute on function private.admin_set_entity_public_status_impl(uuid,text,text) to authenticated;
