-- Setup TVP Owner Dashboard Tables and Sample Data
-- This script creates the necessary tables and inserts sample data

-- Create cars table if it doesn't exist
CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_number VARCHAR(50) NOT NULL,
  fleet_name VARCHAR(100) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  audit_tires VARCHAR(50),
  audit_body VARCHAR(50),
  audit_engine VARCHAR(50),
  audit_battery VARCHAR(50),
  audit_km INTEGER,
  audit_photos TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  tvp_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hissab_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS hissab_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  tvp_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50),
  tvp_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample cars for TVP Owner
INSERT INTO cars (car_number, fleet_name, deposit_amount, audit_tires, audit_body, audit_engine, audit_battery, audit_km, audit_photos, status, tvp_owner_id)
SELECT 
  'CAR-001',
  'Fleet Alpha',
  5000.00,
  'Good',
  'Excellent',
  'Good',
  'New',
  45000,
  ARRAY['photo1.jpg', 'photo2.jpg'],
  'active',
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

INSERT INTO cars (car_number, fleet_name, deposit_amount, audit_tires, audit_body, audit_engine, audit_battery, audit_km, audit_photos, status, tvp_owner_id)
SELECT 
  'CAR-002',
  'Fleet Beta',
  6000.00,
  'Fair',
  'Good',
  'Excellent',
  'Good',
  32000,
  ARRAY['photo3.jpg', 'photo4.jpg'],
  'active',
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

INSERT INTO cars (car_number, fleet_name, deposit_amount, audit_tires, audit_body, audit_engine, audit_battery, audit_km, audit_photos, status, tvp_owner_id)
SELECT 
  'CAR-003',
  'Fleet Gamma',
  4500.00,
  'Good',
  'Good',
  'Good',
  'Fair',
  28000,
  ARRAY['photo5.jpg'],
  'maintenance',
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

-- Insert sample hissab transactions for TVP Owner
INSERT INTO hissab_transactions (week_date, total_trips, total_earnings, cash_collect, toll, adjustment_amount, adjustment_description, uber_transfer, total_outstanding, net_outstanding, tvp_owner_id)
SELECT 
  '2024-01-01',
  45,
  2250.00,
  1800.00,
  150.00,
  50.00,
  'Fuel adjustment',
  200.00,
  250.00,
  50.00,
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

INSERT INTO hissab_transactions (week_date, total_trips, total_earnings, cash_collect, toll, adjustment_amount, adjustment_description, uber_transfer, total_outstanding, net_outstanding, tvp_owner_id)
SELECT 
  '2024-01-08',
  52,
  2600.00,
  2100.00,
  180.00,
  0.00,
  NULL,
  320.00,
  0.00,
  0.00,
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

INSERT INTO hissab_transactions (week_date, total_trips, total_earnings, cash_collect, toll, adjustment_amount, adjustment_description, uber_transfer, total_outstanding, net_outstanding, tvp_owner_id)
SELECT 
  '2024-01-15',
  38,
  1900.00,
  1500.00,
  120.00,
  -30.00,
  'Refund for cancelled trip',
  280.00,
  0.00,
  0.00,
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

-- Insert sample support tickets for TVP Owner
INSERT INTO support_tickets (title, description, status, priority, category, tvp_owner_id)
SELECT 
  'Car Maintenance Request',
  'CAR-003 needs brake pad replacement',
  'open',
  'high',
  'maintenance',
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (title, description, status, priority, category, tvp_owner_id)
SELECT 
  'Payment Issue',
  'Weekly payment not received for last week',
  'in_progress',
  'medium',
  'payment',
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (title, description, status, priority, category, tvp_owner_id)
SELECT 
  'App Login Problem',
  'Cannot access the mobile app',
  'resolved',
  'low',
  'technical',
  u.id
FROM users u 
WHERE u.email = 'tvpowner@tawaaq.com'
ON CONFLICT DO NOTHING;

-- Show the results
SELECT 'Setup Complete! Sample data inserted.' as status;
SELECT 'Cars count:' as info, COUNT(*) as count FROM cars WHERE tvp_owner_id = (SELECT id FROM users WHERE email = 'tvpowner@tawaaq.com');
SELECT 'Transactions count:' as info, COUNT(*) as count FROM hissab_transactions WHERE tvp_owner_id = (SELECT id FROM users WHERE email = 'tvpowner@tawaaq.com');
SELECT 'Tickets count:' as info, COUNT(*) as count FROM support_tickets WHERE tvp_owner_id = (SELECT id FROM users WHERE email = 'tvpowner@tawaaq.com');
