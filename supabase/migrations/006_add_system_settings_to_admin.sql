-- Add system_settings permission to admin role
-- This migration updates the admin role to include system_settings permission

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

