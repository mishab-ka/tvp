-- Add password_hash column to users table if it doesn't exist
-- Run this FIRST before creating users with passwords

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
    RAISE NOTICE 'password_hash column added to users table';
  ELSE
    RAISE NOTICE 'password_hash column already exists';
  END IF;
END $$;

-- Create password hash function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_password_hash(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- SHA-256 hash for password storage
  RETURN encode(sha256(password::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

SELECT 'password_hash column setup complete!' as status;




