-- Check Database Structure
-- Run this to understand the current database setup

-- Check if user_roles table exists and has data
SELECT 'User Roles Table Check:' as info;

SELECT 
  COUNT(*) as total_roles,
  STRING_AGG(role_name, ', ') as available_roles
FROM user_roles;

-- Check user_roles table structure
SELECT 'User Roles Table Structure:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Check users table structure
SELECT 'Users Table Structure:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check user_profiles table structure
SELECT 'User Profiles Table Structure:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check current users
SELECT 'Current Users:' as info;

SELECT 
  u.id,
  u.email,
  u.status,
  u.role_id,
  ur.role_name
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
ORDER BY u.email;

-- Check if super_admin role exists
SELECT 'Super Admin Role Check:' as info;

SELECT 
  id,
  role_name,
  display_name,
  permissions
FROM user_roles 
WHERE role_name = 'super_admin';

-- Check foreign key relationships
SELECT 'Foreign Key Relationships:' as info;

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('users', 'user_profiles')
ORDER BY tc.table_name, kcu.column_name;
