# Deepa Bar & Restaurant — Inventory

## Quick start
    cp .env.example .env
    docker compose up -d db
    npm install
    npm run migrate
    npm run seed
    npm test
    npm run dev            # API :3000, Vite :5173

## Production
    npm run build
    NODE_ENV=production node dist/server/index.js

## Invariants
- Liquor stored in ml; packaged beverages in bottles/tins/cans.
- Package size is metadata, never stock quantity.
- Liquor bottle size is FK-constrained to the regulated catalog.
- No inventory date before 2026-08-31.
- Append-only stock_movements; audit_log blocks UPDATE/DELETE.
- Mutations require Idempotency-Key header.
- One physical count per product per day.
- CSV exports neutralise formula injection.

## Features ✅ Complete
- Full inventory management with ml/count units
- Daily inventory counts with spillage/adjustments
- Purchase orders & goods receipts
- Suppliers & product-supplier pricing
- Reports (valuation, stock health, movements, spillage, cost history)
- Audit log with tamper evidence
- User management with role-based access
- Modern responsive UI with design system
- PWA support
- CSV exports with formula injection protection

## Roadmap
- PDF exports
- Enhanced offline queue
- Automated backup scheduling
- Browser-based responsive & WCAG automated testing
