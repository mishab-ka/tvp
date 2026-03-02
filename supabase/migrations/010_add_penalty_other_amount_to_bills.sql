-- Store penalty_other (week-based "Other") amount on the bill for invoice display
ALTER TABLE tvp_driver_bills
ADD COLUMN IF NOT EXISTS penalty_other_amount NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN tvp_driver_bills.penalty_other_amount IS 'Amount from penalty_other (Other) transactions applied to this bill for the same week';
