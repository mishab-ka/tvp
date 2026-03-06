-- Add penalty_other payment type and applied_bill_id for week-based "Other" charges
-- penalty_other: pending charge for a specific week; added to bill when that week's bill is generated
-- applied_bill_id: set when penalty_other is applied to a bill so we don't apply it again

ALTER TABLE tvp_driver_payments
DROP CONSTRAINT IF EXISTS tvp_driver_payments_payment_type_check;

ALTER TABLE tvp_driver_payments
ADD CONSTRAINT tvp_driver_payments_payment_type_check
CHECK (payment_type IN (
  'paid', 'due', 'refund', 'deposit', 'deposit_due', 'bill',
  'deposit_refund', 'deposit_paid', 'penalty_due', 'penalty_refund', 'penalty_paid', 'penalty_other'
));

ALTER TABLE tvp_driver_payments
ADD COLUMN IF NOT EXISTS applied_bill_id UUID REFERENCES tvp_driver_bills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tvp_driver_payments_applied_bill_id
ON tvp_driver_payments(applied_bill_id) WHERE applied_bill_id IS NOT NULL;

COMMENT ON COLUMN tvp_driver_payments.applied_bill_id IS 'Set when penalty_other is applied to a bill (so it is not applied again)';
