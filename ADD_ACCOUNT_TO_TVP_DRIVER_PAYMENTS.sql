-- ============================================================================
-- ADD ACCOUNT COLUMN TO TVP_DRIVER_PAYMENTS
-- ============================================================================
-- Values: letzryd (LetzRyd A/c), tawaaq_fleet (Tawaaq Fleet A/c), cash_in_hand (Cash In hand)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tvp_driver_payments'
  ) THEN
    RAISE NOTICE 'Table tvp_driver_payments does not exist. Run base migration first.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tvp_driver_payments'
      AND column_name = 'account'
  ) THEN
    ALTER TABLE tvp_driver_payments
    ADD COLUMN account TEXT DEFAULT 'letzryd';

    COMMENT ON COLUMN tvp_driver_payments.account IS 'Account: letzryd | tawaaq_fleet | cash_in_hand';

    UPDATE tvp_driver_payments SET account = 'letzryd' WHERE account IS NULL;

    RAISE NOTICE 'Added account column to tvp_driver_payments';
  ELSE
    RAISE NOTICE 'account column already exists in tvp_driver_payments';
  END IF;
END $$;
