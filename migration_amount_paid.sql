-- Add status to invoices
ALTER TABLE public.invoices ADD COLUMN "status" text DEFAULT 'saved';
UPDATE public.invoices SET status = 'saved' WHERE status IS NULL;

-- Create personnel_payouts table
CREATE TABLE public.personnel_payouts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id uuid REFERENCES public.workOrders(id) ON DELETE CASCADE,
    personnel_name text NOT NULL,
    work_name text,
    duration text,
    amount_paid numeric NOT NULL,
    payment_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);
