-- Add status column ('paid' | 'pending') to personnel_payouts
ALTER TABLE public.personnel_payouts 
ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'paid';

UPDATE public.personnel_payouts 
SET status = 'paid' 
WHERE status IS NULL;

ALTER TABLE public.personnel_payouts 
DROP CONSTRAINT IF EXISTS chk_payout_status_valid;

ALTER TABLE public.personnel_payouts 
ADD CONSTRAINT chk_payout_status_valid CHECK (status IN ('paid', 'pending'));
