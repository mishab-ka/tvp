# How to Fix Week Columns Schema Cache Error

## Error
```
Could not find the 'week_end' column of 'tvp_driver_bills' in the schema cache
```

## Solution Steps

### Step 1: Run the Migration
Run `ADD_WEEK_COLUMNS_TO_BILLS.sql` in your Supabase SQL Editor to add the missing columns:

```sql
-- This will add week_start and week_end columns to tvp_driver_bills table
```

### Step 2: Refresh PostgREST Schema Cache

**Option A: Wait for automatic refresh (5-30 seconds)**
- After running the migration, wait 5-30 seconds for Supabase to automatically refresh the schema cache

**Option B: Restart Supabase project (recommended)**
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Click **"Restart Project"** (this refreshes the schema cache)

**Option C: Manual schema reload**
- In Supabase Dashboard → Database → Tables → click the refresh icon near `tvp_driver_bills`

### Step 3: Verify the Fix
After refreshing, try your query again. The error should be resolved.

## What the Migration Adds

- `week_start` (DATE): Start date of the week for this bill (Monday)
- `week_end` (DATE): End date of the week for this bill (Sunday)

These columns are used to:
- Store the week range when creating bills from CSV uploads
- Generate PDF filenames with week information (e.g., "Biju Cm (12 jan 2026 to 18 jan 2026).pdf")

## If the error persists:

1. **Verify columns exist in database:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'tvp_driver_bills' 
   AND column_name IN ('week_start', 'week_end');
   ```

2. **If columns don't exist, run:**
   - `ADD_WEEK_COLUMNS_TO_BILLS.sql` (the migration script)

3. **Check RLS policies:**
   - Make sure your user has INSERT/UPDATE permissions on `tvp_driver_bills` table

4. **Contact Supabase Support** if the issue continues
