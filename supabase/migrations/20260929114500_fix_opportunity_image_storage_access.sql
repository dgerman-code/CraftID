-- Fix Opportunity image storage policies without exposing the private access helper.
-- Storage RLS runs as the authenticated caller, so it cannot invoke
-- private.partner_has_access() directly because EXECUTE is intentionally revoked.

create or replace function public.partner_can_manage_opportunity_media(
  p_partner_organisation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, private
as $$
  select private.partner_has_access(p_partner_organisation_id);
$$;

revoke all on function public.partner_can_manage_opportunity_media(uuid)
from public, anon;
grant execute on function public.partner_can_manage_opportunity_media(uuid)
to authenticated;

drop policy if exists "opportunity images partners can upload" on storage.objects;
create policy "opportunity images partners can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then public.partner_can_manage_opportunity_media(
        ((storage.foldername(name))[1])::uuid
      )
    else false
  end
);

drop policy if exists "opportunity images partners can update" on storage.objects;
create policy "opportunity images partners can update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then public.partner_can_manage_opportunity_media(
        ((storage.foldername(name))[1])::uuid
      )
    else false
  end
)
with check (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then public.partner_can_manage_opportunity_media(
        ((storage.foldername(name))[1])::uuid
      )
    else false
  end
);

drop policy if exists "opportunity images partners can delete" on storage.objects;
create policy "opportunity images partners can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then public.partner_can_manage_opportunity_media(
        ((storage.foldername(name))[1])::uuid
      )
    else false
  end
);
