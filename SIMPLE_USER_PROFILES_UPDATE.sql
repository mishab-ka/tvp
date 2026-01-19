-- Simple script to add missing columns to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add the missing columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS proof_of_document TEXT;

-- Add some sample data for existing TVP owners
INSERT INTO user_profiles (
    user_id, 
    address, 
    emergency_contact, 
    license_number, 
    region, 
    status
)
SELECT 
    u.id,
    'Sample Address for ' || u.name,
    '+91 98765 43210',
    'DL' || substr(u.id::text, 1, 8),
    'North Zone',
    'active'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
)
AND u.id IN (
    SELECT DISTINCT ur.user_id 
    FROM user_roles ur 
    WHERE ur.role_name = 'tvp_owner'
);

-- Show the results
SELECT 'user_profiles table updated successfully' as message;
