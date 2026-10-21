# CRM database migration

The CRM uses the existing `public.customers` table shared with Billing. The versioned extension in `202610210001_crm_tables.sql` adds only leads, follow-ups, activities, and CRM settings, plus tenant-safe relationships, indexes, RLS, and database activity/conversion functions.

## Existing Supabase project

If `schema.sql`, `customers_schema.sql`, `schema_billing.sql`, and `schema_payments.sql` have already been applied, run only:

1. `202610210001_crm_tables.sql`

Run it in the Supabase SQL Editor as a database administrator. The application changes require this migration before CRM lead, follow-up, settings, and generated customer-code operations can work. The migration was not applied from this repository.

## Fresh database setup

Run the existing setup files once in this order, then apply the CRM extension:

1. `schema.sql` (creates the business table and shared base objects)
2. `customers_schema.sql`
3. `schema_billing.sql`
4. `schema_payments.sql`
5. `202610210001_crm_tables.sql`

`business_schema.sql` is an alternate, overlapping business setup script. Do not run it after `schema.sql`; both define the business table and policies. Review its extra setup manually only if using it instead of `schema.sql`.
