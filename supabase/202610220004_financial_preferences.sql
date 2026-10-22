-- Save settings shared by business profile, Finance, and reporting atomically.
-- Run after 202610210002_finance_module.sql and 202610220001_business_settings.sql.
create or replace function public.save_business_financial_preferences(
  p_business_id uuid,
  p_currency text,
  p_financial_year_start_month smallint,
  p_decimal_precision smallint,
  p_financial_year text
) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not exists (
    select 1 from public.business where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'Not authorized for this business'; end if;
  if p_currency is null or length(trim(p_currency)) <> 3 then
    raise exception 'Currency must be a three-letter currency code';
  end if;
  if p_financial_year_start_month not between 1 and 12 then
    raise exception 'Financial year start month must be between 1 and 12';
  end if;
  if p_decimal_precision not in (0, 2, 3) then
    raise exception 'Unsupported decimal precision';
  end if;
  if p_financial_year not in ('April-March', 'January-December', 'July-June') then
    raise exception 'Unsupported financial year';
  end if;

  update public.business set
    currency = upper(trim(p_currency)),
    financial_year = p_financial_year,
    decimal_precision = p_decimal_precision
  where id = p_business_id;

  insert into public.finance_settings (business_id, currency, financial_year_start_month)
  values (p_business_id, upper(trim(p_currency)), p_financial_year_start_month)
  on conflict (business_id) do update set
    currency = excluded.currency,
    financial_year_start_month = excluded.financial_year_start_month;
end;
$$;
revoke all on function public.save_business_financial_preferences(uuid,text,smallint,smallint,text) from public;
grant execute on function public.save_business_financial_preferences(uuid,text,smallint,smallint,text) to authenticated;
