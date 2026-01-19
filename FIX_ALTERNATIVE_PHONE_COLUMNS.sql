-- ============================================================================
-- FIX: Add alternative phone columns to tvp_drivers table
-- ============================================================================
-- This script ensures the alternative_phone columns exist in tvp_drivers
-- Run this if you're getting schema cache errors about missing alternative_phone columns
-- ============================================================================

DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_drivers'
  ) THEN
    
    -- Add alternative_phone_1 column if it doesn't exist
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

    -- Add alternative_phone_2 column if it doesn't exist
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

    -- Add alternative_phone_3 column if it doesn't exist
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
    'alternative_phone_1',
    'alternative_phone_2',
    'alternative_phone_3'
  )
ORDER BY column_name;
