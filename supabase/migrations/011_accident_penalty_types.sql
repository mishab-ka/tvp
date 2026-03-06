-- Accident penalty: accident_due (add to bill for selected week), accident_paid (applied via bill)
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
  'penalty_other',
  'accident_due',
  'accident_paid'
));

-- Store accident penalty amount on the bill for invoice display
ALTER TABLE tvp_driver_bills
ADD COLUMN IF NOT EXISTS accident_penalty_amount NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN tvp_driver_bills.accident_penalty_amount IS 'Amount from accident_due transactions applied to this bill for the same week';
