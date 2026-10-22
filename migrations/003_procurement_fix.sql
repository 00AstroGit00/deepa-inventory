-- Migration fix: Apply 003_procurement changes on top of existing 001_init schema
-- This script alters existing tables and creates new ones

-- 1. Add missing columns to suppliers table
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS gstin TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Create trigger for suppliers updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suppliers_updated ON suppliers;
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Recreate product_suppliers table with correct schema
-- First, drop the foreign key constraints that reference it
ALTER TABLE product_suppliers DROP CONSTRAINT IF EXISTS product_suppliers_product_id_fkey;
ALTER TABLE product_suppliers DROP CONSTRAINT IF EXISTS product_suppliers_supplier_id_fkey;

-- Drop the old table and recreate with correct schema
DROP TABLE IF EXISTS product_suppliers CASCADE;

CREATE TABLE product_suppliers (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_sku TEXT,
  purchase_price NUMERIC(14,4) NOT NULL CHECK (purchase_price >= 0),
  price_unit TEXT NOT NULL,
  min_order_qty NUMERIC(14,4) DEFAULT 1,
  lead_time_days INT DEFAULT 0,
  is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  PRIMARY KEY (product_id, supplier_id, effective_from)
);

-- 4. Create indexes for product_suppliers
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product ON product_suppliers (product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON product_suppliers (supplier_id);

-- 5. Create purchase order status enum
DO $$ BEGIN
  CREATE TYPE po_status AS ENUM ('draft', 'confirmed', 'partial', 'received', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status po_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create purchase_order_lines table
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  ordered_qty NUMERIC(14,4) NOT NULL CHECK (ordered_qty > 0),
  received_qty NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(14,4) NOT NULL CHECK (unit_price >= 0),
  tax_treatment TEXT NOT NULL,
  line_total NUMERIC(16,4) GENERATED ALWAYS AS (ordered_qty * unit_price) STORED
);

-- 8. Create goods_receipts table
CREATE TABLE IF NOT EXISTS goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number TEXT NOT NULL UNIQUE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  invoice_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create goods_receipt_lines table
CREATE TABLE IF NOT EXISTS goods_receipt_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_line_id UUID NOT NULL REFERENCES purchase_order_lines(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  received_qty NUMERIC(14,4) NOT NULL CHECK (received_qty > 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(14,4) NOT NULL CHECK (unit_price >= 0),
  batch_number TEXT,
  expiry_date DATE,
  quality_check BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT
);

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers (is_active);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product ON product_suppliers (product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON product_suppliers (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders (order_date);
CREATE INDEX IF NOT EXISTS idx_po_lines_po ON purchase_order_lines (po_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po ON goods_receipts (po_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_date ON goods_receipts (receipt_date);
CREATE INDEX IF NOT EXISTS idx_gr_lines_gr ON goods_receipt_lines (gr_id);
CREATE INDEX IF NOT EXISTS idx_gr_lines_product ON goods_receipt_lines (product_id);

-- 11. Triggers for updated_at
DROP TRIGGER IF EXISTS trg_purchase_orders_updated ON purchase_orders;
CREATE TRIGGER trg_purchase_orders_updated BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();