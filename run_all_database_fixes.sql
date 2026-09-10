-- ====================================================================
-- Master Database Fix Script for Supabase SQL Editor
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Fix Row-Level Security on personnel_payouts
-- Disables RLS so frontend client queries & fallback aggregation return actual data
ALTER TABLE public.personnel_payouts DISABLE ROW LEVEL SECURITY;

-- 2. Add Event Expense Columns to workOrders table
ALTER TABLE public."workOrders" ADD COLUMN IF NOT EXISTS "travel_expense" numeric DEFAULT 0;
ALTER TABLE public."workOrders" ADD COLUMN IF NOT EXISTS "food_expense" numeric DEFAULT 0;
ALTER TABLE public."workOrders" ADD COLUMN IF NOT EXISTS "stay_expense" numeric DEFAULT 0;

-- 3. Document Column Purpose
COMMENT ON COLUMN public."workOrders"."travel_expense" IS 'Event travel / transport expenses';
COMMENT ON COLUMN public."workOrders"."food_expense" IS 'Event food / meals expenses';
COMMENT ON COLUMN public."workOrders"."stay_expense" IS 'Event accommodation / lodging expenses';
