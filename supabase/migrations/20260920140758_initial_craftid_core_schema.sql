
create schema if not exists private;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;

create table private.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('reviewer','admin')),
  created_at timestamptz not null default now()
);

create or replace function private.has_staff_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, private
as $$
  select exists (
    select 1
    from private.staff_roles sr
    where sr.user_id = (select auth.uid())
      and sr.role = any(required_roles)
  );
$$;

revoke all on function private.has_staff_role(text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_staff_role(text[]) to authenticated;

create sequence public.craftid_public_number_seq
  start with 1000
  increment by 1
  no cycle;

create table public.craftid_entities (
  id uuid primary key default gen_random_uuid(),
  craftid_number bigint not null default nextval('public.craftid_public_number_seq') unique,
  entity_type text not null check (entity_type in ('professional','workshop')),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  public_status text not null default 'draft'
    check (public_status in ('draft','published','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (craftid_number > 0)
);

create unique index craftid_entities_owner_type_uidx
  on public.craftid_entities(owner_user_id, entity_type)
  where public_status <> 'archived';
create index craftid_entities_owner_idx on public.craftid_entities(owner_user_id);
create index craftid_entities_public_status_idx on public.craftid_entities(public_status);
create index craftid_entities_type_idx on public.craftid_entities(entity_type);

create table public.professional_profiles (
  entity_id uuid primary key references public.craftid_entities(id) on delete cascade,
  display_name text not null,
  professional_title text,
  country_code text,
  region text,
  city text,
  about text,
  profile_photo_path text,
  languages text[] not null default '{}',
  cooperation_interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workshop_profiles (
  entity_id uuid primary key references public.craftid_entities(id) on delete cascade,
  display_name text not null,
  craft_sector text,
  country_code text,
  region text,
  city text,
  about text,
  website_url text,
  capabilities text[] not null default '{}',
  production_capacity text,
  profile_photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taxonomy_terms (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.taxonomy_terms(id) on delete restrict,
  term_type text not null check (term_type in ('craft_category','profession','skill')),
  stable_key text not null unique,
  label_en text not null,
  label_uk text not null,
  description_en text,
  description_uk text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index taxonomy_terms_parent_idx on public.taxonomy_terms(parent_id);
create index taxonomy_terms_type_active_idx on public.taxonomy_terms(term_type, is_active, sort_order);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  claim_type text not null check (
    claim_type in (
      'identity','skill','experience','qualification',
      'workshop_affiliation','external_recognition','origin','craft_tradition'
    )
  ),
  title text not null,
  description text,
  taxonomy_term_id uuid references public.taxonomy_terms(id) on delete set null,
  issuer_or_source text,
  starts_on date,
  ends_on date,
  visibility text not null default 'public' check (visibility in ('public','private')),
  status text not null default 'self_declared' check (
    status in (
      'self_declared','evidence_submitted','document_reviewed',
      'evidence_reviewed','external_source_confirmed','identity_reviewed'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index claims_entity_idx on public.claims(entity_id);
create index claims_taxonomy_idx on public.claims(taxonomy_term_id);
create index claims_status_idx on public.claims(status);
create index claims_type_idx on public.claims(claim_type);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  owner_entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  evidence_type text not null,
  title text not null,
  issuer text,
  issue_date date,
  storage_path text unique,
  source_reference text,
  visibility text not null default 'private' check (visibility in ('private','public')),
  review_status text not null default 'submitted'
    check (review_status in ('submitted','under_review','reviewed','needs_clarification','rejected')),
  retention_status text not null default 'active'
    check (retention_status in ('active','withdrawn','deleted')),
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (storage_path is not null or source_reference is not null)
);

create index evidence_items_owner_entity_idx on public.evidence_items(owner_entity_id);
create index evidence_items_review_status_idx on public.evidence_items(review_status);

create table public.claim_evidence_links (
  claim_id uuid not null references public.claims(id) on delete cascade,
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (claim_id, evidence_id)
);

create index claim_evidence_links_evidence_idx on public.claim_evidence_links(evidence_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  evidence_id uuid references public.evidence_items(id) on delete set null,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  reviewer_role text not null check (reviewer_role in ('reviewer','admin')),
  decision text not null check (
    decision in ('supports_claim','does_not_support_claim','unable_to_determine','needs_clarification')
  ),
  resulting_status text not null check (
    resulting_status in (
      'evidence_submitted','document_reviewed','evidence_reviewed',
      'external_source_confirmed','identity_reviewed'
    )
  ),
  private_notes text,
  created_at timestamptz not null default now()
);

create index reviews_claim_idx on public.reviews(claim_id, created_at desc);
create index reviews_evidence_idx on public.reviews(evidence_id);
create index reviews_reviewer_idx on public.reviews(reviewer_user_id, created_at desc);

create table public.privacy_settings (
  entity_id uuid primary key references public.craftid_entities(id) on delete cascade,
  show_profile_photo boolean not null default true,
  show_city boolean not null default true,
  show_languages boolean not null default true,
  show_portfolio boolean not null default true,
  show_qualifications boolean not null default true,
  location_precision text not null default 'city'
    check (location_precision in ('country','region','city','exact_business_location')),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_id uuid references public.craftid_entities(id) on delete set null,
  claim_id uuid references public.claims(id) on delete set null,
  evidence_id uuid references public.evidence_items(id) on delete set null,
  action text not null,
  old_status text,
  new_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_entity_idx on public.audit_events(entity_id, created_at desc);
create index audit_events_claim_idx on public.audit_events(claim_id, created_at desc);
create index audit_events_actor_user_idx on public.audit_events(actor_user_id, created_at desc);
create index audit_events_evidence_idx on public.audit_events(evidence_id, created_at desc);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger craftid_entities_touch_updated_at
before update on public.craftid_entities
for each row execute function private.touch_updated_at();

create trigger professional_profiles_touch_updated_at
before update on public.professional_profiles
for each row execute function private.touch_updated_at();

create trigger workshop_profiles_touch_updated_at
before update on public.workshop_profiles
for each row execute function private.touch_updated_at();

create trigger taxonomy_terms_touch_updated_at
before update on public.taxonomy_terms
for each row execute function private.touch_updated_at();

create trigger claims_touch_updated_at
before update on public.claims
for each row execute function private.touch_updated_at();

create trigger evidence_items_touch_updated_at
before update on public.evidence_items
for each row execute function private.touch_updated_at();

create trigger privacy_settings_touch_updated_at
before update on public.privacy_settings
for each row execute function private.touch_updated_at();

create or replace function private.apply_review_effects()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_entity_id uuid;
  v_old_status text;
begin
  if not private.has_staff_role(array['reviewer','admin']) then
    raise exception 'reviewer role required';
  end if;

  if new.reviewer_user_id is distinct from (select auth.uid()) then
    raise exception 'reviewer_user_id must match authenticated user';
  end if;

  select c.entity_id, c.status
    into v_entity_id, v_old_status
  from public.claims c
  where c.id = new.claim_id;

  if v_entity_id is null then
    raise exception 'claim not found';
  end if;

  if new.evidence_id is not null and not exists (
    select 1
    from public.claim_evidence_links l
    where l.claim_id = new.claim_id
      and l.evidence_id = new.evidence_id
  ) then
    raise exception 'evidence is not linked to claim';
  end if;

  update public.claims
     set status = new.resulting_status,
         updated_at = now()
   where id = new.claim_id;

  if new.evidence_id is not null then
    update public.evidence_items
       set review_status = case
         when new.decision = 'supports_claim' then 'reviewed'
         when new.decision = 'needs_clarification' then 'needs_clarification'
         when new.decision = 'does_not_support_claim' then 'rejected'
         else 'under_review'
       end,
       updated_at = now()
     where id = new.evidence_id;
  end if;

  insert into public.audit_events(
    actor_user_id, entity_id, claim_id, evidence_id,
    action, old_status, new_status, metadata
  ) values (
    new.reviewer_user_id, v_entity_id, new.claim_id, new.evidence_id,
    'claim_reviewed', v_old_status, new.resulting_status,
    jsonb_build_object('decision', new.decision, 'review_id', new.id)
  );

  return new;
end;
$$;

revoke all on function private.apply_review_effects() from public;
grant execute on function private.apply_review_effects() to authenticated;

create trigger reviews_apply_effects
after insert on public.reviews
for each row execute function private.apply_review_effects();

alter table public.craftid_entities enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.workshop_profiles enable row level security;
alter table public.taxonomy_terms enable row level security;
alter table public.claims enable row level security;
alter table public.evidence_items enable row level security;
alter table public.claim_evidence_links enable row level security;
alter table public.reviews enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.audit_events enable row level security;

create policy "published entities are publicly readable"
on public.craftid_entities for select
to anon, authenticated
using (
  public_status = 'published'
  or owner_user_id = (select auth.uid())
  or private.has_staff_role(array['reviewer','admin'])
);

create policy "users can create their own entities"
on public.craftid_entities for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

create policy "owners can update their entities"
on public.craftid_entities for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "owners and staff can read professional profiles"
on public.professional_profiles for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = professional_profiles.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can create professional profiles"
on public.professional_profiles for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = professional_profiles.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.entity_type = 'professional'
  )
);

create policy "owners can update professional profiles"
on public.professional_profiles for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = professional_profiles.entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = professional_profiles.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.entity_type = 'professional'
  )
);

create policy "owners and staff can read workshop profiles"
on public.workshop_profiles for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = workshop_profiles.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can create workshop profiles"
on public.workshop_profiles for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = workshop_profiles.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.entity_type = 'workshop'
  )
);

create policy "owners can update workshop profiles"
on public.workshop_profiles for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = workshop_profiles.entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = workshop_profiles.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.entity_type = 'workshop'
  )
);

create policy "active taxonomy is publicly readable"
on public.taxonomy_terms for select
to anon, authenticated
using (is_active or private.has_staff_role(array['admin']));

create policy "admins can create taxonomy"
on public.taxonomy_terms for insert
to authenticated
with check (private.has_staff_role(array['admin']));

create policy "admins can update taxonomy"
on public.taxonomy_terms for update
to authenticated
using (private.has_staff_role(array['admin']))
with check (private.has_staff_role(array['admin']));

create policy "owners and staff can read claims"
on public.claims for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = claims.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can create claims"
on public.claims for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = claims.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and status = 'self_declared'
);

create policy "owners can update editable claims"
on public.claims for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = claims.entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = claims.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and status in ('self_declared','evidence_submitted')
);

create policy "owners can delete unreviewed claims"
on public.claims for delete
to authenticated
using (
  status in ('self_declared','evidence_submitted')
  and exists (
    select 1 from public.craftid_entities e
    where e.id = claims.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners and staff can read evidence metadata"
on public.evidence_items for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = evidence_items.owner_entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can create evidence metadata"
on public.evidence_items for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = evidence_items.owner_entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and visibility = 'private'
);

create policy "owners can update evidence metadata"
on public.evidence_items for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = evidence_items.owner_entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = evidence_items.owner_entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners and staff can read claim evidence links"
on public.claim_evidence_links for select
to authenticated
using (
  exists (
    select 1
    from public.claims c
    join public.craftid_entities e on e.id = c.entity_id
    where c.id = claim_evidence_links.claim_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can create claim evidence links"
on public.claim_evidence_links for insert
to authenticated
with check (
  exists (
    select 1
    from public.claims c
    join public.evidence_items i on i.id = claim_evidence_links.evidence_id
    join public.craftid_entities e on e.id = c.entity_id
    where c.id = claim_evidence_links.claim_id
      and i.owner_entity_id = c.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners can remove claim evidence links"
on public.claim_evidence_links for delete
to authenticated
using (
  exists (
    select 1
    from public.claims c
    join public.craftid_entities e on e.id = c.entity_id
    where c.id = claim_evidence_links.claim_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "staff can read reviews"
on public.reviews for select
to authenticated
using (private.has_staff_role(array['reviewer','admin']));

create policy "staff can create reviews"
on public.reviews for insert
to authenticated
with check (
  reviewer_user_id = (select auth.uid())
  and private.has_staff_role(array['reviewer','admin'])
);

create policy "owners can read privacy settings"
on public.privacy_settings for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = privacy_settings.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners can create privacy settings"
on public.privacy_settings for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = privacy_settings.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners can update privacy settings"
on public.privacy_settings for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = privacy_settings.entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = privacy_settings.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "staff can read audit events"
on public.audit_events for select
to authenticated
using (private.has_staff_role(array['reviewer','admin']));

grant select on public.craftid_entities to anon, authenticated;
grant insert, update on public.craftid_entities to authenticated;
grant select on public.taxonomy_terms to anon, authenticated;
grant insert, update on public.taxonomy_terms to authenticated;
grant select, insert, update on public.professional_profiles to authenticated;
grant select, insert, update on public.workshop_profiles to authenticated;
grant select, insert, update, delete on public.claims to authenticated;
grant select, insert, update on public.evidence_items to authenticated;
grant select, insert, delete on public.claim_evidence_links to authenticated;
grant select, insert on public.reviews to authenticated;
grant select, insert, update on public.privacy_settings to authenticated;
grant select on public.audit_events to authenticated;
grant usage, select on sequence public.craftid_public_number_seq to authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "evidence owners can read files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'evidence'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.has_staff_role(array['reviewer','admin'])
  )
);

create policy "evidence owners can upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "evidence owners can update files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "evidence owners can delete files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
