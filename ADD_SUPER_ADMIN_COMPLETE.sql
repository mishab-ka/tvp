-- Complete Script to Add New Super Admin User
-- This script will:
-- 1. Add password_hash column if it doesn't exist
-- 2. Create password hash function if it doesn't exist
-- 3. Create the super admin user
-- 4. Create the user profile

-- Step 1: Add password_hash column if it doesn't exist
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

-- Step 2: Create password hash function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_password_hash(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- SHA-256 hash for password storage
  RETURN encode(sha256(password::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the super admin user
DO $$
DECLARE
  super_admin_role_id UUID;
  new_user_id UUID;
BEGIN
  -- Get the super admin role ID
  SELECT id INTO super_admin_role_id FROM user_roles WHERE role_name = 'super_admin';
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found. Please ensure user_roles table has super_admin role.';
  END IF;
  
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = 'sadmin@tawaaq.com') THEN
    RAISE EXCEPTION 'User with email sadmin@tawaaq.com already exists. Please use a different email.';
  END IF;
  
  -- Create the super admin user (CHANGE: email, password, full_name, phone, department)
  INSERT INTO users (id, email, status, role_id, password_hash, sso_enabled, mfa_enabled) 
  VALUES (
    new_user_id,
    'sadmin@tawaaq.com',  -- CHANGE THIS: Your email
    'active',
    super_admin_role_id,
    generate_password_hash('password'),  -- CHANGE THIS: Your password
    false,
    true
  );
  
  -- Create user profile
  INSERT INTO user_profiles (user_id, full_name, phone, department, bio) 
  VALUES (
    new_user_id,
    'Super Administrator',  -- CHANGE THIS: Full name
    '+919606393089',  -- CHANGE THIS: Phone number
    'IT',  -- CHANGE THIS: Department
    'Super administrator with full system access control'
  );
  
  RAISE NOTICE 'Super admin user created successfully!';
  RAISE NOTICE 'Email: sadmin@tawaaq.com';
  RAISE NOTICE 'Password: password';
END $$;

-- Step 4: Verify the user was created
SELECT 
  u.id,
  u.email,
  u.status,
  u.password_hash IS NOT NULL as has_password,
  u.sso_enabled,
  u.mfa_enabled,
  ur.role_name,
  ur.display_name,
  up.full_name,
  up.phone,
  up.department
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'sadmin@tawaaq.com';  -- CHANGE THIS: Replace with the email you used above

SELECT 'Super admin user setup complete!' as status;




