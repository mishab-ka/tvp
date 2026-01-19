-- Add missing columns to user_profiles table
-- This script adds the required columns for TVP owner profiles

-- Add address column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add emergency_contact column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Add license_number column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Add region column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Add status column with default value
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add proof_of_document column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS proof_of_document TEXT;

-- Add document_url column for storing document file paths
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Add document_type column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Add document_expiry column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS document_expiry DATE;

-- Add additional profile fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS nationality TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Add created_at and updated_at timestamps if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create an index on status for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Create an index on region for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_region ON user_profiles(region);

-- Show the updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Insert sample profile data for existing users (optional)
-- This will create profile records for users who don't have them
INSERT INTO user_profiles (
    user_id, 
    address, 
    emergency_contact, 
    license_number, 
    region, 
    status,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'Sample Address for ' || u.name,
    '+91 98765 43210',
    'DL' || substr(u.id::text, 1, 8),
    CASE 
        WHEN u.id::text LIKE '%1%' THEN 'North Zone'
        WHEN u.id::text LIKE '%2%' THEN 'South Zone'
        WHEN u.id::text LIKE '%3%' THEN 'East Zone'
        WHEN u.id::text LIKE '%4%' THEN 'West Zone'
        ELSE 'Central Zone'
    END,
    'active',
    NOW(),
    NOW()
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
SELECT 
    'user_profiles table updated successfully' as message,
    COUNT(*) as total_profiles
FROM user_profiles;
