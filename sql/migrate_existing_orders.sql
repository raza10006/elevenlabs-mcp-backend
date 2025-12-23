-- Migrate existing orders: Copy data from old columns to new columns
-- This will populate status, eta, carrier, etc. from existing order_status, estimated_delivery_date, delivery_partner, etc.

-- Update status from order_status
UPDATE orders
SET status = CASE
  WHEN order_status IS NULL THEN 'PROCESSING'
  WHEN UPPER(order_status) LIKE '%SHIPPED%' OR UPPER(order_status) LIKE '%SHIPPING%' THEN 'SHIPPED'
  WHEN UPPER(order_status) LIKE '%DELIVERED%' OR UPPER(order_status) LIKE '%DELIVERY%' THEN 'DELIVERED'
  WHEN UPPER(order_status) LIKE '%PROCESSING%' OR UPPER(order_status) LIKE '%PROCESS%' THEN 'PROCESSING'
  WHEN UPPER(order_status) LIKE '%CANCELED%' OR UPPER(order_status) LIKE '%CANCELLED%' THEN 'CANCELED'
  WHEN UPPER(order_status) LIKE '%RETURNED%' OR UPPER(order_status) LIKE '%RETURN%' THEN 'RETURNED'
  WHEN UPPER(order_status) LIKE '%HOLD%' THEN 'ON_HOLD'
  ELSE 'PROCESSING'
END
WHERE status IS NULL AND order_status IS NOT NULL;

-- Update eta from estimated_delivery_date
UPDATE orders
SET eta = estimated_delivery_date::DATE
WHERE eta IS NULL AND estimated_delivery_date IS NOT NULL;

-- Update carrier from delivery_partner
UPDATE orders
SET carrier = delivery_partner
WHERE carrier IS NULL AND delivery_partner IS NOT NULL;

-- Update issue_flag from issue_type
UPDATE orders
SET issue_flag = issue_type
WHERE issue_flag IS NULL AND issue_type IS NOT NULL;

-- Update last_update from order_date or created_at
UPDATE orders
SET last_update = COALESCE(order_date, created_at, NOW())
WHERE last_update IS NULL;

-- Set default status for orders that still don't have one
UPDATE orders
SET status = 'PROCESSING'
WHERE status IS NULL;

-- Verify the migration
SELECT 
  order_id,
  order_status as "Old Status",
  status as "New Status",
  estimated_delivery_date as "Old ETA",
  eta as "New ETA",
  delivery_partner as "Old Carrier",
  carrier as "New Carrier"
FROM orders
LIMIT 10;

