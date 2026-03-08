-- ============================================================================
-- TVP drivers RLS: allow admin portal to list and manage drivers
-- ============================================================================
-- Your admin portal uses custom auth (localStorage) and the Supabase anon key,
-- so auth.uid() is null. The "Drivers can read own profile" policies only
-- return rows when auth.uid() matches a driver, so the admin portal gets no rows.
--
-- This migration adds policies so that:
-- 1) Admins (when using Supabase Auth with auth.uid() in users + admin role)
--    get full access to tvp_drivers.
-- 2) Anon gets SELECT (and optionally full) access so the current admin portal
--    works without changing to Supabase Auth. For stricter security, remove
--    the anon policy and ensure admin login sets a Supabase Auth session.
-- ============================================================================

-- Ensure RLS is enabled (you already enabled it when adding driver policies)
ALTER TABLE tvp_drivers ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 1) Admin full access (when Supabase Auth is used for admin login)
--    Same pattern as users / user_profiles in 002_production_rls_policies.sql
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all tvp_drivers" ON tvp_drivers;
CREATE POLICY "Admins can manage all tvp_drivers"
  ON tvp_drivers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.role_name IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.role_name IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Allow anon full access so admin portal works (list + create/edit/delete)
--    The admin portal uses anon key + custom auth; auth.uid() is never set.
--    To lock down later: drop this policy and have admin login set a Supabase
--    Auth session so "Admins can manage all tvp_drivers" applies instead.
--    To allow only read: change FOR ALL to FOR SELECT and remove WITH CHECK.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon read tvp_drivers for admin portal" ON tvp_drivers;
DROP POLICY IF EXISTS "Allow anon write tvp_drivers for admin portal" ON tvp_drivers;
DROP POLICY IF EXISTS "Allow anon full access tvp_drivers for admin portal" ON tvp_drivers;
CREATE POLICY "Allow anon full access tvp_drivers for admin portal"
  ON tvp_drivers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
