-- Foundation hardening:
-- 1) derive reviewer identity/role in the database and prohibit self-review;
-- 2) add a governed professional <-> workshop relationship model.
--
-- This migration does NOT yet enable multi-CraftID switching in the owner UI.
-- It establishes the safe data model first so later workflows do not require
-- another structural rewrite.

-------------------------------------------------------------------------------
-- Review governance
-------------------------------------------------------------------------------

create or replace function private.submit_claim_review_impl(
  p_claim_id uuid,
  p_evidence_id uuid,
  p_decision text,
  p_resulting_status text,
  p_private_notes text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role text;
  v_entity_id uuid;
  v_owner_user_id uuid;
  v_review_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select sr.role
    into v_role
  from private.staff_roles sr
  where sr.user_id = v_actor;

  if v_role not in ('reviewer','admin') then
    raise exception 'reviewer role required';
  end if;

  if p_decision not in (
    'supports_claim','does_not_support_claim',
    'unable_to_determine','needs_clarification'
  ) then
    raise exception 'invalid review decision';
  end if;

  if p_resulting_status not in (
    'evidence_submitted','document_reviewed','evidence_reviewed',
    'external_source_confirmed','identity_reviewed'
  ) then
    raise exception 'invalid resulting status';
  end if;

  select c.entity_id, e.owner_user_id
    into v_entity_id, v_owner_user_id
  from public.claims c
  join public.craftid_entities e on e.id = c.entity_id
  where c.id = p_claim_id
  for update of c;

  if v_entity_id is null then
    raise exception 'claim not found';
  end if;

  if v_owner_user_id = v_actor then
    raise exception 'self-review is not permitted';
  end if;

  if p_evidence_id is not null and not exists (
    select 1
    from public.claim_evidence_links l
    where l.claim_id = p_claim_id
      and l.evidence_id = p_evidence_id
  ) then
    raise exception 'evidence is not linked to claim';
  end if;

  insert into public.reviews(
    claim_id,
    evidence_id,
    reviewer_user_id,
    reviewer_role,
    decision,
    resulting_status,
    private_notes
  )
  values (
    p_claim_id,
    p_evidence_id,
    v_actor,
    v_role,
    p_decision,
    p_resulting_status,
    nullif(btrim(coalesce(p_private_notes,'')), '')
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function private.submit_claim_review_impl(uuid,uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function private.submit_claim_review_impl(uuid,uuid,text,text,text)
  to authenticated;

create or replace function public.submit_claim_review(
  p_claim_id uuid,
  p_evidence_id uuid,
  p_decision text,
  p_resulting_status text,
  p_private_notes text default null
)
returns uuid
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.submit_claim_review_impl(
    p_claim_id,
    p_evidence_id,
    p_decision,
    p_resulting_status,
    p_private_notes
  );
$$;

revoke all on function public.submit_claim_review(uuid,uuid,text,text,text)
  from public, anon;
grant execute on function public.submit_claim_review(uuid,uuid,text,text,text)
  to authenticated;

-- The application must use submit_claim_review. Authenticated users can no
-- longer manufacture review rows directly.
revoke insert on public.reviews from authenticated;

-- Defence in depth: even privileged application paths must preserve reviewer
-- attribution and conflict-of-interest rules.
create or replace function private.protect_review_attribution()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role text;
  v_owner_user_id uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'reviews are append-only';
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

  select e.owner_user_id into v_owner_user_id
  from public.claims c
  join public.craftid_entities e on e.id = c.entity_id
  where c.id = new.claim_id;

  if v_owner_user_id is null then
    raise exception 'claim not found';
  end if;

  if v_owner_user_id = v_actor then
    raise exception 'self-review is not permitted';
  end if;

  new.reviewer_user_id := v_actor;
  new.reviewer_role := v_role;

  return new;
end;
$$;

revoke all on function private.protect_review_attribution() from public, anon, authenticated;

drop trigger if exists reviews_protect_attribution on public.reviews;
create trigger reviews_protect_attribution
before insert on public.reviews
for each row execute function private.protect_review_attribution();

-------------------------------------------------------------------------------
-- Professional <-> workshop relationship foundation
-------------------------------------------------------------------------------

create table if not exists public.professional_workshop_relationships (
  id uuid primary key default gen_random_uuid(),
  professional_entity_id uuid not null
    references public.craftid_entities(id) on delete cascade,
  workshop_entity_id uuid not null
    references public.craftid_entities(id) on delete cascade,
  relationship_role text not null check (
    relationship_role in (
      'owner','co_owner','member','master','employee','collaborator'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending','active','ended','rejected')
  ),
  visibility text not null default 'private' check (
    visibility in ('private','public')
  ),
  provenance_status text not null default 'self_declared' check (
    provenance_status in (
      'self_declared','document_supported','reviewed','external_source_confirmed'
    )
  ),
  starts_on date,
  ends_on date,
  initiated_by_user_id uuid references auth.users(id) on delete set null,
  professional_confirmed_at timestamptz,
  workshop_confirmed_at timestamptz,
  source_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (professional_entity_id <> workshop_entity_id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on),
  unique (professional_entity_id, workshop_entity_id, relationship_role)
);

create index if not exists professional_workshop_relationships_professional_idx
  on public.professional_workshop_relationships(professional_entity_id, status);
create index if not exists professional_workshop_relationships_workshop_idx
  on public.professional_workshop_relationships(workshop_entity_id, status);

drop trigger if exists professional_workshop_relationships_touch_updated_at
  on public.professional_workshop_relationships;
create trigger professional_workshop_relationships_touch_updated_at
before update on public.professional_workshop_relationships
for each row execute function private.touch_updated_at();

create or replace function private.validate_professional_workshop_relationship()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_professional_type text;
  v_workshop_type text;
begin
  select entity_type into v_professional_type
  from public.craftid_entities
  where id = new.professional_entity_id;

  select entity_type into v_workshop_type
  from public.craftid_entities
  where id = new.workshop_entity_id;

  if v_professional_type <> 'professional' then
    raise exception 'professional_entity_id must reference a professional CraftID';
  end if;

  if v_workshop_type <> 'workshop' then
    raise exception 'workshop_entity_id must reference a workshop CraftID';
  end if;

  if new.status = 'active'
     and (new.professional_confirmed_at is null or new.workshop_confirmed_at is null) then
    raise exception 'active relationship requires confirmation from both sides';
  end if;

  if new.visibility = 'public' and new.status <> 'active' then
    raise exception 'only active relationships may be public';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_professional_workshop_relationship()
  from public, anon, authenticated;

drop trigger if exists professional_workshop_relationships_validate
  on public.professional_workshop_relationships;
create trigger professional_workshop_relationships_validate
before insert or update on public.professional_workshop_relationships
for each row execute function private.validate_professional_workshop_relationship();

alter table public.professional_workshop_relationships enable row level security;

create policy "relationship participants and staff can read"
on public.professional_workshop_relationships for select
to authenticated
using (
  exists (
    select 1
    from public.craftid_entities e
    where e.id in (
      professional_workshop_relationships.professional_entity_id,
      professional_workshop_relationships.workshop_entity_id
    )
      and e.owner_user_id = (select auth.uid())
  )
  or private.has_staff_role(array['reviewer','admin'])
);

create policy "public can read active public relationships"
on public.professional_workshop_relationships for select
to anon
using (
  status = 'active'
  and visibility = 'public'
  and exists (
    select 1 from public.craftid_entities p
    where p.id = professional_workshop_relationships.professional_entity_id
      and p.public_status = 'published'
  )
  and exists (
    select 1 from public.craftid_entities w
    where w.id = professional_workshop_relationships.workshop_entity_id
      and w.public_status = 'published'
  )
);

-- No direct end-user writes yet. The relationship confirmation workflow will be
-- exposed through guarded RPCs when the owner UI supports multiple records.
revoke insert, update, delete on public.professional_workshop_relationships
  from anon, authenticated;
grant select on public.professional_workshop_relationships to anon, authenticated;
grant all privileges on public.professional_workshop_relationships to service_role;

comment on table public.professional_workshop_relationships is
  'Governed links between professional and workshop CraftID entities. Public visibility requires an active relationship confirmed by both sides.';
