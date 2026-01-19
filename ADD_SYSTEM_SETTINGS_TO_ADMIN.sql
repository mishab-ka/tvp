-- Add system_settings permission to admin role
-- Run this SQL directly in your Supabase SQL editor or database client

-- Method 1: Simple update (recommended)
UPDATE user_roles
SET permissions = '["dashboard_view", "tvp_management", "financial_reports", "user_management", "vehicle_management", "system_settings"]'::jsonb
WHERE role_name = 'admin';

-- Method 2: Add to existing array (if you want to preserve order)
DO $$
DECLARE
  current_perms jsonb;
  new_perms jsonb;
BEGIN
  SELECT permissions INTO current_perms
  FROM user_roles
  WHERE role_name = 'admin';
  
  -- Check if system_settings already exists
  IF NOT (current_perms @> '["system_settings"]'::jsonb) THEN
    -- Add system_settings to the array
    new_perms := current_perms || '["system_settings"]'::jsonb;
    
    UPDATE user_roles
    SET permissions = new_perms
    WHERE role_name = 'admin';
    
    RAISE NOTICE 'Added system_settings permission to admin role';
  ELSE
    RAISE NOTICE 'system_settings permission already exists for admin role';
  END IF;
END $$;

-- Verify the update
SELECT 
  role_name, 
  display_name, 
  permissions,
  CASE 
    WHEN permissions @> '["system_settings"]'::jsonb THEN '✅ system_settings permission exists'
    ELSE '❌ system_settings permission missing'
  END as status
FROM user_roles 
WHERE role_name = 'admin';

-- To check all roles and their permissions:
SELECT role_name, display_name, permissions 
FROM user_roles 
ORDER BY role_name;



