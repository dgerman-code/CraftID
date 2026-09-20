-- CraftID intelligence hardening v2
-- Append-only observation history, versioned indicator definitions,
-- split publication/aggregation consent, external taxonomy release metadata,
-- and versioned territorial classification infrastructure.

create extension if not exists btree_gist;

create table if not exists public.indicator_definition_versions (
  id uuid primary key default gen_random_uuid(),
  indicator_key text not null references public.indicator_definitions(key) on delete restrict,
  version integer not null check (version > 0),
  label_en text not null,
  label_uk text not null,
  description_en text,
  description_uk text,
  value_type text not null check (value_type in ('categorical','multi_select','boolean','integer','range','text')),
  options jsonb,
  effective_from date not null default current_date,
  effective_to date,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique(indicator_key, version),
  check (effective_to is null or effective_to >= effective_from)
);

insert into public.indicator_definition_versions(
  indicator_key, version, label_en, label_uk, description_en, description_uk,
  value_type, options, effective_from, is_current
)
select
  d.key, 1, d.label_en, d.label_uk, d.description_en, d.description_uk,
  d.value_type, d.options, current_date, true
from public.indicator_definitions d
where not exists (
  select 1 from public.indicator_definition_versions v
  where v.indicator_key = d.key and v.version = 1
);

alter table public.indicator_definition_versions enable row level security;

create policy "indicator definition versions are publicly readable"
on public.indicator_definition_versions for select
to anon, authenticated
using (true);

grant select on public.indicator_definition_versions to anon, authenticated;

alter table public.observations
  add column if not exists indicator_version_id uuid references public.indicator_definition_versions(id) on delete restrict,
  add column if not exists supersedes_observation_id uuid references public.observations(id) on delete restrict,
  add column if not exists reviewer_user_id uuid references auth.users(id) on delete restrict,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_valid_until date,
  add column if not exists show_in_public_profile boolean not null default false,
  add column if not exists include_in_aggregates boolean not null default false,
  add column if not exists subject_ref uuid generated always as (coalesce(claim_id, entity_id)) stored;

update public.observations o
set indicator_version_id = v.id
from public.indicator_definition_versions v
where v.indicator_key = o.indicator_key
  and v.is_current = true
  and o.indicator_version_id is null;

alter table public.observations
  alter column indicator_version_id set not null;

alter table public.observations
  drop constraint if exists observations_visibility_check;

alter table public.observations
  drop column if exists visibility;

alter table public.observations
  add constraint observations_review_metadata_check check (
    (provenance_status = 'self_declared'
      and reviewer_user_id is null
      and reviewed_at is null)
    or
    (provenance_status <> 'self_declared'
      and reviewer_user_id is not null
      and reviewed_at is not null)
  );

create unique index if not exists observations_supersedes_uidx
  on public.observations(supersedes_observation_id)
  where supersedes_observation_id is not null;

alter table public.observations
  drop constraint if exists observations_no_overlapping_current_values;

alter table public.observations
  add constraint observations_no_overlapping_current_values
  exclude using gist (
    subject_ref with =,
    indicator_version_id with =,
    daterange(valid_from, coalesce(valid_to, 'infinity'::date), '[)') with &&
  );

create or replace function private.enforce_observation_append_only()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.id is distinct from old.id
    or new.entity_id is distinct from old.entity_id
    or new.claim_id is distinct from old.claim_id
    or new.taxonomy_term_id is distinct from old.taxonomy_term_id
    or new.indicator_key is distinct from old.indicator_key
    or new.indicator_version_id is distinct from old.indicator_version_id
    or new.value is distinct from old.value
    or new.provenance_status is distinct from old.provenance_status
    or new.evidence_id is distinct from old.evidence_id
    or new.supersedes_observation_id is distinct from old.supersedes_observation_id
    or new.reviewer_user_id is distinct from old.reviewer_user_id
    or new.reviewed_at is distinct from old.reviewed_at
    or new.review_valid_until is distinct from old.review_valid_until
    or new.observed_at is distinct from old.observed_at
    or new.valid_from is distinct from old.valid_from
    or new.show_in_public_profile is distinct from old.show_in_public_profile
    or new.include_in_aggregates is distinct from old.include_in_aggregates
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'observations are append-only; create a superseding observation instead';
  end if;

  if old.valid_to is not null then
    raise exception 'closed observations cannot be modified';
  end if;

  if new.valid_to is null or new.valid_to < old.valid_from then
    raise exception 'valid_to must close the existing observation';
  end if;

  return new;
end;
$$;

drop trigger if exists observations_append_only on public.observations;
create trigger observations_append_only
before update on public.observations
for each row execute function private.enforce_observation_append_only();

revoke delete on public.observations from authenticated;

drop policy if exists "owners can update own self declared observations" on public.observations;
drop policy if exists "staff can update observations" on public.observations;

create policy "owners can close own self declared observations"
on public.observations for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = observations.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and provenance_status = 'self_declared'
  and valid_to is null
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = observations.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and provenance_status = 'self_declared'
);

create policy "staff can close observations"
on public.observations for update
to authenticated
using (
  private.has_staff_role(array['reviewer','admin'])
  and valid_to is null
)
with check (private.has_staff_role(array['reviewer','admin']));

create policy "staff can insert reviewed observations"
on public.observations for insert
to authenticated
with check (
  private.has_staff_role(array['reviewer','admin'])
  and reviewer_user_id = (select auth.uid())
  and provenance_status in ('document_supported','reviewed','external_source_confirmed')
);

create or replace function private.validate_observation_links()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_indicator_key text;
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

  return new;
end;
$$;

create or replace view public.current_observations
with (security_invoker = true)
as
select o.*
from public.observations o
where o.valid_to is null
  and not exists (
    select 1
    from public.observations newer
    where newer.supersedes_observation_id = o.id
  );

grant select on public.current_observations to authenticated;

alter table public.taxonomy_external_mappings
  add column if not exists source_version text;

alter table public.taxonomy_external_mappings
  drop constraint if exists taxonomy_external_mappings_mapping_relation_check;

update public.taxonomy_external_mappings
set mapping_relation = case mapping_relation
  when 'broad' then 'broader'
  when 'narrow' then 'narrower'
  when 'close' then 'related'
  else mapping_relation
end;

alter table public.taxonomy_external_mappings
  add constraint taxonomy_external_mappings_mapping_relation_check
  check (mapping_relation in ('exact','broader','narrower','related'));

create table if not exists public.territorial_units (
  id uuid primary key default gen_random_uuid(),
  system text not null,
  system_version text not null,
  code text not null,
  level text not null,
  parent_id uuid references public.territorial_units(id) on delete restrict,
  country_code text,
  name_local text not null,
  name_en text,
  valid_from date not null,
  valid_to date,
  created_at timestamptz not null default now(),
  unique(system, system_version, code),
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists public.territorial_unit_mappings (
  id uuid primary key default gen_random_uuid(),
  source_unit_id uuid not null references public.territorial_units(id) on delete cascade,
  target_unit_id uuid not null references public.territorial_units(id) on delete cascade,
  mapping_relation text not null check (mapping_relation in ('exact','broader','narrower','overlap','related')),
  valid_from date not null,
  valid_to date,
  notes text,
  created_at timestamptz not null default now(),
  unique(source_unit_id, target_unit_id, valid_from),
  check (source_unit_id <> target_unit_id),
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists public.entity_territorial_links (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  place_role text not null check (
    place_role in ('place_of_practice','previous_place_of_practice','registration_place','origin_place')
  ),
  territorial_unit_id uuid not null references public.territorial_units(id) on delete restrict,
  valid_from date not null,
  valid_to date,
  is_relocation_related boolean,
  disclosure_level text not null default 'region'
    check (disclosure_level in ('country','region','local_unit','private')),
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists public.territorial_unit_statuses (
  id uuid primary key default gen_random_uuid(),
  territorial_unit_id uuid not null references public.territorial_units(id) on delete cascade,
  status_type text not null,
  valid_from date not null,
  valid_to date,
  source_reference text,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

create index if not exists territorial_units_system_idx
  on public.territorial_units(system, system_version, level, code);

create index if not exists territorial_links_entity_idx
  on public.entity_territorial_links(entity_id, place_role, valid_from desc);

create index if not exists territorial_statuses_unit_idx
  on public.territorial_unit_statuses(territorial_unit_id, valid_from desc);

alter table public.territorial_units enable row level security;
alter table public.territorial_unit_mappings enable row level security;
alter table public.entity_territorial_links enable row level security;
alter table public.territorial_unit_statuses enable row level security;

create policy "territorial units are publicly readable"
on public.territorial_units for select to anon, authenticated using (true);

create policy "territorial mappings are publicly readable"
on public.territorial_unit_mappings for select to anon, authenticated using (true);

create policy "territorial statuses are publicly readable"
on public.territorial_unit_statuses for select to anon, authenticated using (true);

create policy "owners and staff can read territorial links"
on public.entity_territorial_links for select to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_territorial_links.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can insert territorial links"
on public.entity_territorial_links for insert to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_territorial_links.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

grant select on public.territorial_units to anon, authenticated;
grant select on public.territorial_unit_mappings to anon, authenticated;
grant select on public.territorial_unit_statuses to anon, authenticated;
grant select, insert on public.entity_territorial_links to authenticated;

create table if not exists public.aggregation_suppression_rules (
  category text primary key,
  minimum_distinct_entities integer not null check (minimum_distinct_entities >= 2),
  description text not null,
  updated_at timestamptz not null default now()
);

insert into public.aggregation_suppression_rules(category, minimum_distinct_entities, description)
values
  ('general', 5, 'Suppress aggregates below five distinct registered entities.'),
  ('sensitive', 10, 'Suppress sensitive aggregates below ten distinct registered entities.')
on conflict (category) do update
set minimum_distinct_entities = excluded.minimum_distinct_entities,
    description = excluded.description,
    updated_at = now();

alter table public.indicator_definitions
  add column if not exists aggregation_category text not null default 'general'
  check (aggregation_category in ('general','sensitive'));

alter table public.aggregation_suppression_rules enable row level security;

create policy "suppression rules are publicly readable"
on public.aggregation_suppression_rules for select to anon, authenticated using (true);

grant select on public.aggregation_suppression_rules to anon, authenticated;
