-- CraftID intelligence layer v1
-- Store time-stamped, provenance-aware observations instead of widening profile tables.

create table if not exists public.indicator_definitions (
  key text primary key,
  scope text not null check (scope in ('skill','entity')),
  label_en text not null,
  label_uk text not null,
  description_en text,
  description_uk text,
  value_type text not null check (value_type in ('categorical','multi_select','boolean','integer','range','text')),
  options jsonb,
  sort_order integer not null default 0,
  is_core boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete cascade,
  taxonomy_term_id uuid references public.taxonomy_terms(id) on delete set null,
  indicator_key text not null references public.indicator_definitions(key),
  value jsonb not null,
  provenance_status text not null default 'self_declared'
    check (provenance_status in ('self_declared','document_supported','reviewed','external_source_confirmed')),
  evidence_id uuid references public.evidence_items(id) on delete set null,
  observed_at timestamptz not null default now(),
  valid_from date not null default current_date,
  valid_to date,
  visibility text not null default 'aggregate_only'
    check (visibility in ('private','aggregate_only','public')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint observations_valid_period check (valid_to is null or valid_to >= valid_from)
);

create table if not exists public.taxonomy_external_mappings (
  id uuid primary key default gen_random_uuid(),
  taxonomy_term_id uuid not null references public.taxonomy_terms(id) on delete cascade,
  source_system text not null check (source_system in ('ESCO','NACE','UNESCO_ICH','OTHER')),
  external_id text not null,
  external_uri text,
  mapping_relation text not null default 'close'
    check (mapping_relation in ('exact','close','broad','narrow','related')),
  notes text,
  created_at timestamptz not null default now(),
  unique (taxonomy_term_id, source_system, external_id)
);

create index if not exists observations_entity_idx on public.observations(entity_id, indicator_key, observed_at desc);
create index if not exists observations_claim_idx on public.observations(claim_id, indicator_key, observed_at desc) where claim_id is not null;
create index if not exists observations_taxonomy_idx on public.observations(taxonomy_term_id, indicator_key, observed_at desc) where taxonomy_term_id is not null;
create index if not exists observations_provenance_idx on public.observations(provenance_status, indicator_key);
create index if not exists taxonomy_external_mappings_source_idx on public.taxonomy_external_mappings(source_system, external_id);

alter table public.indicator_definitions enable row level security;
alter table public.observations enable row level security;
alter table public.taxonomy_external_mappings enable row level security;

create policy "indicator definitions are publicly readable"
on public.indicator_definitions for select to anon, authenticated
using (is_active = true);

create policy "owners can read own observations"
on public.observations for select to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = observations.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  or private.has_staff_role(array['reviewer','admin'])
);

create policy "owners can insert own observations"
on public.observations for insert to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = observations.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and created_by = (select auth.uid())
  and provenance_status = 'self_declared'
);

create policy "owners can update own self declared observations"
on public.observations for update to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = observations.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and provenance_status = 'self_declared'
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = observations.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and provenance_status = 'self_declared'
);

create policy "staff can update observations"
on public.observations for update to authenticated
using (private.has_staff_role(array['reviewer','admin']))
with check (private.has_staff_role(array['reviewer','admin']));

create policy "taxonomy mappings publicly readable"
on public.taxonomy_external_mappings for select to anon, authenticated
using (true);

grant select on public.indicator_definitions to anon, authenticated;
grant select, insert, update on public.observations to authenticated;
grant select on public.taxonomy_external_mappings to anon, authenticated;

create or replace function private.validate_observation_links()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
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

  return new;
end;
$$;

create trigger observations_validate_links
before insert or update on public.observations
for each row execute function private.validate_observation_links();

create trigger indicator_definitions_touch_updated_at
before update on public.indicator_definitions
for each row execute function private.touch_updated_at();

create trigger observations_touch_updated_at
before update on public.observations
for each row execute function private.touch_updated_at();

insert into public.indicator_definitions
(key, scope, label_en, label_uk, description_en, description_uk, value_type, options, sort_order, is_core)
values
('skill.usage_intensity','skill','Use in current practice','Використання у поточній практиці',
 'How central this skill is to current practice.','Наскільки ця навичка є центральною у поточній практиці.',
 'categorical','["rarely","regularly","core","main_activity"]'::jsonb,10,true),
('skill.practice_status','skill','Current practice status','Поточний статус практики',
 'Whether the skill is currently active.','Чи використовується навичка зараз.',
 'categorical','["active","occasional","temporarily_inactive","no_longer_active"]'::jsonb,20,true),
('skill.years_band','skill','Years of practice','Роки практики',
 'Experience band for this skill.','Діапазон досвіду для цієї навички.',
 'categorical','["lt_1","1_3","4_7","8_15","15_plus"]'::jsonb,30,true),
('skill.acquisition_pathway','skill','How the skill was acquired','Як набуто навичку',
 'Learning and transmission pathway.','Шлях навчання та передачі навички.',
 'multi_select','["formal_vet","higher_education","apprenticeship","family_transmission","peer_transmission","course","self_taught","mixed"]'::jsonb,40,true),
('skill.production_archetype','skill','Production method','Спосіб виконання роботи',
 'Primary production archetype used with this skill.','Основний спосіб виконання роботи для цієї навички.',
 'categorical','["fully_handmade","hand_tools","machine_assisted_hand_defined","mostly_mechanised_with_hand_finishing","digital_design_handmade"]'::jsonb,50,true),
('skill.digital_design_intensity','skill','Digital design','Цифрове проєктування',
 'Use of digital design tools with this skill.','Використання цифрових інструментів проєктування з цією навичкою.',
 'categorical','["none","occasional","core"]'::jsonb,60,true),
('skill.digital_fabrication_intensity','skill','Digital fabrication','Цифрове виготовлення',
 'Use of digital fabrication with this skill.','Використання цифрового виготовлення з цією навичкою.',
 'categorical','["none","occasional","core"]'::jsonb,70,true),
('skill.repair_restoration_role','skill','Repair / restoration','Ремонт / реставрація',
 'Role of repair or restoration in the use of this skill.','Роль ремонту або реставрації у використанні цієї навички.',
 'categorical','["none","occasional","regular","core"]'::jsonb,80,true),
('skill.commercial_relevance','skill','Commercial relevance','Комерційне значення',
 'How this skill contributes to paid work.','Як ця навичка використовується в оплачуваній роботі.',
 'categorical','["non_commercial","occasional_paid","regular_paid","main_income"]'::jsonb,90,true),
('skill.apprenticeship_capacity','skill','Apprenticeship capacity','Можливість приймати учнів',
 'Whether the practitioner can accept an apprentice.','Чи може практик приймати учня.',
 'categorical','["no","yes","with_support"]'::jsonb,100,true),
('skill.successor_status','skill','Successor identified','Визначений наступник',
 'Whether a successor has been identified for this skill.','Чи визначено наступника для передачі цієї навички.',
 'categorical','["yes","no","not_applicable"]'::jsonb,110,true),
('skill.teaching_capacity','skill','Teaching / transfer capacity','Можливість навчати / передавати',
 'Ability to teach or transfer the skill.','Можливість навчати або передавати навичку.',
 'categorical','["no","informal","mentor","apprenticeship","structured_training"]'::jsonb,120,false),
('entity.materials_reclaimed_share','entity','Reclaimed / recycled material use','Використання вторинних / відновлених матеріалів',
 'Approximate share of reclaimed or recycled material use.','Приблизна частка вторинних або відновлених матеріалів.',
 'categorical','["none","lt_25","25_50","gt_50"]'::jsonb,210,false),
('entity.material_source','entity','Material sourcing geography','Географія походження матеріалів',
 'Primary sourcing geography for materials.','Основна географія походження матеріалів.',
 'categorical','["local","regional","national","imported","mixed"]'::jsonb,220,false),
('entity.workshop_size','entity','Workshop size','Розмір майстерні',
 'Approximate team size.','Приблизний розмір команди.',
 'categorical','["solo","2_5","6_10","11_plus"]'::jsonb,230,false)
on conflict (key) do update
set label_en = excluded.label_en,
    label_uk = excluded.label_uk,
    description_en = excluded.description_en,
    description_uk = excluded.description_uk,
    value_type = excluded.value_type,
    options = excluded.options,
    sort_order = excluded.sort_order,
    is_core = excluded.is_core,
    is_active = true;
