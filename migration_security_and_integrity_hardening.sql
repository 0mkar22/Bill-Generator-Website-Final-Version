-- ====================================================================
-- Database Security, Integrity & Concurrency Hardening Migration
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Numerical CHECK Constraints on Payouts
ALTER TABLE public.personnel_payouts 
    DROP CONSTRAINT IF EXISTS chk_payout_amount_positive;
ALTER TABLE public.personnel_payouts 
    ADD CONSTRAINT chk_payout_amount_positive CHECK (amount_paid > 0);

-- 2. Numerical and Status CHECK Constraints on Invoices
ALTER TABLE public.invoices 
    DROP CONSTRAINT IF EXISTS chk_invoice_amount_received_non_negative;
ALTER TABLE public.invoices 
    ADD CONSTRAINT chk_invoice_amount_received_non_negative CHECK (amount_received IS NULL OR amount_received >= 0);

ALTER TABLE public.invoices 
    DROP CONSTRAINT IF EXISTS chk_invoice_status_valid;
ALTER TABLE public.invoices 
    ADD CONSTRAINT chk_invoice_status_valid CHECK (status IN ('saved', 'paid', 'pending', 'cancelled'));

-- 3. Numerical CHECK Constraints on Work Order Expenses
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workOrders' AND column_name = 'travel_expense'
    ) THEN
        ALTER TABLE public."workOrders" DROP CONSTRAINT IF EXISTS chk_wo_travel_expense_non_negative;
        ALTER TABLE public."workOrders" ADD CONSTRAINT chk_wo_travel_expense_non_negative CHECK (travel_expense IS NULL OR travel_expense >= 0);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workOrders' AND column_name = 'food_expense'
    ) THEN
        ALTER TABLE public."workOrders" DROP CONSTRAINT IF EXISTS chk_wo_food_expense_non_negative;
        ALTER TABLE public."workOrders" ADD CONSTRAINT chk_wo_food_expense_non_negative CHECK (food_expense IS NULL OR food_expense >= 0);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workOrders' AND column_name = 'stay_expense'
    ) THEN
        ALTER TABLE public."workOrders" DROP CONSTRAINT IF EXISTS chk_wo_stay_expense_non_negative;
        ALTER TABLE public."workOrders" ADD CONSTRAINT chk_wo_stay_expense_non_negative CHECK (stay_expense IS NULL OR stay_expense >= 0);
    END IF;
END $$;

-- 4. Unique Constraints per Tenant
-- Ensures a user cannot accidentally create duplicate work order entry numbers
ALTER TABLE public."workOrders" 
    DROP CONSTRAINT IF EXISTS workorders_user_entry_key;
ALTER TABLE public."workOrders" 
    ADD CONSTRAINT workorders_user_entry_key UNIQUE (user_id, "entryNumber");
