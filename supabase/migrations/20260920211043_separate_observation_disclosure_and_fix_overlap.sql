-- Separate data history from disclosure consent and ensure one current value
-- per conceptual indicator even across definition-version changes.

create table if not exists public.observation_disclosure_preferences (
  observation_id uuid primary key references public.observations(id) on delete cascade,
  show_in_public_profile boolean not null default false,
  public_profile_consent_at timestamptz,
  include_in_aggregates boolean not null default false,
  aggregate_consent_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (show_in_public_profile = false and public_profile_consent_at is null)
    or
    (show_in_public_profile = true and public_profile_consent_at is not null)
  ),
  check (
    (include_in_aggregates = false and aggregate_consent_at is null)
    or
    (include_in_aggregates = true and aggregate_consent_at is not null)
  )
);

insert into public.observation_disclosure_preferences(
  observation_id,
  show_in_public_profile,
  public_profile_consent_at,
  include_in_aggregates,
  aggregate_consent_at
)
select
  id,
  show_in_public_profile,
  case when show_in_public_profile then now() else null end,
  include_in_aggregates,
  case when include_in_aggregates then now() else null end
from public.observations
on conflict (observation_id) do nothing;

alter table public.observation_disclosure_preferences enable row level security;

create policy "owners can read observation disclosure preferences"
on public.observation_disclosure_preferences for select
to authenticated
using (
  exists (
    select 1
    from public.observations o
    join public.craftid_entities e on e.id = o.entity_id
    where o.id = observation_disclosure_preferences.observation_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can create observation disclosure preferences"
on public.observation_disclosure_preferences for insert
to authenticated
with check (
  exists (
    select 1
    from public.observations o
    join public.craftid_entities e on e.id = o.entity_id
    where o.id = observation_disclosure_preferences.observation_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners can update observation disclosure preferences"
on public.observation_disclosure_preferences for update
to authenticated
using (
  exists (
    select 1
    from public.observations o
    join public.craftid_entities e on e.id = o.entity_id
    where o.id = observation_disclosure_preferences.observation_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.observations o
    join public.craftid_entities e on e.id = o.entity_id
    where o.id = observation_disclosure_preferences.observation_id
      and e.owner_user_id = (select auth.uid())
  )
);

grant select, insert, update on public.observation_disclosure_preferences to authenticated;

drop view if exists public.current_observations;

alter table public.observations
  drop constraint if exists observations_no_overlapping_current_values;

alter table public.observations
  add constraint observations_no_overlapping_current_values
  exclude using gist (
    subject_ref with =,
    indicator_key with =,
    daterange(valid_from, coalesce(valid_to, 'infinity'::date), '[)') with &&
  );

alter table public.observations
  drop column if exists show_in_public_profile,
  drop column if exists include_in_aggregates;

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

drop trigger if exists observation_disclosure_preferences_touch_updated_at
on public.observation_disclosure_preferences;

create trigger observation_disclosure_preferences_touch_updated_at
before update on public.observation_disclosure_preferences
for each row execute function private.touch_updated_at();
