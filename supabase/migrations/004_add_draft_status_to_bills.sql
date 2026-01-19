-- Migration: Add 'draft' status support to tvp_driver_bills table
-- This migration updates the status constraint to include 'draft' status

-- Drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tvp_driver_bills_status_check'
  ) THEN
    ALTER TABLE tvp_driver_bills 
    DROP CONSTRAINT tvp_driver_bills_status_check;
  END IF;
END $$;

-- Add new constraint with 'draft' status
ALTER TABLE tvp_driver_bills 
ADD CONSTRAINT tvp_driver_bills_status_check 
CHECK (status IN ('draft', 'generated', 'paid', 'cancelled'));

-- Update default status to 'draft' for new bills (optional, keeps existing default)
-- ALTER TABLE tvp_driver_bills ALTER COLUMN status SET DEFAULT 'draft';

COMMENT ON COLUMN tvp_driver_bills.status IS 'Bill status: draft (editable), generated (finalized with invoice), paid, or cancelled';



