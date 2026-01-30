# Fix "including_room" schema cache error (PGRST204)

If you see **"Could not find the 'including_room' column of 'tvp_drivers' in the schema cache"**:

1. **Add the column** (if not already done):
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
   - Run the script **`ADD_INCLUDING_ROOM_TO_TVP_DRIVERS.sql`** (from this repo root).

2. **Refresh PostgREST schema cache**:
   - **Supabase Dashboard** → **Project Settings** → **API**.
   - Use **"Reload schema cache"** if available, or:
   - Restart the project (**Settings** → **General** → **Restart project**), or
   - Wait 5–30 seconds; Supabase often refreshes the cache after schema changes.

3. **Reload the app** and try saving again.

Until the migration is applied and the cache is refreshed, the app will **retry updates without `including_room`** so saves still succeed; the "Including room" option just won’t be persisted until the fix is in place.
