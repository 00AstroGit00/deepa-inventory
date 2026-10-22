CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('admin','manager','counter');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'counter',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_expiry ON sessions (expires_at);

CREATE TABLE liquor_bottle_sizes (ml INTEGER PRIMARY KEY);
INSERT INTO liquor_bottle_sizes (ml) VALUES (2000),(1000),(750),(500),(375),(180),(90),(60);

CREATE TYPE tax_treatment AS ENUM ('outside_gst_excise_vat','gst_5','gst_18','gst_28_cess');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL CHECK (category IN ('liquor','beer','soda','club_soda','water','other')),
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  stock_unit TEXT NOT NULL CHECK (stock_unit IN ('ml','bottle','tin','can','case','piece')),
  package_size_amount NUMERIC(12,3) CHECK (package_size_amount > 0),
  package_size_unit TEXT CHECK (package_size_unit IN ('ml','litre','bottle','tin','can')),
  bottle_size_ml INTEGER REFERENCES liquor_bottle_sizes(ml) ON UPDATE RESTRICT ON DELETE RESTRICT,
  tax_treatment tax_treatment NOT NULL DEFAULT 'outside_gst_excise_vat',
  reorder_level NUMERIC(18,4) CHECK (reorder_level >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT liquor_has_bottle_size CHECK ((category = 'liquor') = (bottle_size_ml IS NOT NULL)),
  CONSTRAINT liquor_is_ml CHECK (category <> 'liquor' OR stock_unit = 'ml'),
  CONSTRAINT liquor_tax_consistent CHECK (category NOT IN ('liquor','beer') OR tax_treatment = 'outside_gst_excise_vat')
);
CREATE INDEX idx_products_barcode ON products (barcode) WHERE is_active;

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE product_suppliers (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, supplier_id)
);

CREATE TABLE inventory_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_date DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','counting','reconciled','closed')),
  allow_negative_stock BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_pre_launch_dates CHECK (inventory_date >= DATE '2026-08-31')
);

CREATE TYPE movement_type AS ENUM ('opening','receipt','transfer_in','transfer_out','consumption','spillage','adjustment');

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_day_id UUID NOT NULL REFERENCES inventory_days(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type movement_type NOT NULL,
  amount NUMERIC(18,4) NOT NULL,
  unit TEXT NOT NULL,
  reference_id UUID,
  idempotency_key TEXT UNIQUE,
  reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_movements_day_product ON stock_movements (inventory_day_id, product_id);
CREATE INDEX idx_movements_product ON stock_movements (product_id);

CREATE TABLE physical_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_day_id UUID NOT NULL REFERENCES inventory_days(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  amount NUMERIC(18,4) NOT NULL CHECK (amount >= 0),
  unit TEXT NOT NULL,
  entered_by UUID NOT NULL REFERENCES users(id),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inventory_day_id, product_id)
);

CREATE TABLE stock_snapshots (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  snapshot_on DATE NOT NULL,
  on_hand NUMERIC(18,4) NOT NULL,
  PRIMARY KEY (product_id, snapshot_on)
);

CREATE TABLE negative_stock_flags (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  inventory_day_id UUID NOT NULL REFERENCES inventory_days(id),
  movement_ref UUID,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  response_status INTEGER NOT NULL DEFAULT 0,
  response_body JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);
CREATE INDEX idx_idem_expiry ON idempotency_keys (expires_at);
