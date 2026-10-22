-- Keep payment reversal/deletion and the corresponding invoice balance update
-- in one transaction. Run after 202610210002_finance_module.sql.

-- Keep the atomic payment path's invoice total aligned with Billing's
-- computeDocumentTotals rule: aggregate taxable value and tax, then round the
-- final total to the nearest whole currency unit.
create or replace function public.record_finance_invoice_payment(
  p_business_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_mode text,
  p_payment_date date,
  p_transaction_ref text,
  p_notes text,
  p_bank_account_id uuid
) returns uuid
language plpgsql security invoker set search_path = public as $$
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
  if v_invoice.status in ('draft', 'cancelled') then
    raise exception 'Payments cannot be recorded for draft or cancelled invoices';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment must be greater than zero'; end if;

  select round(coalesce(sum(
    quantity * unit_price * (1 - discount_percent / 100)
    * (1 + gst_percent / 100)
  ), 0)) into v_total
  from public.invoice_items where invoice_id = v_invoice.id;
  if p_amount > greatest(0, v_total - v_invoice.amount_paid) then
    raise exception 'Payment exceeds invoice outstanding balance';
  end if;
  if p_bank_account_id is not null and not exists (
    select 1 from public.finance_bank_accounts
    where id = p_bank_account_id and business_id = p_business_id and is_active
  ) then raise exception 'Bank account is not active for this business'; end if;

  select 'PMT-' || v_year::text || '-' || lpad(
    (coalesce(max(split_part(payment_number, '-', 3)::integer), 0) + 1)::text, 4, '0'
  ) into v_payment_number
  from public.payments
  where business_id = p_business_id
    and payment_number ~ ('^PMT-' || v_year::text || '-[0-9]+$');

  v_new_paid := round(v_invoice.amount_paid + p_amount, 2);
  insert into public.payments (
    id, business_id, payment_number, invoice_id, customer_id, amount, mode, status,
    payment_date, transaction_ref, notes, currency, bank_account_id
  ) values (
    v_payment_id, p_business_id, v_payment_number, v_invoice.id, v_invoice.customer_id,
    round(p_amount, 2), coalesce(p_mode, 'bank-transfer'), 'received',
    coalesce(p_payment_date, current_date), nullif(trim(p_transaction_ref), ''),
    nullif(trim(p_notes), ''), v_invoice.currency, p_bank_account_id
  );
  insert into public.payment_allocations (payment_id, invoice_id, amount_allocated)
  values (v_payment_id, v_invoice.id, round(p_amount, 2));
  update public.invoices set amount_paid = v_new_paid,
    payment_status = case when v_new_paid >= v_total then 'paid' else 'partial' end,
    status = case when v_new_paid >= v_total then 'paid' else status end
  where id = v_invoice.id and business_id = p_business_id;
  return v_payment_id;
end;
$$;
revoke all on function public.record_finance_invoice_payment(uuid,uuid,numeric,text,date,text,text,uuid) from public;
grant execute on function public.record_finance_invoice_payment(uuid,uuid,numeric,text,date,text,text,uuid) to authenticated;

create or replace function public.reverse_finance_invoice_payment(
  p_business_id uuid,
  p_payment_id uuid,
  p_target_status text
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_payment public.payments%rowtype;
  v_invoice public.invoices%rowtype;
  v_allocated numeric(14,2);
  v_total numeric(14,2);
  v_new_paid numeric(14,2);
begin
  if p_target_status not in ('refunded', 'voided') then
    raise exception 'Unsupported payment reversal status';
  end if;

  select * into v_payment from public.payments
  where id = p_payment_id and business_id = p_business_id for update;
  if not found then raise exception 'Payment not found or not authorized'; end if;
  if v_payment.status = p_target_status then return v_payment.id; end if;
  if v_payment.status not in ('received', 'completed') then
    raise exception 'Only received payments can be refunded or voided';
  end if;

  if v_payment.invoice_id is not null then
    select * into v_invoice from public.invoices
    where id = v_payment.invoice_id and business_id = p_business_id for update;
    if not found then raise exception 'Linked invoice not found for this business'; end if;

    select coalesce(sum(amount_allocated), 0) into v_allocated
    from public.payment_allocations
    where payment_id = v_payment.id and invoice_id = v_invoice.id;
    if v_allocated <= 0 then v_allocated := v_payment.amount; end if;

    select round(coalesce(sum(
      quantity * unit_price * (1 - discount_percent / 100)
      * (1 + gst_percent / 100)
    ), 0)) into v_total
    from public.invoice_items where invoice_id = v_invoice.id;

    v_new_paid := greatest(0, round(v_invoice.amount_paid - v_allocated, 2));
    update public.invoices set
      amount_paid = v_new_paid,
      payment_status = case
        when v_new_paid >= v_total then 'paid'
        when due_date is not null and due_date < current_date then 'overdue'
        when v_new_paid > 0 then 'partial'
        else 'pending'
      end,
      status = case
        when status <> 'paid' then status
        when due_date is not null and due_date < current_date then 'overdue'
        when v_new_paid > 0 then 'partial'
        else 'sent'
      end
    where id = v_invoice.id and business_id = p_business_id;
  end if;

  update public.payments set status = p_target_status
  where id = v_payment.id and business_id = p_business_id;
  return v_payment.id;
end;
$$;
revoke all on function public.reverse_finance_invoice_payment(uuid,uuid,text) from public;
grant execute on function public.reverse_finance_invoice_payment(uuid,uuid,text) to authenticated;

create or replace function public.delete_finance_invoice_payment(
  p_business_id uuid,
  p_payment_id uuid
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_payment public.payments%rowtype;
  v_invoice public.invoices%rowtype;
  v_allocated numeric(14,2);
  v_total numeric(14,2);
  v_new_paid numeric(14,2);
begin
  select * into v_payment from public.payments
  where id = p_payment_id and business_id = p_business_id for update;
  if not found then raise exception 'Payment not found or not authorized'; end if;

  if v_payment.status in ('received', 'completed') and v_payment.invoice_id is not null then
    select * into v_invoice from public.invoices
    where id = v_payment.invoice_id and business_id = p_business_id for update;
    if not found then raise exception 'Linked invoice not found for this business'; end if;

    select coalesce(sum(amount_allocated), 0) into v_allocated
    from public.payment_allocations
    where payment_id = v_payment.id and invoice_id = v_invoice.id;
    if v_allocated <= 0 then v_allocated := v_payment.amount; end if;

    select round(coalesce(sum(
      quantity * unit_price * (1 - discount_percent / 100)
      * (1 + gst_percent / 100)
    ), 0)) into v_total
    from public.invoice_items where invoice_id = v_invoice.id;

    v_new_paid := greatest(0, round(v_invoice.amount_paid - v_allocated, 2));
    update public.invoices set
      amount_paid = v_new_paid,
      payment_status = case
        when v_new_paid >= v_total then 'paid'
        when due_date is not null and due_date < current_date then 'overdue'
        when v_new_paid > 0 then 'partial'
        else 'pending'
      end,
      status = case
        when status <> 'paid' then status
        when due_date is not null and due_date < current_date then 'overdue'
        when v_new_paid > 0 then 'partial'
        else 'sent'
      end
    where id = v_invoice.id and business_id = p_business_id;
  end if;

  delete from public.payments where id = v_payment.id and business_id = p_business_id;
  return v_payment.id;
end;
$$;
revoke all on function public.delete_finance_invoice_payment(uuid,uuid) from public;
grant execute on function public.delete_finance_invoice_payment(uuid,uuid) to authenticated;
