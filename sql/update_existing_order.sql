-- Step 3: Update order 10000001 with complete data
-- Run this AFTER you've added the missing columns

UPDATE orders 
SET 
  status = 'SHIPPED',
  eta = '2025-12-28',
  carrier = 'Yurtiçi Kargo',
  tracking_number = '123456789',
  last_update = NOW(),
  issue_flag = NULL,
  notes = 'Out for delivery'
WHERE order_id = '10000001';

-- If the order doesn't exist, insert it
INSERT INTO orders (order_id, status, eta, carrier, tracking_number, last_update, issue_flag, notes)
SELECT 
  '10000001', 
  'SHIPPED', 
  '2025-12-28', 
  'Yurtiçi Kargo', 
  '123456789', 
  NOW(), 
  NULL, 
  'Out for delivery'
WHERE NOT EXISTS (
  SELECT 1 FROM orders WHERE order_id = '10000001'
);

-- Verify the order
SELECT order_id, status, eta, carrier, tracking_number, last_update, issue_flag, notes
FROM orders
WHERE order_id = '10000001';

