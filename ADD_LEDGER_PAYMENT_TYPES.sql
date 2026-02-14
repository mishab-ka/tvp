-- ADD LEDGER PAYMENT TYPES: Deposit Transaction + Penalty and Refund Transaction
-- Each ledger has: Due (adds), Refund (reduces), Paid (reduces)
-- All require account: letzryd, tawaaq_fleet, cash_in_hand

-- Deposit ledger: deposit_due, deposit_refund, deposit_paid
-- Penalty ledger: penalty_due, penalty_refund, penalty_paid

ALTER TABLE tvp_driver_payments 
DROP CONSTRAINT IF EXISTS tvp_driver_payments_payment_type_check;

ALTER TABLE tvp_driver_payments 
ADD CONSTRAINT tvp_driver_payments_payment_type_check 
CHECK (payment_type IN (
  'paid', 'due', 'refund', 'deposit', 'deposit_due', 'bill',
  'deposit_refund', 'deposit_paid', 'penalty_due', 'penalty_refund', 'penalty_paid'
));

COMMENT ON COLUMN tvp_driver_payments.payment_type IS 
  'Deposit ledger: deposit_due (+), deposit_refund (-), deposit_paid (-). Penalty ledger: penalty_due (+), penalty_refund (-), penalty_paid (-). Legacy: paid, due, refund, deposit, deposit_due, bill.';
