-- Enable RLS on tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE hissab_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "TVP Owners can view their own cars" ON cars;
DROP POLICY IF EXISTS "Admins can view all cars" ON cars;
DROP POLICY IF EXISTS "TVP Owners can view their own transactions" ON hissab_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON hissab_transactions;
DROP POLICY IF EXISTS "TVP Owners can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;

-- Cars table policies
CREATE POLICY "TVP Owners can view their own cars" ON cars
    FOR SELECT
    USING (
        tvp_owner_id = auth.uid()::text
    );

CREATE POLICY "Admins can view all cars" ON cars
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.id = auth.uid()::text
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

-- Hissab transactions table policies
CREATE POLICY "TVP Owners can view their own transactions" ON hissab_transactions
    FOR SELECT
    USING (
        tvp_owner_id = auth.uid()::text
    );

CREATE POLICY "Admins can view all transactions" ON hissab_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.id = auth.uid()::text
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

-- Support tickets table policies
CREATE POLICY "TVP Owners can view their own tickets" ON support_tickets
    FOR SELECT
    USING (
        tvp_owner_id = auth.uid()::text
    );

CREATE POLICY "Admins can view all tickets" ON support_tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.id = auth.uid()::text
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

-- Alternative simpler policies (if the above don't work)
-- These policies work with your custom authentication system

-- Simple cars policy
CREATE POLICY "Simple cars policy" ON cars
    FOR SELECT
    USING (true); -- Allow all SELECT operations

-- Simple transactions policy  
CREATE POLICY "Simple transactions policy" ON hissab_transactions
    FOR SELECT
    USING (true); -- Allow all SELECT operations

-- Simple tickets policy
CREATE POLICY "Simple tickets policy" ON support_tickets
    FOR SELECT
    USING (true); -- Allow all SELECT operations

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('cars', 'hissab_transactions', 'support_tickets');
