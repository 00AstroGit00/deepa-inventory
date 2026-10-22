# Deepa Inventory - Business Sign-Off Checklist

**Version:** 1.0  
**Date:** 2026-10-21  
**Prepared For:** Deepa Bar & Restaurant, Cherpulassery, Palakkad, Kerala  
**Purpose:** Practical acceptance criteria for authorized business manager/owner review

---

## Instructions

This checklist is designed for business stakeholders (owner, manager) to validate the system without reading code. Each item should be tested in the staging environment (or production pilot) and marked accordingly.

**Status Codes:**
- **PASS** — Works as expected
- **FAIL** — Does not work / incorrect
- **NOT TESTED** — Not yet verified
- **N/A** — Not applicable to our operation

---

## 1. Inventory Accuracy

| # | Criterion | Test Method | Status | Comments |
|---|-----------|-------------|--------|----------|
| 1.1 | Opening balance traceable | Check a product: opening stock matches prior day closing | | |
| 1.2 | Stock receipts affect correct products | Receive stock, verify expected stock increases | | |
| 1.3 | Liquor arithmetic correct | Enter 12 bottles + 240ml loose for 750ml product → shows 9240ml | | |
| 1.4 | Count-based quantities correct | Enter 24 bottles beer → shows 24 bottles (not ml) | | |
| 1.5 | Expected closing reproducible | Manual calc = Opening + Receipts - Consumption = Expected | | |
| 1.6 | Physical count distinct from expected | Can enter different physical count; variance shows difference | | |
| 1.7 | Variance understandable | Negative = shortage, Positive = excess; clear labels | | |
| 1.6 | Total volume for liquor | Shows "12 btl 240 ml = 9,240 ml" format | | |

---

## 2. Daily Operation

| # | Criterion | Test Method | Status | Comments |
|---|-----------|-------------|--------|----------|
| 2.1 | Correct date selection | Date picker shows today; can select past dates | | |
| 2.2 | Fast product lookup | Search by name/barcode/SKU returns instant results | | |
| 2.3 | Clear save feedback | Toast "Count saved" + status indicator | | |
| 2.4 | Interrupted work resumable | Close app, reopen → counts still there | | |
| 2.5 | No unexplained data loss | Enter count, refresh page → count persists | | |
| 2.6 | Day-end report readable | Export CSV / Print → readable, matches screen | | |
| 2.7 | Date boundary correct | Movements on 23:59 go to correct day | | |

---

## 3. Control & Accountability

| # | Criterion | Test Method | Status | Comments |
|---|-----------|-------------|--------|----------|
| 3.1 | Staff access restricted | Counter cannot adjust; manager can | | |
| 3.2 | Sensitive changes require auth | Adjustment/finalize needs manager login | | |
| 3.3 | Corrections auditable | Check audit log: original + revised + reason + who + when | | |
| 3.4 | Duplicate ops don't duplicate stock | Tap "Save" twice → single movement | | |
| 3.5 | Historical records accessible | Can view any past date's stocktake | | |
| 3.6 | Backup/restore understood | Admin can backup → restore → data intact | | |
| 3.7 | Idempotent retries safe | Network timeout → retry → single transaction | | |

---

## 4. Device & Printing

| # | Criterion | Test Method | Status | Comments |
|---|-----------|-------------|--------|----------|
| 4.1 | Works at Android viewport sizes | Test 360dp, 390dp, 412dp widths | | |
| 4.2 | Touch controls usable | Buttons ≥ 44dp, no accidental taps | | |
| 4.3 | Virtual keyboard doesn't obscure | Focus input → save button visible | | |
| 4.4 | Desktop layout usable | 1920×1080, table + grid views | | |
| 4.5 | Printing checked | A4 landscape daily sheet prints clean | | |
| 4.6 | Export CSV checked | Opens in Excel, columns aligned | | |
| 4.4 | Unsupported behavior disclosed | Offline edits disabled with message | | |

---

## 5. Android-Specific (PWA)

| # | Criterion | Test Method | Status | Comments |
|---|-----------|-------------|--------|----------|
| 5.1 | Installable as PWA | Chrome → "Install App" → home screen icon | | |
| 5.2 | Standalone mode | Opens full-screen, no browser bar | | |
| 5.3 | Status bar not overlapping | Header below status bar | | |
| 5.4 | Bottom nav above nav bar | Safe-area padding works | | |
| 5.5 | Theme (dark/light) | Toggle works, persists | | |
| 5.6 | Offline banner | Shows when airplane mode on | | |
| 5.6 | Auto-retry online | Reconnect → syncs automatically | | |
| 5.7 | Hardware scanner | USB/Bluetooth scanner → types barcode | | |

---

## 6. Category-Specific Validation

### Liquor (ml-based)

| # | Check | Status | Comments |
|---|-------|--------|----------|
| L-1 | Bottle sizes restricted to regulated: 60,90,180,375,500,750,1000,2000ml | | |
| L-2 | Loose ml < bottle size enforced | | |
| L-3 | Full bottles + loose ml calculation correct | | |
| L-4 | Peg conversion (60ml/30ml) available | | |
| L-5 | Consumption reduces total ml correctly | | |

### Beer (count-based)

| # | Check | Status | Comments |
|---|-------|--------|----------|
| B-1 | Bottles and tins separate products | | |
| B-2 | Whole units only (no fractional) | | |
| B-3 | Package size metadata separate from stock | | |

### Soda / Club Soda / Water

| # | Check | Status | Comments |
|---|-------|--------|----------|
| S-1 | Count-based units (bottle/tin/can) | | |
| S-2 | Package size metadata shown | | |
| S-3 | Correct unit in all views | | |

---

## 7. Reporting & Export

| # | Report | Verified | Comments |
|---|--------|----------|----------|
| R-1 | Daily Reconciliation (screen + CSV) | | |
| R-2 | Stock Movements (date range filter) | | |
| R-3 | Spillage & Adjustments log | | |
| R-4 | Purchase Cost History | | |
| R-5 | Inventory Valuation (latest cost) | | |
| R-6 | Stock Health (low/critical/out-of-stock) | | |
| R-7 | Dashboard KPIs (open days, negative stock, counts) | | |

---

## 8. Data Integrity & Safety

| # | Check | Status | Comments |
|---|-------|--------|----------|
| D-1 | No fabricated stock in production DB | | |
| D-2 | No deleted records during testing | | |
| D-3 | Backup created before pilot | | |
| D-4 | Backup integrity verified (restore test) | | |
| D-5 | Opening stock not inferred from synthetic data | | |
| D-6 | Historical records preserved | | |

---

## 8. Operational Readiness

| # | Item | Status | Comments |
|---|------|--------|----------|
| O-1 | Product master reviewed by operator | | |
| O-2 | Packaging & stock units verified | | |
| O-3 | Category & conversion rules reviewed | | |
| O-4 | Opening stock source docs available | | |
| O-5 | Business date explicitly selectable | | |
| O-6 | Historical records preserved | | |
| O-7 | Unresolved quantities identified | | |
| O-7 | Import totals reconciled to approved source | | |
| O-8 | Authorized person can approve initial balances | | |

---

## Sign-Off

| Role | Name | Signature | Date | Approved |
|------|------|-----------|------|----------|
| **Owner / General Manager** | | | | ☐ Yes ☐ No |
| **Bar Manager** | | | | ☐ Yes ☐ No |
| **Inventory Counter** | | | | ☐ Yes ☐ No |

---

## Conditional Approval

If any item is **FAIL** or **NOT TESTED**, document below:

| Item # | Reason | Required Action | Target Date |
|--------|--------|-----------------|-------------|
| | | | |
| | | | |
| | | | |

---

## Final Declaration

> By signing below, I confirm that I have personally verified the items marked **PASS** in this checklist. Items marked **FAIL** or **NOT TESTED** are documented above with required corrective actions. I understand that this system manages real inventory assets and that accuracy, traceability, and accountability are paramount.

**Authorized Signatory:** _________________________  
**Title:** _________________________  
**Date:** _________________________  

---

## Notes for Reviewer

- This checklist covers **business-critical** acceptance criteria only.
- Technical implementation details (code, infrastructure) are covered in separate technical readiness review.
- "NOT TESTED" items must be addressed before production go-live.
- The system must not be declared production-ready solely on automated test results.
- Physical device testing (Android phone, printer, scanner) is required for items in sections 4, 5, 10.

---

*End of Business Sign-Off Checklist*