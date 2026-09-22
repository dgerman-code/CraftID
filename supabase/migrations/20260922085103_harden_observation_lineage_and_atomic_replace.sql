-- Observation lineage hardening and atomic self-declared skill updates.

-------------------------------------------------------------------------------
-- 1. Strengthen observation link validation, including supersedes lineage
-------------------------------------------------------------------------------

create or replace function private.validate_observation_links()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_indicator_key text;
  v_prev_entity uuid;
  v_prev_claim uuid;
  v_prev_taxonomy uuid;
  v_prev_indicator text;
  v_prev_observed_at timestamptz;
  v_prev_valid_from date;
  v_prev_valid_to date;
begin
  select v.indicator_key into v_indicator_key
  from public.indicator_definition_versions v
  where v.id = new.indicator_version_id;

  if v_indicator_key is null or v_indicator_key <> new.indicator_key then
    raise exception 'indicator version does not match indicator key';
  end if;

  if new.claim_id is not null and not exists (
    select 1 from public.claims c
    where c.id = new.claim_id and c.entity_id = new.entity_id
  ) then
    raise exception 'claim does not belong to entity';
  end if;

  if new.taxonomy_term_id is not null and new.claim_id is not null and not exists (
    select 1 from public.claims c
    where c.id = new.claim_id
      and c.taxonomy_term_id is not distinct from new.taxonomy_term_id
  ) then
    raise exception 'taxonomy term does not match claim';
  end if;

  if new.evidence_id is not null and not exists (
    select 1 from public.evidence_items ei
    where ei.id = new.evidence_id and ei.owner_entity_id = new.entity_id
  ) then
    raise exception 'evidence does not belong to entity';
  end if;

  if new.provenance_status <> 'self_declared' and new.evidence_id is null then
    raise exception 'non-self-declared provenance requires linked evidence';
  end if;

  if new.supersedes_observation_id is not null then
    if new.supersedes_observation_id = new.id then
      raise exception 'observation cannot supersede itself';
    end if;

    select
      o.entity_id,
      o.claim_id,
      o.taxonomy_term_id,
      o.indicator_key,
      o.observed_at,
      o.valid_from,
      o.valid_to
    into
      v_prev_entity,
      v_prev_claim,
      v_prev_taxonomy,
      v_prev_indicator,
      v_prev_observed_at,
      v_prev_valid_from,
      v_prev_valid_to
    from public.observations o
    where o.id = new.supersedes_observation_id;

    if v_prev_entity is null then
      raise exception 'superseded observation not found';
    end if;

    if v_prev_entity is distinct from new.entity_id
       or v_prev_claim is distinct from new.claim_id
       or v_prev_taxonomy is distinct from new.taxonomy_term_id
       or v_prev_indicator is distinct from new.indicator_key then
      raise exception 'superseded observation must belong to the same subject and indicator lineage';
    end if;

    if v_prev_valid_to is null then
      raise exception 'superseded observation must be closed before replacement';
    end if;

    if v_prev_valid_to > new.valid_from then
      raise exception 'replacement observation cannot overlap predecessor';
    end if;

    if v_prev_observed_at > new.observed_at
       or v_prev_valid_from > new.valid_from then
      raise exception 'replacement observation cannot precede its predecessor';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_observation_links()
from public, anon, authenticated;

-------------------------------------------------------------------------------
-- 2. Atomic owner update for self-declared skill observations
-------------------------------------------------------------------------------

create or replace function private.replace_self_declared_skill_observation_impl(
  p_claim_id uuid,
  p_indicator_key text,
  p_value text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_entity_id uuid;
  v_taxonomy_term_id uuid;
  v_version_id uuid;
  v_current public.observations%rowtype;
  v_new_id uuid;
  v_today date := current_date;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select c.entity_id, c.taxonomy_term_id
    into v_entity_id, v_taxonomy_term_id
  from public.claims c
  join public.craftid_entities e on e.id = c.entity_id
  where c.id = p_claim_id
    and c.claim_type = 'skill'
    and e.owner_user_id = v_actor;

  if v_entity_id is null then
    raise exception 'owned skill claim not found';
  end if;

  select v.id into v_version_id
  from public.indicator_definition_versions v
  join public.indicator_definitions d on d.key = v.indicator_key
  where v.indicator_key = p_indicator_key
    and v.is_current = true
    and d.scope = 'skill'
    and d.is_active = true
  limit 1;

  if v_version_id is null then
    raise exception 'current skill indicator definition not found';
  end if;

  select o.* into v_current
  from public.observations o
  where o.claim_id = p_claim_id
    and o.indicator_key = p_indicator_key
    and o.valid_to is null
  order by o.valid_from desc, o.created_at desc
  limit 1
  for update;

  if v_current.id is not null and v_current.value = to_jsonb(p_value) then
    return v_current.id;
  end if;

  if v_current.id is not null and v_current.provenance_status <> 'self_declared' then
    raise exception 'reviewed or externally supported observation cannot be replaced by owner';
  end if;

  if v_current.id is not null then
    update public.observations
    set valid_to = greatest(v_today, v_current.valid_from)
    where id = v_current.id;
  end if;

  insert into public.observations(
    entity_id,
    claim_id,
    taxonomy_term_id,
    indicator_key,
    indicator_version_id,
    value,
    provenance_status,
    supersedes_observation_id,
    valid_from,
    created_by
  )
  values (
    v_entity_id,
    p_claim_id,
    v_taxonomy_term_id,
    p_indicator_key,
    v_version_id,
    to_jsonb(p_value),
    'self_declared',
    v_current.id,
    case
      when v_current.id is not null and v_current.valid_from > v_today
        then v_current.valid_from
      else v_today
    end,
    v_actor
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function private.replace_self_declared_skill_observation_impl(uuid,text,text)
from public, anon, authenticated;
grant execute on function private.replace_self_declared_skill_observation_impl(uuid,text,text)
to authenticated;

create or replace function public.replace_self_declared_skill_observation(
  p_claim_id uuid,
  p_indicator_key text,
  p_value text
)
returns uuid
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.replace_self_declared_skill_observation_impl(
    p_claim_id,
    p_indicator_key,
    p_value
  );
$$;

revoke all on function public.replace_self_declared_skill_observation(uuid,text,text)
from public, anon;
grant execute on function public.replace_self_declared_skill_observation(uuid,text,text)
to authenticated;
