-- ============================================================================
-- FIX: Add payment_type column to tvp_driver_payments table
-- ============================================================================
-- This script ensures the payment_type column exists in tvp_driver_payments
-- Run this if you're getting schema cache errors about missing payment_type
-- ============================================================================

-- Add payment_type column if it doesn't exist
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tvp_driver_payments'
  ) THEN
    -- Add payment_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tvp_driver_payments' 
      AND column_name = 'payment_type'
    ) THEN
      ALTER TABLE tvp_driver_payments 
      ADD COLUMN payment_type TEXT DEFAULT 'paid';
      
      RAISE NOTICE 'Added payment_type column to tvp_driver_payments';
    ELSE
      RAISE NOTICE 'payment_type column already exists in tvp_driver_payments';
    END IF;
    
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conname = 'tvp_driver_payments_payment_type_check'
    ) THEN
      -- First, drop the constraint if it exists with a different name (in case of duplicates)
      ALTER TABLE tvp_driver_payments 
      DROP CONSTRAINT IF EXISTS tvp_driver_payments_payment_type_check;
      
      -- Add the constraint
      ALTER TABLE tvp_driver_payments 
      ADD CONSTRAINT tvp_driver_payments_payment_type_check 
      CHECK (payment_type IN ('paid', 'due'));
      
      RAISE NOTICE 'Added payment_type check constraint';
    ELSE
      RAISE NOTICE 'payment_type check constraint already exists';
    END IF;
    
    -- Update existing rows that have NULL payment_type to 'paid'
    UPDATE tvp_driver_payments 
    SET payment_type = 'paid' 
    WHERE payment_type IS NULL;
    
    RAISE NOTICE 'Updated existing rows with NULL payment_type to ''paid''';
    
    -- Add comment
    COMMENT ON COLUMN tvp_driver_payments.payment_type IS 'Payment category: paid (reduces balance) or due (increases balance)';
    
  ELSE
    RAISE NOTICE 'Table tvp_driver_payments does not exist. Please run the base migration first.';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tvp_driver_payments'
  AND column_name = 'payment_type';

