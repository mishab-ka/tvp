-- Simple SQL Query to Add New Super Admin User
-- Replace the placeholder values with your desired credentials
-- IMPORTANT: Run ADD_PASSWORD_HASH_COLUMN.sql FIRST if password_hash column doesn't exist

DO $$
DECLARE
  super_admin_role_id UUID;
  new_user_id UUID;
BEGIN
  -- Get the super admin role ID
  SELECT id INTO super_admin_role_id FROM user_roles WHERE role_name = 'super_admin';
  
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Create the super admin user (CHANGE: email, password, full_name, phone, department)
  INSERT INTO users (id, email, status, role_id, password_hash, sso_enabled, mfa_enabled) 
  VALUES (
    new_user_id,
    'newadmin@tawaaq.com',  -- CHANGE THIS: Your email
    'active',
    super_admin_role_id,
    generate_password_hash('YourSecurePassword123!'),  -- CHANGE THIS: Your password
    false,
    true
  );
  
  -- Create user profile
  INSERT INTO user_profiles (user_id, full_name, phone, department, bio) 
  VALUES (
    new_user_id,
    'New Super Administrator',  -- CHANGE THIS: Full name
    '+966501234567',  -- CHANGE THIS: Phone number
    'IT',  -- CHANGE THIS: Department
    'Super administrator with full system access control'
  );
  
  RAISE NOTICE 'Super admin user created successfully!';
END $$;

