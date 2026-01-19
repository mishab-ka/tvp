# Database Setup Guide - Fixing User Management Issues

## Current Issues

The errors you're seeing are caused by:

1. **Infinite recursion in RLS policies** - Policies referencing each other circularly
2. **Missing table relationships** - Foreign key constraints not properly set up
3. **Table structure issues** - Tables created in wrong order

## Solution: Development-First Approach

For development, we'll **disable RLS** to avoid recursion issues entirely. This allows you to test all functionality without policy complications.

## Step-by-Step Fix

### 1. **Reset Your Database (Recommended)**

If you're in development and can reset your database:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Click **Reset Database** (⚠️ This will delete all data)
4. Confirm the reset

### 2. **Run the Corrected Migration**

1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy and paste the entire contents of `supabase/migrations/001_create_user_management_tables.sql`
3. Click **Run** to execute the migration

**Important**: This migration **disables RLS** for development purposes.

### 3. **Verify Tables Created**

Run this query to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_roles', 'users', 'user_profiles', 'user_sessions', 'saved_filters');
```

### 4. **Check Default Roles**

Run this query to verify roles were created:

```sql
SELECT * FROM user_roles ORDER BY role_name;
```

You should see:

- super_admin
- admin
- manager
- user

### 5. **Test the API**

After running the migration, refresh your application. The errors should be resolved.

## Alternative: Manual Table Creation

If you can't reset the database, manually drop and recreate tables:

### Step 1: Drop Existing Tables

```sql
DROP TABLE IF EXISTS saved_filters CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
```

### Step 2: Create Tables in Order

```sql
-- 1. Create user_roles first
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  role_id UUID REFERENCES user_roles(id),
  sso_enabled BOOLEAN DEFAULT false,
  mfa_enabled BOOLEAN DEFAULT false,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create other tables
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE saved_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Insert Default Roles

```sql
INSERT INTO user_roles (role_name, display_name, description, permissions) VALUES
  ('super_admin', 'Super Administrator', 'Full system access with all permissions',
    '["dashboard_view", "tvp_management", "financial_reports", "user_management", "system_settings", "audit_logs"]'),
  ('admin', 'Administrator', 'System administration with most permissions',
    '["dashboard_view", "tvp_management", "financial_reports", "user_management"]'),
  ('manager', 'Manager', 'Department management with limited permissions',
    '["dashboard_view", "tvp_management", "financial_reports"]'),
  ('user', 'User', 'Basic user with minimal permissions',
    '["dashboard_view"]');
```

### Step 4: Create Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);
```

### Step 5: Disable RLS for Development

```sql
-- IMPORTANT: Disable RLS for development to avoid recursion issues
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters DISABLE ROW LEVEL SECURITY;
```

## Testing the Fix

After completing the setup:

1. **Refresh your application**
2. **Check the browser console** - errors should be gone
3. **Verify the user management page loads** without errors
4. **Test creating a user** to ensure everything works

## Production Setup

When you're ready for production, run the production RLS policies:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy and paste the contents of `supabase/migrations/002_production_rls_policies.sql`
3. Click **Run** to enable proper security

**Note**: The production policies are designed to avoid recursion while providing proper security.

## Common Issues & Solutions

### Issue: "relation does not exist"

**Solution**: Run the migration again or manually create the missing table

### Issue: "infinite recursion detected"

**Solution**: RLS is now disabled for development to avoid this issue entirely

### Issue: "Could not find a relationship"

**Solution**: Tables are now created in the correct order with proper foreign keys

### Issue: "Permission denied"

**Solution**: RLS is disabled for development, so this shouldn't occur

## Security Note

**Development Mode**: RLS is disabled for easier development and testing.

**Production Mode**: Run the production RLS policies when deploying to production for proper security.

## Next Steps

Once the database is set up correctly:

1. **Create a test user** through the UI
2. **Test filtering and search** functionality
3. **Verify bulk operations** work correctly
4. **Check that statistics** display properly

The application should now work without the database errors you were experiencing!
