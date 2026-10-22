# Deepa Inventory - Architecture Documentation

## Overview
Full-stack TypeScript inventory management system for Deepa Bar & Restaurant.
Built with React, Express, PostgreSQL, and Vite.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router DOM 6
- **State Management**: React hooks (useState, useEffect, useContext)
- **Styling**: Custom CSS with CSS Variables (design system)
- **HTTP Client**: Fetch API with credentials
- **Testing**: Vitest (unit tests)

### Backend
- **Runtime**: Node.js (ESM)
- **Framework**: Express 4
- **Database**: PostgreSQL 16 with `pg` driver
- **Authentication**: Cookie-based sessions with bcrypt
- **Validation**: Zod schemas (shared with frontend)
- **Middleware**: 
  - `express-async-errors` for async error handling
  - `cookie-parser` for session cookies
  - Custom idempotency middleware
  - Role-based authorization

### Database
- **PostgreSQL 16** with UUID primary keys
- **Extensions**: `pgcrypto` for UUID generation
- **Migrations**: Sequential SQL files in `migrations/`
- **Audit Trail**: Hash-chained append-only `audit_log` table
- **Idempotency**: `idempotency_keys` table with 24h TTL

### DevOps
- **Package Manager**: npm
- **TypeScript**: Strict mode, two configs (client + server)
- **Linting**: TypeScript compiler checks
- **Testing**: Vitest with Node environment
- **PWA**: Service worker, manifest, offline-capable
- **Code Splitting**: Vite manualChunks for optimal bundle sizes

## Project Structure

```
deepa-inventory/
├── src/
│   ├── client/                 # React frontend
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── api.ts              # API client
│   │   ├── App.tsx             # Root component
│   │   ├── main.tsx            # Entry point
│   │   └── styles.css          # Design system
│   ├── server/                 # Express backend
│   │   ├── routes/             # API route handlers
│   │   ├── middleware/         # Custom middleware
│   │   ├── index.ts            # Server entry
│   │   ├── db.ts               # Database pool + transactions
│   │   ├── auth.ts             # Auth + sessions
│   │   └── errors.ts           # Error handling
│   ├── shared/                 # Shared code
│   │   └── schemas.ts          # Zod validation schemas
│   ├── domain/                 # Pure business logic
│   │   ├── units.ts            # Unit types + conversions
│   │   ├── liquor.ts           # Liquor volume calculations
│   │   ├── inventory.ts        # Inventory math (opening/closing/variance)
│   │   ├── catalog.ts          # Regulated bottle sizes + pegs
│   │   └── csvSafe.ts          # CSV formula injection prevention
│   ├── types/                  # TypeScript declarations
│   └── scripts/                # CLI scripts
├── migrations/                 # SQL migrations
├── public/                     # Static assets (PWA)
├── docs/                       # Documentation
├── dist/                       # Build output
├── package.json
├── tsconfig.json               # Client/shared TypeScript config
├── tsconfig.server.json        # Server TypeScript config
├── vite.config.ts              # Vite config with manualChunks
└── AGENTS.md                   # Agent instructions
```

## Key Architectural Decisions

### 1. Domain-Driven Design
Business logic isolated in `src/domain/`:
- Pure TypeScript functions (no side effects)
- Unit tested with Vitest
- Shared between client and server via `src/shared/`
- Single source of truth for inventory calculations

### 2. Shared Validation Schemas
Zod schemas in `src/shared/schemas.ts` used by both:
- Frontend for form validation
- Backend for request validation
- Prevents drift between client/server validation

### 3. Idempotency for Mutations
All mutating endpoints require `Idempotency-Key` header:
- Prevents duplicate submissions
- Stores response for replay
- Returns `Idempotency-Replayed: true` header on replay

### 4. Audit Trail
Every material change logged to `audit_log`:
- Actor, timestamp, entity, operation
- Previous and new state (JSON)
- Hash-chained for tamper evidence
- Immutable (triggers block UPDATE/DELETE)

### 5. Two TypeScript Configs
- `tsconfig.json`: Client + domain + scripts (noEmit, bundler resolution)
- `tsconfig.server.json`: Server build (emit to `dist/`, Node resolution)

### 6. Responsive Design System
- CSS Variables for theming
- Fluid layouts with CSS Grid/Flexbox
- Mobile-first breakpoints
- Touch targets ≥44px
- WCAG 2.2 AA baseline

### 7. Code Splitting
Vite `manualChunks` for optimal loading:
- `vendor-react`: React, React DOM, Router
- `vendor-other`: Other node_modules
- `pages-inventory`: Daily Inventory, Reconciliation, Reports, Audit Log
- `pages-procurement`: Suppliers, POs, Goods Receipts
- `pages-products`: Products page
- `pages-dashboard`: Dashboard

## API Design

### Authentication
- `POST /api/auth/login` - Rate limited (5/min), returns session cookie
- `POST /api/auth/logout` - Clears session
- `GET /api/auth/me` - Returns current user
- `POST /api/auth/change-password` - Requires current password

### Products
- `GET /api/products?q=` - Search with autocomplete
- `POST /api/products` - Create (admin/manager)
- `PATCH /api/products/:id` - Update (admin/manager)
- Soft delete via `is_active` flag

### Inventory
- `GET /api/inventory/:date` - Reconciliation data for date
- `POST /api/inventory/:date/counts` - Save physical count (idempotent)
- `POST /api/inventory/:date/movements` - Record movement (admin/manager, idempotent)
- `POST /api/inventory/:date/sync-opening` - Carry forward prior day (admin/manager)
- `GET /api/inventory/:date/movements` - Movement history

### Suppliers & Procurement
- `GET/POST/PATCH/DELETE /api/suppliers` - Supplier CRUD
- `GET/POST/PATCH/DELETE /api/product-suppliers` - Product-Supplier pricing
- `GET/POST/PATCH /api/purchase-orders` - Purchase order lifecycle
- `GET/POST /api/goods-receipts` - Receiving workflow

### Reports
- `GET /api/reports/dashboard` - KPIs (low stock, open days, etc.)
- `GET /api/reports/reconciliation.csv` - Daily reconciliation export
- `GET /api/reports/stock-movements[.csv]` - Movement history
- `GET /api/reports/spillage-adjustments[.csv]` - Spillage/adjustments
- `GET /api/reports/purchase-cost-history[.csv]` - Cost history
- `GET /api/reports/valuation[.csv]` - Inventory valuation
- `GET /api/reports/stock-health[.csv]` - Stock health status

### Audit
- `GET /api/audit-log` - Paginated, filterable audit trail

### Users (Admin only)
- `GET/POST/PATCH/DELETE /api/users` - User management

## Database Schema Highlights

### Core Tables
- `users` - Authentication + roles (admin/manager/counter)
- `sessions` - Session tokens with TTL
- `products` - Master catalog with units, categories, pricing
- `inventory_days` - Daily inventory periods
- `stock_movements` - All stock changes (append-only)
- `physical_counts` - Daily physical counts (1 per product/day)
- `audit_log` - Immutable change history

### Procurement Tables
- `suppliers` - Vendor master
- `product_suppliers` - Pricing per supplier with effective dates
- `purchase_orders` - PO lifecycle (draft→confirmed→partial→received→cancelled)
- `purchase_order_lines` - PO line items
- `goods_receipts` - Receiving events
- `goods_receipt_lines` - Received quantities per line

### Constraints & Triggers
- Enum types for categories, units, movement types
- CHECK constraints (no negative stock unless allowed, valid dates)
- FK constraints with RESTRICT to preserve history
- Audit triggers (hash-chaining, immutability)

## Security

### Authentication
- bcrypt (12 rounds) for password hashing
- Secure, HttpOnly, SameSite=Lax session cookies
- 12-hour default session TTL (configurable)

### Authorization
- Role-based: admin > manager > counter
- Middleware protects sensitive endpoints
- Users cannot deactivate themselves or change own admin role

### Input Validation
- Zod schemas on all endpoints
- SQL parameterization (no string interpolation)
- CSV formula injection prevention

### Idempotency
- Required on all mutations
- 24-hour key expiry
- Fingerprint validation prevents replay with different payload

## Deployment

### Build
```bash
npm run build
# Runs: tsc -p tsconfig.server.json && vite build
# Output: dist/server/ (Node) + dist/client/ (static assets)
```

### Production Start
```bash
npm run start
# Runs: node dist/server/index.js
# Serves API + static client from dist/client
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | required | PostgreSQL connection string |
| `PORT` | 3000 | API port |
| `COOKIE_SECURE` | false | Set true for HTTPS |
| `SESSION_TTL_HOURS` | 12 | Session cookie lifetime |
| `SEED_ADMIN_EMAIL` | admin@deepa.local | Seed script |
| `SEED_ADMIN_PASSWORD` | ChangeMe-Immediately-1 | **Change in production** |

### Database Setup
```bash
npm run migrate  # Apply migrations
npm run seed     # Create admin + sample products
```

### Backup/Restore
```bash
npm run backup   # Creates timestamped SQL dump in backups/
npm run restore backups/deepa-backup-2024-01-15.sql  # Restore from file
```

## Testing

```bash
npm run test        # Unit tests (Vitest)
npm run typecheck   # TypeScript compile check
npm run build       # Full production build verification
```

## Future Enhancements

1. **Reorder Recommendations** - Consumption-based forecasting
2. **Excel/PDF Exports** - SheetJS + pdf-lib integration
3. **Integration Tests** - Supertest for API routes
4. **E2E Tests** - Playwright for critical flows
5. **Real-time Updates** - WebSocket for live inventory sync
6. **Multi-location Support** - Warehouse/bar stock separation
7. **Purchase Cost Averaging** - Weighted average cost method
8. **Mobile App** - Capacitor wrapper for native builds