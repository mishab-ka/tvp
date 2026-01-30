-- ============================================================================
-- ADD INCLUDING_ROOM COLUMN TO TVP_DRIVERS
-- ============================================================================
-- When true, room rent is added in bill generation. When false, room rent
-- is excluded from the bill.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tvp_drivers'
  ) THEN
    RAISE NOTICE 'Table tvp_drivers does not exist. Run base migration first.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tvp_drivers'
      AND column_name = 'including_room'
  ) THEN
    ALTER TABLE tvp_drivers
    ADD COLUMN including_room BOOLEAN DEFAULT false;

    COMMENT ON COLUMN tvp_drivers.including_room IS 'If true, room rent is included in bill generation';

    RAISE NOTICE 'Added including_room column to tvp_drivers';
  ELSE
    RAISE NOTICE 'including_room column already exists in tvp_drivers';
  END IF;
END $$;
