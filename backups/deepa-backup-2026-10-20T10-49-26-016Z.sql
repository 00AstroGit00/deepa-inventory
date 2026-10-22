-- Deepa Inventory Database Backup
-- Generated: 2026-10-20T10:49:26.046Z
-- Database: localhost:5432/deepa_inventory


-- Table: users
-- Columns: id, email, password_hash, role, is_active, created_at
INSERT INTO users (id, email, password_hash, role, is_active, created_at) VALUES ('8a5239ce-0644-487c-946e-46f441e61019', 'admin@deepa.local', '$2a$12$zhrBeFaOfr5Q39eZTlupre4jcnCIvJPy21WfjWSlsVq5Zlkvq8RBq', 'admin', true, '"2026-10-20T09:09:12.881Z"');


-- Table: sessions
-- Columns: id, user_id, token_hash, expires_at, created_at
INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES ('66148820-c69e-44a4-9ce6-95fcad06ee37', '8a5239ce-0644-487c-946e-46f441e61019', 'cc60925dc5d473ee4b0a387058134663e70d53023379660dcfad3737f99b6178', '"2026-10-20T21:13:08.341Z"', '"2026-10-20T09:13:08.341Z"');


-- Table: liquor_bottle_sizes
-- Columns: ml
INSERT INTO liquor_bottle_sizes (ml) VALUES (60);
INSERT INTO liquor_bottle_sizes (ml) VALUES (90);
INSERT INTO liquor_bottle_sizes (ml) VALUES (180);
INSERT INTO liquor_bottle_sizes (ml) VALUES (375);
INSERT INTO liquor_bottle_sizes (ml) VALUES (500);
INSERT INTO liquor_bottle_sizes (ml) VALUES (750);
INSERT INTO liquor_bottle_sizes (ml) VALUES (1000);
INSERT INTO liquor_bottle_sizes (ml) VALUES (2000);


-- Table: products
-- Columns: id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('16a44b6f-7945-42cd-93c3-79f2acb8150a', 'Kingfisher Draught 330ml Tin', 'Kingfisher', 'beer', NULL, NULL, 'tin', '330.000', 'ml', NULL, 'outside_gst_excise_vat', '24.0000', true, '"2026-10-20T09:09:12.892Z"', '"2026-10-20T09:09:12.892Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('3f0c08d3-cd8c-45a1-b6ba-7063ad80c543', 'Kingfisher Draught 330ml Tin', 'Kingfisher', 'beer', NULL, NULL, 'tin', '330.000', 'ml', NULL, 'outside_gst_excise_vat', '24.0000', true, '"2026-10-20T09:08:46.893Z"', '"2026-10-20T09:08:46.893Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('426383e3-1fa0-4632-a41b-723cbb6e01f8', 'Bisleri Mineral Water 1000ml', 'Bisleri', 'water', NULL, NULL, 'bottle', '1000.000', 'ml', NULL, 'gst_18', '24.0000', true, '"2026-10-20T09:08:46.897Z"', '"2026-10-20T09:08:46.897Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('5a0ee218-6d53-46a8-af0b-957b863fd904', 'Royal Challenge Whisky 750ml', 'Royal Challenge', 'liquor', NULL, NULL, 'ml', '750.000', 'ml', 750, 'outside_gst_excise_vat', '6.0000', true, '"2026-10-20T09:08:46.891Z"', '"2026-10-20T09:08:46.891Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('7bfc5ea5-58fd-400c-9151-19676e391ae6', 'Coca-Cola 300ml', 'Coca-Cola', 'soda', NULL, NULL, 'bottle', '300.000', 'ml', NULL, 'gst_28_cess', '12.0000', true, '"2026-10-20T09:09:12.893Z"', '"2026-10-20T09:09:12.893Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('84b159bc-13b7-4b33-ab70-1d079e7c8f0a', 'Royal Challenge Whisky 750ml', 'Royal Challenge', 'liquor', NULL, NULL, 'ml', '750.000', 'ml', 750, 'outside_gst_excise_vat', '6.0000', true, '"2026-10-20T09:09:12.889Z"', '"2026-10-20T09:09:12.889Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('8a253440-f808-4604-83a0-271989eb6569', 'Old Monk Rum 750ml', 'Old Monk', 'liquor', NULL, NULL, 'ml', '750.000', 'ml', 750, 'outside_gst_excise_vat', '4.0000', true, '"2026-10-20T09:08:46.892Z"', '"2026-10-20T09:08:46.892Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('9c042fa0-9a80-4b5b-84f2-a70207321f3f', 'McDowell No.1 Whisky 750ml', 'McDowell', 'liquor', NULL, NULL, 'ml', '750.000', 'ml', 750, 'outside_gst_excise_vat', '6.0000', true, '"2026-10-20T09:09:12.887Z"', '"2026-10-20T09:09:12.887Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('aa702fc3-a48c-4ed9-8001-cb0f67966d01', 'Old Monk Rum 750ml', 'Old Monk', 'liquor', NULL, NULL, 'ml', '750.000', 'ml', 750, 'outside_gst_excise_vat', '4.0000', true, '"2026-10-20T09:09:12.890Z"', '"2026-10-20T09:09:12.890Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('b0251a50-045b-47fa-b24d-4de9063c8cf5', 'McDowell No.1 Whisky 750ml', 'McDowell', 'liquor', NULL, NULL, 'ml', '750.000', 'ml', 750, 'outside_gst_excise_vat', '6.0000', true, '"2026-10-20T09:08:46.886Z"', '"2026-10-20T09:08:46.886Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('b94edd40-96a1-45fd-bd36-1820653adf4d', 'Coca-Cola 300ml', 'Coca-Cola', 'soda', NULL, NULL, 'bottle', '300.000', 'ml', NULL, 'gst_28_cess', '12.0000', true, '"2026-10-20T09:08:46.895Z"', '"2026-10-20T09:08:46.895Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('ce2c7c7e-7510-42d1-a2cc-fe6b00089ad5', 'Kingfisher Lager 650ml', 'Kingfisher', 'beer', NULL, NULL, 'bottle', '650.000', 'ml', NULL, 'outside_gst_excise_vat', '24.0000', true, '"2026-10-20T09:08:46.893Z"', '"2026-10-20T09:08:46.893Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('dc7659e4-5de0-4503-bc84-9aac43457535', 'Bisleri Mineral Water 1000ml', 'Bisleri', 'water', NULL, NULL, 'bottle', '1000.000', 'ml', NULL, 'gst_18', '24.0000', true, '"2026-10-20T09:09:12.895Z"', '"2026-10-20T09:09:12.895Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('ddb7beeb-88f0-44d3-9f4e-eec23fe0e9db', 'Club Soda 750ml', 'Generic', 'club_soda', NULL, NULL, 'bottle', '750.000', 'ml', NULL, 'gst_18', '12.0000', true, '"2026-10-20T09:09:12.894Z"', '"2026-10-20T09:09:12.894Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('e1ce98ad-b6b8-4c7a-a33c-986ecbdfe6d5', 'Club Soda 750ml', 'Generic', 'club_soda', NULL, NULL, 'bottle', '750.000', 'ml', NULL, 'gst_18', '12.0000', true, '"2026-10-20T09:08:46.896Z"', '"2026-10-20T09:08:46.896Z"');
INSERT INTO products (id, name, brand, category, sku, barcode, stock_unit, package_size_amount, package_size_unit, bottle_size_ml, tax_treatment, reorder_level, is_active, created_at, updated_at) VALUES ('fe604533-0cd2-45ca-8dfa-feb07abc6308', 'Kingfisher Lager 650ml', 'Kingfisher', 'beer', NULL, NULL, 'bottle', '650.000', 'ml', NULL, 'outside_gst_excise_vat', '24.0000', true, '"2026-10-20T09:09:12.891Z"', '"2026-10-20T09:09:12.891Z"');


-- Table: suppliers
-- Columns: id, name, contact_info, is_active, address, phone, email, gstin, payment_terms, created_at, updated_at


-- Table: product_suppliers
-- Columns: product_id, supplier_id, supplier_sku, purchase_price, price_unit, min_order_qty, lead_time_days, is_preferred, effective_from, effective_to


-- Table: inventory_days
-- Columns: id, inventory_date, status, allow_negative_stock, created_at
INSERT INTO inventory_days (id, inventory_date, status, allow_negative_stock, created_at) VALUES ('12ea2eee-a0ed-4004-9872-b68fad3e8e5b', '"2026-10-19T18:30:00.000Z"', 'open', false, '"2026-10-20T09:13:41.009Z"');


-- Table: stock_movements
-- Columns: id, inventory_day_id, product_id, movement_type, amount, unit, reference_id, idempotency_key, reason, created_by, created_at


-- Table: physical_counts
-- Columns: id, inventory_day_id, product_id, amount, unit, entered_by, entered_at


-- Table: stock_snapshots
-- Columns: product_id, snapshot_on, on_hand


-- Table: negative_stock_flags
-- Columns: id, product_id, inventory_day_id, movement_ref, flagged_at, resolved


-- Table: idempotency_keys
-- Columns: key, fingerprint, response_status, response_body, created_at, expires_at
INSERT INTO idempotency_keys (key, fingerprint, response_status, response_body, created_at, expires_at) VALUES ('99835569-73f1-4208-b097-3ae6041d12ae', '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a', 200, '{"reason":"no_prior_day","applied":0,"skipped":0}', '"2026-10-20T09:13:40.999Z"', '"2026-10-21T09:13:40.999Z"');


-- Table: audit_log
-- Columns: id, actor_id, occurred_at, entity_type, entity_id, operation, previous_state, new_state, reason, operation_id, prev_hash, row_hash


-- Table: purchase_orders
-- Columns: id, po_number, supplier_id, status, order_date, expected_date, notes, created_by, created_at, updated_at


-- Table: purchase_order_lines
-- Columns: id, po_id, product_id, ordered_qty, received_qty, unit, unit_price, tax_treatment, line_total


-- Table: goods_receipts
-- Columns: id, grn_number, po_id, supplier_id, receipt_date, invoice_number, invoice_date, notes, created_by, created_at


-- Table: goods_receipt_lines
-- Columns: id, gr_id, po_line_id, product_id, received_qty, unit, unit_price, batch_number, expiry_date, quality_check, notes


-- Table: schema_migrations
-- Columns: version, applied_at
INSERT INTO schema_migrations (version, applied_at) VALUES ('001_init', '"2026-10-20T09:08:37.852Z"');
INSERT INTO schema_migrations (version, applied_at) VALUES ('002_audit', '"2026-10-20T09:08:37.907Z"');
INSERT INTO schema_migrations (version, applied_at) VALUES ('003_procurement', '"2026-10-20T10:48:43.730Z"');

