import { Router } from 'express';
import { pool, withTransaction } from '../db';
import { requireAuth, requireRole } from '../auth';
import { HttpError } from '../errors';
import { z } from 'zod';

export const goodsReceiptsRouter = Router();
goodsReceiptsRouter.use(requireAuth);

const GrLineSchema = z.object({
  poLineId: z.string().uuid(),
  productId: z.string().uuid(),
  receivedQty: z.coerce.number().positive(),
  unit: z.string().max(32),
  unitPrice: z.coerce.number().min(0),
  batchNumber: z.string().max(64).optional().nullable(),
  expiryDate: z.string().date().optional().nullable(),
  qualityCheck: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

const GoodsReceiptSchema = z.object({
  poId: z.string().uuid(),
  supplierId: z.string().uuid(),
  receiptDate: z.string().date().optional(),
  invoiceNumber: z.string().max(64).optional().nullable(),
  invoiceDate: z.string().date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  lines: z.array(GrLineSchema).min(1),
});

function generateGrnNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GRN-${date}-${rand}`;
}

goodsReceiptsRouter.get('/', async (req, res) => {
  const poId = String(req.query.poId ?? '');
  const supplierId = String(req.query.supplierId ?? '');
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const offset = Number(req.query.offset ?? 0);

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let idx = 1;

  if (poId) { conditions.push(`po_id = $${idx++}`); params.push(poId); }
  if (supplierId) { conditions.push(`supplier_id = $${idx++}`); params.push(supplierId); }

  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT gr.*, s.name as supplier_name, po.po_number
       FROM goods_receipts gr
       JOIN suppliers s ON s.id = gr.supplier_id
       JOIN purchase_orders po ON po.id = gr.po_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY gr.receipt_date DESC, gr.created_at DESC
      LIMIT $${idx++} OFFSET $${idx}`,
    params,
  );
  res.json(rows);
});

goodsReceiptsRouter.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT gr.*, s.name as supplier_name, po.po_number
       FROM goods_receipts gr
       JOIN suppliers s ON s.id = gr.supplier_id
       JOIN purchase_orders po ON po.id = gr.po_id
      WHERE gr.id = $1`,
    [req.params.id],
  );
  if (!rows[0]) throw new HttpError(404, 'Goods receipt not found');

  const { rows: lines } = await pool.query(
    `SELECT grl.*, p.name as product_name, p.stock_unit
       FROM goods_receipt_lines grl
       JOIN products p ON p.id = grl.product_id
      WHERE grl.gr_id = $1
      ORDER BY grl.id`,
    [req.params.id],
  );
  res.json({ ...rows[0], lines });
});

goodsReceiptsRouter.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const gr = GoodsReceiptSchema.parse(req.body);
  const grnNumber = generateGrnNumber();

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  async function ensureDay(c: any, date: string): Promise<string> {
    if (!DATE_RE.test(date)) throw new HttpError(400, 'Invalid date');
    const { rows } = await c.query(
      `INSERT INTO inventory_days (inventory_date) VALUES ($1)
       ON CONFLICT (inventory_date) DO UPDATE SET status = inventory_days.status
       RETURNING id`, [date]);
    return rows[0].id;
  }

  const { rows } = await withTransaction(async (c) => {
    // Verify PO exists and get its status
    const po = await c.query('SELECT id, status, supplier_id FROM purchase_orders WHERE id=$1', [gr.poId]);
    if (!po.rows[0]) throw new HttpError(404, 'Purchase order not found');
    if (po.rows[0].supplier_id !== gr.supplierId) {
      throw new HttpError(400, 'Supplier does not match purchase order');
    }

    const ins = await c.query(
      `INSERT INTO goods_receipts (grn_number, po_id, supplier_id, receipt_date, invoice_number, invoice_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [grnNumber, gr.poId, gr.supplierId, gr.receiptDate ?? null,
       gr.invoiceNumber ?? null, gr.invoiceDate ?? null, gr.notes ?? null, req.user!.id],
    );
    const grId = ins.rows[0].id;

    const receiptDate = gr.receiptDate ?? new Date().toISOString().slice(0, 10);
    const dayId = await ensureDay(c, receiptDate);

    for (const line of gr.lines) {
      // Verify the PO line exists and belongs to this PO
      const poLine = await c.query(
        `SELECT id, ordered_qty, received_qty, product_id
           FROM purchase_order_lines WHERE id=$1 AND po_id=$2`,
        [line.poLineId, gr.poId],
      );
      if (!poLine.rows[0]) throw new HttpError(404, `PO line ${line.poLineId} not found`);
      if (poLine.rows[0].product_id !== line.productId) {
        throw new HttpError(400, `Product mismatch on PO line ${line.poLineId}`);
      }

      const newReceivedQty = Number(poLine.rows[0].received_qty) + line.receivedQty;
      if (newReceivedQty > Number(poLine.rows[0].ordered_qty)) {
        throw new HttpError(400, `Received qty exceeds ordered qty on line ${line.poLineId}`);
      }

      await c.query(
        `INSERT INTO goods_receipt_lines
          (gr_id, po_line_id, product_id, received_qty, unit, unit_price, batch_number, expiry_date, quality_check, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [grId, line.poLineId, line.productId, line.receivedQty, line.unit,
         line.unitPrice, line.batchNumber ?? null, line.expiryDate ?? null,
         line.qualityCheck ?? true, line.notes ?? null],
      );

      // Update PO line received qty
      await c.query(
        `UPDATE purchase_order_lines SET received_qty = $1 WHERE id = $2`,
        [newReceivedQty, line.poLineId],
      );

      // Create stock movement as receipt
      await c.query(
        `INSERT INTO stock_movements
          (inventory_day_id, product_id, movement_type, amount, unit, reason, created_by)
         VALUES ($1,$2,'receipt',$3,$4,'goods receipt',$5)`,
        [dayId, line.productId, line.receivedQty, line.unit, req.user!.id],
      );

      await c.query(
        `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
         VALUES ($1,'movement',$2,'receipt',$3)`,
        [req.user!.id, line.productId, JSON.stringify({ date: receiptDate, ...line, type: 'receipt' })],
      );
    }

    // Update PO status
    const allLines = await c.query(
      `SELECT SUM(ordered_qty) as total_ordered, SUM(received_qty) as total_received
         FROM purchase_order_lines WHERE po_id = $1`,
      [gr.poId],
    );
    const totalOrdered = Number(allLines.rows[0].total_ordered);
    const totalReceived = Number(allLines.rows[0].total_received);

    let newStatus = 'partial';
    if (totalReceived >= totalOrdered) newStatus = 'received';
    await c.query(`UPDATE purchase_orders SET status = $1, updated_at = now() WHERE id = $2`, [newStatus, gr.poId]);

    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
       VALUES ($1,'goods_receipt',$2,'create',$3)`,
      [req.user!.id, grId, JSON.stringify({ ...gr, grnNumber })],
    );
    return ins;
  });
  res.status(201).json({ id: rows[0].id, grnNumber });
});