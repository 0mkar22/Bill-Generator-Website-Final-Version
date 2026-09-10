-- ====================================================================
-- Fix Row Level Security (RLS) on personnel_payouts
-- ====================================================================
-- Explanation:
-- When personnel_payouts was created, RLS was enabled without policies,
-- which blocked the Supabase anon/authenticated client (used by the frontend)
-- from querying or inserting rows (returning 0 rows instead of actual data).
--
-- Run EITHER Option 1 (matches other tables like workOrders/invoices)
-- OR Option 2 (explicit policies for authenticated and anon roles).

-- Option 1 (Recommended): Disable RLS to match workOrders & invoices
ALTER TABLE public.personnel_payouts DISABLE ROW LEVEL SECURITY;

-- Option 2 (Alternative if you prefer RLS enabled):
-- ALTER TABLE public.personnel_payouts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow full access for authenticated users" 
--   ON public.personnel_payouts FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow read access for anon" 
--   ON public.personnel_payouts FOR SELECT TO anon USING (true);
