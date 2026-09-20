-- Optional exact business address. Kept separate from public profile data.

create table if not exists public.entity_business_addresses (
  entity_id uuid primary key references public.craftid_entities(id) on delete cascade,
  address_line1 text,
  address_line2 text,
  postal_code text,
  locality text,
  country_code text,
  updated_at timestamptz not null default now()
);

alter table public.entity_business_addresses enable row level security;

create policy "owners and staff can read business address"
on public.entity_business_addresses for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_business_addresses.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can insert business address"
on public.entity_business_addresses for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_business_addresses.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "owners can update business address"
on public.entity_business_addresses for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_business_addresses.entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_business_addresses.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

grant select, insert, update on public.entity_business_addresses to authenticated;

drop trigger if exists entity_business_addresses_touch_updated_at
on public.entity_business_addresses;

create trigger entity_business_addresses_touch_updated_at
before update on public.entity_business_addresses
for each row execute function private.touch_updated_at();
