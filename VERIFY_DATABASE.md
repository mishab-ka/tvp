# 🔍 VERIFY DATABASE SETUP

## Quick Check - Run These Queries

Go to your **Supabase Dashboard** → **SQL Editor** and run these queries to verify everything is set up correctly:

### 1. Check if Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_roles', 'users', 'user_profiles', 'user_sessions', 'saved_filters');
```

**Expected Result:** You should see all 5 tables listed.

### 2. Check if Roles Exist

```sql
SELECT * FROM user_roles ORDER BY role_name;
```

**Expected Result:** You should see:

- super_admin
- admin
- manager
- user

### 3. Check Table Structure

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Expected Result:** Should show columns like `id`, `email`, `status`, `role_id`, etc.

## If Roles Are Missing

If the `user_roles` table is empty, run this:

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

## If Tables Are Missing

If any tables are missing, run the full migration again:

1. Copy the entire content from `supabase/migrations/001_create_user_management_tables.sql`
2. Paste it in SQL Editor
3. Click "Run"

## Test User Creation

After verifying the setup, try creating a user with this test data:

- **Email:** test@example.com
- **Password:** test123456
- **Full Name:** Test User
- **Role:** User (or any role that exists)
- **Department:** IT

## Common Issues & Solutions

### "Foreign key constraint" Error

- **Cause:** Role ID doesn't exist in user_roles table
- **Solution:** Run the roles INSERT query above

### "Table doesn't exist" Error

- **Cause:** Migration didn't run properly
- **Solution:** Run the full migration again

### "Permission denied" Error

- **Cause:** RLS is enabled
- **Solution:** Make sure RLS is disabled (check the migration)

## Still Having Issues?

1. **Reset your database** completely
2. **Run the migration** again
3. **Verify roles exist** with the queries above
4. **Try creating a user** with the test data

---

## ✅ Success Checklist

- [ ] All 5 tables exist
- [ ] 4 roles exist (super_admin, admin, manager, user)
- [ ] RLS is disabled on all tables
- [ ] Can create a test user successfully
- [ ] User appears in the list after creation

Once all these are checked, your user management system should work perfectly! 🎉
