-- Fix Unique Constraint Issue
-- Run this in your Supabase SQL Editor

-- Check if unique constraint already exists
DO $$ 
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_key'
  ) THEN
    -- Add unique constraint to email column
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    RAISE NOTICE 'Unique constraint users_email_key added successfully';
  ELSE
    RAISE NOTICE 'Unique constraint users_email_key already exists';
  END IF;
END $$;

-- Verify the constraint exists
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_email_key';
