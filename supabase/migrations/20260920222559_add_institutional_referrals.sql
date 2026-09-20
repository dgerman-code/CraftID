-- Institutional referral workflow v1.
-- CraftID staff may invite a registered professional/workshop to an opportunity
-- without disclosing private contact details to the requester.

create table if not exists public.institutional_referrals (
  id uuid primary key default gen_random_uuid(),
  target_entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  requester_organisation text not null,
  requester_contact_name text,
  requester_contact_email text,
  opportunity_type text not null check (
    opportunity_type in ('project','partnership','training','commission','research','restoration','other')
  ),
  title text not null,
  message text not null,
  response_deadline date,
  status text not null default 'invited' check (
    status in ('invited','accepted','declined','withdrawn','closed')
  ),
  owner_response_note text,
  responded_at timestamptz,
  responded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists institutional_referrals_target_idx
  on public.institutional_referrals(target_entity_id, created_at desc);

create index if not exists institutional_referrals_status_idx
  on public.institutional_referrals(status, created_at desc);

alter table public.institutional_referrals enable row level security;

create policy "owners can read own referrals"
on public.institutional_referrals for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = institutional_referrals.target_entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "staff can read referrals"
on public.institutional_referrals for select
to authenticated
using (private.has_staff_role(array['reviewer','admin']));

create policy "admins can create referrals"
on public.institutional_referrals for insert
to authenticated
with check (
  private.has_staff_role(array['admin'])
  and created_by = (select auth.uid())
);

create policy "owners can respond to referrals"
on public.institutional_referrals for update
to authenticated
using (
  status = 'invited'
  and exists (
    select 1 from public.craftid_entities e
    where e.id = institutional_referrals.target_entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  status in ('accepted','declined')
  and responded_by = (select auth.uid())
);

create policy "admins can manage referrals"
on public.institutional_referrals for update
to authenticated
using (private.has_staff_role(array['admin']))
with check (private.has_staff_role(array['admin']));

grant select, insert, update on public.institutional_referrals to authenticated;

drop trigger if exists institutional_referrals_touch_updated_at on public.institutional_referrals;
create trigger institutional_referrals_touch_updated_at
before update on public.institutional_referrals
for each row execute function private.touch_updated_at();

create or replace view public.institutional_shareable_contacts
with (security_invoker = true, security_barrier = true)
as
select
  cp.id,
  cp.entity_id,
  cp.contact_type,
  cp.value,
  cp.verification_level,
  cp.verified_at,
  cp.last_checked_at
from public.entity_contact_points cp
where cp.share_with_institutional_partners = true;

grant select on public.institutional_shareable_contacts to authenticated;
