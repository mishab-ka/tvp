-- Create tables for TVP Owner Dashboard
-- This script creates the necessary tables for cars, hissab (accounting), and support tickets

-- 1. Cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tvp_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    car_number VARCHAR(20) NOT NULL,
    fleet_name VARCHAR(100) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    audit_tires INTEGER DEFAULT 0,
    audit_body VARCHAR(50) DEFAULT 'Good',
    audit_engine VARCHAR(50) DEFAULT 'Good',
    audit_battery VARCHAR(50) DEFAULT 'Good',
    audit_km INTEGER DEFAULT 0,
    audit_photos TEXT[], -- Array of photo URLs
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hissab (Accounting) table
CREATE TABLE IF NOT EXISTS hissab_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tvp_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_date DATE NOT NULL,
    total_trips INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    cash_collect DECIMAL(10,2) DEFAULT 0,
    toll DECIMAL(10,2) DEFAULT 0,
    adjustment_amount DECIMAL(10,2) DEFAULT 0,
    adjustment_description TEXT,
    uber_transfer DECIMAL(10,2) DEFAULT 0,
    total_outstanding DECIMAL(10,2) DEFAULT 0,
    net_outstanding DECIMAL(10,2) DEFAULT 0,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tvp_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_tvp_owner_id ON cars(tvp_owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_hissab_tvp_owner_id ON hissab_transactions(tvp_owner_id);
CREATE INDEX IF NOT EXISTS idx_hissab_week_date ON hissab_transactions(week_date);
CREATE INDEX IF NOT EXISTS idx_hissab_car_id ON hissab_transactions(car_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tvp_owner_id ON support_tickets(tvp_owner_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE hissab_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Cars policies
CREATE POLICY "TVP owners can view their own cars" ON cars
    FOR SELECT USING (tvp_owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND 
        (ur.role_name IN ('super_admin', 'admin') OR ur.permissions ? 'tvp_management')
    ));

CREATE POLICY "Admins can manage all cars" ON cars
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND 
        (ur.role_name IN ('super_admin', 'admin') OR ur.permissions ? 'tvp_management')
    ));

-- Hissab policies
CREATE POLICY "TVP owners can view their own transactions" ON hissab_transactions
    FOR SELECT USING (tvp_owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND 
        (ur.role_name IN ('super_admin', 'admin') OR ur.permissions ? 'tvp_management')
    ));

CREATE POLICY "Admins can manage all transactions" ON hissab_transactions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND 
        (ur.role_name IN ('super_admin', 'admin') OR ur.permissions ? 'tvp_management')
    ));

-- Support tickets policies
CREATE POLICY "TVP owners can view their own tickets" ON support_tickets
    FOR SELECT USING (tvp_owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND 
        (ur.role_name IN ('super_admin', 'admin') OR ur.permissions ? 'tvp_management')
    ));

CREATE POLICY "Admins can manage all tickets" ON support_tickets
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND 
        (ur.role_name IN ('super_admin', 'admin') OR ur.permissions ? 'tvp_management')
    ));

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hissab_transactions_updated_at BEFORE UPDATE ON hissab_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
