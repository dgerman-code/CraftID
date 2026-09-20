-- Correct MOD-97 check digits.
-- The concatenated base number and two check digits validate to remainder 1.
create or replace function public.craftid_check_digits(p_number bigint)
returns text
language sql
immutable
strict
security invoker
set search_path = pg_catalog
as $$
  select lpad((98 - ((p_number * 100) % 97))::text, 2, '0');
$$;
