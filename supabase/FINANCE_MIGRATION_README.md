# Finance database migration

Finance reuses the existing invoice, payment, customer, supplier, and purchase-bill records. It adds only Finance-owned transactions, bank-account metadata, and Finance preferences. Invoice receipts are posted to `payments` and `payment_allocations`; supplier payments are posted to the existing `purchase_bill_payments` table.

## Existing Supabase database

When `schema.sql`, `customers_schema.sql`, `schema_billing.sql`, `schema_payments.sql`, and `schema_purchase_flow.sql` are already installed, run:

1. `202610210002_finance_module.sql`

If the CRM migration from this repository has not been run, it is independent of Finance; to apply both versioned extensions, run `202610210001_crm_tables.sql` first and this Finance migration second.

Run the SQL in Supabase SQL Editor as a database administrator. This repository cannot apply or verify the migration against the configured Supabase project. The migration uses `NOT VALID` for added composite tenant foreign keys so legacy rows do not block installation; new writes are checked, and historical rows should be reviewed before validating those constraints.

## Fresh database setup

Run the base setup files once, in dependency order:

1. `schema.sql`
2. `customers_schema.sql`
3. `schema_billing.sql`
4. `schema_payments.sql`
5. `schema_purchase_flow.sql`
6. `202610210001_crm_tables.sql` (if installing the CRM extension)
7. `202610210002_finance_module.sql`

`business_schema.sql` is an alternate overlapping business setup file; do not run it after `schema.sql`.
