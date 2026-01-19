-- ============================================================================
-- COMPLETE TVP DRIVER BILLS MIGRATION
-- ============================================================================
-- This script creates/updates all tables and columns needed for TVP driver
-- billing system with trip slab support.
-- 
-- Run this script in your Supabase SQL editor or via psql
-- ============================================================================

-- ============================================================================
-- PART 1: Create tvp_drivers table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tvp_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  region TEXT,
  status TEXT DEFAULT 'active',
  deposit_amount NUMERIC(12,2) DEFAULT 0,
  outstanding_balance NUMERIC(12,2) DEFAULT 0,
  net_outstanding NUMERIC(12,2) DEFAULT 0,
  payment_delay_days INTEGER DEFAULT 0,
  performance_score NUMERIC(5,2) DEFAULT 100,
  total_earnings NUMERIC(14,2) DEFAULT 0,
  total_cash_collect NUMERIC(14,2) DEFAULT 0,
  vehicle_numbers TEXT[] DEFAULT '{}',
  aadhar_front_url TEXT,
  aadhar_back_url TEXT,
  license_front_url TEXT,
  license_back_url TEXT,
  notes TEXT,
  join_date DATE DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tvp_drivers
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_status ON tvp_drivers(status);
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_region ON tvp_drivers(region);
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_created_at ON tvp_drivers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_driver_code ON tvp_drivers(driver_code);

-- ============================================================================
-- PART 2: Create tvp_driver_bills table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tvp_driver_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES tvp_drivers(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL UNIQUE,
  tvp_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  rental_days INTEGER NOT NULL,
  trips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Add all required columns to tvp_driver_bills
-- ============================================================================
-- These ALTER TABLE statements are safe to run multiple times
-- They will only add columns if they don't already exist

-- Rental and rent calculations
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS daily_rent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS weekly_insurance NUMERIC(12,2) DEFAULT 210;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS double_driver_charge NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS net_weekly_rent NUMERIC(12,2) DEFAULT 0;

-- Earnings and collections
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS total_cash_collect NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS difference NUMERIC(12,2) DEFAULT 0;

-- Fees and charges
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS toll NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS tds NUMERIC(12,2) DEFAULT 0;

-- Adjustments and penalties
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS vehicle_adjustment NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS rto_fine NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS accident NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS dead_km NUMERIC(12,2) DEFAULT 0;

-- Final outstanding calculation
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS current_os NUMERIC(12,2) DEFAULT 0;

-- Invoice storage
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS invoice_html TEXT;

-- Status
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'generated';

-- ============================================================================
-- PART 4: Add constraints
-- ============================================================================

-- Add status check constraint (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tvp_driver_bills_status_check'
  ) THEN
    ALTER TABLE tvp_driver_bills 
    ADD CONSTRAINT tvp_driver_bills_status_check 
    CHECK (status IN ('generated', 'paid', 'cancelled'));
  END IF;
END $$;

-- ============================================================================
-- PART 5: Create indexes for tvp_driver_bills
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_driver_id 
  ON tvp_driver_bills(driver_id);

CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_bill_number 
  ON tvp_driver_bills(bill_number);

CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_created_at 
  ON tvp_driver_bills(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_status 
  ON tvp_driver_bills(status);

CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_tvp_id 
  ON tvp_driver_bills(tvp_id);

-- ============================================================================
-- PART 6: Create trigger function for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: Create triggers
-- ============================================================================

-- Trigger for tvp_drivers updated_at
DROP TRIGGER IF EXISTS trg_tvp_drivers_updated_at ON tvp_drivers;
CREATE TRIGGER trg_tvp_drivers_updated_at
  BEFORE UPDATE ON tvp_drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger for tvp_driver_bills updated_at
DROP TRIGGER IF EXISTS trg_tvp_driver_bills_updated_at ON tvp_driver_bills;
CREATE TRIGGER trg_tvp_driver_bills_updated_at
  BEFORE UPDATE ON tvp_driver_bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- PART 8: Row Level Security (RLS)
-- ============================================================================

ALTER TABLE tvp_drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tvp_driver_bills DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 9: Add table and column comments
-- ============================================================================

COMMENT ON TABLE tvp_drivers IS 
  'Stores TVP driver roster, financial snapshot, performance and document metadata';

COMMENT ON TABLE tvp_driver_bills IS 
  'Stores invoices/bills generated for TVP drivers with all charges and calculations';

COMMENT ON COLUMN tvp_driver_bills.daily_rent IS 
  'Daily rent calculated from trip slab based on number of trips';

COMMENT ON COLUMN tvp_driver_bills.net_weekly_rent IS 
  'Calculated as: daily_rent * rental_days';

COMMENT ON COLUMN tvp_driver_bills.difference IS 
  'Calculated as: total_earnings - total_cash_collect';

COMMENT ON COLUMN tvp_driver_bills.current_os IS 
  'Current Outstanding: net_weekly_rent - toll - difference';

-- ============================================================================
-- PART 10: Verification queries
-- ============================================================================

-- Verify tvp_drivers table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tvp_drivers' 
ORDER BY ordinal_position;

-- Verify tvp_driver_bills table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tvp_driver_bills' 
ORDER BY ordinal_position;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables and columns have been created/updated successfully.
-- You can now use the bill generation feature in the admin portal.
-- ============================================================================

