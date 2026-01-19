-- Create missing user profiles for all users
-- This script ensures all users have a profile record

-- Insert profile records for users that don't have one
INSERT INTO user_profiles (user_id, full_name, phone, department, bio, created_at, updated_at)
SELECT 
    u.id as user_id,
    u.email as full_name, -- Use email as default name
    '' as phone,
    '' as department,
    '' as bio,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Show how many profiles were created
SELECT COUNT(*) as profiles_created FROM user_profiles WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Show all users and their profiles
SELECT 
    u.id,
    u.email,
    u.status,
    up.full_name,
    up.phone,
    up.department,
    up.bio,
    CASE WHEN up.user_id IS NOT NULL THEN 'Has Profile' ELSE 'No Profile' END as profile_status
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC;
