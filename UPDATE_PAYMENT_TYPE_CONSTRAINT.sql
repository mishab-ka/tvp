-- Migration: Update payment_type constraint to include new categories
-- New types: deposit, due, refund, paid
-- - deposit: Adds to deposit_amount column
-- - due, refund, paid: Reduces outstanding_balance

-- Drop existing constraint if it exists
ALTER TABLE tvp_driver_payments 
DROP CONSTRAINT IF EXISTS tvp_driver_payments_payment_type_check;

-- Add new constraint with all payment types
ALTER TABLE tvp_driver_payments 
ADD CONSTRAINT tvp_driver_payments_payment_type_check 
CHECK (payment_type IN ('paid', 'due', 'refund', 'deposit'));

-- Add comment to document the payment types
COMMENT ON COLUMN tvp_driver_payments.payment_type IS 
'Payment category: 
- paid: Reduces outstanding balance (payment received)
- due: Reduces outstanding balance (amount settled)
- refund: Reduces outstanding balance (refund given)
- deposit: Adds to deposit_amount (security deposit)';
