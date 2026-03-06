-- ============================================================================
-- ADD deposit_due TO payment_type CONSTRAINT
-- ============================================================================
-- deposit_due: Reduces deposit_amount (e.g. deducting from deposit for charges)
-- ============================================================================

ALTER TABLE tvp_driver_payments 
DROP CONSTRAINT IF EXISTS tvp_driver_payments_payment_type_check;

ALTER TABLE tvp_driver_payments 
ADD CONSTRAINT tvp_driver_payments_payment_type_check 
CHECK (payment_type IN ('paid', 'due', 'refund', 'deposit', 'deposit_due', 'bill'));

COMMENT ON COLUMN tvp_driver_payments.payment_type IS 
'Payment category: 
- bill: Amount added when bill is generated (ledger entry)
- paid: Reduces outstanding balance (payment received)
- due: Adds to outstanding balance (amount due)
- refund: Reduces outstanding balance (refund given)
- deposit: Adds to deposit_amount (security deposit)
- deposit_due: Reduces deposit_amount (deduction from deposit)';
