-- Safe contact and referral workflow v1.
-- Public users can send a controlled enquiry without seeing private email or phone.

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  target_entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  requester_name text not null,
  requester_email text not null,
  requester_organisation text,
  requester_role text,
  message text not null,
  purpose text not null default 'professional_enquiry'
    check (purpose in ('professional_enquiry','institutional_partnership','project_invitation','training','commission','other')),
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','closed','spam')),
  submitted_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references auth.users(id) on delete set null,
  owner_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_requests_target_idx
  on public.contact_requests(target_entity_id, submitted_at desc);

create index if not exists contact_requests_status_idx
  on public.contact_requests(status, submitted_at desc);

alter table public.contact_requests enable row level security;

create policy "owners and staff can read contact requests"
on public.contact_requests for select
to authenticated
using (
  exists (
    select 1
    from public.craftid_entities e
    where e.id = contact_requests.target_entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can update contact request handling"
on public.contact_requests for update
to authenticated
using (
  exists (
    select 1
    from public.craftid_entities e
    where e.id = contact_requests.target_entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.craftid_entities e
    where e.id = contact_requests.target_entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

grant select, update on public.contact_requests to authenticated;

drop trigger if exists contact_requests_touch_updated_at on public.contact_requests;
create trigger contact_requests_touch_updated_at
before update on public.contact_requests
for each row execute function private.touch_updated_at();

create or replace function private.submit_contact_request_impl(
  p_craftid_number bigint,
  p_requester_name text,
  p_requester_email text,
  p_requester_organisation text,
  p_requester_role text,
  p_purpose text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_entity_id uuid;
  v_request_id uuid;
  v_email text := lower(btrim(coalesce(p_requester_email, '')));
  v_name text := btrim(coalesce(p_requester_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_purpose text := coalesce(nullif(btrim(p_purpose), ''), 'professional_enquiry');
  v_recent_count integer;
begin
  if p_craftid_number is null or p_craftid_number < 1 then
    raise exception 'invalid CraftID';
  end if;

  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'requester name must be between 2 and 120 characters';
  end if;

  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'valid email required';
  end if;

  if length(v_message) < 20 or length(v_message) > 3000 then
    raise exception 'message must be between 20 and 3000 characters';
  end if;

  if v_purpose not in ('professional_enquiry','institutional_partnership','project_invitation','training','commission','other') then
    raise exception 'invalid purpose';
  end if;

  select e.id into v_entity_id
  from public.craftid_entities e
  where e.craftid_number = p_craftid_number
    and e.public_status = 'published'
  limit 1;

  if v_entity_id is null then
    raise exception 'CraftID profile is not available for contact';
  end if;

  select count(*) into v_recent_count
  from public.contact_requests r
  where r.target_entity_id = v_entity_id
    and lower(r.requester_email) = v_email
    and r.submitted_at > now() - interval '1 hour';

  if v_recent_count >= 3 then
    raise exception 'too many recent requests; try again later';
  end if;

  insert into public.contact_requests(
    target_entity_id,
    requester_name,
    requester_email,
    requester_organisation,
    requester_role,
    purpose,
    message
  )
  values(
    v_entity_id,
    v_name,
    v_email,
    nullif(btrim(coalesce(p_requester_organisation, '')), ''),
    nullif(btrim(coalesce(p_requester_role, '')), ''),
    v_purpose,
    v_message
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.submit_contact_request_impl(bigint,text,text,text,text,text,text)
from public, anon, authenticated;

create or replace function public.submit_contact_request(
  p_craftid_number bigint,
  p_requester_name text,
  p_requester_email text,
  p_requester_organisation text default null,
  p_requester_role text default null,
  p_purpose text default 'professional_enquiry',
  p_message text default null
)
returns uuid
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.submit_contact_request_impl(
    p_craftid_number,
    p_requester_name,
    p_requester_email,
    p_requester_organisation,
    p_requester_role,
    p_purpose,
    p_message
  );
$$;

grant execute on function public.submit_contact_request(bigint,text,text,text,text,text,text)
to anon, authenticated;
