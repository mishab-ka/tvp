-- Insert sample data for TVP Owner Dashboard
-- This script adds sample cars, hissab transactions, and support tickets for the TVP owner

-- First, get the TVP owner user ID
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
        RAISE EXCEPTION 'TVP owner user not found. Please run ADD_TVP_OWNER_ROLE.sql first.';
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
    RAISE NOTICE 'Inserted % cars, % transactions, and % support tickets', 3, 11, 6;

END $$;
