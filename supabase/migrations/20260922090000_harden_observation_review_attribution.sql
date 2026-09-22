-- Prevent staff from creating reviewed intelligence observations for their
-- own CraftID entities and derive reviewer attribution from the database.

create or replace function private.protect_observation_review_attribution()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_owner uuid;
  v_role text;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  if new.provenance_status = 'self_declared' then
    if new.reviewer_user_id is not null or new.reviewed_at is not null then
      raise exception 'self-declared observations cannot carry reviewer attribution';
    end if;
    return new;
  end if;

  if v_actor is null then
    raise exception 'authenticated reviewer required';
  end if;

  select sr.role into v_role
  from private.staff_roles sr
  where sr.user_id = v_actor;

  if v_role not in ('reviewer','admin') then
    raise exception 'reviewer role required';
  end if;

  select e.owner_user_id into v_owner
  from public.craftid_entities e
  where e.id = new.entity_id;

  if v_owner is null then
    raise exception 'observation entity not found';
  end if;

  if v_owner = v_actor then
    raise exception 'self-review of observations is not permitted';
  end if;

  new.reviewer_user_id := v_actor;
  new.reviewed_at := coalesce(new.reviewed_at, now());

  return new;
end;
$$;

revoke all on function private.protect_observation_review_attribution()
from public, anon, authenticated;

drop trigger if exists observations_protect_review_attribution
  on public.observations;
create trigger observations_protect_review_attribution
before insert on public.observations
for each row execute function private.protect_observation_review_attribution();

drop policy if exists "staff can insert reviewed observations"
  on public.observations;

create policy "staff can insert reviewed observations"
on public.observations for insert
to authenticated
with check (
  private.has_staff_role(array['reviewer','admin'])
  and reviewer_user_id = (select auth.uid())
  and provenance_status in (
    'document_supported','reviewed','external_source_confirmed'
  )
  and exists (
    select 1
    from public.craftid_entities e
    where e.id = observations.entity_id
      and e.owner_user_id is distinct from (select auth.uid())
  )
);
