-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  payment_terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product-Supplier association with pricing
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

-- Purchase order status enum
CREATE TYPE po_status AS ENUM ('draft', 'confirmed', 'partial', 'received', 'cancelled');

-- Purchase orders
CREATE TABLE purchase_orders (
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

-- Purchase order lines
CREATE TABLE purchase_order_lines (
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

-- Goods receipts
CREATE TABLE goods_receipts (
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

-- Goods receipt lines
CREATE TABLE goods_receipt_lines (
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

-- Indexes
CREATE INDEX idx_suppliers_active ON suppliers (is_active);
CREATE INDEX idx_product_suppliers_product ON product_suppliers (product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers (supplier_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders (supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders (order_date);
CREATE INDEX idx_po_lines_po ON purchase_order_lines (po_id);
CREATE INDEX idx_goods_receipts_po ON goods_receipts (po_id);
CREATE INDEX idx_goods_receipts_date ON goods_receipts (receipt_date);
CREATE INDEX idx_gr_lines_gr ON goods_receipt_lines (gr_id);
CREATE INDEX idx_gr_lines_product ON goods_receipt_lines (product_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_purchase_orders_updated BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();