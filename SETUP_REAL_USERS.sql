-- Setup Real Users with Authentication and Role-Based Access
-- Run this in your Supabase SQL Editor

-- First, let's check the current state
SELECT 'Current Users:' as info;
SELECT 
  u.id,
  u.email,
  u.status,
  ur.role_name,
  ur.display_name,
  up.full_name,
  up.phone,
  up.department
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY ur.role_name, u.email;

-- Check if unique constraint exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- Create a function to generate simple password hashes
CREATE OR REPLACE FUNCTION generate_password_hash(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- This is a simple hash for demo purposes
  -- In production, use proper password hashing libraries
  RETURN encode(sha256(password::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Add password_hash column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'password_hash') THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- Clear existing users (optional - uncomment if you want to start fresh)
-- DELETE FROM user_profiles;
-- DELETE FROM users;

-- Create ONLY ONE Super Admin User with provided credentials
-- Use a safer approach that handles existing users
DO $$
DECLARE
  super_admin_role_id UUID;
  existing_user_id UUID;
BEGIN
  -- Get the super admin role ID
  SELECT id INTO super_admin_role_id FROM user_roles WHERE role_name = 'super_admin';
  
  -- Check if user already exists
  SELECT id INTO existing_user_id FROM users WHERE email = 'sadmin@tawaaq.com';
  
  IF existing_user_id IS NULL THEN
    -- Insert new user
    INSERT INTO users (email, status, role_id, password_hash, sso_enabled, mfa_enabled) 
    VALUES ('sadmin@tawaaq.com', 'active', super_admin_role_id, generate_password_hash('t4w44q009@@##'), false, true);
    
    RAISE NOTICE 'Super admin user created successfully';
  ELSE
    -- Update existing user
    UPDATE users 
    SET status = 'active', 
        role_id = super_admin_role_id, 
        password_hash = generate_password_hash('t4w44q009@@##'),
        sso_enabled = false, 
        mfa_enabled = true
    WHERE id = existing_user_id;
    
    RAISE NOTICE 'Super admin user updated successfully';
  END IF;
END $$;

-- Create user profile for the super admin
DO $$
DECLARE
  super_admin_user_id UUID;
BEGIN
  -- Get the super admin user ID
  SELECT id INTO super_admin_user_id FROM users WHERE email = 'sadmin@tawaaq.com';
  
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = super_admin_user_id) THEN
    -- Insert new profile
    INSERT INTO user_profiles (user_id, full_name, phone, department, bio) 
    VALUES (super_admin_user_id, 'Super Administrator', '+966501234567', 'IT', 'System super administrator with full access control');
    
    RAISE NOTICE 'Super admin profile created successfully';
  ELSE
    -- Update existing profile
    UPDATE user_profiles 
    SET full_name = 'Super Administrator',
        phone = '+966501234567',
        department = 'IT',
        bio = 'System super administrator with full access control'
    WHERE user_id = super_admin_user_id;
    
    RAISE NOTICE 'Super admin profile updated successfully';
  END IF;
END $$;

-- Verify the setup
SELECT 'Super Admin Setup Complete!' as status;

-- Display the super admin user with role and permissions
SELECT 
  'Super Admin User Details:' as info;
  
SELECT 
  u.email,
  u.status,
  ur.role_name,
  ur.display_name,
  up.full_name,
  up.phone,
  up.department,
  u.sso_enabled,
  u.mfa_enabled,
  ur.permissions
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'sadmin@tawaaq.com';

-- Display login credentials for reference
SELECT 
  'Login Credentials (for development only):' as info;
  
SELECT 
  'Super Admin' as role,
  'sadmin@tawaaq.com' as email,
  't4w44q009@@##' as password,
  'Full system access' as description;

-- Show all current users
SELECT 
  'All Current Users:' as info;
  
SELECT 
  u.email,
  u.status,
  ur.role_name,
  ur.display_name,
  up.full_name,
  up.department
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY ur.role_name, u.email;
