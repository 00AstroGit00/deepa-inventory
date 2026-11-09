DEEPA STOCKROOM — LIQUOR INVENTORY PROTOTYPE

Included file
- deepa_inventory_prototype.html: responsive, single-file browser application. It uses no external libraries or network requests.

How to use
1. Open the HTML file in a modern browser (Chrome, Edge, Firefox, or Samsung Internet).
2. The first launch includes labelled demo inventory figures for trying the calculations. On the selected date, use Daily stock ledger > Reset selected day to start that day's count at zero, then enter the actual stock counts. Keep the sample catalogue or edit it to match your active brands.
3. For each brand/pack-size row, enter opening full bottles, opening loose ml, received bottles, closing full bottles, closing loose ml, and wastage ml.
4. Use Carry forward to take the previous business date's closing count into today's opening count. This uses the previous calendar date, so a saved ledger must exist for that date.
5. Use Print sheet to print the A4 landscape daily reconciliation, or Daily report > Export CSV to open the line items in Excel.

Permitted pack sizes
- Spirits: 375 ml, 500 ml, 750 ml, 1,000 ml
- Beer: 500 ml, 650 ml
- Sparkling wine: 330 ml
- Standard spirit peg equivalent: 60 ml

Calculation
Opening volume (opening bottles × fixed pack size + opening loose ml) + received volume (bottles received × fixed pack size) − closing volume (closing bottles × fixed pack size + closing loose ml) − recorded wastage ml = inferred sales/consumption volume.
For spirits, inferred volume ÷ 60 ml = 60 ml peg-equivalents. Beer and sparkling wine remain bottle-equivalents by their fixed bottle size. Negative values are flagged for review.

Important limitations
- This is an interactive prototype, not a production-ready multi-user accounting or regulatory system.
- Records are stored in browser local storage only when the browser permits it. They do not automatically sync between devices or user accounts. Use CSV exports and a proper backend/database for reliable operations.
- The demo does not calculate rupee sales revenue, GST, excise reports, or POS-reconciled sales. Inferred consumption is derived from stock movement and should be reconciled with the POS and actual count.
- Test the print layout and your stock-count process before operational use. Do not rely on demo numbers as real inventory.
