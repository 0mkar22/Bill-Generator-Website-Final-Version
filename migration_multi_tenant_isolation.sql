-- ====================================================================
-- Multi-Tenant & Per-User Data Isolation Migration Script
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Add user_id column across all application tables
-- --------------------------------------------------------------------

ALTER TABLE public.invoices 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."workOrders" 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.personnel_payouts 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.companies 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.team 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- --------------------------------------------------------------------
-- 2. Set default to auth.uid() for automatic assignment on direct queries
-- --------------------------------------------------------------------

ALTER TABLE public.invoices 
    ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public."workOrders" 
    ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.personnel_payouts 
    ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.companies 
    ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.team 
    ALTER COLUMN user_id SET DEFAULT auth.uid();

-- --------------------------------------------------------------------
-- 3. Backfill existing legacy records to the primary/first user in auth.users
-- --------------------------------------------------------------------

DO $$
DECLARE
    default_admin_id UUID;
    invoices_count INT;
    work_orders_count INT;
    payouts_count INT;
    companies_count INT;
    team_count INT;
BEGIN
    -- Select the earliest registered user as the legacy record owner
    SELECT id INTO default_admin_id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF default_admin_id IS NOT NULL THEN
        UPDATE public.invoices SET user_id = default_admin_id WHERE user_id IS NULL;
        GET DIAGNOSTICS invoices_count = ROW_COUNT;

        UPDATE public."workOrders" SET user_id = default_admin_id WHERE user_id IS NULL;
        GET DIAGNOSTICS work_orders_count = ROW_COUNT;

        UPDATE public.personnel_payouts SET user_id = default_admin_id WHERE user_id IS NULL;
        GET DIAGNOSTICS payouts_count = ROW_COUNT;

        UPDATE public.companies SET user_id = default_admin_id WHERE user_id IS NULL;
        GET DIAGNOSTICS companies_count = ROW_COUNT;

        UPDATE public.team SET user_id = default_admin_id WHERE user_id IS NULL;
        GET DIAGNOSTICS team_count = ROW_COUNT;

        RAISE NOTICE 'Backfilled legacy data to owner UUID: % (Invoices: %, WorkOrders: %, Payouts: %, Companies: %, Team: %)',
            default_admin_id, invoices_count, work_orders_count, payouts_count, companies_count, team_count;
    ELSE
        RAISE WARNING 'No users found in auth.users. Existing unowned records will remain NULL until assigned.';
    END IF;
END $$;

-- --------------------------------------------------------------------
-- 4. Create Performance Composite Indexes per Tenant
-- --------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_invoices_user_created 
    ON public.invoices (user_id, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_user_status 
    ON public.invoices (user_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_user_number 
    ON public.invoices (user_id, "invoiceNumber");

CREATE INDEX IF NOT EXISTS idx_workorders_user_date 
    ON public."workOrders" (user_id, "eventDate" DESC);

CREATE INDEX IF NOT EXISTS idx_workorders_user_entry 
    ON public."workOrders" (user_id, "entryNumber");

CREATE INDEX IF NOT EXISTS idx_payouts_user_created 
    ON public.personnel_payouts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_user_event 
    ON public.personnel_payouts (user_id, event_id);

CREATE INDEX IF NOT EXISTS idx_companies_user 
    ON public.companies (user_id);

CREATE INDEX IF NOT EXISTS idx_team_user 
    ON public.team (user_id);

-- Composite unique constraint for team members per user
ALTER TABLE public.team DROP CONSTRAINT IF EXISTS team_name_key;
ALTER TABLE public.team DROP CONSTRAINT IF EXISTS team_user_name_key;
ALTER TABLE public.team ADD CONSTRAINT team_user_name_key UNIQUE (user_id, name);

-- --------------------------------------------------------------------
-- 5. Enable Row-Level Security (RLS) on all application tables
-- --------------------------------------------------------------------

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."workOrders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 6. Define Explicit RLS Policies for Invoices
-- --------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" 
    ON public.invoices FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices" 
    ON public.invoices FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices" 
    ON public.invoices FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Users can delete own invoices" 
    ON public.invoices FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 7. Define Explicit RLS Policies for Work Orders
-- --------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own workOrders" ON public."workOrders";
CREATE POLICY "Users can view own workOrders" 
    ON public."workOrders" FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workOrders" ON public."workOrders";
CREATE POLICY "Users can insert own workOrders" 
    ON public."workOrders" FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workOrders" ON public."workOrders";
CREATE POLICY "Users can update own workOrders" 
    ON public."workOrders" FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workOrders" ON public."workOrders";
CREATE POLICY "Users can delete own workOrders" 
    ON public."workOrders" FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 8. Define Explicit RLS Policies for Personnel Payouts
-- --------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own payouts" ON public.personnel_payouts;
CREATE POLICY "Users can view own payouts" 
    ON public.personnel_payouts FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payouts" ON public.personnel_payouts;
CREATE POLICY "Users can insert own payouts" 
    ON public.personnel_payouts FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payouts" ON public.personnel_payouts;
CREATE POLICY "Users can update own payouts" 
    ON public.personnel_payouts FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payouts" ON public.personnel_payouts;
CREATE POLICY "Users can delete own payouts" 
    ON public.personnel_payouts FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 9. Define Explicit RLS Policies for Companies
-- --------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view own companies" 
    ON public.companies FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own companies" ON public.companies;
CREATE POLICY "Users can insert own companies" 
    ON public.companies FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can update own companies" 
    ON public.companies FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;
CREATE POLICY "Users can delete own companies" 
    ON public.companies FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 10. Define Explicit RLS Policies for Team
-- --------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own team" ON public.team;
CREATE POLICY "Users can view own team" 
    ON public.team FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own team" ON public.team;
CREATE POLICY "Users can insert own team" 
    ON public.team FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own team" ON public.team;
CREATE POLICY "Users can update own team" 
    ON public.team FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own team" ON public.team;
CREATE POLICY "Users can delete own team" 
    ON public.team FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
