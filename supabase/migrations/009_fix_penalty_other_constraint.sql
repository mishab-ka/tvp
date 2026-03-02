-- FIX: Add penalty_other to payment_type constraint (run in Supabase SQL Editor if you get 23514 on penalty_other)
-- Run this if inserts with payment_type = 'penalty_other' fail with check constraint violation.

ALTER TABLE tvp_driver_payments
DROP CONSTRAINT IF EXISTS tvp_driver_payments_payment_type_check;

ALTER TABLE tvp_driver_payments
ADD CONSTRAINT tvp_driver_payments_payment_type_check
CHECK (payment_type IN (
  'paid',
  'due',
  'refund',
  'deposit',
  'deposit_due',
  'bill',
  'deposit_refund',
  'deposit_paid',
  'penalty_due',
  'penalty_refund',
  'penalty_paid',
  'penalty_other'
));

-- Ensure applied_bill_id column exists (no error if already exists)
ALTER TABLE tvp_driver_payments
ADD COLUMN IF NOT EXISTS applied_bill_id UUID REFERENCES tvp_driver_bills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tvp_driver_payments_applied_bill_id
ON tvp_driver_payments(applied_bill_id) WHERE applied_bill_id IS NOT NULL;
