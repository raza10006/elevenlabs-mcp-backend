# Supabase Setup Guide

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `jznericynupuzgllbgct`
3. Or go directly to: https://supabase.com/dashboard/project/jznericynupuzgllbgct

### 2. Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"** button (top right)

### 3. Check Current Table Structure

First, let's see what your current table looks like. Run this query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

This will show you the current structure of your `orders` table.

### 4. Fix Table Structure (if needed)

If your table doesn't match the expected structure, run this to recreate it:

```sql
-- Drop existing table if it exists (WARNING: This deletes all data!)
DROP TABLE IF EXISTS orders CASCADE;

-- Create orders table with correct structure
CREATE TABLE orders (
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

-- Create indexes
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5. Insert Seed Data

After creating the table, insert the demo orders:

```sql
-- Insert seed data (5 demo orders)
INSERT INTO orders (order_id, status, eta, carrier, tracking_number, last_update, issue_flag, notes) VALUES
  ('TR-10001', 'SHIPPED', '2025-12-28', 'Yurtiçi Kargo', '123456789', '2025-12-23T10:30:00Z', NULL, 'Out for delivery'),
  ('TR-10002', 'PROCESSING', '2025-12-30', NULL, NULL, '2025-12-23T08:15:00Z', NULL, 'Awaiting payment confirmation'),
  ('TR-10003', 'DELIVERED', '2025-12-20', 'Aras Kargo', '987654321', '2025-12-20T14:22:00Z', NULL, 'Delivered to customer'),
  ('TR-10004', 'ON_HOLD', NULL, NULL, NULL, '2025-12-22T16:45:00Z', 'address_problem', 'Customer address needs verification'),
  ('TR-10005', 'SHIPPED', '2025-12-29', 'MNG Kargo', '456789123', '2025-12-23T11:00:00Z', NULL, 'In transit to distribution center')
ON CONFLICT (order_id) DO NOTHING;
```

### 6. Verify Data

Check that the data was inserted correctly:

```sql
SELECT order_id, status, eta, carrier, tracking_number, last_update
FROM orders
ORDER BY order_id;
```

You should see 5 rows with order IDs: TR-10001, TR-10002, TR-10003, TR-10004, TR-10005

### 7. Test Query

Test the exact query your backend uses:

```sql
SELECT *
FROM orders
WHERE order_id = 'TR-10001';
```

This should return one row with all the order details.

## Common Issues

### Issue: Column names are lowercase

If your table has lowercase column names (e.g., `order_id` vs `Order_ID`), you have two options:

**Option A: Update the table to use lowercase (recommended)**
```sql
-- Rename columns to lowercase
ALTER TABLE orders RENAME COLUMN "Order_ID" TO order_id;
ALTER TABLE orders RENAME COLUMN "Status" TO status;
-- etc.
```

**Option B: Update the code to use your column names**

### Issue: Table exists but structure is different

If your table already has data and you don't want to drop it, you can:

1. Check what columns exist (use the query in step 3)
2. Add missing columns:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eta DATE;
-- etc.
```

3. Update existing data to match the expected format

## Quick Copy-Paste SQL

If you want to run everything at once, here's the complete SQL from `sql/schema.sql`:

```sql
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

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO orders (order_id, status, eta, carrier, tracking_number, last_update, issue_flag, notes) VALUES
  ('TR-10001', 'SHIPPED', '2025-12-28', 'Yurtiçi Kargo', '123456789', '2025-12-23T10:30:00Z', NULL, 'Out for delivery'),
  ('TR-10002', 'PROCESSING', '2025-12-30', NULL, NULL, '2025-12-23T08:15:00Z', NULL, 'Awaiting payment confirmation'),
  ('TR-10003', 'DELIVERED', '2025-12-20', 'Aras Kargo', '987654321', '2025-12-20T14:22:00Z', NULL, 'Delivered to customer'),
  ('TR-10004', 'ON_HOLD', NULL, NULL, NULL, '2025-12-22T16:45:00Z', 'address_problem', 'Customer address needs verification'),
  ('TR-10005', 'SHIPPED', '2025-12-29', 'MNG Kargo', '456789123', '2025-12-23T11:00:00Z', NULL, 'In transit to distribution center')
ON CONFLICT (order_id) DO NOTHING;
```

## After Setup

Once you've set up the table and inserted data:

1. **Test with curl:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TRENDYOL_MCP_SECRET_9f83kls" \
  -d '{"jsonrpc":"2.0","id":"2","method":"tools/call","params":{"name":"lookup_order","arguments":{"order_id":"TR-10001"}}}'
```

2. **Check server logs** - You should see debug info about the order data structure

3. **If you still get "undefined"**, check the server logs for the debug output showing what fields are actually in your database.

