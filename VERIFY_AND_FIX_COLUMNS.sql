-- ============================================================================
-- VERIFY AND FIX: Alternative Phone Columns
-- ============================================================================
-- This script will:
-- 1. Check if columns exist in the database
-- 2. Add missing columns
-- 3. Verify they were added
-- 4. Output results for debugging
-- ============================================================================

DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- Check if tvp_drivers table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_drivers'
  ) THEN
    RAISE EXCEPTION 'Table tvp_drivers does not exist. Please run the base migration first.';
  END IF;

  RAISE NOTICE 'Table tvp_drivers exists. Checking columns...';

  -- Check and add alternative_phone_1
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'tvp_drivers' 
    AND column_name = 'alternative_phone_1'
  ) INTO col_exists;

  IF NOT col_exists THEN
    ALTER TABLE tvp_drivers ADD COLUMN alternative_phone_1 TEXT;
    COMMENT ON COLUMN tvp_drivers.alternative_phone_1 IS 'First alternative mobile number';
    RAISE NOTICE '✓ Added alternative_phone_1 column';
  ELSE
    RAISE NOTICE '✓ alternative_phone_1 column already exists';
  END IF;

  -- Check and add alternative_phone_2
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'tvp_drivers' 
    AND column_name = 'alternative_phone_2'
  ) INTO col_exists;

  IF NOT col_exists THEN
    ALTER TABLE tvp_drivers ADD COLUMN alternative_phone_2 TEXT;
    COMMENT ON COLUMN tvp_drivers.alternative_phone_2 IS 'Second alternative mobile number';
    RAISE NOTICE '✓ Added alternative_phone_2 column';
  ELSE
    RAISE NOTICE '✓ alternative_phone_2 column already exists';
  END IF;

  -- Check and add alternative_phone_3
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'tvp_drivers' 
    AND column_name = 'alternative_phone_3'
  ) INTO col_exists;

  IF NOT col_exists THEN
    ALTER TABLE tvp_drivers ADD COLUMN alternative_phone_3 TEXT;
    COMMENT ON COLUMN tvp_drivers.alternative_phone_3 IS 'Third alternative mobile number';
    RAISE NOTICE '✓ Added alternative_phone_3 column';
  ELSE
    RAISE NOTICE '✓ alternative_phone_3 column already exists';
  END IF;

  RAISE NOTICE 'All alternative phone columns verified!';
END $$;

-- Verify columns exist and show their properties
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable,
  CASE 
    WHEN column_name IN ('alternative_phone_1', 'alternative_phone_2', 'alternative_phone_3') 
    THEN '✓ FOUND'
    ELSE 'Found'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tvp_drivers'
  AND column_name IN (
    'alternative_phone_1',
    'alternative_phone_2',
    'alternative_phone_3'
  )
ORDER BY column_name;

-- If no rows returned, columns don't exist - the DO block above should have added them
-- If rows are returned, columns exist in the database
