-- Add event-level expense tracking to workOrders
ALTER TABLE public."workOrders" ADD COLUMN IF NOT EXISTS "travel_expense" numeric DEFAULT 0;
ALTER TABLE public."workOrders" ADD COLUMN IF NOT EXISTS "food_expense" numeric DEFAULT 0;
ALTER TABLE public."workOrders" ADD COLUMN IF NOT EXISTS "stay_expense" numeric DEFAULT 0;

-- Optional comment description
COMMENT ON COLUMN public."workOrders"."travel_expense" IS 'Event travel / conveyance expenses';
COMMENT ON COLUMN public."workOrders"."food_expense" IS 'Event food & catering expenses';
COMMENT ON COLUMN public."workOrders"."stay_expense" IS 'Event accommodation / lodging expenses';
