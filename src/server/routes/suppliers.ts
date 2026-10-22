import { Router } from 'express';
import { pool, withTransaction } from '../db';
import { requireAuth, requireRole } from '../auth';
import { HttpError } from '../errors';
import { z } from 'zod';

export const suppliersRouter = Router();
suppliersRouter.use(requireAuth);

const SupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contact_info: z.string().max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  gstin: z.string().max(32).optional().nullable(),
  payment_terms: z.string().max(200).optional().nullable(),
  is_active: z.boolean().optional(),
});

suppliersRouter.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const like = `%${q}%`;
  const { rows } = await pool.query(
    `SELECT * FROM suppliers
     WHERE is_active
       AND ($1 = '' OR name ILIKE $2 OR phone = $1 OR email = $1 OR gstin = $1)
     ORDER BY name LIMIT 200`,
    [q, like],
  );
  res.json(rows);
});

suppliersRouter.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const s = SupplierSchema.parse(req.body);
  const { rows } = await withTransaction(async (c) => {
    const ins = await c.query(
      `INSERT INTO suppliers (name, contact_info, address, phone, email, gstin, payment_terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [s.name, s.contact_info ?? null, s.address ?? null, s.phone ?? null,
       s.email ?? null, s.gstin ?? null, s.payment_terms ?? null],
    );
    const id = ins.rows[0].id;
    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
       VALUES ($1,'supplier',$2,'create',$3)`,
      [req.user!.id, id, JSON.stringify(s)],
    );
    return ins;
  });
  res.status(201).json({ id: rows[0].id });
});

suppliersRouter.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  const s = SupplierSchema.partial().parse(req.body);
  const id = req.params.id;
  await withTransaction(async (c) => {
    const prior = await c.query('SELECT * FROM suppliers WHERE id=$1', [id]);
    if (!prior.rows[0]) throw new HttpError(404, 'Supplier not found');
    const fields = Object.keys(s);
    if (fields.length === 0) return;
    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    await c.query(
      `UPDATE suppliers SET ${sets}, updated_at = now() WHERE id = $1`,
      [id, ...fields.map(f => (s as Record<string, unknown>)[f] ?? null)],
    );
    await c.query(
      `INSERT INTO audit_log
        (actor_id, entity_type, entity_id, operation, previous_state, new_state)
       VALUES ($1,'supplier',$2,'update',$3,$4)`,
      [req.user!.id, id, JSON.stringify(prior.rows[0]), JSON.stringify(s)],
    );
  });
  res.json({ ok: true });
});

suppliersRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  await withTransaction(async (c) => {
    const prior = await c.query('SELECT * FROM suppliers WHERE id=$1', [id]);
    if (!prior.rows[0]) throw new HttpError(404, 'Supplier not found');
    await c.query('UPDATE suppliers SET is_active = false, updated_at = now() WHERE id = $1', [id]);
    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, previous_state)
       VALUES ($1,'supplier',$2,'deactivate',$3)`,
      [req.user!.id, id, JSON.stringify(prior.rows[0])],
    );
  });
  res.json({ ok: true });
});