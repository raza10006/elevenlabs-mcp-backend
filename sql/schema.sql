-- Orders table schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'RETURNED', 'ON_HOLD')),
  eta DATE,
  carrier TEXT,
  tracking_number TEXT,
  last_update TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  issue_flag TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on order_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data (6 demo orders - includes both formats)
INSERT INTO orders (order_id, status, eta, carrier, tracking_number, last_update, issue_flag, notes) VALUES
  ('10000001', 'SHIPPED', '2025-12-28', 'Yurtiçi Kargo', '123456789', '2025-12-23T10:30:00Z', NULL, 'Out for delivery'),
  ('10000002', 'PROCESSING', '2025-12-30', NULL, NULL, '2025-12-23T08:15:00Z', NULL, 'Awaiting payment confirmation'),
  ('10000003', 'DELIVERED', '2025-12-20', 'Aras Kargo', '987654321', '2025-12-20T14:22:00Z', NULL, 'Delivered to customer'),
  ('10000004', 'ON_HOLD', NULL, NULL, NULL, '2025-12-22T16:45:00Z', 'address_problem', 'Customer address needs verification'),
  ('10000005', 'SHIPPED', '2025-12-29', 'MNG Kargo', '456789123', '2025-12-23T11:00:00Z', NULL, 'In transit to distribution center'),
  ('TR-10001', 'SHIPPED', '2025-12-28', 'Yurtiçi Kargo', '123456789', '2025-12-23T10:30:00Z', NULL, 'Out for delivery')
ON CONFLICT (order_id) DO NOTHING;

-- Optional: Create a view for easier querying
CREATE OR REPLACE VIEW orders_summary AS
SELECT
  order_id,
  status,
  eta,
  carrier,
  tracking_number,
  last_update,
  issue_flag,
  notes
FROM orders;

-- Grant permissions (adjust based on your RLS policies)
-- Since we're using service role key, RLS is bypassed, but you may want to set up RLS for production
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

