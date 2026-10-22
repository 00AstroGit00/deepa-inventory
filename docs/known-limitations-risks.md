# Deepa Inventory - Known Limitations & Risks

**Version:** 1.0  
**Date:** 2026-10-21  
**Status:** Living document - update as issues are discovered/resolved

---

## Critical Risks (Must Resolve Before Production)

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| R-1 | **No physical Android device testing** | Touch targets, safe-area, virtual keyboard, scanner may not work as expected | High | Test on 3+ physical devices (small/medium/large) before go-live | **BLOCKED** |
| R-2 | **No physical printer verification** | Daily sheet may not print correctly (margins, orientation, column width) | High | Print test on actual A4 printer before go-live | **BLOCKED** |
| R-3 | **No hardware scanner integration test** | USB/Bluetooth scanner may not work as keyboard wedge | Medium | Test with actual scanner model | **BLOCKED** |
| R-4 | **No iOS/Safari testing** | PWA install, safe-area, keyboard behavior may differ | Medium | Test on iPhone/iPad if iOS users exist | **PARTIAL** |
| R-5 | **Offline sync not implemented** | Operators cannot enter counts offline; data loss risk if network fails | Medium | Disable unsafe ops offline; document limitation | **KNOWN** |
| R-6 | **TypeScript strict errors (100+)** | Code may have runtime type errors despite esbuild build passing | Medium | Fix TS errors incrementally; add CI check | **KNOWN** |

---

## High Priority Risks

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| R-7 | **No integration/E2E tests** | API contracts, auth flows, DB transactions not automatically verified | High | Add Playwright/Cypress tests for critical flows | **PLANNED** |
| R-8 | **Single-point-of-failure: single PostgreSQL** | DB outage = total system down | Medium | Plan read-replica + automated failover | **PLANNED** |
| R-9 | **No automated backup verification** | Backup may be corrupt; restore untested | High | Add restore test to CI/CD | **PLANNED** |
| R-10 | **Idempotency key collision risk** | Low probability but possible with random UUID | Low | Monitor `idempotency_keys` table size | **MONITORING** |
| R-11 | **Concurrent stock updates race condition** | `FOR UPDATE` lock prevents but not tested under load | Medium | Load test concurrent updates | **PLANNED** |
| R-12 | **No rate limiting on inventory APIs** | Abuse could cause performance issues | Low | Add rate limiting to inventory endpoints | **PLANNED** |
| R-13 | **Audit log growth unbounded** | Table grows forever; query performance degrades | Medium | Add partitioning/archiving policy | **PLANNED** |
| R-14 | **No data retention policy** | Compliance/legal risk | Medium | Define retention (e.g., 7 years) | **PLANNED** |

---

## Medium Priority Risks

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| R-15 | **PWA cache stale inventory** | SW caches static assets only; API always network-first | Low | Verified SW config | **VERIFIED** |
| R-16 | **Service worker update race** | User on old SW version may see stale UI | Low | `skipWaiting()` + `clients.claim()` implemented | **VERIFIED** |
| R-17 | **No conflict resolution for offline** | If offline writes added later, last-write-wins | Medium | Design conflict UI before offline writes enabled | **DEFERRED** |
| R-17 | **No multi-device session invalidation** | Password change doesn't revoke other sessions | Medium | Implement session invalidation on password change | **PLANNED** |
| R-18 | **No automated DB migration rollback** | Failed migration = manual fix | Low | Test rollback procedures | **PLANNED** |
| R-18 | **CSV injection protection only in `csvSafe.ts`** | Verify all exports use it | Low | Audit all CSV endpoints | **VERIFIED** |

---

## Data Quality Risks

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| DQ-1 | **Product master inaccuracies** | Wrong bottle sizes, units, categories | High | Operator review before go-live | **REQUIRED** |
| DQ-2 | **Historical opening stock gaps** | Missing prior-day data → carry-forward fails | Medium | Seed with real data; document gaps | **REQUIRED** |
| DQ-3 | **Duplicate product entries** | Same product entered twice | Medium | Unique constraints on SKU/barcode | **ENFORCED** |
| DQ-4 | **Incorrect reorder levels** | False low-stock alerts | Medium | Review with manager | **REQUIRED** |
| DQ-5 | **Package size ≠ stock unit confusion** | Operators may confuse pack size with stock count | High | UI shows both clearly; training | **UI DONE** |

---

## Operational Risks

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| OP-1 | **Operator error: wrong unit entered** | Stock corruption | High | Server validates unit matches product | **ENFORCED** |
| OP-2 | **Operator error: negative count** | Stock goes negative | High | Server rejects negative (unless allowed) | **ENFORCED** |
| OP-3 | **Operator error: duplicate receipt** | Double-counted stock | High | Idempotency key on receipt | **ENFORCED** |
| OP-4 | **Operator error: wrong date selected** | Movements on wrong day | Medium | Date picker defaults to today; visible | **UI DONE** |
| OP-5 | **Network failure during finalize** | Day left unfinalized | Medium | Idempotent finalize; retry safe | **ENFORCED** |
| OP-6 | **Scanner misread** | Wrong product counted | Medium | Operator confirms product name on screen | **TRAINING** |
| OP-7 | **Shift handover confusion** | Counts lost between shifts | Low | Draft auto-saves; visible to next shift | **DESIGNED** |

---

## Security Risks

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| SEC-1 | **Session hijacking** | Unauthorized access | Low | HttpOnly, Secure, SameSite=Lax cookies | **IMPLEMENTED** |
| SEC-2 | **CSRF** | Unauthorized mutations | Low | SameSite=Lax + idempotency keys | **IMPLEMENTED** |
| SEC-3 | **SQL injection** | Data breach/corruption | Low | Parameterized queries (pg) | **IMPLEMENTED** |
| SEC-4 | **XSS** | Script injection | Low | React auto-escapes; no dangerouslySetInnerHTML | **IMPLEMENTED** |
| SEC-5 | **Weak passwords** | Account takeover | Medium | bcrypt + min length enforced | **IMPLEMENTED** |
| SEC-6 | **Secrets in repo** | Credential leak | Low | `.env` gitignored; `.env.example` only | **VERIFIED** |
| SEC-7 | **Audit log tampering** | Cover tracks | Low | Hash-chained append-only trigger | **IMPLEMENTED** |
| SEC-8 | **No 2FA** | Credential theft → full access | Medium | Plan 2FA for admin/manager | **PLANNED** |

---

## Dependency Risks

| ID | Dependency | Risk | Mitigation |
|----|------------|------|------------|
| DEP-1 | React 18 / Vite 5 | Breaking changes on upgrade | Pin versions; test upgrades in staging |
| DEP-2 | PostgreSQL 16 | Version-specific features | Pin version; test upgrades |
| DEP-3 | `pg` driver | Connection pooling issues | Monitor pool size; use PgBouncer in prod |
| DEP-4 | `zod` validation | Breaking schema changes | Pin version; test upgrades |
| DEP-5 | `vitest` | Test runner changes | Pin version; CI pinned |

---

## Compliance & Legal Risks

| ID | Risk | Regulation | Mitigation |
|----|------|------------|------------|
| CL-1 | **GST/excise compliance** | Indian liquor laws | Tax treatment field; outside_gst_excise_vat default |
| CL-2 | **Data retention** | IT Act / business records | Define 7-year retention; implement purge |
| CL-3 | **Audit trail integrity** | Financial audit | Hash-chained audit log |
| CL-4 | **Employee data privacy** | PII in users table | Minimal fields; no sensitive data |

---

## Risk Register Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Technical | 1 | 3 | 5 | 3 | 12 |
| Data Quality | 1 | 2 | 2 | 0 | 5 |
| Operational | 0 | 3 | 2 | 2 | 7 |
| Security | 0 | 1 | 2 | 3 | 6 |
| Dependencies | 0 | 0 | 5 | 0 | 5 |
| Compliance | 0 | 0 | 2 | 2 | 4 |
| **Total** | **2** | **9** | **16** | **10** | **37** |

---

## Risk Acceptance

| Risk ID | Accepted By | Date | Justification | Review Date |
|---------|-------------|------|---------------|-------------|
| R-5 (Offline sync) | | | Core inventory requires server; offline only for reads | 2027-01-01 |
| R-7 (No E2E tests) | | | Unit tests cover domain logic; manual QA for flows | 2027-01-01 |
| R-15 (PWA cache) | | | Verified SW config; no API caching | 2027-01-01 |

---

## Risk Review Schedule

| Review | Date | Participants | Outcome |
|--------|------|--------------|---------|
| Pre-pilot | 2026-10-21 | Tech lead, Manager | |
| Post-pilot | | Tech lead, Manager, Owner | |
| Pre-production | | Tech lead, Manager, Owner | |
| Monthly (prod) | | Tech lead | |

---

*Last Updated: 2026-10-21 | Next Review: Post-pilot*