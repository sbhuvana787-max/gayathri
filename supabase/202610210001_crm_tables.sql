-- Nexora CRM extension. Run after schema_payments.sql.
-- Keeps customers in the shared Billing/CRM table and adds only CRM-specific data.

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'customers_business_id_id_key' and conrelid = 'public.customers'::regclass) then
    alter table public.customers add constraint customers_business_id_id_key unique (business_id, id);
  end if;
end $$;

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business(id) on delete cascade,
  lead_code text not null,
  name text not null,
  company text not null default '',
  contact_person text not null default '',
  phone text not null default '',
  email text,
  source text not null default 'website' check (source in ('website','referral','cold-call','trade-show','social-media','advertisement','walk-in')),
  status text not null default 'new' check (status in ('new','contacted','qualified','proposal','negotiation','won','lost')),
  expected_revenue numeric(14,2) not null default 0 check (expected_revenue >= 0),
  assigned_user text not null default '',
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  converted_customer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, lead_code),
  unique (business_id, id),
  constraint crm_leads_customer_same_business foreign key (business_id, converted_customer_id)
    references public.customers(business_id, id) on delete set null (converted_customer_id)
);

create table if not exists public.crm_follow_ups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business(id) on delete cascade,
  customer_id uuid,
  lead_id uuid,
  purpose text not null,
  due_at timestamptz not null,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'pending' check (status in ('pending','completed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  check ((customer_id is not null) <> (lead_id is not null)),
  constraint crm_follow_ups_customer_same_business foreign key (business_id, customer_id)
    references public.customers(business_id, id) on delete cascade,
  constraint crm_follow_ups_lead_same_business foreign key (business_id, lead_id)
    references public.crm_leads(business_id, id) on delete cascade
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business(id) on delete cascade,
  customer_id uuid,
  lead_id uuid,
  activity_type text not null,
  title text not null,
  details text not null default '',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (customer_id is null or lead_id is null),
  constraint crm_activities_customer_same_business foreign key (business_id, customer_id)
    references public.customers(business_id, id) on delete cascade,
  constraint crm_activities_lead_same_business foreign key (business_id, lead_id)
    references public.crm_leads(business_id, id) on delete cascade
);

create table if not exists public.crm_settings (
  business_id uuid primary key references public.business(id) on delete cascade,
  customer_number_prefix text not null default 'CUS',
  customer_number_next_value integer not null default 1 check (customer_number_next_value > 0),
  default_credit_days integer not null default 30 check (default_credit_days >= 0),
  default_currency text not null default 'INR',
  default_country text not null default 'India',
  customer_categories text[] not null default array['Retail','Wholesale','Corporate','VIP','Distributor','Dealer'],
  updated_at timestamptz not null default now()
);

create index if not exists crm_leads_business_status_idx on public.crm_leads (business_id, status, created_at desc);
create index if not exists crm_follow_ups_business_due_idx on public.crm_follow_ups (business_id, status, due_at);
create index if not exists crm_activities_business_occurred_idx on public.crm_activities (business_id, occurred_at desc);
create index if not exists crm_activities_customer_idx on public.crm_activities (customer_id, occurred_at desc) where customer_id is not null;
create unique index if not exists crm_leads_business_email_unique on public.crm_leads (business_id, lower(email)) where email is not null and email <> '';

do $$
declare t text;
begin
  foreach t in array array['crm_leads','crm_follow_ups','crm_activities','crm_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_business_owner_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (exists (select 1 from public.business b where b.id = public.%I.business_id and b.owner_id = auth.uid())) with check (exists (select 1 from public.business b where b.id = public.%I.business_id and b.owner_id = auth.uid()))', t || '_business_owner_all', t, t, t);
    execute format('revoke all on public.%I from anon, public', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

drop trigger if exists crm_leads_updated_at on public.crm_leads;
create trigger crm_leads_updated_at before update on public.crm_leads for each row execute function public.set_updated_at();
drop trigger if exists crm_follow_ups_updated_at on public.crm_follow_ups;
create trigger crm_follow_ups_updated_at before update on public.crm_follow_ups for each row execute function public.set_updated_at();
drop trigger if exists crm_settings_updated_at on public.crm_settings;
create trigger crm_settings_updated_at before update on public.crm_settings for each row execute function public.set_updated_at();

-- Serializes code allocation per business so concurrent customer creation cannot reuse a code.
create or replace function public.next_crm_customer_code(p_business_id uuid)
returns text language plpgsql security invoker set search_path = public
as $$
declare s public.crm_settings%rowtype; n integer; code text;
begin
  if not exists (select 1 from public.business where id = p_business_id and owner_id = auth.uid()) then
    raise exception 'Not authorized for this business';
  end if;
  insert into public.crm_settings (business_id) values (p_business_id) on conflict (business_id) do nothing;
  select * into s from public.crm_settings where business_id = p_business_id for update;
  n := s.customer_number_next_value;
  loop
    code := s.customer_number_prefix || '-' || lpad(n::text, 4, '0');
    exit when not exists (select 1 from public.customers where business_id = p_business_id and customer_code = code);
    n := n + 1;
  end loop;
  update public.crm_settings set customer_number_next_value = n + 1 where business_id = p_business_id;
  return code;
end $$;
revoke all on function public.next_crm_customer_code(uuid) from public;
grant execute on function public.next_crm_customer_code(uuid) to authenticated;

-- Atomic and idempotent lead conversion; conversion runs under caller RLS and retains lead history.
create or replace function public.convert_crm_lead(p_business_id uuid, p_lead_id uuid)
returns uuid language plpgsql security invoker set search_path = public
as $$
declare l public.crm_leads%rowtype; c_id uuid; c_code text;
begin
  if not exists (select 1 from public.business where id = p_business_id and owner_id = auth.uid()) then
    raise exception 'Not authorized for this business';
  end if;
  select * into l from public.crm_leads where id = p_lead_id and business_id = p_business_id for update;
  if not found then raise exception 'Lead not found'; end if;
  if l.converted_customer_id is not null then return l.converted_customer_id; end if;
  if l.status = 'lost' then raise exception 'A lost lead cannot be converted'; end if;
  c_code := public.next_crm_customer_code(p_business_id);
  insert into public.customers (business_id, customer_code, name, company_name, contact_person, email, phone, customer_group, status)
  values (p_business_id, c_code, l.name, nullif(l.company,''), nullif(l.contact_person,''), nullif(l.email,''), l.phone, 'Retail', 'new')
  returning id into c_id;
  update public.crm_leads set status = 'won', converted_customer_id = c_id where id = l.id;
  insert into public.crm_activities (business_id, lead_id, activity_type, title, details)
  values (p_business_id, l.id, 'lead-converted', 'Lead converted', 'Customer ' || c_code || ' created from this lead');
  return c_id;
end $$;
revoke all on function public.convert_crm_lead(uuid, uuid) from public;
grant execute on function public.convert_crm_lead(uuid, uuid) to authenticated;

-- Billing records can only refer to CRM customers and invoices in the same business.
create index if not exists invoices_business_customer_date_idx on public.invoices (business_id, customer_id, invoice_date desc);
create index if not exists payments_business_customer_date_idx on public.payments (business_id, customer_id, payment_date desc);

create or replace function public.crm_validate_invoice_customer()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.customer_id is not null and not exists (
    select 1 from public.customers c where c.id = new.customer_id and c.business_id = new.business_id
  ) then raise exception 'Invoice customer must belong to the same business'; end if;
  return new;
end $$;
drop trigger if exists crm_invoice_customer_business_check on public.invoices;
create trigger crm_invoice_customer_business_check before insert or update of business_id, customer_id on public.invoices
for each row execute function public.crm_validate_invoice_customer();

create or replace function public.crm_validate_payment_links()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare invoice_customer_id uuid;
begin
  if new.customer_id is not null and not exists (
    select 1 from public.customers c where c.id = new.customer_id and c.business_id = new.business_id
  ) then raise exception 'Payment customer must belong to the same business'; end if;
  if new.invoice_id is not null then
    select customer_id into invoice_customer_id from public.invoices
      where id = new.invoice_id and business_id = new.business_id;
    if not found then raise exception 'Payment invoice must belong to the same business'; end if;
    if invoice_customer_id is not null and new.customer_id is distinct from invoice_customer_id then
      raise exception 'Payment customer must match the linked invoice customer';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists crm_payment_links_business_check on public.payments;
create trigger crm_payment_links_business_check before insert or update of business_id, customer_id, invoice_id on public.payments
for each row execute function public.crm_validate_payment_links();

create or replace function public.crm_validate_payment_allocation()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare payment_business uuid; invoice_business uuid;
begin
  select business_id into payment_business from public.payments where id = new.payment_id;
  select business_id into invoice_business from public.invoices where id = new.invoice_id;
  if payment_business is null or invoice_business is null or payment_business <> invoice_business then
    raise exception 'Payment allocation records must belong to one business';
  end if;
  return new;
end $$;
drop trigger if exists crm_payment_allocation_business_check on public.payment_allocations;
create trigger crm_payment_allocation_business_check before insert or update on public.payment_allocations
for each row execute function public.crm_validate_payment_allocation();

create or replace function public.crm_log_customer_change()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  insert into public.crm_activities (business_id, customer_id, activity_type, title, details)
  values (new.business_id, new.id, case when tg_op = 'INSERT' then 'customer-created' else 'customer-updated' end,
    case when tg_op = 'INSERT' then 'Customer created' else 'Customer updated' end, new.name);
  return new;
end $$;
drop trigger if exists crm_customer_change_activity on public.customers;
create trigger crm_customer_change_activity after insert or update on public.customers
for each row execute function public.crm_log_customer_change();

create or replace function public.crm_log_note()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare b_id uuid; c_name text;
begin
  select business_id, name into b_id, c_name from public.customers where id = new.customer_id;
  insert into public.crm_activities (business_id, customer_id, activity_type, title, details)
  values (b_id, new.customer_id, 'note-added', 'Customer note added', c_name);
  return new;
end $$;
drop trigger if exists crm_customer_note_activity on public.customer_notes;
create trigger crm_customer_note_activity after insert on public.customer_notes
for each row execute function public.crm_log_note();

create or replace function public.crm_log_lead()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  insert into public.crm_activities (business_id, lead_id, activity_type, title, details)
  values (new.business_id, new.id, 'lead-created', 'Lead created', new.name);
  return new;
end $$;
drop trigger if exists crm_lead_created_activity on public.crm_leads;
create trigger crm_lead_created_activity after insert on public.crm_leads
for each row execute function public.crm_log_lead();

create or replace function public.crm_log_follow_up()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare label text;
begin
  if tg_op = 'INSERT' then
    select coalesce(c.name, l.name) into label from (select new.customer_id as customer_id, new.lead_id as lead_id) x
      left join public.customers c on c.id = x.customer_id left join public.crm_leads l on l.id = x.lead_id;
    insert into public.crm_activities (business_id, customer_id, lead_id, activity_type, title, details)
    values (new.business_id, new.customer_id, new.lead_id, 'follow-up-scheduled', 'Follow-up scheduled', coalesce(label, new.purpose));
  elsif old.status = 'pending' and new.status = 'completed' then
    insert into public.crm_activities (business_id, customer_id, lead_id, activity_type, title, details)
    values (new.business_id, new.customer_id, new.lead_id, 'follow-up-completed', 'Follow-up completed', new.purpose);
  end if;
  return new;
end $$;
drop trigger if exists crm_follow_up_activity on public.crm_follow_ups;
create trigger crm_follow_up_activity after insert or update on public.crm_follow_ups
for each row execute function public.crm_log_follow_up();
