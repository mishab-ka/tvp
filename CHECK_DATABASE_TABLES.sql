-- Check if database tables exist and have data
-- Run this to verify the database setup

-- Check if tables exist
SELECT 'Table Existence Check:' as test;
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name IN ('cars', 'hissab_transactions', 'support_tickets', 'users', 'user_roles')
AND table_schema = 'public';

-- Check if TVP Owner user exists
SELECT 'TVP Owner User Check:' as test;
SELECT 
  u.id,
  u.email,
  u.status,
  ur.role_name
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
WHERE u.email = 'tvpowner@tawaaq.com';

-- Check cars table data
SELECT 'Cars Table Data:' as test;
SELECT 
  COUNT(*) as total_cars,
  COUNT(CASE WHEN tvp_owner_id IS NOT NULL THEN 1 END) as cars_with_owner
FROM cars;

-- Check hissab_transactions table data
SELECT 'Hissab Transactions Data:' as test;
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN tvp_owner_id IS NOT NULL THEN 1 END) as transactions_with_owner
FROM hissab_transactions;

-- Check support_tickets table data
SELECT 'Support Tickets Data:' as test;
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN tvp_owner_id IS NOT NULL THEN 1 END) as tickets_with_owner
FROM support_tickets;

-- Show sample data for TVP Owner (if exists)
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

-- Show sample transactions for TVP Owner (if exists)
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
