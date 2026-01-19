-- Add TVP Owner Role
-- Run this in your Supabase SQL Editor

-- Add TVP Owner role to user_roles table
INSERT INTO user_roles (id, role_name, display_name, permissions) VALUES
  (gen_random_uuid(), 'tvp_owner', 'TVP Owner', 
   '["cars_list", "hissab_view", "support_access"]'::jsonb)
ON CONFLICT (role_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  permissions = EXCLUDED.permissions;

-- Verify the role was added
SELECT 'TVP Owner Role Added Successfully!' as status;

-- Display all roles with their permissions
SELECT 
  role_name,
  display_name,
  permissions
FROM user_roles
ORDER BY role_name;

-- Create a test TVP Owner user
DO $$
DECLARE
  tvp_owner_role_id UUID;
  test_user_id UUID;
BEGIN
  -- Get TVP Owner role ID
  SELECT id INTO tvp_owner_role_id FROM user_roles WHERE role_name = 'tvp_owner';
  
  -- Generate test user ID
  test_user_id := gen_random_uuid();
  
  -- Create test TVP Owner user
  INSERT INTO users (id, email, status, role_id, sso_enabled, mfa_enabled) 
  VALUES (
    test_user_id,
    'tvpowner@tawaaq.com',
    'active',
    tvp_owner_role_id,
    false,
    false
  );
  
  -- Create test TVP Owner profile
  INSERT INTO user_profiles (user_id, full_name, phone, department, bio) 
  VALUES (
    test_user_id,
    'Test TVP Owner',
    '+966501234570',
    'Fleet',
    'Test TVP owner for fleet management'
  );
  
  RAISE NOTICE 'Test TVP Owner user created successfully: tvpowner@tawaaq.com / TvpOwner123';
END $$;

-- Show all users including the new TVP Owner
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
