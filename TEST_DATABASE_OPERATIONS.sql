-- Test Database Operations
-- Run this in Supabase SQL Editor to verify everything is working

-- 1. Check if tables exist and have data
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'user_roles' as table_name, COUNT(*) as record_count FROM user_roles;

-- 2. Check a sample user with profile
SELECT 
    u.id,
    u.email,
    u.status,
    u.role_id,
    up.full_name,
    up.phone,
    up.department,
    up.bio
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LIMIT 5;

-- 3. Test updating a user profile (replace USER_ID with actual user ID)
-- UPDATE user_profiles 
-- SET 
--     full_name = 'Test User Updated',
--     phone = '+1234567890',
--     department = 'IT',
--     bio = 'This is a test bio',
--     updated_at = NOW()
-- WHERE user_id = 'USER_ID_HERE';

-- 4. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'user_profiles', 'user_roles', 'user_sessions', 'saved_filters');

-- 5. Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('users', 'user_profiles', 'user_roles', 'saved_filters');
