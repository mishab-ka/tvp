-- Add New Super Admin User
-- This script creates a new super admin user with email, password, and profile
-- Replace the placeholder values with your desired super admin credentials

DO $$
DECLARE
  super_admin_role_id UUID;
  new_user_id UUID;
  user_email TEXT := 'newadmin@tawaaq.com';  -- CHANGE THIS: Replace with desired email
  user_password TEXT := 'SecurePassword123!';  -- CHANGE THIS: Replace with desired password
  user_full_name TEXT := 'New Super Administrator';  -- CHANGE THIS: Replace with full name
  user_phone TEXT := '+966501234567';  -- CHANGE THIS: Replace with phone number
  user_department TEXT := 'IT';  -- CHANGE THIS: Replace with department
BEGIN
  -- Get the super admin role ID
  SELECT id INTO super_admin_role_id FROM user_roles WHERE role_name = 'super_admin';
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found. Please ensure user_roles table has super_admin role.';
  END IF;
  
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = user_email) THEN
    RAISE EXCEPTION 'User with email % already exists. Please use a different email.', user_email;
  END IF;
  
  -- Create the super admin user
  INSERT INTO users (
    id,
    email,
    status,
    role_id,
    password_hash,
    sso_enabled,
    mfa_enabled
  ) VALUES (
    new_user_id,
    user_email,
    'active',
    super_admin_role_id,
    generate_password_hash(user_password),
    false,
    true
  );
  
  -- Create user profile for the super admin
  INSERT INTO user_profiles (
    user_id,
    full_name,
    phone,
    department,
    bio
  ) VALUES (
    new_user_id,
    user_full_name,
    user_phone,
    user_department,
    'Super administrator with full system access control'
  );
  
  RAISE NOTICE 'Super admin user created successfully!';
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'Password: %', user_password;
  RAISE NOTICE 'Full Name: %', user_full_name;
END $$;

-- Verify the new super admin user was created
SELECT 
  u.id,
  u.email,
  u.status,
  u.password_hash IS NOT NULL as has_password,
  u.sso_enabled,
  u.mfa_enabled,
  ur.role_name,
  ur.display_name,
  ur.permissions,
  up.full_name,
  up.phone,
  up.department
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'newadmin@tawaaq.com';  -- CHANGE THIS: Replace with the email you used above

-- Show all super admin users
SELECT 
  u.email,
  u.status,
  up.full_name,
  up.department,
  up.phone,
  u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE ur.role_name = 'super_admin'
ORDER BY u.created_at DESC;




