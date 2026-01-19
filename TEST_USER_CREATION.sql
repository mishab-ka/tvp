-- Test User Creation and Authentication
-- Run this to verify the user management system works

-- Test 1: Check if super admin exists and can login
SELECT 'Test 1: Super Admin Authentication' as test_name;

SELECT 
  u.email,
  u.status,
  u.password_hash IS NOT NULL as has_password,
  ur.role_name,
  ur.display_name,
  ur.permissions
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
WHERE u.email = 'sadmin@tawaaq.com';

-- Test 2: Check available roles for user creation
SELECT 'Test 2: Available Roles for User Creation' as test_name;

SELECT 
  id,
  role_name,
  display_name,
  permissions
FROM user_roles
ORDER BY role_name;

-- Test 3: Test password hash function
SELECT 'Test 3: Password Hash Function Test' as test_name;

SELECT 
  'testpassword123' as test_password,
  generate_password_hash('testpassword123') as hashed_password,
  LENGTH(generate_password_hash('testpassword123')) as hash_length;

-- Test 4: Create a test admin user
SELECT 'Test 4: Creating Test Admin User' as test_name;

DO $$
DECLARE
  admin_role_id UUID;
  test_user_id UUID;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM user_roles WHERE role_name = 'admin';
  
  -- Generate test user ID
  test_user_id := gen_random_uuid();
  
  -- Create test admin user
  INSERT INTO users (id, email, status, role_id, password_hash, sso_enabled, mfa_enabled) 
  VALUES (
    test_user_id,
    'testadmin@tawaaq.com',
    'active',
    admin_role_id,
    generate_password_hash('TestAdmin123'),
    false,
    true
  );
  
  -- Create test admin profile
  INSERT INTO user_profiles (user_id, full_name, phone, department, bio) 
  VALUES (
    test_user_id,
    'Test Administrator',
    '+966501234568',
    'IT',
    'Test admin user for verification'
  );
  
  RAISE NOTICE 'Test admin user created successfully: testadmin@tawaaq.com / TestAdmin123';
END $$;

-- Test 5: Verify test admin user was created
SELECT 'Test 5: Verify Test Admin User' as test_name;

SELECT 
  u.email,
  u.status,
  u.password_hash IS NOT NULL as has_password,
  ur.role_name,
  ur.display_name,
  up.full_name,
  up.phone,
  up.department
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'testadmin@tawaaq.com';

-- Test 6: Test authentication for test admin
SELECT 'Test 6: Test Admin Authentication' as test_name;

DO $$
DECLARE
  test_user_id UUID;
  password_hash TEXT;
  auth_result TEXT;
BEGIN
  -- Get test user
  SELECT id, password_hash INTO test_user_id, password_hash 
  FROM users WHERE email = 'testadmin@tawaaq.com';
  
  -- Test password authentication
  IF password_hash = generate_password_hash('TestAdmin123') THEN
    auth_result := 'SUCCESS: Password authentication works';
  ELSE
    auth_result := 'FAILED: Password authentication failed';
  END IF;
  
  RAISE NOTICE 'Authentication test result: %', auth_result;
END $$;

-- Test 7: Create a test manager user
SELECT 'Test 7: Creating Test Manager User' as test_name;

DO $$
DECLARE
  manager_role_id UUID;
  test_user_id UUID;
BEGIN
  -- Get manager role ID
  SELECT id INTO manager_role_id FROM user_roles WHERE role_name = 'manager';
  
  -- Generate test user ID
  test_user_id := gen_random_uuid();
  
  -- Create test manager user
  INSERT INTO users (id, email, status, role_id, password_hash, sso_enabled, mfa_enabled) 
  VALUES (
    test_user_id,
    'testmanager@tawaaq.com',
    'active',
    manager_role_id,
    generate_password_hash('TestManager123'),
    false,
    false
  );
  
  -- Create test manager profile
  INSERT INTO user_profiles (user_id, full_name, phone, department, bio) 
  VALUES (
    test_user_id,
    'Test Manager',
    '+966501234569',
    'Operations',
    'Test manager user for verification'
  );
  
  RAISE NOTICE 'Test manager user created successfully: testmanager@tawaaq.com / TestManager123';
END $$;

-- Test 8: Show all test users
SELECT 'Test 8: All Test Users Created' as test_name;

SELECT 
  u.email,
  u.status,
  ur.role_name,
  ur.display_name,
  up.full_name,
  up.department,
  'Password: [See below]' as password_info
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email IN ('sadmin@tawaaq.com', 'testadmin@tawaaq.com', 'testmanager@tawaaq.com')
ORDER BY ur.role_name, u.email;

-- Test 9: Password reference for testing
SELECT 'Test 9: Login Credentials for Testing' as test_name;

SELECT 
  'Super Admin' as role,
  'sadmin@tawaaq.com' as email,
  't4w44q009@@##' as password,
  'Full system access' as description
UNION ALL
SELECT 
  'Test Admin' as role,
  'testadmin@tawaaq.com' as email,
  'TestAdmin123' as password,
  'Admin access for testing' as description
UNION ALL
SELECT 
  'Test Manager' as role,
  'testmanager@tawaaq.com' as email,
  'TestManager123' as password,
  'Manager access for testing' as description;

-- Test 10: Clean up test users (optional - uncomment to remove test users)
-- SELECT 'Test 10: Cleaning Up Test Users' as test_name;
-- 
-- DELETE FROM user_profiles WHERE user_id IN (
--   SELECT id FROM users WHERE email IN ('testadmin@tawaaq.com', 'testmanager@tawaaq.com')
-- );
-- 
-- DELETE FROM users WHERE email IN ('testadmin@tawaaq.com', 'testmanager@tawaaq.com');
-- 
-- SELECT 'Test users cleaned up successfully' as cleanup_status;

-- Final status
SELECT 'User Creation and Authentication Tests Complete!' as status;

