-- Complete TVP Owner Dashboard Setup
-- This script sets up everything needed for the TVP Owner Dashboard

-- Step 1: Add TVP Owner role
INSERT INTO user_roles (role_name, display_name, permissions) VALUES
  ('tvp_owner', 'TVP Owner', 
   '["cars_list", "hissab_view", "support_access"]'::jsonb)
ON CONFLICT (role_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  permissions = EXCLUDED.permissions;

-- Step 2: Create TVP Owner user
DO $$
DECLARE
  tvp_owner_role_id UUID;
  test_user_id UUID;
BEGIN
  -- Get TVP Owner role ID
  SELECT id INTO tvp_owner_role_id FROM user_roles WHERE role_name = 'tvp_owner';
  
  -- Generate test user ID
  test_user_id := gen_random_uuid();
  
  -- Create test TVP Owner user
  INSERT INTO users (id, email, status, role_id, sso_enabled, mfa_enabled) 
  VALUES (
    test_user_id,
    'tvpowner@tawaaq.com',
    'active',
    tvp_owner_role_id,
    false,
    false
  );
  
  -- Create test TVP Owner profile
  INSERT INTO user_profiles (user_id, full_name, phone, department, bio) 
  VALUES (
    test_user_id,
    'Test TVP Owner',
    '+966501234570',
    'Fleet',
    'Test TVP owner for fleet management'
  );
  
  RAISE NOTICE 'Test TVP Owner user created successfully: tvpowner@tawaaq.com';
END $$;

-- Step 3: Create cars table
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

-- Step 4: Create hissab_transactions table
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

-- Step 5: Create support_tickets table
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

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_cars_tvp_owner_id ON cars(tvp_owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_hissab_tvp_owner_id ON hissab_transactions(tvp_owner_id);
CREATE INDEX IF NOT EXISTS idx_hissab_week_date ON hissab_transactions(week_date);
CREATE INDEX IF NOT EXISTS idx_hissab_car_id ON hissab_transactions(car_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tvp_owner_id ON support_tickets(tvp_owner_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE hissab_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies (simplified for now)
CREATE POLICY "TVP owners can view their own cars" ON cars
    FOR SELECT USING (tvp_owner_id = auth.uid());

CREATE POLICY "Admins can manage all cars" ON cars
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND ur.role_name IN ('super_admin', 'admin')
    ));

CREATE POLICY "TVP owners can view their own transactions" ON hissab_transactions
    FOR SELECT USING (tvp_owner_id = auth.uid());

CREATE POLICY "Admins can manage all transactions" ON hissab_transactions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND ur.role_name IN ('super_admin', 'admin')
    ));

CREATE POLICY "TVP owners can view their own tickets" ON support_tickets
    FOR SELECT USING (tvp_owner_id = auth.uid());

CREATE POLICY "Admins can manage all tickets" ON support_tickets
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.role_id = ur.id 
        WHERE u.id = auth.uid() AND ur.role_name IN ('super_admin', 'admin')
    ));

-- Step 9: Create triggers for updated_at
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hissab_transactions_updated_at BEFORE UPDATE ON hissab_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Insert sample data
DO $$
DECLARE
    tvp_owner_id UUID;
    car1_id UUID;
    car2_id UUID;
    car3_id UUID;
BEGIN
    -- Get the TVP owner user ID
    SELECT id INTO tvp_owner_id FROM users WHERE email = 'tvpowner@tawaaq.com';
    
    IF tvp_owner_id IS NULL THEN
        RAISE EXCEPTION 'TVP owner user not found. Please check if the user was created.';
    END IF;

    -- Insert sample cars
    INSERT INTO cars (tvp_owner_id, car_number, fleet_name, deposit_amount, audit_tires, audit_body, audit_engine, audit_battery, audit_km, audit_photos, status)
    VALUES 
        (tvp_owner_id, 'ABC-123', 'Fleet Alpha', 5000.00, 4, 'Good', 'Excellent', 'Good', 45000, ARRAY['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'], 'active')
    RETURNING id INTO car1_id;
    
    INSERT INTO cars (tvp_owner_id, car_number, fleet_name, deposit_amount, audit_tires, audit_body, audit_engine, audit_battery, audit_km, audit_photos, status)
    VALUES 
        (tvp_owner_id, 'XYZ-789', 'Fleet Beta', 3500.00, 3, 'Fair', 'Good', 'Fair', 38500, ARRAY['https://example.com/photo3.jpg'], 'maintenance')
    RETURNING id INTO car2_id;
    
    INSERT INTO cars (tvp_owner_id, car_number, fleet_name, deposit_amount, audit_tires, audit_body, audit_engine, audit_battery, audit_km, audit_photos, status)
    VALUES 
        (tvp_owner_id, 'DEF-456', 'Fleet Gamma', 6000.00, 4, 'Excellent', 'Excellent', 'Excellent', 22000, ARRAY['https://example.com/photo4.jpg', 'https://example.com/photo5.jpg'], 'active')
    RETURNING id INTO car3_id;

    -- Insert sample hissab transactions
    INSERT INTO hissab_transactions (tvp_owner_id, week_date, total_trips, total_earnings, cash_collect, toll, adjustment_amount, adjustment_description, uber_transfer, total_outstanding, net_outstanding, car_id)
    VALUES 
        -- Week 1
        (tvp_owner_id, '2024-01-15', 25, 8500.00, 7000.00, 150.00, 200.00, 'Fuel adjustment for ABC-123', 1150.00, 1500.00, 1350.00, car1_id),
        (tvp_owner_id, '2024-01-15', 18, 6200.00, 5000.00, 120.00, 0.00, NULL, 1080.00, 1200.00, 1200.00, car2_id),
        (tvp_owner_id, '2024-01-15', 30, 9500.00, 8000.00, 200.00, 300.00, 'Maintenance adjustment for DEF-456', 1000.00, 1500.00, 1200.00, car3_id),
        
        -- Week 2
        (tvp_owner_id, '2024-01-08', 22, 7800.00, 6500.00, 180.00, 150.00, 'Toll adjustment for ABC-123', 970.00, 1300.00, 1150.00, car1_id),
        (tvp_owner_id, '2024-01-08', 15, 5200.00, 4200.00, 100.00, 0.00, NULL, 900.00, 1000.00, 1000.00, car2_id),
        (tvp_owner_id, '2024-01-08', 28, 8800.00, 7500.00, 220.00, 250.00, 'Cleaning adjustment for DEF-456', 830.00, 1300.00, 1050.00, car3_id),
        
        -- Week 3
        (tvp_owner_id, '2024-01-01', 20, 7200.00, 6000.00, 160.00, 100.00, 'Parking adjustment for ABC-123', 940.00, 1200.00, 1100.00, car1_id),
        (tvp_owner_id, '2024-01-01', 12, 4100.00, 3300.00, 80.00, 0.00, NULL, 720.00, 800.00, 800.00, car2_id),
        (tvp_owner_id, '2024-01-01', 25, 8200.00, 7000.00, 190.00, 200.00, 'Insurance adjustment for DEF-456', 810.00, 1200.00, 1000.00, car3_id);

    -- Insert sample support tickets
    INSERT INTO support_tickets (tvp_owner_id, title, description, status, priority, assigned_to)
    VALUES 
        (tvp_owner_id, 'Vehicle maintenance request', 'Need maintenance for vehicle ABC-123. Engine making unusual noise.', 'open', 'medium', 'Fleet Manager'),
        (tvp_owner_id, 'Insurance renewal reminder', 'Insurance expiring soon for XYZ-789. Need renewal process.', 'in_progress', 'high', 'Admin'),
        (tvp_owner_id, 'Driver assignment request', 'Request for new driver assignment for DEF-456. Current driver on leave.', 'resolved', 'low', 'HR Manager'),
        (tvp_owner_id, 'GPS system malfunction', 'GPS tracking system not working properly in ABC-123.', 'open', 'high', 'IT Support'),
        (tvp_owner_id, 'Fuel card issue', 'Fuel card for XYZ-789 not working at gas stations.', 'in_progress', 'medium', 'Finance Team'),
        (tvp_owner_id, 'Document renewal', 'Vehicle registration documents need renewal for DEF-456.', 'open', 'medium', 'Admin');

    RAISE NOTICE 'Sample data inserted successfully for TVP owner: %', tvp_owner_id;
    RAISE NOTICE 'Inserted % cars, % transactions, and % support tickets', 3, 9, 6;

END $$;

-- Step 11: Verification
SELECT 'TVP Owner Dashboard Setup Complete!' as status;

-- Show summary
SELECT 
  'Cars' as table_name,
  COUNT(*) as record_count
FROM cars
UNION ALL
SELECT 
  'Hissab Transactions' as table_name,
  COUNT(*) as record_count
FROM hissab_transactions
UNION ALL
SELECT 
  'Support Tickets' as table_name,
  COUNT(*) as record_count
FROM support_tickets;
