# Debugging Authentication Issue

## 🔍 **Current Problem**

The TVP Owner Dashboard is showing "User not authenticated" error when trying to load data.

## 📋 **Debugging Steps**

### **Step 1: Check Database Setup**

Run the test script to verify database setup:

```bash
psql -h db.xyz.supabase.co -p 5432 -d postgres -U postgres.xyz -f TEST_TVP_OWNER_USER.sql
```

### **Step 2: Check Browser Console**

1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for debug messages from `getCurrentUser()` function
4. Check what's in localStorage

### **Step 3: Manual Authentication Test**

1. Clear localStorage: `localStorage.clear()`
2. Go to login page: `/login`
3. Login with: `tvpowner@tawaaq.com` / `TvpOwner123`
4. Check if redirected to `/dashboard`
5. Check if redirected to `/tvp-owner-dashboard`

### **Step 4: Check AuthContext State**

1. Open browser console
2. Run: `console.log('AuthContext:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__)`
3. Check React DevTools for AuthContext state

### **Step 5: Verify User Data**

Check if user data is properly stored:

```javascript
// In browser console
console.log("LocalStorage session:", localStorage.getItem("tawaaq_session"));
console.log(
  "Parsed session:",
  JSON.parse(localStorage.getItem("tawaaq_session"))
);
```

## 🎯 **Expected Results**

### **Database Check Should Show:**

- TVP Owner role exists with `["cars_list", "hissab_view", "support_access"]` permissions
- TVP Owner user exists with correct role assignment
- Cars, transactions, and tickets tables have data

### **Browser Console Should Show:**

- "Checking localStorage for session data..."
- "Session data from localStorage: [session data]"
- "User authenticated successfully: [user-id]"

### **AuthContext Should Show:**

- `isAuthenticated: true`
- `currentUser` object with `id`, `role`, `permissions`

## 🚨 **Common Issues & Solutions**

### **Issue 1: User Not Created**

**Symptoms:** No user found in database
**Solution:** Run `SETUP_TVP_DASHBOARD_COMPLETE.sql`

### **Issue 2: Wrong Permissions**

**Symptoms:** User exists but no `cars_list` permission
**Solution:** Update user role permissions

### **Issue 3: Session Not Stored**

**Symptoms:** localStorage is empty
**Solution:** Check login process and AuthContext

### **Issue 4: Session Expired**

**Symptoms:** Session exists but expired
**Solution:** Re-login or extend session

### **Issue 5: Wrong User ID**

**Symptoms:** User authenticated but wrong ID in database
**Solution:** Check user creation and database relationships

## 🔧 **Quick Fixes**

### **If Database Tables Don't Exist:**

```bash
psql -h db.xyz.supabase.co -p 5432 -d postgres -U postgres.xyz -f SETUP_TVP_DASHBOARD_COMPLETE.sql
```

### **If User Doesn't Exist:**

```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'tvpowner@tawaaq.com';

-- If not, create manually
INSERT INTO user_roles (role_name, display_name, permissions) VALUES
  ('tvp_owner', 'TVP Owner', '["cars_list", "hissab_view", "support_access"]'::jsonb)
ON CONFLICT (role_name) DO NOTHING;
```

### **If Permissions Wrong:**

```sql
-- Update TVP Owner permissions
UPDATE user_roles
SET permissions = '["cars_list", "hissab_view", "support_access"]'::jsonb
WHERE role_name = 'tvp_owner';
```

## 📞 **Next Steps**

1. Run the test script
2. Check browser console output
3. Verify user authentication
4. Test data loading
5. Report results for further debugging
