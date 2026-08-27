ALTER TABLE public.companies ADD COLUMN "is_govt_client" boolean DEFAULT false;
ALTER TABLE public.companies ADD COLUMN "requires_po_number" boolean DEFAULT false;
ALTER TABLE public.companies ADD COLUMN "uses_marathi_labels" boolean DEFAULT false;
