-- Client roles must never be able to bypass row-level security with TRUNCATE.
-- Supabase default table privileges may include TRUNCATE unless explicitly revoked.

do $$
declare
  r record;
begin
  for r in
    select quote_ident(n.nspname) as schema_name, quote_ident(c.relname) as relation_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r','p')
  loop
    execute format(
      'revoke truncate on table %s.%s from anon, authenticated',
      r.schema_name,
      r.relation_name
    );
  end loop;
end
$$;
