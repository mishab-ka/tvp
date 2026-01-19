# How to Fix PostgREST Schema Cache Error

## Error
```
Could not find the 'alternative_phone_1' column of 'tvp_drivers' in the schema cache
```

## Solution Steps

### Step 1: Run the Migration
Run `VERIFY_AND_FIX_COLUMNS.sql` in your Supabase SQL Editor to ensure the columns exist:

```sql
-- This will add missing columns and verify they exist
```

### Step 2: Refresh PostgREST Schema Cache

**Option A: Wait for automatic refresh (5-30 seconds)**
- After running the migration, wait 5-30 seconds for Supabase to automatically refresh the schema cache

**Option B: Restart Supabase project**
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Click **"Restart Project"** (this refreshes the schema cache)

**Option C: Use Supabase CLI (if you have it)**
```bash
supabase db reset --linked
```

### Step 3: Verify the Fix
After refreshing, try your query again. The error should be resolved.

## If the error persists:

1. **Verify columns exist in database:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'tvp_drivers' 
   AND column_name LIKE 'alternative_phone%';
   ```

2. **If columns don't exist, run:**
   - `ADD_DRIVER_ADDITIONAL_FIELDS.sql` (full migration)
   - OR `FIX_ALTERNATIVE_PHONE_COLUMNS.sql` (just phone columns)

3. **Check RLS policies:**
   - Make sure your user has SELECT permissions on `tvp_drivers` table

4. **Contact Supabase Support** if the issue continues
