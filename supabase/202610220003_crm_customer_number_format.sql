-- Persist the customer numbering choice and enforce it in the shared allocator.
-- Run after 202610210001_crm_tables.sql.
alter table public.crm_settings
  add column if not exists customer_number_format text not null default 'cust-seq'
  check (customer_number_format in ('cust-seq', 'plain-seq', 'yyyy-seq'));

create or replace function public.next_crm_customer_code(p_business_id uuid)
returns text language plpgsql security invoker set search_path = public
as $$
declare
  s public.crm_settings%rowtype;
  n integer;
  code text;
begin
  if not exists (
    select 1 from public.business where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'Not authorized for this business'; end if;

  insert into public.crm_settings (business_id) values (p_business_id)
  on conflict (business_id) do nothing;
  select * into s from public.crm_settings where business_id = p_business_id for update;
  n := s.customer_number_next_value;
  loop
    code := case s.customer_number_format
      when 'plain-seq' then lpad(n::text, 4, '0')
      when 'yyyy-seq' then extract(year from current_date)::text || '-' || lpad(n::text, 4, '0')
      else s.customer_number_prefix || '-' || lpad(n::text, 4, '0')
    end;
    exit when not exists (
      select 1 from public.customers where business_id = p_business_id and customer_code = code
    );
    n := n + 1;
  end loop;
  update public.crm_settings set customer_number_next_value = n + 1 where business_id = p_business_id;
  return code;
end;
$$;
revoke all on function public.next_crm_customer_code(uuid) from public;
grant execute on function public.next_crm_customer_code(uuid) to authenticated;
