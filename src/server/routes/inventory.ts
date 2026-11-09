import { Router } from 'express';
import { pool, withTransaction } from '../db';
import { CountSchema, MovementSchema } from '../../shared/schemas';
import { requireAuth, requireRole } from '../auth';
import { idempotency } from '../middleware/idempotency';
import { HttpError } from '../errors';
import { buildReconciliation, ReconciliationRow } from '../../domain/inventory';

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function ensureDay(c: any, date: string): Promise<string> {
  if (!DATE_RE.test(date)) throw new HttpError(400, 'Invalid date');
  const { rows } = await c.query(
    `INSERT INTO inventory_days (inventory_date) VALUES ($1)
     ON CONFLICT (inventory_date) DO UPDATE SET status = inventory_days.status
     RETURNING id`, [date]);
  return rows[0].id;
}

inventoryRouter.get('/:date', async (req, res) => {
  const date = req.params.date;
  const dayRes = await pool.query(
    'SELECT id, status FROM inventory_days WHERE inventory_date = $1', [date]);
  const day = dayRes.rows[0];
  const dayId = day?.id ?? null;
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.stock_unit,
       COALESCE(SUM(CASE WHEN m.movement_type='opening'      THEN m.amount END),0) AS opening,
       COALESCE(SUM(CASE WHEN m.movement_type='receipt'      THEN m.amount END),0) AS receipts,
       COALESCE(SUM(CASE WHEN m.movement_type='consumption'  THEN m.amount END),0) AS consumption,
       COALESCE(SUM(CASE WHEN m.movement_type='spillage'     THEN m.amount END),0) AS spillage,
       COALESCE(SUM(CASE WHEN m.movement_type='transfer_in'  THEN m.amount END),0) AS transfer_in,
       COALESCE(SUM(CASE WHEN m.movement_type='transfer_out' THEN m.amount END),0) AS transfer_out,
       COALESCE(SUM(CASE WHEN m.movement_type='adjustment'   THEN m.amount END),0) AS adjustments,
       pc.amount AS physical
     FROM products p
     LEFT JOIN stock_movements m ON m.product_id = p.id AND m.inventory_day_id = $1
     LEFT JOIN physical_counts pc ON pc.product_id = p.id AND pc.inventory_day_id = $1
     WHERE p.is_active
     GROUP BY p.id, p.name, p.stock_unit, pc.amount
     ORDER BY p.name`,
    [dayId],
  );
  const result: ReconciliationRow[] = rows.map((r: any) =>
    buildReconciliation({
      productId: r.id, productName: r.name, unit: r.stock_unit,
      opening: Number(r.opening), receipts: Number(r.receipts),
      consumption: Number(r.consumption), spillage: Number(r.spillage),
      transferIn: Number(r.transfer_in), transferOut: Number(r.transfer_out),
      adjustments: Number(r.adjustments),
      physicalCount: r.physical == null ? null : Number(r.physical),
    }),
  );
  res.json({ date, status: day?.status ?? 'not_started', rows: result });
});

inventoryRouter.post(
  '/:date/counts',
  requireRole('admin', 'manager'),
  idempotency(),
  async (req, res) => {
  const body = CountSchema.parse(req.body);
  const date = req.params.date ?? '';
  await withTransaction(async (c) => {
    const dayId = await ensureDay(c, date);
    const prod = await c.query('SELECT stock_unit FROM products WHERE id=$1 AND is_active', [body.productId]);
    if (!prod.rows[0]) throw new HttpError(404, 'Product not found');
    if (prod.rows[0].stock_unit !== body.unit) {
      throw new HttpError(400, `Unit mismatch: product is tracked in ${prod.rows[0].stock_unit}`);
    }
    const prior = await c.query(
      'SELECT amount FROM physical_counts WHERE inventory_day_id=$1 AND product_id=$2',
      [dayId, body.productId],
    );
    await c.query(
      `INSERT INTO physical_counts (inventory_day_id, product_id, amount, unit, entered_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (inventory_day_id, product_id)
       DO UPDATE SET amount = EXCLUDED.amount, unit = EXCLUDED.unit,
                     entered_by = EXCLUDED.entered_by, entered_at = now()`,
      [dayId, body.productId, body.amount, body.unit, req.user!.id],
    );
    await c.query(
      `INSERT INTO audit_log
        (actor_id, entity_type, entity_id, operation, previous_state, new_state)
       VALUES ($1,'physical_count',$2,'upsert',$3,$4)`,
      [req.user!.id, body.productId,
       prior.rows[0] ? JSON.stringify(prior.rows[0]) : null,
       JSON.stringify({ date, amount: body.amount, unit: body.unit })],
    );
    await c.query(
      `UPDATE inventory_days SET status='counting' WHERE id=$1 AND status='open'`, [dayId]);
  });
  res.status(201).json({ ok: true });
});

inventoryRouter.post(
  '/:date/movements',
  requireRole('admin', 'manager'),
  idempotency(),
  async (req, res) => {
    const body = MovementSchema.parse(req.body);
    const date = req.params.date ?? '';
    await withTransaction(async (c) => {
      const dayId = await ensureDay(c, date);
      const day = await c.query('SELECT allow_negative_stock FROM inventory_days WHERE id=$1', [dayId]);
      const allowNegative = day.rows[0].allow_negative_stock as boolean;
      const lock = await c.query('SELECT stock_unit FROM products WHERE id=$1 FOR UPDATE', [body.productId]);
      if (!lock.rows[0]) throw new HttpError(404, 'Product not found');
      if (lock.rows[0].stock_unit !== body.unit) {
        throw new HttpError(400, `Unit mismatch: product is tracked in ${lock.rows[0].stock_unit}`);
      }
      const onHandRes = await c.query(
        'SELECT COALESCE(SUM(amount),0)::numeric AS on_hand FROM stock_movements WHERE product_id=$1',
        [body.productId],
      );
      const onHand = Number(onHandRes.rows[0].on_hand);
      const after = onHand + body.amount;
      if (after < 0 && !allowNegative) {
        throw new HttpError(409,
          `Insufficient stock: on hand ${onHand} ${body.unit}, requested ${body.amount}`);
      }
      if (after < 0) {
        await c.query(
          `INSERT INTO negative_stock_flags (product_id, inventory_day_id)
           VALUES ($1,$2)`, [body.productId, dayId]);
      }
      await c.query(
        `INSERT INTO stock_movements
          (inventory_day_id, product_id, movement_type, amount, unit, reason, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [dayId, body.productId, body.type, body.amount, body.unit, body.reason ?? null, req.user!.id],
      );
      await c.query(
        `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
         VALUES ($1,'movement',$2,$3,$4)`,
        [req.user!.id, body.productId, body.type, JSON.stringify({ date, ...body })],
      );
    });
    res.status(201).json({ ok: true });
  },
);

inventoryRouter.post(
  '/:date/sync-opening',
  requireRole('admin', 'manager'),
  idempotency(),
  async (req, res) => {
    const date = req.params.date ?? '';
    const summary = await withTransaction(async (c) => {
      const dayId = await ensureDay(c, date);
      const prior = await c.query(
        `SELECT id, inventory_date FROM inventory_days
          WHERE inventory_date < $1 ORDER BY inventory_date DESC LIMIT 1`, [date]);
      if (!prior.rows[0]) return { applied: 0, skipped: 0, reason: 'no_prior_day' as const };
      const priorId = prior.rows[0].id;
      const existing = await c.query(
        `SELECT product_id FROM stock_movements
          WHERE inventory_day_id=$1 AND movement_type='opening'`, [dayId]);
      const overrides = new Set(existing.rows.map((r: any) => r.product_id));
      const { rows } = await c.query(
        `SELECT p.id,
                COALESCE(SUM(CASE
                  WHEN m.movement_type='opening'      THEN  m.amount
                  WHEN m.movement_type='receipt'      THEN  m.amount
                  WHEN m.movement_type='transfer_in'  THEN  m.amount
                  WHEN m.movement_type='transfer_out' THEN -m.amount
                  WHEN m.movement_type='consumption'  THEN -m.amount
                  WHEN m.movement_type='spillage'     THEN -m.amount
                  WHEN m.movement_type='adjustment'   THEN  m.amount
                  ELSE 0 END),0) AS closing,
                p.stock_unit
           FROM products p
           JOIN stock_movements m ON m.product_id = p.id AND m.inventory_day_id = $1
          WHERE p.is_active
          GROUP BY p.id, p.stock_unit`, [priorId]);
      let applied = 0, skipped = 0;
      for (const r of rows) {
        if (overrides.has(r.id)) { skipped++; continue; }
        const closing = Number(r.closing);
        if (closing < 0) { skipped++; continue; }
        await c.query(
          `INSERT INTO stock_movements
            (inventory_day_id, product_id, movement_type, amount, unit, reason, created_by)
           VALUES ($1,$2,'opening',$3,$4,'carry-forward',$5)`,
          [dayId, r.id, closing, r.stock_unit, req.user!.id],
        );
        applied++;
      }
      await c.query(
        `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
         VALUES ($1,'inventory_day',$2,'sync_opening',$3)`,
        [req.user!.id, dayId, JSON.stringify({ date, applied, skipped })]);
      return { applied, skipped, reason: 'ok' as const };
    });
    res.json(summary);
  },
);

inventoryRouter.get('/:date/movements', async (req, res) => {
  const date = req.params.date ?? '';
  const dayRes = await pool.query(
    'SELECT id FROM inventory_days WHERE inventory_date = $1', [date]);
  const dayId = dayRes.rows[0]?.id ?? null;
  const { rows } = await pool.query(
    `SELECT m.id, m.product_id, p.name as product_name, m.movement_type, m.amount, m.unit, m.reason,
            m.created_by, u.email as created_by_email, m.created_at
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       LEFT JOIN users u ON u.id = m.created_by
      WHERE m.inventory_day_id = $1
      ORDER BY m.created_at DESC`,
    [dayId],
  );
  res.json({ movements: rows });
});
