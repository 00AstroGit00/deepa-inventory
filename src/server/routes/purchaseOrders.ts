import { Router } from 'express';
import { pool, withTransaction } from '../db';
import { requireAuth, requireRole } from '../auth';
import { HttpError } from '../errors';
import { z } from 'zod';

export const purchaseOrdersRouter = Router();
purchaseOrdersRouter.use(requireAuth);

const PoLineSchema = z.object({
  productId: z.string().uuid(),
  orderedQty: z.coerce.number().positive(),
  unit: z.string().max(32),
  unitPrice: z.coerce.number().min(0),
  taxTreatment: z.string().max(64),
});

const PurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  expectedDate: z.string().date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  lines: z.array(PoLineSchema).min(1),
});

const PoStatusSchema = z.enum(['draft', 'confirmed', 'partial', 'received', 'cancelled']);

function generatePoNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${date}-${rand}`;
}

purchaseOrdersRouter.get('/', async (req, res) => {
  const status = String(req.query.status ?? '');
  const supplierId = String(req.query.supplierId ?? '');
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const offset = Number(req.query.offset ?? 0);

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let idx = 1;

  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (supplierId) { conditions.push(`supplier_id = $${idx++}`); params.push(supplierId); }

  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT po.*, s.name as supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY po.order_date DESC, po.created_at DESC
      LIMIT $${idx++} OFFSET $${idx}`,
    params,
  );
  res.json(rows);
});

purchaseOrdersRouter.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT po.*, s.name as supplier_name, s.contact_info as supplier_contact
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.id = $1`,
    [req.params.id],
  );
  if (!rows[0]) throw new HttpError(404, 'Purchase order not found');

  const { rows: lines } = await pool.query(
    `SELECT pol.*, p.name as product_name, p.stock_unit
       FROM purchase_order_lines pol
       JOIN products p ON p.id = pol.product_id
      WHERE pol.po_id = $1
      ORDER BY pol.id`,
    [req.params.id],
  );
  res.json({ ...rows[0], lines });
});

purchaseOrdersRouter.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const po = PurchaseOrderSchema.parse(req.body);
  const poNumber = generatePoNumber();

  const { rows } = await withTransaction(async (c) => {
    const ins = await c.query(
      `INSERT INTO purchase_orders (po_number, supplier_id, expected_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [poNumber, po.supplierId, po.expectedDate ?? null, po.notes ?? null, req.user!.id],
    );
    const poId = ins.rows[0].id;

    for (const line of po.lines) {
      await c.query(
        `INSERT INTO purchase_order_lines (po_id, product_id, ordered_qty, unit, unit_price, tax_treatment)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [poId, line.productId, line.orderedQty, line.unit, line.unitPrice, line.taxTreatment],
      );
    }

    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
       VALUES ($1,'purchase_order',$2,'create',$3)`,
      [req.user!.id, poId, JSON.stringify({ ...po, poNumber })],
    );
    return ins;
  });
  res.status(201).json({ id: rows[0].id, poNumber });
});

purchaseOrdersRouter.patch('/:id/status', requireRole('admin', 'manager'), async (req, res) => {
  const parsed = PoStatusSchema.parse(req.body);
  const status = parsed;
  const id = req.params.id;

  await withTransaction(async (c) => {
    const prior = await c.query('SELECT * FROM purchase_orders WHERE id=$1', [id]);
    if (!prior.rows[0]) throw new HttpError(404, 'Purchase order not found');
    if (prior.rows[0].status === 'received' || prior.rows[0].status === 'cancelled') {
      throw new HttpError(400, `Cannot change status from ${prior.rows[0].status}`);
    }
    await c.query(
      `UPDATE purchase_orders SET status = $1, updated_at = now() WHERE id = $2`,
      [status, id],
    );
    await c.query(
      `INSERT INTO audit_log
        (actor_id, entity_type, entity_id, operation, previous_state, new_state)
       VALUES ($1,'purchase_order',$2,'status_change',$3,$4)`,
      [req.user!.id, id, JSON.stringify(prior.rows[0]), JSON.stringify({ status })],
    );
  });
  res.json({ ok: true });
});

purchaseOrdersRouter.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  const po = PurchaseOrderSchema.parse(req.body);
  const id = req.params.id;

  await withTransaction(async (c) => {
    const prior = await c.query('SELECT * FROM purchase_orders WHERE id=$1', [id]);
    if (!prior.rows[0]) throw new HttpError(404, 'Purchase order not found');
    if (prior.rows[0].status !== 'draft') {
      throw new HttpError(400, 'Can only edit draft purchase orders');
    }

    await c.query(
      `UPDATE purchase_orders SET supplier_id=$1, expected_date=$2, notes=$3, updated_at=now() WHERE id=$4`,
      [po.supplierId, po.expectedDate ?? null, po.notes ?? null, id],
    );

    // Delete existing lines and insert new ones
    await c.query(`DELETE FROM purchase_order_lines WHERE po_id=$1`, [id]);
    for (const line of po.lines) {
      await c.query(
        `INSERT INTO purchase_order_lines (po_id, product_id, ordered_qty, unit, unit_price, tax_treatment)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, line.productId, line.orderedQty, line.unit, line.unitPrice, line.taxTreatment],
      );
    }

    await c.query(
      `INSERT INTO audit_log
        (actor_id, entity_type, entity_id, operation, previous_state, new_state)
       VALUES ($1,'purchase_order',$2,'update',$3,$4)`,
      [req.user!.id, id, JSON.stringify(prior.rows[0]), JSON.stringify({ ...po, id })],
    );
  });
  res.json({ ok: true });
});