-- Add vehicle_management permission to admin role
-- This script updates the existing admin role to include vehicle_management permission
-- Run this in your Supabase SQL Editor

UPDATE user_roles
SET permissions = '["dashboard_view", "tvp_management", "financial_reports", "user_management", "vehicle_management"]'::jsonb
WHERE role_name = 'admin';

-- Verify the update
SELECT 
  role_name,
  display_name,
  permissions
FROM user_roles
WHERE role_name = 'admin';

-- Show confirmation message
SELECT 'Admin role updated successfully! Vehicle management permission added.' as status;

