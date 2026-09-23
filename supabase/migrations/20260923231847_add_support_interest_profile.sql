-- Phase 1: self-declared Opportunities & Support profile.
-- This module captures structured demand signals only.
-- It does NOT perform programme matching, eligibility scoring or public disclosure.

create table public.support_interest_taxonomy (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  label_en text not null,
  label_uk text not null,
  description_en text not null,
  description_uk text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index support_interest_taxonomy_sort_uidx
on public.support_interest_taxonomy(sort_order);

create table public.entity_support_interests (
  entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  interest_code text not null references public.support_interest_taxonomy(code) on delete restrict,
  engagement_level text not null check (engagement_level in ('interested','actively_looking')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id, interest_code),
  check (note is null or char_length(note) <= 1000)
);

create index entity_support_interests_code_level_idx
on public.entity_support_interests(interest_code, engagement_level);

create index entity_support_interests_updated_idx
on public.entity_support_interests(updated_at desc);

create table public.entity_support_preferences (
  entity_id uuid primary key references public.craftid_entities(id) on delete cascade,
  allow_relevant_contact boolean not null default false,
  contact_consent_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (allow_relevant_contact = false and contact_consent_at is null)
    or
    (allow_relevant_contact = true and contact_consent_at is not null)
  )
);

create trigger support_interest_taxonomy_touch_updated_at
before update on public.support_interest_taxonomy
for each row execute function private.touch_updated_at();

create trigger entity_support_interests_touch_updated_at
before update on public.entity_support_interests
for each row execute function private.touch_updated_at();

create trigger entity_support_preferences_touch_updated_at
before update on public.entity_support_preferences
for each row execute function private.touch_updated_at();

insert into public.support_interest_taxonomy(
  code, label_en, label_uk, description_en, description_uk, sort_order
)
values
  ('funding_finance','Funding & financial support','Фінансування та фінансова підтримка','Grants, vouchers, subsidies, loans, equipment finance and other financial support.','Гранти, ваучери, субсидії, кредити, фінансування обладнання та інша фінансова підтримка.',10),
  ('business_advisory','Business support & advisory','Бізнес-підтримка та консультації','Business planning, pricing, digitalisation, legal or operational advisory.','Бізнес-планування, ціноутворення, цифровізація, юридичні та операційні консультації.',20),
  ('certification_standards','Certification, standards & compliance','Сертифікація, стандарти та відповідність','Guidance on certification, product requirements, testing, standards and compliance.','Консультації щодо сертифікації, вимог до продукції, випробувань, стандартів і відповідності.',30),
  ('training_skills','Training & skills development','Навчання та розвиток навичок','Technical, digital, entrepreneurial, management and other skills development.','Технічні, цифрові, підприємницькі, управлінські та інші програми розвитку навичок.',40),
  ('partnerships','Partnerships & cooperation','Партнерства та співпраця','Cooperation with craftspeople, workshops, designers, suppliers, institutions or other partners.','Співпраця з ремісниками, майстернями, дизайнерами, постачальниками, установами та іншими партнерами.',50),
  ('markets_export','Markets, sales & export','Ринки, продажі та експорт','Trade fairs, marketplaces, B2B buyers, distributors, export and internationalisation support.','Виставки, маркетплейси, B2B-покупці, дистриб’ютори, експорт та інтернаціоналізація.',60),
  ('production_equipment','Production, workspace & equipment','Виробництво, простір та обладнання','Equipment, machinery, shared workshop space, production capacity, logistics or infrastructure.','Обладнання, техніка, спільні майстерні, виробничі потужності, логістика та інфраструктура.',70),
  ('innovation_sustainability','Innovation & sustainability','Інновації та сталість','Digital fabrication, new technologies, energy efficiency, circular production and sustainable materials.','Цифрове виробництво, нові технології, енергоефективність, циркулярне виробництво та сталі матеріали.',80);

alter table public.support_interest_taxonomy enable row level security;
alter table public.entity_support_interests enable row level security;
alter table public.entity_support_preferences enable row level security;

create policy "authenticated users can read active support taxonomy"
on public.support_interest_taxonomy for select
to authenticated
using (is_active or private.has_staff_role(array['admin']));

create policy "admins can manage support taxonomy"
on public.support_interest_taxonomy for all
to authenticated
using (private.has_staff_role(array['admin']))
with check (private.has_staff_role(array['admin']));

create policy "owners and admins can read support interests"
on public.entity_support_interests for select
to authenticated
using (
  private.has_staff_role(array['admin'])
  or exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_interests.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners can create support interests"
on public.entity_support_interests for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_interests.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.public_status <> 'archived'
  )
);

create policy "owners can update support interests"
on public.entity_support_interests for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_interests.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.public_status <> 'archived'
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_interests.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.public_status <> 'archived'
  )
);

create policy "owners can delete support interests"
on public.entity_support_interests for delete
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_interests.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners and admins can read support preferences"
on public.entity_support_preferences for select
to authenticated
using (
  private.has_staff_role(array['admin'])
  or exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_preferences.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners can create support preferences"
on public.entity_support_preferences for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_preferences.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.public_status <> 'archived'
  )
);

create policy "owners can update support preferences"
on public.entity_support_preferences for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_preferences.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.public_status <> 'archived'
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_support_preferences.entity_id
      and e.owner_user_id = (select auth.uid())
      and e.public_status <> 'archived'
  )
);

grant select on public.support_interest_taxonomy to authenticated;
grant insert, update, delete on public.support_interest_taxonomy to authenticated;
grant select, insert, update, delete on public.entity_support_interests to authenticated;
grant select, insert, update on public.entity_support_preferences to authenticated;

create or replace function public.save_my_support_profile(
  p_entity_id uuid,
  p_interests jsonb,
  p_allow_relevant_contact boolean
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'authentication required'; end if;

  if not exists (
    select 1 from public.craftid_entities e
    where e.id = p_entity_id
      and e.owner_user_id = v_user_id
      and e.public_status <> 'archived'
  ) then
    raise exception 'CraftID record not found or not editable';
  end if;

  if p_interests is null or jsonb_typeof(p_interests) <> 'array' then
    raise exception 'interests must be a JSON array';
  end if;

  if (select count(*) from jsonb_array_elements(p_interests))
     <> (select count(distinct item->>'code') from jsonb_array_elements(p_interests) item) then
    raise exception 'duplicate support interest code';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_interests) item
    left join public.support_interest_taxonomy t
      on t.code = item->>'code' and t.is_active = true
    where t.code is null
       or coalesce(item->>'level','') not in ('interested','actively_looking')
       or char_length(coalesce(item->>'note','')) > 1000
  ) then
    raise exception 'invalid support interest selection';
  end if;

  delete from public.entity_support_interests i
  where i.entity_id = p_entity_id
    and not exists (
      select 1 from jsonb_array_elements(p_interests) item
      where item->>'code' = i.interest_code
    );

  insert into public.entity_support_interests(entity_id,interest_code,engagement_level,note)
  select p_entity_id,item->>'code',item->>'level',
         nullif(btrim(coalesce(item->>'note','')), '')
  from jsonb_array_elements(p_interests) item
  on conflict (entity_id, interest_code) do update
  set engagement_level = excluded.engagement_level,
      note = excluded.note,
      updated_at = now();

  insert into public.entity_support_preferences(entity_id,allow_relevant_contact,contact_consent_at)
  values (
    p_entity_id,
    coalesce(p_allow_relevant_contact,false),
    case when coalesce(p_allow_relevant_contact,false) then now() else null end
  )
  on conflict (entity_id) do update
  set allow_relevant_contact = excluded.allow_relevant_contact,
      contact_consent_at = case
        when excluded.allow_relevant_contact
          then coalesce(public.entity_support_preferences.contact_consent_at, excluded.contact_consent_at)
        else null
      end,
      updated_at = now();
end;
$$;

revoke all on function public.save_my_support_profile(uuid,jsonb,boolean) from public, anon;
grant execute on function public.save_my_support_profile(uuid,jsonb,boolean) to authenticated;

create or replace function public.admin_support_interest_summary()
returns table(
  interest_code text,
  label_en text,
  label_uk text,
  interested_count bigint,
  actively_looking_count bigint,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if not private.has_staff_role(array['admin']) then raise exception 'admin role required'; end if;

  return query
  select
    t.code,t.label_en,t.label_uk,
    count(*) filter (where i.engagement_level = 'interested'),
    count(*) filter (where i.engagement_level = 'actively_looking'),
    count(i.entity_id)
  from public.support_interest_taxonomy t
  left join public.entity_support_interests i on i.interest_code = t.code
  where t.is_active = true
  group by t.code,t.label_en,t.label_uk,t.sort_order
  order by t.sort_order;
end;
$$;

revoke all on function public.admin_support_interest_summary() from public, anon;
grant execute on function public.admin_support_interest_summary() to authenticated;

create or replace function public.admin_support_interest_records(
  p_interest_code text default null,
  p_level text default null,
  p_entity_type text default null,
  p_country_code text default null,
  p_limit integer default 200
)
returns table(
  entity_id uuid,
  craftid_number bigint,
  craftid_check_digits text,
  entity_type text,
  display_name text,
  country_code text,
  interest_code text,
  engagement_level text,
  note text,
  allow_relevant_contact boolean,
  updated_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if not private.has_staff_role(array['admin']) then raise exception 'admin role required'; end if;

  return query
  select
    e.id,e.craftid_number,e.craftid_check_digits,e.entity_type,
    case when e.entity_type = 'professional' then pp.display_name else wp.display_name end,
    case when e.entity_type = 'professional' then pp.country_code else wp.country_code end,
    i.interest_code,i.engagement_level,i.note,
    coalesce(pref.allow_relevant_contact,false),i.updated_at
  from public.entity_support_interests i
  join public.craftid_entities e on e.id = i.entity_id
  left join public.professional_profiles pp
    on pp.entity_id = e.id and e.entity_type = 'professional'
  left join public.workshop_profiles wp
    on wp.entity_id = e.id and e.entity_type = 'workshop'
  left join public.entity_support_preferences pref on pref.entity_id = e.id
  where e.public_status <> 'archived'
    and (p_interest_code is null or i.interest_code = p_interest_code)
    and (p_level is null or i.engagement_level = p_level)
    and (p_entity_type is null or e.entity_type = p_entity_type)
    and (
      p_country_code is null
      or upper(coalesce(
        case when e.entity_type = 'professional' then pp.country_code else wp.country_code end,''
      )) = upper(p_country_code)
    )
  order by i.updated_at desc
  limit greatest(1,least(coalesce(p_limit,200),500));
end;
$$;

revoke all on function public.admin_support_interest_records(text,text,text,text,integer)
from public, anon;
grant execute on function public.admin_support_interest_records(text,text,text,text,integer)
to authenticated;

create or replace function private.cleanup_support_profile_on_account_close()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.public_status = 'archived'
     and new.archived_reason = 'account_closed'
     and (
       old.public_status is distinct from new.public_status
       or old.archived_reason is distinct from new.archived_reason
     ) then
    delete from public.entity_support_interests where entity_id = new.id;
    delete from public.entity_support_preferences where entity_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.cleanup_support_profile_on_account_close()
from public, anon, authenticated;

create trigger craftid_entities_cleanup_support_on_account_close
after update of public_status, archived_reason on public.craftid_entities
for each row execute function private.cleanup_support_profile_on_account_close();
