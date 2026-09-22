-- Partner organisations and governance for CraftID.
-- Partners are organisational actors with an explicit role, lifecycle status,
-- agreement/mandate status and public visibility control.

create table if not exists public.partner_organisations (
  id uuid primary key default gen_random_uuid(),
  legal_name_en text not null,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text not null,
  partner_role text not null check (
    partner_role in (
      'european_coordinator',
      'national_coordinating_partner',
      'sectoral_partner',
      'regional_partner',
      'vet_skills_partner',
      'knowledge_partner',
      'ecosystem_partner'
    )
  ),
  status text not null default 'invited' check (
    status in ('invited','in_discussion','confirmed','inactive')
  ),
  agreement_status text not null default 'none' check (
    agreement_status in ('none','draft','mandate_on_file','agreement_signed')
  ),
  website_url text,
  description_en text,
  description_uk text,
  scope_note text,
  is_public boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (country_code = upper(country_code) and char_length(country_code) = 2),
  check (website_url is null or website_url ~ '^https?://')
);

create index if not exists partner_organisations_country_idx
  on public.partner_organisations(country_code, status);
create index if not exists partner_organisations_role_idx
  on public.partner_organisations(partner_role, status);
create index if not exists partner_organisations_public_idx
  on public.partner_organisations(is_public, status, sort_order);

drop trigger if exists partner_organisations_touch_updated_at on public.partner_organisations;
create trigger partner_organisations_touch_updated_at
before update on public.partner_organisations
for each row execute function private.touch_updated_at();

alter table public.partner_organisations enable row level security;

drop policy if exists "public can read confirmed public partners" on public.partner_organisations;
create policy "public can read confirmed public partners"
on public.partner_organisations for select
to anon, authenticated
using (
  (is_public = true and status = 'confirmed')
  or private.has_staff_role(array['admin'])
);

revoke all on public.partner_organisations from anon, authenticated;
grant select on public.partner_organisations to anon, authenticated;
grant all privileges on public.partner_organisations to service_role;

create or replace function private.admin_save_partner_organisation_impl(
  p_id uuid,
  p_legal_name_en text,
  p_legal_name_uk text,
  p_short_name_en text,
  p_short_name_uk text,
  p_country_code text,
  p_partner_role text,
  p_status text,
  p_agreement_status text,
  p_website_url text,
  p_description_en text,
  p_description_uk text,
  p_scope_note text,
  p_is_public boolean,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_id uuid;
  v_actor uuid := (select auth.uid());
  v_old jsonb;
  v_country text := upper(btrim(coalesce(p_country_code, '')));
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if nullif(btrim(coalesce(p_legal_name_en, '')), '') is null then
    raise exception 'English legal name is required';
  end if;

  if char_length(v_country) <> 2 then
    raise exception 'country code must be ISO alpha-2';
  end if;

  if p_partner_role not in (
    'european_coordinator','national_coordinating_partner','sectoral_partner',
    'regional_partner','vet_skills_partner','knowledge_partner','ecosystem_partner'
  ) then
    raise exception 'invalid partner role';
  end if;

  if p_status not in ('invited','in_discussion','confirmed','inactive') then
    raise exception 'invalid partner status';
  end if;

  if p_agreement_status not in ('none','draft','mandate_on_file','agreement_signed') then
    raise exception 'invalid agreement status';
  end if;

  if coalesce(p_is_public,false) and p_status <> 'confirmed' then
    raise exception 'only confirmed partners may be public';
  end if;

  if nullif(btrim(coalesce(p_website_url,'')), '') is not null
     and btrim(p_website_url) !~ '^https?://' then
    raise exception 'website URL must start with http:// or https://';
  end if;

  if p_id is null then
    insert into public.partner_organisations(
      legal_name_en, legal_name_uk, short_name_en, short_name_uk,
      country_code, partner_role, status, agreement_status, website_url,
      description_en, description_uk, scope_note, is_public, sort_order,
      created_by, updated_by
    )
    values (
      btrim(p_legal_name_en),
      nullif(btrim(coalesce(p_legal_name_uk,'')), ''),
      nullif(btrim(coalesce(p_short_name_en,'')), ''),
      nullif(btrim(coalesce(p_short_name_uk,'')), ''),
      v_country, p_partner_role, p_status, p_agreement_status,
      nullif(btrim(coalesce(p_website_url,'')), ''),
      nullif(btrim(coalesce(p_description_en,'')), ''),
      nullif(btrim(coalesce(p_description_uk,'')), ''),
      nullif(btrim(coalesce(p_scope_note,'')), ''),
      coalesce(p_is_public,false), coalesce(p_sort_order,0), v_actor, v_actor
    )
    returning id into v_id;

    insert into public.audit_events(actor_user_id, action, metadata)
    values (
      v_actor,
      'partner_organisation_created',
      jsonb_build_object(
        'partner_organisation_id', v_id,
        'legal_name_en', btrim(p_legal_name_en),
        'partner_role', p_partner_role,
        'status', p_status,
        'agreement_status', p_agreement_status
      )
    );
  else
    select to_jsonb(po) into v_old
    from public.partner_organisations po
    where po.id = p_id
    for update;

    if v_old is null then
      raise exception 'partner organisation not found';
    end if;

    update public.partner_organisations
    set legal_name_en = btrim(p_legal_name_en),
        legal_name_uk = nullif(btrim(coalesce(p_legal_name_uk,'')), ''),
        short_name_en = nullif(btrim(coalesce(p_short_name_en,'')), ''),
        short_name_uk = nullif(btrim(coalesce(p_short_name_uk,'')), ''),
        country_code = v_country,
        partner_role = p_partner_role,
        status = p_status,
        agreement_status = p_agreement_status,
        website_url = nullif(btrim(coalesce(p_website_url,'')), ''),
        description_en = nullif(btrim(coalesce(p_description_en,'')), ''),
        description_uk = nullif(btrim(coalesce(p_description_uk,'')), ''),
        scope_note = nullif(btrim(coalesce(p_scope_note,'')), ''),
        is_public = coalesce(p_is_public,false),
        sort_order = coalesce(p_sort_order,0),
        updated_by = v_actor
    where id = p_id;

    v_id := p_id;

    insert into public.audit_events(actor_user_id, action, metadata)
    values (
      v_actor,
      'partner_organisation_updated',
      jsonb_build_object(
        'partner_organisation_id', v_id,
        'old_status', v_old->>'status',
        'new_status', p_status,
        'old_role', v_old->>'partner_role',
        'new_role', p_partner_role,
        'agreement_status', p_agreement_status
      )
    );
  end if;

  return v_id;
end;
$$;

revoke all on function private.admin_save_partner_organisation_impl(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer
) from public;
grant execute on function private.admin_save_partner_organisation_impl(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer
) to authenticated;

create or replace function public.admin_save_partner_organisation(
  p_id uuid,
  p_legal_name_en text,
  p_legal_name_uk text,
  p_short_name_en text,
  p_short_name_uk text,
  p_country_code text,
  p_partner_role text,
  p_status text,
  p_agreement_status text,
  p_website_url text,
  p_description_en text,
  p_description_uk text,
  p_scope_note text,
  p_is_public boolean,
  p_sort_order integer
)
returns uuid
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_save_partner_organisation_impl(
    p_id, p_legal_name_en, p_legal_name_uk, p_short_name_en, p_short_name_uk,
    p_country_code, p_partner_role, p_status, p_agreement_status, p_website_url,
    p_description_en, p_description_uk, p_scope_note, p_is_public, p_sort_order
  );
$$;

revoke all on function public.admin_save_partner_organisation(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer
) from public;
grant execute on function public.admin_save_partner_organisation(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,boolean,integer
) to authenticated;

insert into public.partner_organisations(
  legal_name_en,
  legal_name_uk,
  short_name_en,
  short_name_uk,
  country_code,
  partner_role,
  status,
  agreement_status,
  description_en,
  description_uk,
  scope_note,
  is_public,
  sort_order
)
select
  'Handicraft Chamber of Ukraine',
  'Реміснича палата України',
  'HCU-MSMEs',
  'РПУ-ММСП',
  'UA',
  'national_coordinating_partner',
  'confirmed',
  'mandate_on_file',
  'HCU-MSMEs supports the national coordination of the CraftID pilot in Ukraine, engagement with craftspeople and craft-based micro-enterprises, contribution to skills and taxonomy development, and institutional cooperation with European partners.',
  'РПУ-ММСП підтримує національну координацію пілотного впровадження CraftID в Україні, взаємодію з ремісниками та ремісничими мікро- і малими підприємствами, розвиток системи навичок і таксономії, а також інституційну співпрацю з європейськими партнерами.',
  'National coordination for Ukraine; mandate on file for European representation/cooperation. No automatic claim-attestation authority.',
  true,
  10
where not exists (
  select 1
  from public.partner_organisations
  where lower(legal_name_en) = lower('Handicraft Chamber of Ukraine')
);
