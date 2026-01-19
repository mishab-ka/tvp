-- Migration: TVP driver master table

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

CREATE INDEX IF NOT EXISTS idx_tvp_drivers_status ON tvp_drivers(status);
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_region ON tvp_drivers(region);
CREATE INDEX IF NOT EXISTS idx_tvp_drivers_created_at ON tvp_drivers(created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tvp_drivers_updated_at ON tvp_drivers;
CREATE TRIGGER trg_tvp_drivers_updated_at
  BEFORE UPDATE ON tvp_drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE tvp_drivers DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE tvp_drivers IS 'Stores TVP driver roster, financial snapshot, performance and document metadata';

-- Create tvp_driver_bills table for invoice/bill management
CREATE TABLE IF NOT EXISTS tvp_driver_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES tvp_drivers(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL UNIQUE,
  tvp_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  rental_days INTEGER NOT NULL,
  trips INTEGER DEFAULT 0,
  daily_rent NUMERIC(12,2) DEFAULT 0,
  weekly_insurance NUMERIC(12,2) DEFAULT 210,
  double_driver_charge NUMERIC(12,2) DEFAULT 0,
  net_weekly_rent NUMERIC(12,2) DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  total_cash_collect NUMERIC(12,2) DEFAULT 0,
  difference NUMERIC(12,2) DEFAULT 0,
  platform_fee NUMERIC(12,2) DEFAULT 0,
  toll NUMERIC(12,2) DEFAULT 0,
  tds NUMERIC(12,2) DEFAULT 0,
  vehicle_adjustment NUMERIC(12,2) DEFAULT 0,
  rto_fine NUMERIC(12,2) DEFAULT 0,
  accident NUMERIC(12,2) DEFAULT 0,
  dead_km NUMERIC(12,2) DEFAULT 0,
  current_os NUMERIC(12,2) DEFAULT 0,
  invoice_html TEXT,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_driver_id ON tvp_driver_bills(driver_id);
CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_bill_number ON tvp_driver_bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_tvp_driver_bills_created_at ON tvp_driver_bills(created_at DESC);

DROP TRIGGER IF EXISTS trg_tvp_driver_bills_updated_at ON tvp_driver_bills;
CREATE TRIGGER trg_tvp_driver_bills_updated_at
  BEFORE UPDATE ON tvp_driver_bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE tvp_driver_bills DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE tvp_driver_bills IS 'Stores invoices/bills generated for TVP drivers';


