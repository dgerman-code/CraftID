-- Operational governance RPCs for CraftID Administration Console.
-- Keeps staff and taxonomy changes behind guarded, audited admin functions.

create or replace function private.admin_list_staff_impl()
returns table(user_id uuid, email text, role text, created_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, auth, private
as $$
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  return query
  select sr.user_id, u.email::text, sr.role, sr.created_at
  from private.staff_roles sr
  left join auth.users u on u.id = sr.user_id
  order by case sr.role when 'admin' then 0 else 1 end, sr.created_at asc;
end;
$$;

revoke all on function private.admin_list_staff_impl() from public;
grant execute on function private.admin_list_staff_impl() to authenticated;

create or replace function public.admin_list_staff()
returns table(user_id uuid, email text, role text, created_at timestamptz)
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select * from private.admin_list_staff_impl();
$$;

revoke all on function public.admin_list_staff() from public;
grant execute on function public.admin_list_staff() to authenticated;

create or replace function private.admin_set_staff_role_impl(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_old_role text;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_role not in ('reviewer','admin') then
    raise exception 'invalid staff role';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user not found';
  end if;

  select role into v_old_role from private.staff_roles where user_id = p_user_id;

  insert into private.staff_roles(user_id, role)
  values (p_user_id, p_role)
  on conflict (user_id) do update set role = excluded.role;

  insert into public.audit_events(actor_user_id, action, old_status, new_status, metadata)
  values (
    (select auth.uid()),
    'staff_role_changed',
    v_old_role,
    p_role,
    jsonb_build_object('target_user_id', p_user_id)
  );
end;
$$;

revoke all on function private.admin_set_staff_role_impl(uuid,text) from public;
grant execute on function private.admin_set_staff_role_impl(uuid,text) to authenticated;

create or replace function public.admin_set_staff_role(p_user_id uuid, p_role text)
returns void
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_set_staff_role_impl(p_user_id, p_role);
$$;

revoke all on function public.admin_set_staff_role(uuid,text) from public;
grant execute on function public.admin_set_staff_role(uuid,text) to authenticated;

create or replace function private.admin_remove_staff_role_impl(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_old_role text;
  v_admin_count integer;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  select role into v_old_role from private.staff_roles where user_id = p_user_id;
  if v_old_role is null then
    return;
  end if;

  if v_old_role = 'admin' then
    select count(*) into v_admin_count from private.staff_roles where role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'cannot remove the last admin';
    end if;
  end if;

  delete from private.staff_roles where user_id = p_user_id;

  insert into public.audit_events(actor_user_id, action, old_status, metadata)
  values (
    (select auth.uid()),
    'staff_role_removed',
    v_old_role,
    jsonb_build_object('target_user_id', p_user_id)
  );
end;
$$;

revoke all on function private.admin_remove_staff_role_impl(uuid) from public;
grant execute on function private.admin_remove_staff_role_impl(uuid) to authenticated;

create or replace function public.admin_remove_staff_role(p_user_id uuid)
returns void
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_remove_staff_role_impl(p_user_id);
$$;

revoke all on function public.admin_remove_staff_role(uuid) from public;
grant execute on function public.admin_remove_staff_role(uuid) to authenticated;

create or replace function private.admin_save_taxonomy_term_impl(
  p_id uuid,
  p_parent_id uuid,
  p_term_type text,
  p_stable_key text,
  p_label_en text,
  p_label_uk text,
  p_description_en text,
  p_description_uk text,
  p_sort_order integer,
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_id uuid;
  v_existing_key text;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if p_term_type not in ('craft_category','profession','skill') then
    raise exception 'invalid taxonomy term type';
  end if;

  if nullif(btrim(p_stable_key), '') is null
     or nullif(btrim(p_label_en), '') is null
     or nullif(btrim(p_label_uk), '') is null then
    raise exception 'stable key and labels are required';
  end if;

  if p_parent_id is not null and p_parent_id = p_id then
    raise exception 'taxonomy term cannot be its own parent';
  end if;

  if p_id is null then
    insert into public.taxonomy_terms(
      parent_id, term_type, stable_key, label_en, label_uk,
      description_en, description_uk, sort_order, is_active
    )
    values (
      p_parent_id, p_term_type, btrim(p_stable_key), btrim(p_label_en), btrim(p_label_uk),
      nullif(btrim(coalesce(p_description_en,'')), ''),
      nullif(btrim(coalesce(p_description_uk,'')), ''),
      coalesce(p_sort_order,0), coalesce(p_is_active,true)
    )
    returning id into v_id;

    insert into public.audit_events(actor_user_id, action, metadata)
    values (
      (select auth.uid()),
      'taxonomy_term_created',
      jsonb_build_object('taxonomy_term_id', v_id, 'stable_key', btrim(p_stable_key))
    );
  else
    select stable_key into v_existing_key from public.taxonomy_terms where id = p_id;
    if v_existing_key is null then
      raise exception 'taxonomy term not found';
    end if;
    if v_existing_key <> btrim(p_stable_key) then
      raise exception 'stable_key is immutable';
    end if;

    update public.taxonomy_terms
    set parent_id = p_parent_id,
        term_type = p_term_type,
        label_en = btrim(p_label_en),
        label_uk = btrim(p_label_uk),
        description_en = nullif(btrim(coalesce(p_description_en,'')), ''),
        description_uk = nullif(btrim(coalesce(p_description_uk,'')), ''),
        sort_order = coalesce(p_sort_order,0),
        is_active = coalesce(p_is_active,true)
    where id = p_id;

    v_id := p_id;

    insert into public.audit_events(actor_user_id, action, metadata)
    values (
      (select auth.uid()),
      'taxonomy_term_updated',
      jsonb_build_object('taxonomy_term_id', v_id, 'stable_key', v_existing_key)
    );
  end if;

  return v_id;
end;
$$;

revoke all on function private.admin_save_taxonomy_term_impl(uuid,uuid,text,text,text,text,text,text,integer,boolean) from public;
grant execute on function private.admin_save_taxonomy_term_impl(uuid,uuid,text,text,text,text,text,text,integer,boolean) to authenticated;

create or replace function public.admin_save_taxonomy_term(
  p_id uuid,
  p_parent_id uuid,
  p_term_type text,
  p_stable_key text,
  p_label_en text,
  p_label_uk text,
  p_description_en text,
  p_description_uk text,
  p_sort_order integer,
  p_is_active boolean
)
returns uuid
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_save_taxonomy_term_impl(
    p_id, p_parent_id, p_term_type, p_stable_key, p_label_en, p_label_uk,
    p_description_en, p_description_uk, p_sort_order, p_is_active
  );
$$;

revoke all on function public.admin_save_taxonomy_term(uuid,uuid,text,text,text,text,text,text,integer,boolean) from public;
grant execute on function public.admin_save_taxonomy_term(uuid,uuid,text,text,text,text,text,text,integer,boolean) to authenticated;
