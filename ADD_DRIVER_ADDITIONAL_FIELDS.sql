-- ============================================================================
-- ADDITIONAL DRIVER FIELDS MIGRATION
-- ============================================================================
-- This migration adds the following columns to tvp_drivers table:
-- 1. room_deposit - Room deposit amount
-- 2. pre_paid_rent_amount - Pre-paid rent amount
-- 3. documents_charge - Documents charge
-- 4. alternative_phone_1 - First alternative mobile number
-- 5. alternative_phone_2 - Second alternative mobile number
-- 6. alternative_phone_3 - Third alternative mobile number
-- ============================================================================

DO $$
BEGIN
  -- Check if tvp_drivers table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_drivers'
  ) THEN
    
    -- Add room_deposit column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers' 
      AND column_name = 'room_deposit'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN room_deposit NUMERIC(12,2) DEFAULT 0;
      
      COMMENT ON COLUMN tvp_drivers.room_deposit IS 'Room deposit amount for the driver';
      
      RAISE NOTICE 'Added room_deposit column to tvp_drivers';
    ELSE
      RAISE NOTICE 'room_deposit column already exists in tvp_drivers';
    END IF;

    -- Add pre_paid_rent_amount column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers' 
      AND column_name = 'pre_paid_rent_amount'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN pre_paid_rent_amount NUMERIC(12,2) DEFAULT 0;
      
      COMMENT ON COLUMN tvp_drivers.pre_paid_rent_amount IS 'Pre-paid rent amount for the driver';
      
      RAISE NOTICE 'Added pre_paid_rent_amount column to tvp_drivers';
    ELSE
      RAISE NOTICE 'pre_paid_rent_amount column already exists in tvp_drivers';
    END IF;

    -- Add documents_charge column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers' 
      AND column_name = 'documents_charge'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN documents_charge NUMERIC(12,2) DEFAULT 0;
      
      COMMENT ON COLUMN tvp_drivers.documents_charge IS 'Documents charge for the driver';
      
      RAISE NOTICE 'Added documents_charge column to tvp_drivers';
    ELSE
      RAISE NOTICE 'documents_charge column already exists in tvp_drivers';
    END IF;

    -- Add alternative_phone_1 column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers' 
      AND column_name = 'alternative_phone_1'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN alternative_phone_1 TEXT;
      
      COMMENT ON COLUMN tvp_drivers.alternative_phone_1 IS 'First alternative mobile number';
      
      RAISE NOTICE 'Added alternative_phone_1 column to tvp_drivers';
    ELSE
      RAISE NOTICE 'alternative_phone_1 column already exists in tvp_drivers';
    END IF;

    -- Add alternative_phone_2 column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers' 
      AND column_name = 'alternative_phone_2'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN alternative_phone_2 TEXT;
      
      COMMENT ON COLUMN tvp_drivers.alternative_phone_2 IS 'Second alternative mobile number';
      
      RAISE NOTICE 'Added alternative_phone_2 column to tvp_drivers';
    ELSE
      RAISE NOTICE 'alternative_phone_2 column already exists in tvp_drivers';
    END IF;

    -- Add alternative_phone_3 column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers' 
      AND column_name = 'alternative_phone_3'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN alternative_phone_3 TEXT;
      
      COMMENT ON COLUMN tvp_drivers.alternative_phone_3 IS 'Third alternative mobile number';
      
      RAISE NOTICE 'Added alternative_phone_3 column to tvp_drivers';
    ELSE
      RAISE NOTICE 'alternative_phone_3 column already exists in tvp_drivers';
    END IF;

  ELSE
    RAISE NOTICE 'Table tvp_drivers does not exist. Please run the base migration first.';
  END IF;
END $$;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tvp_drivers'
  AND column_name IN (
    'room_deposit',
    'pre_paid_rent_amount',
    'documents_charge',
    'alternative_phone_1',
    'alternative_phone_2',
    'alternative_phone_3'
  )
ORDER BY column_name;

