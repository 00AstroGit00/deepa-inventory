# Deepa Inventory - Operator Pilot Checklist

**Version:** 1.0  
**Date:** 2026-10-21  
**Target:** Deepa Bar & Restaurant, Cherpulassery, Palakkad, Kerala  
**Purpose:** Validate real-world usability before operational go-live

---

## Pilot Scope

- **Environment:** Staging (or production with test data isolation)
- **Duration:** 3-5 business days
- **Participants:** 1 manager, 1-2 counters, 1 owner/approver
- **Test Data:** Real product master (copied from production, anonymized if needed)

---

## Prerequisites

- [ ] Staging environment deployed and accessible
- [ ] PostgreSQL database with seed data (or copy of production)
- [ ] Admin user created: `admin@deepa.local` / `ChangeMe-Immediately-1`
- [ ] Manager user created for daily operations
- [ ] Counter user created for stock entry
- [ ] Product master reviewed: categories, units, bottle sizes, reorder levels
- [ ] PWA installed on test Android device (Chrome → Install)
- [ ] Physical barcode scanner paired (if available)
- [ ] Backup of staging database taken before pilot

---

## Scenario 1: Start-of-Day Stock Review

**Role:** Manager/Counter  
**Duration:** 10-15 minutes  
**Frequency:** Daily at shift start

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1.1 | Open app on Android (PWA) | Loads to Daily Inventory for today | | |
| 1.2 | Verify date selector shows today | Date = today, not future/past | | |
| 1.3 | Tap "Sync Opening" | Toast: "X applied, Y skipped" | | |
| 1.4 | Check products with opening > 0 | Opening column populated | | |
| 1.5 | Identify products needing count | Low stock / zero opening flagged | | |
| 1.6 | Verify prior day finalized | Status = "closed" or "reconciled" | | |
| 1.7 | Note any unresolved prior variances | List products with unresolved variance | | |

**Pass Criteria:** All steps complete without errors; operator can identify what needs counting.

---

## Scenario 2: Receiving Stock (Goods Receipt)

**Role:** Manager  
**Duration:** 5-10 minutes per PO  
**Frequency:** As deliveries arrive

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 2.1 | Navigate to Purchase Orders | List shows confirmed POs | | |
| 2.2 | Select PO to receive | PO details + lines visible | | |
| 2.3 | Tap "Create Receipt" | Receipt form opens with PO lines | | |
| 2.4 | Verify received qty per line | Default = ordered - received | | |
| 2.5 | Edit received qty if partial | Accepts qty ≤ ordered - received | | |
| 2.6 | Enter batch number (if applicable) | Free text field | | |
| 2.7 | Enter expiry date (if applicable) | Date picker | | |
| 2.8 | Quality check toggle | Default ON | | |
| 2.9 | Save receipt | Toast "Saved", GRN created | | |
| 2.10 | Verify expected stock updated | Daily Inventory shows +receipt | | |

**Pass Criteria:** Receipt saved, stock updated, GRN number generated, audit trail complete.

---

## Scenario 3: Physical Stocktake (Core Workflow)

**Role:** Counter  
**Duration:** 30-60 minutes (full bar)  
**Frequency:** Daily at shift end

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 3.1 | Open Daily Inventory | Product grid loads | | |
| 3.2 | Search by name "Kingfisher" | Filters to Kingfisher | | |
| 3.3 | Scan barcode (if scanner) | Product auto-selected | | |
| 3.4 | Enter physical count | Numeric keyboard opens | | |
| 3.5 | Liquor: enter full bottles + loose ml | UI shows "X btl Y ml = Z ml" | | |
| 3.6 | Beer: enter whole units | Integer input only | | |
| 3.7 | Verify variance calculation | Physical - Expected shown | | |
| 3.8 | Save count | Toast "Count saved" | | |
| 3.9 | Status indicator changes | Pending → Saved | | |
| 3.8 | Correct entry error | Re-enter, overwrites | | |
| 3.9 | Resume after interruption | App reopen, counts retained | | |
| 3.10 | Complete all products | Zero "No count" items | | |

**Pass Criteria:** All counts saved, variances correct, no data loss on interruption.

---

## Scenario 4: Variance Investigation & Adjustment

**Role:** Manager  
**Duration:** 10-20 minutes  
**Frequency:** When variance ≠ 0

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 4.1 | Filter "Low Stock" / "Variance" | Shows only discrepant products | | |
| 4.2 | Tap product with variance | Movement history dialog opens | | |
| 4.3 | Review movements (receipts, spills, adjustments) | All movements listed chronologically | | |
| 4.4 | Decide: Spillage vs Adjustment | Choose correct type | | |
| 4.5 | Record spillage | Amount + reason (e.g., "broken bottle") | | |
| 4.6 | Record adjustment | Amount (+/-) + reason (e.g., "recount") | | |
| 4.7 | Save movement | Toast "Saved", variance updated | | |
| 4.8 | Verify variance recalculated | New variance = Physical - Expected | | |
| 4.9 | Audit trail check | Both movements in audit log | | |

**Pass Criteria:** Adjustment recorded, variance resolved, full audit trail.

---

## Scenario 5: Day-End Finalization

**Role:** Manager (with owner approval)  
**Duration:** 10-15 minutes  
**Frequency:** Daily at close

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 5.1 | Verify all products counted | No "No count" items | | |
| 5.2 | Review variance list | All variances explained | | |
| 5.3 | Print/export daily sheet | CSV download works | | |
| 5.4 | Print daily sheet (if printer) | A4 landscape, readable | | |
| 5.5 | Finalize day | Status → "reconciled"/"closed" | | |
| 5.6 | Verify next day opening | Next day shows carry-forward | | |
| 5.7 | Verify prior day immutable | Cannot edit finalized day | | |
| 5.8 | Export CSV for records | File downloads correctly | | |

**Pass Criteria:** Day finalized, next day opening correct, reports generated.

---

## Scenario 6: Product Lookup & Search

**Role:** Counter/Manager  
**Duration:** 2-5 minutes per lookup  
**Frequency:** Throughout day

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 6.1 | Search by product name | Results as you type | | |
| 6.2 | Search by barcode (scan) | Instant match | | |
| 6.3 | Search by SKU | Exact match | | |
| 6.4 | Category filter: "liquor" | Only liquor products | | |
| 6.5 | Category filter: "beer" | Only beer products | | |
| 6.5 | Clear filters | All products restored | | |
| 6.6 | Sort by name / stock | Stable sort | | |
| 6.7 | Pagination (50+ products) | Smooth scrolling | | |

---

## Scenario 7: User Permissions

**Role:** Admin (testing)  
**Duration:** 15 minutes

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 7.1 | Login as counter | Can view, count, cannot adjust | | |
| 7.2 | Login as manager | Can adjust, finalize, cannot manage users | | |
| 7.3 | Login as admin | Can manage users, products, all actions | | |
| 7.4 | Direct API call without auth | 401 Unauthorized | | |
| 7.5 | Session expiry (12h) | Auto-logout, redirect login | | |

---

## Scenario 8: Android-Specific Usability

**Device:** Physical Android phone (test multiple: small, medium, large)  
**Duration:** Throughout pilot

| Check | Detail | Pass/Fail | Notes |
|-------|--------|-----------|-------|
| 8.1 | Status bar not overlapping header | Top app bar below status bar | |
| 8.2 | Bottom nav not covered by nav bar | Safe-area padding applied | |
| 8.3 | Touch targets ≥ 44dp | Buttons, chips, inputs | |
| 8.4 | Virtual keyboard | Doesn't cover input/save button | |
| 8.5 | Landscape mode | Bottom nav adapts | |
| 8.5 | Notch/cutout | Content not clipped | |
| 8.6 | PWA install prompt | Appears in Chrome | |
| 8.7 | PWA standalone mode | No browser chrome | |
| 8.8 | Offline banner | Shows when offline | |
| 8.9 | Pull-to-refresh | Not implemented (OK) | |
| 8.10 | Swipe gestures | No conflict with back nav | |
| 8.11 | Hardware scanner | Keyboard wedge works | |

---

## Scenario 9: Offline & Interruption

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 9.1 | Disconnect WiFi | Offline banner appears | | |
| 9.2 | View cached inventory | Shows last loaded data | | |
| 9.3 | Attempt to save count | Disabled with message | | |
| 9.4 | Reconnect WiFi | Banner disappears, auto-sync | | |
| 9.5 | Refresh page | Data reloads | | |
| 9.6 | Browser close/reopen | Session persists (12h) | | |

---

## Scenario 10: Printing & Export

**Equipment:** A4 printer (landscape)  
**Duration:** 5 minutes

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 10.1 | Daily Inventory → Print | Print dialog opens | | |
| 10.2 | Select Landscape A4 | All columns fit | | |
| 10.3 | Print preview | Headers repeat, no clipping | | |
| 10.4 | Print to PDF | PDF generated | | |
| 10.5 | Export CSV | Downloads `reconciliation.csv` | | |
| 10.6 | CSV opens in Excel | Columns aligned, UTF-8 | | |

---

## Scenario 11: Backup & Recovery (Admin Only)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 11.1 | Run `npm run backup` | SQL file in `backups/` | | |
| 11.2 | Verify backup size > 0 | Non-empty file | | |
| 11.3 | Run `npm run restore backups/file.sql` | Schema + data restored | | |
| 11.4 | Verify data integrity | Row counts match | | |

---

## Pilot Results Template

| Scenario | Date | Tester | Role | Pass/Fail | Defects Found | Severity |
|----------|------|--------|------|-----------|---------------|----------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |
| 11 | | | | | | |

---

## Defect Log Template

| ID | Scenario | Description | Steps to Reproduce | Expected | Actual | Severity | Status |
|----|----------|-------------|-------------------|----------|--------|----------|--------|
| D-1 | | | | | | | |
| D-2 | | | | | | | |

**Severity:** Critical (data loss/corruption) / High (workflow blocked) / Medium (workaround exists) / Low (cosmetic)

---

## Sign-Off

| Role | Name | Signature | Date | Approved |
|------|------|-----------|------|----------|
| Manager | | | | ☐ Yes ☐ No |
| Counter | | | | ☐ Yes ☐ No |
| Owner | | | | ☐ Yes ☐ No |

---

## Notes

- All test data must be clearly marked as TEST DATA
- No synthetic quantities in operational database
- Use `2026-10-21` or later for test dates (pre-launch constraint)
- Report defects immediately; do not proceed if Critical/High severity
- Document any workarounds used

---

*End of Pilot Checklist*