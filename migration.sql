ALTER TABLE public.invoices ADD COLUMN "company_id" uuid NULL;
ALTER TABLE public.invoices ADD COLUMN "company_address" text NULL;
ALTER TABLE public.workOrders ADD COLUMN "company_id" uuid NULL;
