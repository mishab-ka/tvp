-- Set Password for User
-- This script allows you to set a password for a user who doesn't have one
-- Replace 'mishabrock8@gmail.com' with the user's email and 'YourPasswordHere' with the desired password

-- Option 1: Set password for a specific user by email
UPDATE users
SET password_hash = generate_password_hash('YourPasswordHere'),
    sso_enabled = false
WHERE email = 'mishabrock8@gmail.com'
AND password_hash IS NULL;

-- Option 2: Set password for user and verify it was set
DO $$
DECLARE
  user_email TEXT := 'mishabrock8@gmail.com';
  new_password TEXT := 'YourPasswordHere';
  updated_count INTEGER;
BEGIN
  -- Update the user's password
  UPDATE users
  SET password_hash = generate_password_hash(new_password),
      sso_enabled = false
  WHERE email = user_email
  AND password_hash IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Password set successfully for user: %', user_email;
    RAISE NOTICE 'New password: %', new_password;
  ELSE
    RAISE NOTICE 'User not found or already has a password: %', user_email;
  END IF;
END $$;

-- Verify the user now has a password
SELECT 
  u.email,
  u.status,
  u.password_hash IS NOT NULL as has_password,
  u.sso_enabled,
  ur.role_name,
  up.full_name
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'mishabrock8@gmail.com';

