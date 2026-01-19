-- Test Super Admin Setup
-- Run this to verify everything is working

-- Test 1: Check if super admin user exists
SELECT 'Test 1: Super Admin User Check' as test_name;

SELECT 
  u.id,
  u.email,
  u.status,
  u.password_hash IS NOT NULL as has_password,
  ur.role_name,
  ur.display_name
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
WHERE u.email = 'sadmin@tawaaq.com';

-- Test 2: Check if super admin profile exists
SELECT 'Test 2: Super Admin Profile Check' as test_name;

SELECT 
  up.user_id,
  up.full_name,
  up.phone,
  up.department,
  up.bio
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE u.email = 'sadmin@tawaaq.com';

-- Test 3: Test password hash function
SELECT 'Test 3: Password Hash Function Test' as test_name;

SELECT 
  't4w44q009@@##' as original_password,
  generate_password_hash('t4w44q009@@##') as hashed_password,
  LENGTH(generate_password_hash('t4w44q009@@##')) as hash_length;

-- Test 4: Verify password hash matches
SELECT 'Test 4: Password Hash Verification' as test_name;

SELECT 
  u.email,
  u.password_hash = generate_password_hash('t4w44q009@@##') as password_matches,
  u.status = 'active' as is_active,
  ur.role_name = 'super_admin' as is_super_admin
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
WHERE u.email = 'sadmin@tawaaq.com';

-- Test 5: Check all current users
SELECT 'Test 5: All Current Users' as test_name;

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

-- Test 6: Check unique constraint
SELECT 'Test 6: Unique Constraint Check' as test_name;

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_email_key';

-- Test 7: Check table structure
SELECT 'Test 7: Table Structure Check' as test_name;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'user_roles', 'user_profiles')
AND column_name IN ('id', 'role_id', 'user_id')
ORDER BY table_name, column_name;

-- Final status
SELECT 'All Tests Complete!' as status;
