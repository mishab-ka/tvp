-- Test Profile Update
-- Run this in Supabase SQL Editor to test profile updates

-- 1. Check current profile data for the specific user
SELECT 
    u.id,
    u.email,
    up.full_name,
    up.phone,
    up.department,
    up.bio,
    up.updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = 'dba8689d-205f-4a46-b4b1-63d2a15e512b';

-- 2. Manually update the profile (test the update operation)
UPDATE user_profiles 
SET 
    full_name = 'Mishab Abdul Samad (Test Update)',
    phone = '+1234567890',
    department = 'IT',
    bio = 'This is a test bio update',
    updated_at = NOW()
WHERE user_id = 'dba8689d-205f-4a46-b4b1-63d2a15e512b';

-- 3. Check if the update worked
SELECT 
    u.id,
    u.email,
    up.full_name,
    up.phone,
    up.department,
    up.bio,
    up.updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = 'dba8689d-205f-4a46-b4b1-63d2a15e512b';

-- 4. Check all profiles to see the structure
SELECT 
    id,
    user_id,
    full_name,
    phone,
    department,
    bio,
    created_at,
    updated_at
FROM user_profiles
ORDER BY updated_at DESC
LIMIT 5;
