# Deepa Inventory - Agent Instructions

## Quick Commands

| Task | Command |
|------|---------|
| Full dev setup | `cp .env.example .env && docker compose up -d db && npm install && npm run migrate && npm run seed` |
| Run dev (API + Vite) | `npm run dev` |
| Run dev API only | `npm run dev:api` |
| Run dev web only | `npm run dev:web` |
| Run tests | `npm test` |
| Typecheck | `npm run typecheck` |
| Build production | `npm run build` |
| Run migrations | `npm run migrate` |
| Seed data | `npm run seed` |
| Start production | `npm run start` |
| Backup database | `npm run backup` |
| Restore database | `npm run restore backups/file.sql` |

## Architecture

- **Monorepo**: single package, ESM (`"type": "module"`)
- **Frontend**: React 18 + Vite, served from `dist/client` in production
- **Backend**: Express on `:3000`, proxied from Vite `:5173` in dev
- **Database**: PostgreSQL 16 via `pg` pool, migrations in `migrations/`
- **Domain logic**: pure TypeScript in `src/domain/` (tested with Vitest)
- **Shared schemas**: Zod schemas in `src/shared/schemas.ts` (client + server)

## Key Invariants (from DB constraints)

- Liquor stored in **ml**; packaged beverages in **bottle/tin/can/case/piece**
- `package_size` is metadata only — never used as stock quantity
- Liquor `bottle_size_ml` FK-constrained to `liquor_bottle_sizes` catalog (2000,1000,750,500,375,180,90,60)
- No inventory date before **2026-08-31** (`CHECK` constraint)
- `stock_movements` append-only; `audit_log` has triggers blocking UPDATE/DELETE
- **Mutations require `Idempotency-Key` header** (middleware in `src/server/middleware/idempotency.ts`)
- One physical count per product per day (unique constraint)
- CSV exports neutralise formula injection (`src/domain/csvSafe.ts`)

## Database Notes

- Run migrations before seed: `npm run migrate && npm run seed`
- Schema uses UUID PKs, `pgcrypto` extension
- `idempotency_keys` table auto-expires after 24h
- `audit_log` has hash-chaining trigger for tamper evidence

## API Routes (all under `/api`)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/login` | Rate limited (5 req/min), returns session cookie |
| POST | `/auth/logout` | Clears session |
| GET | `/auth/me` | Returns current user |
| POST | `/auth/change-password` | Requires current password, invalidates all sessions |
| GET | `/products` | List products (search via `?q=`) |
| POST | `/products` | Create product (admin/manager) |
| PATCH | `/products/:id` | Update product (admin/manager) |
| GET | `/inventory/:date` | Reconciliation data for date |
| POST | `/inventory/:date/counts` | Save physical count (idempotent) |
| POST | `/inventory/:date/movements` | Record movement (admin/manager, idempotent) |
| POST | `/inventory/:date/sync-opening` | Carry forward prior day (admin/manager) |
| GET | `/inventory/:date/movements` | Movement history |
| GET/POST/PATCH/DELETE | `/suppliers` | Supplier CRUD (admin/manager) |
| GET/POST/PATCH/DELETE | `/product-suppliers` | Product-Supplier pricing (admin/manager) |
| GET/POST/PATCH | `/purchase-orders` | PO lifecycle (draft→confirmed→partial→received→cancelled) |
| GET/POST | `/goods-receipts` | Receiving workflow (partial receipts) |
| GET | `/reports/dashboard` | KPIs (low stock, open days, etc.) |
| GET | `/reports/reconciliation.csv` | Daily reconciliation export |
| GET | `/reports/stock-movements[.csv]` | Movement history |
| GET | `/reports/spillage-adjustments[.csv]` | Spillage/adjustments |
| GET | `/reports/purchase-cost-history[.csv]` | Cost history |
| GET | `/reports/valuation[.csv]` | Inventory valuation (latest cost) |
| GET | `/reports/stock-health[.csv]` | Stock health status |
| GET | `/audit-log` | Paginated, filterable audit trail |
| GET/POST/PATCH/DELETE | `/users` | User management (admin only) |

**Idempotency**: Middleware stores response after first execution; replay returns cached response with `Idempotency-Replayed: true` header.

## Frontend Dev Proxy
Vite proxies `/api` to `http://localhost:3000` (configured in `vite.config.ts`)

## TypeScript Configs
- `tsconfig.json` - Shared config for client + domain + scripts (noEmit, strict)
- `tsconfig.server.json` - Server build config (outputs to `dist/`, moduleResolution: node)

## Testing
- Unit tests only: `src/domain/__tests__/*.test.ts` (Vitest, Node env)
- Run single test file: `npx vitest run src/domain/__tests__/inventory.test.ts`
- Run specific test: `npx vitest run -t "liquor: 9000+1500..."`
- No integration/E2E tests configured

## File Layout

```
src/
  client/       # React app (pages, components, api.ts, main.tsx)
  server/       # Express routes, middleware, db, auth, errors
    middleware/ # idempotency.ts
    routes/     # auth, products, inventory, reports, suppliers, purchaseOrders, goodsReceipts, users, auditLog
  domain/       # Pure business logic (inventory, units, liquor, catalog, csvSafe)
  shared/       # Zod schemas (shared client/server)
scripts/        # migrate.ts, seed.ts, backup.ts, restore.ts (run with tsx)
migrations/     # 001_init.sql, 002_audit.sql, 003_procurement.sql
public/         # Static assets (PWA manifest, service worker, icons)
docs/           # architecture.md, implementation-status.md
```

## Env Vars

| Var | Default | Notes |
|-----|---------|-------|
| `DATABASE_URL` | `postgresql://deepa:deepa@localhost:5432/deepa_inventory` | Required |
| `PORT` | `3000` | API port |
| `COOKIE_SECURE` | `false` | Set `true` for HTTPS in production |
| `SESSION_TTL_HOURS` | `12` | Session cookie lifetime |
| `SEED_ADMIN_EMAIL` | `admin@deepa.local` | Seed script |
| `SEED_ADMIN_PASSWORD` | `ChangeMe-Immediately-1` | **Change in production** |

## Common Gotchas

1. **Database required** for `dev:api`, `migrate`, `seed`, `start` - ensure PostgreSQL is running and `DATABASE_URL` is set
2. **Build order matters**: `tsc -p tsconfig.server.json` must run before `vite build` (see `build` script)
3. **express-async-errors** imported at top of `src/server/index.ts` - enables async error handling without try/catch in routes
4. **Cookie parsing** - `cookie-parser` middleware required for session cookie
5. **Production** - `npm run start` serves both API and static client from `dist/`
6. **Unit mismatch errors**: Server validates `stock_unit` matches product definition (400 if mismatched)
7. **Negative stock**: Blocked by default; `allow_negative_stock` flag on `inventory_days` opts in
8. **Session auth**: Cookie-based (`sid`), 12h TTL default; `requireRole('admin','manager')` guards mutations
9. **Two tsconfigs**: `tsconfig.json` (client + domain, noEmit) + `tsconfig.server.json` (server build to `dist/`)
10. **Idempotency**: All mutating endpoints require `Idempotency-Key` header; replayed requests return cached response
11. **Code splitting**: Vite `manualChunks` creates separate bundles for vendor, inventory pages, procurement pages, etc.
12. **PWA**: Service worker caches static assets; API requests always go to network

## Design System

- CSS Variables in `src/client/styles.css` for theming
- Mobile-first responsive with breakpoints at 480px, 768px
- Mobile navigation drawer (hamburger menu) for <768px
- Touch targets ≥44px
- WCAG 2.2 AA baseline compliance
- Focus indicators on all interactive elements

## PWA Features

- `public/manifest.json` - Installable, standalone mode
- `public/sw.js` - Service worker caches static assets, network-first for API
- Offline-capable for static content
- Install prompts on supported browsers