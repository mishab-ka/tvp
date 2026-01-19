-- ============================================================================
-- ADD WEEK COLUMNS TO tvp_driver_bills TABLE
-- ============================================================================
-- This script adds week_start and week_end columns to tvp_driver_bills table
-- to store the week range for each bill
-- ============================================================================

DO $$
BEGIN
  -- Check if tvp_driver_bills table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_driver_bills'
  ) THEN
    
    -- Add week_start column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_driver_bills' 
      AND column_name = 'week_start'
    ) THEN
      ALTER TABLE tvp_driver_bills 
      ADD COLUMN week_start DATE;
      
      COMMENT ON COLUMN tvp_driver_bills.week_start IS 'Start date of the week for this bill (Monday)';
      
      RAISE NOTICE 'Added week_start column to tvp_driver_bills';
    ELSE
      RAISE NOTICE 'week_start column already exists in tvp_driver_bills';
    END IF;

    -- Add week_end column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_driver_bills' 
      AND column_name = 'week_end'
    ) THEN
      ALTER TABLE tvp_driver_bills 
      ADD COLUMN week_end DATE;
      
      COMMENT ON COLUMN tvp_driver_bills.week_end IS 'End date of the week for this bill (Sunday)';
      
      RAISE NOTICE 'Added week_end column to tvp_driver_bills';
    ELSE
      RAISE NOTICE 'week_end column already exists in tvp_driver_bills';
    END IF;

    RAISE NOTICE 'All week columns verified!';
  ELSE
    RAISE NOTICE 'Table tvp_driver_bills does not exist. Please run the base migration first.';
  END IF;
END $$;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable,
  CASE 
    WHEN column_name IN ('week_start', 'week_end') 
    THEN '✓ FOUND'
    ELSE 'Found'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tvp_driver_bills'
  AND column_name IN (
    'week_start',
    'week_end'
  )
ORDER BY column_name;

-- If no rows returned, columns don't exist - the DO block above should have added them
-- If rows are returned, columns exist in the database
