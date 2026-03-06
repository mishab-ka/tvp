-- ============================================================================
-- ADD WEEK COLUMNS AND BILL PAYMENT TYPE TO tvp_driver_payments
-- ============================================================================
-- 1. Adds week_start and week_end for stable week-based queries
-- 2. Adds 'bill' payment type for ledger entries when bills are generated
-- 3. Backfills week columns from payment_date for existing rows
-- ============================================================================

-- Step 1: Add week columns
ALTER TABLE tvp_driver_payments ADD COLUMN IF NOT EXISTS week_start DATE;
ALTER TABLE tvp_driver_payments ADD COLUMN IF NOT EXISTS week_end DATE;

COMMENT ON COLUMN tvp_driver_payments.week_start IS 'Start date of the week (Monday) for this payment';
COMMENT ON COLUMN tvp_driver_payments.week_end IS 'End date of the week (Sunday) for this payment';

-- Step 2: Update payment_type constraint to include 'bill'
ALTER TABLE tvp_driver_payments 
DROP CONSTRAINT IF EXISTS tvp_driver_payments_payment_type_check;

ALTER TABLE tvp_driver_payments 
ADD CONSTRAINT tvp_driver_payments_payment_type_check 
CHECK (payment_type IN ('paid', 'due', 'refund', 'deposit', 'bill'));

COMMENT ON COLUMN tvp_driver_payments.payment_type IS 
'Payment category: 
- bill: Amount added when bill is generated (ledger entry, does not affect outstanding_balance directly)
- paid: Reduces outstanding balance (payment received)
- due: Reduces outstanding balance (amount settled)
- refund: Reduces outstanding balance (refund given)
- deposit: Adds to deposit_amount (security deposit)';

-- Step 3: Backfill week_start and week_end from payment_date for existing rows
-- PostgreSQL: date_trunc('week', date) returns Monday of the week (ISO week)
UPDATE tvp_driver_payments
SET 
  week_start = (date_trunc('week', payment_date)::date),
  week_end = (date_trunc('week', payment_date)::date + interval '6 days')::date
WHERE week_start IS NULL AND payment_date IS NOT NULL;

-- Step 4: Create index for week-based queries
CREATE INDEX IF NOT EXISTS idx_tvp_driver_payments_week 
ON tvp_driver_payments(week_start, week_end);

-- Step 5: Backfill "bill" ledger entries from existing tvp_driver_bills
-- Inserts bill records for historical bills so week-based balance is accurate
INSERT INTO tvp_driver_payments (
  driver_id,
  bill_id,
  payment_amount,
  payment_date,
  payment_type,
  week_start,
  week_end
)
SELECT 
  b.driver_id,
  b.id,
  b.current_os,
  COALESCE(b.week_end, b.week_start, CURRENT_DATE),
  'bill',
  b.week_start,
  b.week_end
FROM tvp_driver_bills b
WHERE b.week_start IS NOT NULL 
  AND b.week_end IS NOT NULL 
  AND COALESCE(b.current_os, 0) != 0
  AND NOT EXISTS (
    SELECT 1 FROM tvp_driver_payments p 
    WHERE p.bill_id = b.id AND p.payment_type = 'bill'
  );
