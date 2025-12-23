-- Quick SQL to insert/update a test order with ID "10000001"
-- Run this in Supabase SQL Editor if you want to test with your existing order ID format

-- Option 1: Insert if doesn't exist, update if exists
INSERT INTO orders (order_id, status, eta, carrier, tracking_number, last_update, issue_flag, notes) 
VALUES 
  ('10000001', 'SHIPPED', '2025-12-28', 'Yurtiçi Kargo', '123456789', NOW(), NULL, 'Out for delivery')
ON CONFLICT (order_id) 
DO UPDATE SET
  status = EXCLUDED.status,
  eta = EXCLUDED.eta,
  carrier = EXCLUDED.carrier,
  tracking_number = EXCLUDED.tracking_number,
  last_update = EXCLUDED.last_update,
  issue_flag = EXCLUDED.issue_flag,
  notes = EXCLUDED.notes;

-- Option 2: Just update existing order (if it already exists)
-- UPDATE orders 
-- SET 
--   status = 'SHIPPED',
--   eta = '2025-12-28',
--   carrier = 'Yurtiçi Kargo',
--   tracking_number = '123456789',
--   last_update = NOW(),
--   issue_flag = NULL,
--   notes = 'Out for delivery'
-- WHERE order_id = '10000001';

-- Verify the order exists and has correct data
SELECT order_id, status, eta, carrier, tracking_number, last_update
FROM orders
WHERE order_id = '10000001';

