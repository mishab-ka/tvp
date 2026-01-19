-- ============================================================================
-- ADD VEHICLES BREAKDOWN COLUMN TO BILLS
-- ============================================================================
-- This script adds a JSONB column to store vehicle breakdown details
-- ============================================================================

DO $$
BEGIN
  -- Check if tvp_driver_bills table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_driver_bills'
  ) THEN
    
    -- Add vehicles_breakdown column (JSONB array to store vehicle details)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_driver_bills' 
      AND column_name = 'vehicles_breakdown'
    ) THEN
      ALTER TABLE tvp_driver_bills 
      ADD COLUMN vehicles_breakdown JSONB DEFAULT '[]'::jsonb;
      
      COMMENT ON COLUMN tvp_driver_bills.vehicles_breakdown IS 'JSONB array storing vehicle breakdown: [{vehicleNumber, rentalDays, trips, dailyRent, vehicleRent}]';
      
      RAISE NOTICE 'Added vehicles_breakdown column to tvp_driver_bills';
    ELSE
      RAISE NOTICE 'vehicles_breakdown column already exists in tvp_driver_bills';
    END IF;

  ELSE
    RAISE NOTICE 'Table tvp_driver_bills does not exist. Please run the base migration first.';
  END IF;

  RAISE NOTICE 'Vehicles breakdown column verified!';
END $$;

-- Verify the column was added
SELECT 
  table_name,
  column_name, 
  data_type, 
  column_default,
  is_nullable,
  '✓ FOUND' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tvp_driver_bills'
  AND column_name = 'vehicles_breakdown'
ORDER BY table_name, column_name;
