-- Finance module extension. Apply after schema_payments.sql and schema_purchase_flow.sql.
-- Billing invoices/payments and purchasing bills remain the authoritative shared records.

create table if not exists public.finance_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business(id) on delete cascade,
  bank_name text not null check (length(trim(bank_name)) > 0),
  account_holder text not null default '',
  account_number_masked text not null default '',
  ifsc text not null default '',
  account_type text not null default 'Current' check (account_type in ('Current','Savings','OD','Cash')),
  opening_balance numeric(14,2) not null default 0,
  opening_balance_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business(id) on delete cascade,
  bank_account_id uuid,
  transfer_to_account_id uuid,
  transaction_type text not null check (transaction_type in ('income','expense','transfer')),
  status text not null default 'completed' check (status in ('pending','completed','failed','reconciled','voided')),
  transaction_date date not null default current_date,
  reference text,
  category text not null,
  counterparty text not null default '',
  description text not null default '',
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null default 'bank-transfer' check (payment_method in ('cash','upi','bank-transfer','cheque','card','neft','rtgs','other')),
  gst_rate numeric(5,2) not null default 0 check (gst_rate between 0 and 100),
  has_receipt boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  constraint finance_transactions_account_same_business foreign key (business_id, bank_account_id)
    references public.finance_bank_accounts(business_id, id) on delete restrict,
  constraint finance_transactions_transfer_target_same_business foreign key (business_id, transfer_to_account_id)
    references public.finance_bank_accounts(business_id, id) on delete restrict,
  constraint finance_transactions_transfer_shape_check
  check ((transaction_type = 'transfer' and bank_account_id is not null and transfer_to_account_id is not null and bank_account_id <> transfer_to_account_id)
      or (transaction_type <> 'transfer' and transfer_to_account_id is null))
);

alter table public.finance_transactions add column if not exists transfer_to_account_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'finance_transactions_transfer_target_same_business' and conrelid = 'public.finance_transactions'::regclass) then
    alter table public.finance_transactions add constraint finance_transactions_transfer_target_same_business
      foreign key (business_id, transfer_to_account_id) references public.finance_bank_accounts(business_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'finance_transactions_transfer_shape_check' and conrelid = 'public.finance_transactions'::regclass) then
    alter table public.finance_transactions add constraint finance_transactions_transfer_shape_check
      check ((transaction_type = 'transfer' and bank_account_id is not null and transfer_to_account_id is not null and bank_account_id <> transfer_to_account_id)
          or (transaction_type <> 'transfer' and transfer_to_account_id is null));
  end if;
end $$;

create table if not exists public.finance_settings (
  business_id uuid primary key references public.business(id) on delete cascade,
  currency text not null default 'INR',
  financial_year_start_month smallint not null default 4 check (financial_year_start_month between 1 and 12),
  tax_registration_type text not null default 'Regular' check (tax_registration_type in ('Regular','Composition','Unregistered')),
  invoice_start_number integer not null default 1 check (invoice_start_number > 0),
  tds_applicable boolean not null default false,
  default_payment_terms_days integer not null default 30 check (default_payment_terms_days >= 0),
  updated_at timestamptz not null default now()
);

alter table public.payments add column if not exists bank_account_id uuid;
alter table public.payments drop constraint if exists payments_business_bank_account_fk;
alter table public.payments add constraint payments_business_bank_account_fk
  foreign key (business_id, bank_account_id)
  references public.finance_bank_accounts(business_id, id) on delete restrict;

alter table public.purchase_bill_payments add column if not exists bank_account_id uuid;
alter table public.purchase_bill_payments add column if not exists payment_method text not null default 'other'
  check (payment_method in ('cash','upi','bank-transfer','cheque','card','neft','rtgs','other'));
alter table public.purchase_bill_payments drop constraint if exists purchase_bill_payments_business_bank_account_fk;
alter table public.purchase_bill_payments add constraint purchase_bill_payments_business_bank_account_fk
  foreign key (business_id, bank_account_id)
  references public.finance_bank_accounts(business_id, id) on delete restrict;

-- Composite references close the gap where a tenant-owned row could point at another tenant's parent.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_business_id_id_key' and conrelid = 'public.invoices'::regclass) then
    alter table public.invoices add constraint invoices_business_id_id_key unique (business_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_business_id_id_key' and conrelid = 'public.payments'::regclass) then
    alter table public.payments add constraint payments_business_id_id_key unique (business_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'purchase_bills_business_id_id_key' and conrelid = 'public.purchase_bills'::regclass) then
    alter table public.purchase_bills add constraint purchase_bills_business_id_id_key unique (business_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'suppliers_business_id_id_key' and conrelid = 'public.suppliers'::regclass) then
    alter table public.suppliers add constraint suppliers_business_id_id_key unique (business_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customers_business_id_id_key' and conrelid = 'public.customers'::regclass) then
    alter table public.customers add constraint customers_business_id_id_key unique (business_id, id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_customer_same_business_fk' and conrelid = 'public.invoices'::regclass) then
    alter table public.invoices add constraint invoices_customer_same_business_fk
      foreign key (business_id, customer_id) references public.customers(business_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_invoice_same_business_fk' and conrelid = 'public.payments'::regclass) then
    alter table public.payments add constraint payments_invoice_same_business_fk
      foreign key (business_id, invoice_id) references public.invoices(business_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_customer_same_business_fk' and conrelid = 'public.payments'::regclass) then
    alter table public.payments add constraint payments_customer_same_business_fk
      foreign key (business_id, customer_id) references public.customers(business_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'purchase_bills_supplier_same_business_fk' and conrelid = 'public.purchase_bills'::regclass) then
    alter table public.purchase_bills add constraint purchase_bills_supplier_same_business_fk
      foreign key (business_id, supplier_id) references public.suppliers(business_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'purchase_bill_payments_bill_same_business_fk' and conrelid = 'public.purchase_bill_payments'::regclass) then
    alter table public.purchase_bill_payments add constraint purchase_bill_payments_bill_same_business_fk
      foreign key (business_id, purchase_bill_id) references public.purchase_bills(business_id, id) not valid;
  end if;
end $$;

create or replace function public.finance_validate_payment_customer_invoice()
returns trigger language plpgsql security invoker set search_path = public as $$
declare invoice_business uuid; invoice_customer uuid;
begin
  if new.invoice_id is not null then
    select business_id, customer_id into invoice_business, invoice_customer from public.invoices where id = new.invoice_id;
    if not found or invoice_business <> new.business_id then raise exception 'Payment invoice must belong to the same business'; end if;
    if invoice_customer is not null and new.customer_id is distinct from invoice_customer then raise exception 'Payment customer must match the linked invoice customer'; end if;
  end if;
  return new;
end $$;
drop trigger if exists finance_payment_customer_invoice_check on public.payments;
create trigger finance_payment_customer_invoice_check before insert or update of business_id, invoice_id, customer_id on public.payments
  for each row execute function public.finance_validate_payment_customer_invoice();

create or replace function public.finance_validate_payment_allocation_tenant()
returns trigger language plpgsql security invoker set search_path = public as $$
declare payment_business uuid; invoice_business uuid;
begin
  select business_id into payment_business from public.payments where id = new.payment_id;
  select business_id into invoice_business from public.invoices where id = new.invoice_id;
  if payment_business is null or invoice_business is null or payment_business <> invoice_business then
    raise exception 'Payment allocation must link records from the same business';
  end if;
  return new;
end $$;
drop trigger if exists finance_payment_allocation_tenant_check on public.payment_allocations;
create trigger finance_payment_allocation_tenant_check before insert or update on public.payment_allocations
  for each row execute function public.finance_validate_payment_allocation_tenant();

-- Tighten the existing supplier-payment policy so business_id cannot be spoofed independently of its bill.
drop policy if exists "purchase_bill_payments: owner full access" on public.purchase_bill_payments;
create policy "purchase_bill_payments: owner full access" on public.purchase_bill_payments for all to authenticated
  using (exists (
    select 1 from public.purchase_bills pb join public.business b on b.id = pb.business_id
    where pb.id = purchase_bill_payments.purchase_bill_id and pb.business_id = purchase_bill_payments.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.purchase_bills pb join public.business b on b.id = pb.business_id
    where pb.id = purchase_bill_payments.purchase_bill_id and pb.business_id = purchase_bill_payments.business_id and b.owner_id = auth.uid()
  ));

create index if not exists finance_transactions_business_date_idx
  on public.finance_transactions (business_id, transaction_date desc, created_at desc);
create index if not exists finance_transactions_account_date_idx
  on public.finance_transactions (bank_account_id, transaction_date desc) where bank_account_id is not null;
create index if not exists finance_bank_accounts_business_active_idx
  on public.finance_bank_accounts (business_id, is_active);
create index if not exists payments_business_date_status_idx
  on public.payments (business_id, payment_date desc, status);
create index if not exists purchase_bill_payments_business_date_idx
  on public.purchase_bill_payments (business_id, payment_date desc);

alter table public.finance_bank_accounts enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_settings enable row level security;

drop policy if exists finance_bank_accounts_owner_all on public.finance_bank_accounts;
create policy finance_bank_accounts_owner_all on public.finance_bank_accounts for all to authenticated
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));
drop policy if exists finance_transactions_owner_all on public.finance_transactions;
create policy finance_transactions_owner_all on public.finance_transactions for all to authenticated
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));
drop policy if exists finance_settings_owner_all on public.finance_settings;
create policy finance_settings_owner_all on public.finance_settings for all to authenticated
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));

revoke all on public.finance_bank_accounts, public.finance_transactions, public.finance_settings from anon, public;
grant select, insert, update, delete on public.finance_bank_accounts, public.finance_transactions, public.finance_settings to authenticated;

drop trigger if exists finance_bank_accounts_updated_at on public.finance_bank_accounts;
create trigger finance_bank_accounts_updated_at before update on public.finance_bank_accounts
  for each row execute function public.set_updated_at();
drop trigger if exists finance_transactions_updated_at on public.finance_transactions;
create trigger finance_transactions_updated_at before update on public.finance_transactions
  for each row execute function public.set_updated_at();
drop trigger if exists finance_settings_updated_at on public.finance_settings;
create trigger finance_settings_updated_at before update on public.finance_settings
  for each row execute function public.set_updated_at();

-- Payment entry is atomic with bill/supplier balance updates and stores the actual date/method.
create or replace function public.record_finance_purchase_bill_payment(
  p_business_id uuid,
  p_purchase_bill_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_payment_method text,
  p_bank_account_id uuid,
  p_created_by text
) returns void language plpgsql security invoker set search_path = public as $$
declare
  v_bill public.purchase_bills%rowtype;
  v_paid numeric(14,2);
  v_status text;
begin
  select * into v_bill from public.purchase_bills
  where id = p_purchase_bill_id and business_id = p_business_id for update;
  if not found then raise exception 'Purchase bill not found or not authorized'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment must be greater than zero'; end if;
  if p_amount > v_bill.total - v_bill.amount_paid then raise exception 'Payment exceeds outstanding bill balance'; end if;
  if p_bank_account_id is not null and not exists (
    select 1 from public.finance_bank_accounts where id = p_bank_account_id and business_id = p_business_id and is_active
  ) then raise exception 'Bank account is not active for this business'; end if;
  v_paid := round(v_bill.amount_paid + p_amount, 2);
  v_status := case when v_paid >= v_bill.total then 'paid'
                   when v_paid > 0 then 'partial'
                   when v_bill.due_date < current_date then 'overdue'
                   else 'unpaid' end;
  insert into public.purchase_bill_payments (business_id, purchase_bill_id, amount, payment_date, created_by, payment_method, bank_account_id)
  values (p_business_id, v_bill.id, round(p_amount, 2), coalesce(p_payment_date, current_date), nullif(trim(p_created_by), ''),
          coalesce(p_payment_method, 'other'), p_bank_account_id);
  update public.purchase_bills set amount_paid = v_paid, payment_status = v_status where id = v_bill.id;
  update public.suppliers set outstanding_amount = greatest(0, outstanding_amount - p_amount)
  where id = v_bill.supplier_id and business_id = p_business_id;
end;
$$;
revoke all on function public.record_finance_purchase_bill_payment(uuid,uuid,numeric,date,text,uuid,text) from public;
grant execute on function public.record_finance_purchase_bill_payment(uuid,uuid,numeric,date,text,uuid,text) to authenticated;

create or replace function public.save_finance_settings(
  p_business_id uuid,
  p_currency text,
  p_financial_year_start_month smallint,
  p_tax_registration_type text,
  p_tds_applicable boolean,
  p_default_payment_terms_days integer,
  p_invoice_start_number integer,
  p_gst_number text,
  p_pan_number text,
  p_invoice_prefix text
) returns void language plpgsql security invoker set search_path = public as $$
begin
  if not exists (select 1 from public.business where id = p_business_id and owner_id = auth.uid()) then
    raise exception 'Not authorized for this business';
  end if;
  if p_invoice_prefix is null or length(trim(p_invoice_prefix)) = 0 then raise exception 'Invoice prefix is required'; end if;
  insert into public.finance_settings (business_id, currency, financial_year_start_month, tax_registration_type, tds_applicable, default_payment_terms_days, invoice_start_number)
  values (p_business_id, p_currency, p_financial_year_start_month, p_tax_registration_type, p_tds_applicable, p_default_payment_terms_days, p_invoice_start_number)
  on conflict (business_id) do update set currency = excluded.currency,
    financial_year_start_month = excluded.financial_year_start_month,
    tax_registration_type = excluded.tax_registration_type,
    tds_applicable = excluded.tds_applicable,
    default_payment_terms_days = excluded.default_payment_terms_days,
    invoice_start_number = excluded.invoice_start_number;
  update public.business set gst_number = coalesce(p_gst_number, ''), pan_number = coalesce(p_pan_number, ''),
    invoice_prefix = upper(trim(p_invoice_prefix)),
    invoice_number_format = regexp_replace(invoice_number_format, '^[^-]+', upper(trim(p_invoice_prefix)))
  where id = p_business_id;
end;
$$;
revoke all on function public.save_finance_settings(uuid,text,smallint,text,boolean,integer,integer,text,text,text) from public;
grant execute on function public.save_finance_settings(uuid,text,smallint,text,boolean,integer,integer,text,text,text) to authenticated;

-- A single atomic operation keeps the receipt, allocation, and invoice balance in sync.
create or replace function public.record_finance_invoice_payment(
  p_business_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_mode text,
  p_payment_date date,
  p_transaction_ref text,
  p_notes text,
  p_bank_account_id uuid
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_invoice public.invoices%rowtype;
  v_total numeric(14,2);
  v_new_paid numeric(14,2);
  v_payment_id uuid := gen_random_uuid();
  v_payment_number text;
  v_year integer := extract(year from coalesce(p_payment_date, current_date))::integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text, 0));
  select * into v_invoice from public.invoices
  where id = p_invoice_id and business_id = p_business_id for update;
  if not found then raise exception 'Invoice not found or not authorized'; end if;
  if v_invoice.status in ('draft','cancelled') then raise exception 'Payments cannot be recorded for draft or cancelled invoices'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment must be greater than zero'; end if;
  select coalesce(sum(round(round(quantity * unit_price * (1 - discount_percent / 100), 2) + round(round(quantity * unit_price * (1 - discount_percent / 100), 2) * gst_percent / 100, 2), 2)), 0)
    into v_total from public.invoice_items where invoice_id = v_invoice.id;
  if p_amount > greatest(0, v_total - v_invoice.amount_paid) then raise exception 'Payment exceeds invoice outstanding balance'; end if;
  if p_bank_account_id is not null and not exists (
    select 1 from public.finance_bank_accounts where id = p_bank_account_id and business_id = p_business_id and is_active
  ) then raise exception 'Bank account is not active for this business'; end if;
  select 'PMT-' || v_year::text || '-' || lpad((coalesce(max(split_part(payment_number, '-', 3)::integer), 0) + 1)::text, 4, '0')
    into v_payment_number from public.payments
    where business_id = p_business_id and payment_number ~ ('^PMT-' || v_year::text || '-[0-9]+$');
  v_new_paid := round(v_invoice.amount_paid + p_amount, 2);
  insert into public.payments (id, business_id, payment_number, invoice_id, customer_id, amount, mode, status, payment_date, transaction_ref, notes, currency, bank_account_id)
  values (v_payment_id, p_business_id, v_payment_number, v_invoice.id, v_invoice.customer_id, round(p_amount, 2), coalesce(p_mode, 'bank-transfer'), 'received', coalesce(p_payment_date, current_date), nullif(trim(p_transaction_ref), ''), nullif(trim(p_notes), ''), v_invoice.currency, p_bank_account_id);
  insert into public.payment_allocations (payment_id, invoice_id, amount_allocated) values (v_payment_id, v_invoice.id, round(p_amount, 2));
  update public.invoices set amount_paid = v_new_paid,
    payment_status = case when v_new_paid >= v_total then 'paid' else 'partial' end,
    status = case when v_new_paid >= v_total then 'paid' else status end
  where id = v_invoice.id;
  return v_payment_id;
end;
$$;
revoke all on function public.record_finance_invoice_payment(uuid,uuid,numeric,text,date,text,text,uuid) from public;
grant execute on function public.record_finance_invoice_payment(uuid,uuid,numeric,text,date,text,text,uuid) to authenticated;

create or replace function public.record_finance_transfer(
  p_business_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_transaction_date date,
  p_reference text,
  p_notes text
) returns uuid language plpgsql security invoker set search_path = public as $$
declare v_id uuid := gen_random_uuid(); v_accounts integer;
begin
  if not exists (select 1 from public.business where id = p_business_id and owner_id = auth.uid()) then raise exception 'Not authorized for this business'; end if;
  if p_from_account_id is null or p_to_account_id is null or p_from_account_id = p_to_account_id then raise exception 'Choose two different accounts'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Transfer amount must be greater than zero'; end if;
  perform id from public.finance_bank_accounts where business_id = p_business_id and id in (p_from_account_id, p_to_account_id) and is_active order by id for update;
  get diagnostics v_accounts = row_count;
  if v_accounts <> 2 then raise exception 'Both accounts must be active and belong to this business'; end if;
  insert into public.finance_transactions (id, business_id, bank_account_id, transfer_to_account_id, transaction_type, status, transaction_date, reference, category, description, amount, payment_method, notes)
  values (v_id, p_business_id, p_from_account_id, p_to_account_id, 'transfer', 'completed', coalesce(p_transaction_date, current_date), nullif(trim(p_reference), ''), 'Internal transfer', 'Account transfer', round(p_amount, 2), 'bank-transfer', coalesce(p_notes, ''));
  return v_id;
end;
$$;
revoke all on function public.record_finance_transfer(uuid,uuid,uuid,numeric,date,text,text) from public;
grant execute on function public.record_finance_transfer(uuid,uuid,uuid,numeric,date,text,text) to authenticated;

