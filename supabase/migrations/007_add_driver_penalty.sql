-- Add penalty_amount to tvp_drivers (pending penalty to apply to future bills)
ALTER TABLE tvp_drivers
ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(12,2) DEFAULT 0;

-- Add penalty_amount to tvp_driver_bills (amount applied in this bill; for invoice and audit)
ALTER TABLE tvp_driver_bills
ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN tvp_drivers.penalty_amount IS 'Pending penalty (INR) to be applied to next bill(s)';
COMMENT ON COLUMN tvp_driver_bills.penalty_amount IS 'Penalty amount (INR) applied in this bill';
