-- Add fields used by the persisted Business Profile and Preferences screens.
-- Run after supabase/schema.sql. Existing business records receive safe defaults.
alter table public.business
  add column if not exists website text,
  add column if not exists description text,
  add column if not exists date_format text not null default 'dd-mm-yyyy',
  add column if not exists decimal_precision smallint not null default 2
    check (decimal_precision in (0, 2, 3));
