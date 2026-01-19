-- ============================================================================
-- ADD CATEGORY, CUMULATIVE RENTAL DAYS, AND PAYMENT MANAGEMENT
-- ============================================================================
-- This migration adds:
-- 1. category field to tvp_drivers (single driver/double driver)
-- 2. cumulative_rental_days field to track total rental days
-- 3. tvp_driver_payments table for payment tracking
-- ============================================================================
-- PREREQUISITE: The tvp_drivers table must exist before running this migration.
-- If the table doesn't exist, run one of these first:
--   - supabase/migrations/002_create_tvp_owner_enhancements.sql
--   - Or create the table manually
-- ============================================================================
-- This migration is idempotent and will safely skip steps if:
--   - The tvp_drivers table doesn't exist (will show a notice)
--   - Columns already exist (won't try to add them again)
--   - Indexes already exist (won't try to create them again)
-- ============================================================================

-- Check if tvp_drivers table exists and add columns
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_drivers'
  ) THEN
    -- Add category field to tvp_drivers
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tvp_drivers' 
      AND column_name = 'category'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN category TEXT DEFAULT 'single_driver';
      
      -- Add check constraint for category
      ALTER TABLE tvp_drivers 
      ADD CONSTRAINT tvp_drivers_category_check 
      CHECK (category IN ('single_driver', 'double_driver'));
    END IF;

    -- Add cumulative_rental_days field
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tvp_drivers' 
      AND column_name = 'cumulative_rental_days'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN cumulative_rental_days INTEGER DEFAULT 0;
    END IF;

    -- Create index for category
    IF NOT EXISTS (
      SELECT FROM pg_indexes 
      WHERE indexname = 'idx_tvp_drivers_category'
    ) THEN
      CREATE INDEX idx_tvp_drivers_category ON tvp_drivers(category);
    END IF;
  ELSE
    RAISE NOTICE 'Table tvp_drivers does not exist. Skipping column additions.';
  END IF;
END $$;

-- Create tvp_driver_payments table (only if tvp_drivers exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_drivers'
  ) THEN
    -- Create tvp_driver_payments table if it doesn't exist
    CREATE TABLE IF NOT EXISTS tvp_driver_payments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      driver_id UUID NOT NULL,
      bill_id UUID,
      payment_amount NUMERIC(12,2) NOT NULL,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      payment_type TEXT DEFAULT 'paid',
      payment_method TEXT,
      reference_number TEXT,
      notes TEXT,
      screenshot_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id),
      updated_by UUID REFERENCES auth.users(id),
      CONSTRAINT fk_tvp_driver_payments_driver 
        FOREIGN KEY (driver_id) REFERENCES tvp_drivers(id) ON DELETE CASCADE
    );

    -- Add check constraint for payment_type
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conname = 'tvp_driver_payments_payment_type_check'
    ) THEN
      ALTER TABLE tvp_driver_payments 
      ADD CONSTRAINT tvp_driver_payments_payment_type_check 
      CHECK (payment_type IN ('paid', 'due'));
    END IF;

    -- Add foreign key for bill_id if tvp_driver_bills table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tvp_driver_bills'
    ) THEN
      -- Check if foreign key already exists
      IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tvp_driver_payments_bill'
      ) THEN
        ALTER TABLE tvp_driver_payments 
        ADD CONSTRAINT fk_tvp_driver_payments_bill 
        FOREIGN KEY (bill_id) REFERENCES tvp_driver_bills(id) ON DELETE SET NULL;
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Table tvp_drivers does not exist. Cannot create tvp_driver_payments table.';
  END IF;
END $$;

-- Create indexes for payments (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_driver_payments'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tvp_driver_payments_driver_id ON tvp_driver_payments(driver_id);
    CREATE INDEX IF NOT EXISTS idx_tvp_driver_payments_bill_id ON tvp_driver_payments(bill_id);
    CREATE INDEX IF NOT EXISTS idx_tvp_driver_payments_payment_date ON tvp_driver_payments(payment_date DESC);

    -- Disable RLS for now (adjust based on your security needs)
    ALTER TABLE tvp_driver_payments DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add updated_at trigger for payments table
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_driver_payments'
  ) THEN
    DROP TRIGGER IF EXISTS trg_tvp_driver_payments_updated_at ON tvp_driver_payments;
    CREATE TRIGGER trg_tvp_driver_payments_updated_at
      BEFORE UPDATE ON tvp_driver_payments
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Add comments (only if tables exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_drivers'
  ) THEN
    COMMENT ON COLUMN tvp_drivers.category IS 'Driver category: single_driver or double_driver';
    COMMENT ON COLUMN tvp_drivers.cumulative_rental_days IS 'Total accumulated rental days across all bills';
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_driver_payments'
  ) THEN
    COMMENT ON TABLE tvp_driver_payments IS 'Tracks payments made by TVP drivers against their bills';
    COMMENT ON COLUMN tvp_driver_payments.screenshot_url IS 'URL to payment screenshot/receipt image (optional)';
    COMMENT ON COLUMN tvp_driver_payments.payment_type IS 'Payment category: paid (reduces balance) or due (increases balance)';

    -- Add screenshot_url column if it doesn't exist (for existing installations)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tvp_driver_payments' 
      AND column_name = 'screenshot_url'
    ) THEN
      ALTER TABLE tvp_driver_payments 
      ADD COLUMN screenshot_url TEXT;
    END IF;

    -- Add payment_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tvp_driver_payments' 
      AND column_name = 'payment_type'
    ) THEN
      ALTER TABLE tvp_driver_payments 
      ADD COLUMN payment_type TEXT DEFAULT 'paid';
      
      -- Add check constraint if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'tvp_driver_payments_payment_type_check'
      ) THEN
        ALTER TABLE tvp_driver_payments 
        ADD CONSTRAINT tvp_driver_payments_payment_type_check 
        CHECK (payment_type IN ('paid', 'due'));
      END IF;
    END IF;
  END IF;
END $$;

