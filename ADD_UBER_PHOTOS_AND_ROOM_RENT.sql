-- ============================================================================
-- ADD UBER DRIVER PHOTOS AND ROOM RENT COLUMNS
-- ============================================================================
-- This script adds:
-- 1. Uber driver profile photos column (array) to tvp_drivers table
-- 2. Room rent column to tvp_driver_bills table
-- ============================================================================

DO $$
BEGIN
  -- Check if tvp_drivers table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_drivers'
  ) THEN
    
    -- Add uber_driver_photos column (array of photo URLs)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers' 
      AND column_name = 'uber_driver_photos'
    ) THEN
      ALTER TABLE tvp_drivers 
      ADD COLUMN uber_driver_photos TEXT[] DEFAULT '{}';
      
      COMMENT ON COLUMN tvp_drivers.uber_driver_photos IS 'Array of Uber driver profile photo URLs (can store 3 or more photos)';
      
      RAISE NOTICE 'Added uber_driver_photos column to tvp_drivers';
    ELSE
      RAISE NOTICE 'uber_driver_photos column already exists in tvp_drivers';
    END IF;

  ELSE
    RAISE NOTICE 'Table tvp_drivers does not exist. Please run the base migration first.';
  END IF;

  -- Check if tvp_driver_bills table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_driver_bills'
  ) THEN
    
    -- Add room_rent column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_driver_bills' 
      AND column_name = 'room_rent'
    ) THEN
      ALTER TABLE tvp_driver_bills 
      ADD COLUMN room_rent NUMERIC(12,2) DEFAULT 0;
      
      COMMENT ON COLUMN tvp_driver_bills.room_rent IS 'Room rent amount for this bill';
      
      RAISE NOTICE 'Added room_rent column to tvp_driver_bills';
    ELSE
      RAISE NOTICE 'room_rent column already exists in tvp_driver_bills';
    END IF;

  ELSE
    RAISE NOTICE 'Table tvp_driver_bills does not exist. Please run the base migration first.';
  END IF;

  RAISE NOTICE 'All columns verified!';
END $$;

-- Verify the columns were added
SELECT 
  table_name,
  column_name, 
  data_type, 
  column_default,
  is_nullable,
  CASE 
    WHEN column_name IN ('uber_driver_photos', 'room_rent') 
    THEN '✓ FOUND'
    ELSE 'Found'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'tvp_drivers' AND column_name = 'uber_driver_photos')
    OR (table_name = 'tvp_driver_bills' AND column_name = 'room_rent')
  )
ORDER BY table_name, column_name;
