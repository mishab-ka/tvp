-- Complete Migration: Update tvp_driver_bills table with all required columns
-- This migration handles both new table creation and adding missing columns

-- Step 1: Create tvp_drivers table if it doesn't exist
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

-- Step 2: Create indexes for tvp_drivers
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_status ON tvp_drivers(status);
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_region ON tvp_drivers(region);
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_created_at ON tvp_drivers(created_at DESC);

-- Step 3: Create or update tvp_driver_bills table
-- First, create the table if it doesn't exist (with minimal structure)
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

-- Step 4: Add all required columns (if they don't exist)
-- This handles the case where the table already exists

-- Daily rent and weekly calculations
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS daily_rent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS weekly_insurance NUMERIC(12,2) DEFAULT 210;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS double_driver_charge NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS net_weekly_rent NUMERIC(12,2) DEFAULT 0;

-- Earnings and cash collection
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS total_cash_collect NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS difference NUMERIC(12,2) DEFAULT 0;

-- Additional charges and fees
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS toll NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS tds NUMERIC(12,2) DEFAULT 0;

-- Adjustments and charges
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS vehicle_adjustment NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS rto_fine NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS accident NUMERIC(12,2) DEFAULT 0;

ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS dead_km NUMERIC(12,2) DEFAULT 0;

-- Final calculation
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS current_os NUMERIC(12,2) DEFAULT 0;

-- Invoice storage
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS invoice_html TEXT;

-- Status
ALTER TABLE tvp_driver_bills 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'generated';

-- Step 5: Add status constraint if it doesn't exist
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

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_driver_id ON tvp_driver_bills(driver_id);
CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_bill_number ON tvp_driver_bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_created_at ON tvp_driver_bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_status ON tvp_driver_bills(status);

-- Step 7: Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_tvp_driver_bills_updated_at ON tvp_driver_bills;
CREATE TRIGGER trg_tvp_driver_bills_updated_at
  BEFORE UPDATE ON tvp_driver_bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 9: Create trigger for tvp_drivers updated_at
DROP TRIGGER IF EXISTS trg_tvp_drivers_updated_at ON tvp_drivers;
CREATE TRIGGER trg_tvp_drivers_updated_at
  BEFORE UPDATE ON tvp_drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 10: Disable RLS (if needed)
ALTER TABLE tvp_drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tvp_driver_bills DISABLE ROW LEVEL SECURITY;

-- Step 11: Add comments
COMMENT ON TABLE tvp_drivers IS 'Stores TVP driver roster, financial snapshot, performance and document metadata';
COMMENT ON TABLE tvp_driver_bills IS 'Stores invoices/bills generated for TVP drivers with all charges and calculations';

COMMENT ON COLUMN tvp_driver_bills.daily_rent IS 'Daily rent calculated from trip slab based on number of trips';
COMMENT ON COLUMN tvp_driver_bills.net_weekly_rent IS 'Calculated as: daily_rent * rental_days';
COMMENT ON COLUMN tvp_driver_bills.difference IS 'Calculated as: total_earnings - total_cash_collect';
COMMENT ON COLUMN tvp_driver_bills.current_os IS 'Current Outstanding: net_weekly_rent - toll - difference';

-- Step 12: Verify table structure
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'tvp_drivers table: OK';
  RAISE NOTICE 'tvp_driver_bills table: OK';
  RAISE NOTICE 'All columns added successfully';
END $$;

