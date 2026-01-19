# 🔍 Check Profile Data - Troubleshooting Guide

## Issue: Phone and Department Not Showing in User Cards

The problem is that `phone` and `department` are stored in the `user_profiles` table, but they might not be displaying correctly.

## Step 1: Check if user_profiles Table Has Data

Run these queries in your **Supabase SQL Editor**:

### Check if user_profiles table exists and has data:

```sql
SELECT COUNT(*) as profile_count FROM user_profiles;
```

### Check the structure of user_profiles table:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

### Check if there are any profiles linked to users:

```sql
SELECT
  u.id,
  u.email,
  up.full_name,
  up.phone,
  up.department
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LIMIT 10;
```

## Step 2: If No Profile Data Exists

If the `user_profiles` table is empty, the issue is that profiles aren't being created when users are created. Run this to create profiles for existing users:

```sql
-- Create profiles for users that don't have them
INSERT INTO user_profiles (user_id, full_name, phone, department)
SELECT
  u.id,
  u.email as full_name,
  '' as phone,
  'IT' as department
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);
```

## Step 3: Test User Creation with Profile

Create a test user with profile data:

```sql
-- Insert a test user with profile
INSERT INTO users (email, status, role_id)
VALUES ('test@example.com', 'active', (SELECT id FROM user_roles WHERE role_name = 'user'));

-- Get the user ID
SELECT id FROM users WHERE email = 'test@example.com';

-- Insert profile for the test user (replace USER_ID with actual ID)
INSERT INTO user_profiles (user_id, full_name, phone, department, bio)
VALUES (
  'USER_ID_HERE', -- Replace with actual user ID
  'Test User',
  '+1234567890',
  'IT',
  'This is a test user profile'
);
```

## Step 4: Check Browser Console

1. **Open browser console** (F12)
2. **Refresh the page**
3. **Look for the debug logs**:
   - "Raw user data:" - Shows what's coming from database
   - "Transformed users:" - Shows the transformed data

## Step 5: Expected Data Structure

The raw user data should look like this:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "status": "active",
  "user_profiles": {
    "full_name": "John Doe",
    "phone": "+1234567890",
    "department": "IT",
    "bio": "User bio"
  },
  "user_roles": {
    "role_name": "user",
    "display_name": "User"
  }
}
```

## Step 6: Fix the API Query

If the data isn't being fetched correctly, check the `getUsers` function in `supabase.js`. It should include:

```javascript
let query = supabase.from("users").select(`
  *,
  user_profiles (
    id,
    full_name,
    phone,
    department,
    avatar_url
  ),
  user_roles (
    id,
    role_name,
    permissions
  )
`);
```

## Common Issues & Solutions

### Issue: "user_profiles is null"

- **Cause**: Profile wasn't created when user was created
- **Solution**: Run the profile creation script above

### Issue: "user_profiles table doesn't exist"

- **Cause**: Migration didn't run properly
- **Solution**: Run the migration again

### Issue: "No data in user_profiles"

- **Cause**: Users were created without profiles
- **Solution**: Create profiles for existing users

## Quick Fix

If you want to see the data immediately, run this in SQL Editor:

```sql
-- Create sample profile data for all users
INSERT INTO user_profiles (user_id, full_name, phone, department, bio)
SELECT
  u.id,
  u.email as full_name,
  '+1234567890' as phone,
  'IT' as department,
  'Sample user profile' as bio
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);
```

After running this, refresh your application and the phone and department should appear in the user cards!
