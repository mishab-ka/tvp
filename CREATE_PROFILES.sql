-- Create user profiles for all existing users
-- Run this in your Supabase SQL Editor

-- First, check if user_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
) as table_exists;

-- Check how many users exist
SELECT COUNT(*) as user_count FROM users;

-- Check how many profiles exist
SELECT COUNT(*) as profile_count FROM user_profiles;

-- Create profiles for users that don't have them
INSERT INTO user_profiles (user_id, full_name, phone, department, bio)
SELECT 
  u.id,
  u.email as full_name,
  '+1234567890' as phone,
  'IT' as department,
  'User profile created automatically' as bio
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- Verify the profiles were created
SELECT 
  u.id,
  u.email,
  up.full_name,
  up.phone,
  up.department
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LIMIT 10;
