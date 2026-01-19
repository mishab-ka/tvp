-- Test TVP Owner User Setup
-- This script checks if the TVP Owner user exists and has correct permissions

-- Check if TVP Owner role exists
SELECT 'TVP Owner Role Check:' as test;
SELECT 
  role_name,
  display_name,
  permissions
FROM user_roles 
WHERE role_name = 'tvp_owner';

-- Check if TVP Owner user exists
SELECT 'TVP Owner User Check:' as test;
SELECT 
  u.id,
  u.email,
  u.status,
  ur.role_name,
  ur.display_name,
  ur.permissions,
  up.full_name,
  up.department
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'tvpowner@tawaaq.com';

-- Check if cars table exists and has data
SELECT 'Cars Table Check:' as test;
SELECT 
  COUNT(*) as total_cars,
  COUNT(CASE WHEN tvp_owner_id IS NOT NULL THEN 1 END) as cars_with_owner
FROM cars;

-- Check if hissab_transactions table exists and has data
SELECT 'Hissab Transactions Check:' as test;
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN tvp_owner_id IS NOT NULL THEN 1 END) as transactions_with_owner
FROM hissab_transactions;

-- Check if support_tickets table exists and has data
SELECT 'Support Tickets Check:' as test;
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN tvp_owner_id IS NOT NULL THEN 1 END) as tickets_with_owner
FROM support_tickets;

-- Show sample data for TVP Owner
SELECT 'Sample Cars for TVP Owner:' as test;
SELECT 
  car_number,
  fleet_name,
  deposit_amount,
  status
FROM cars c
JOIN users u ON c.tvp_owner_id = u.id
WHERE u.email = 'tvpowner@tawaaq.com'
LIMIT 5;

-- Show sample transactions for TVP Owner
SELECT 'Sample Transactions for TVP Owner:' as test;
SELECT 
  week_date,
  total_trips,
  total_earnings,
  cash_collect,
  total_outstanding
FROM hissab_transactions h
JOIN users u ON h.tvp_owner_id = u.id
WHERE u.email = 'tvpowner@tawaaq.com'
ORDER BY week_date DESC
LIMIT 5;
