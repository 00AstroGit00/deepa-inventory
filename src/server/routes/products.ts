import { Router } from 'express';
import { pool, withTransaction } from '../db';
import { ProductCreateSchema, ProductUpdateSchema } from '../../shared/schemas';
import { requireAuth, requireRole } from '../auth';
import { HttpError } from '../errors';

export const productsRouter = Router();
productsRouter.use(requireAuth);

productsRouter.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const like = `%${q}%`;
  const { rows } = await pool.query(
    `SELECT id, name, brand, category, sku, barcode, stock_unit,
            package_size_amount, package_size_unit, bottle_size_ml,
            tax_treatment, reorder_level, is_active
       FROM products
      WHERE is_active
        AND ($1 = '' OR name ILIKE $2 OR brand ILIKE $2 OR barcode = $1 OR sku = $1)
      ORDER BY name LIMIT 200`,
    [q, like],
  );
  res.json(rows);
});

productsRouter.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const p = ProductCreateSchema.parse(req.body);
  const { rows } = await withTransaction(async (c) => {
    const ins = await c.query(
      `INSERT INTO products
        (name, brand, category, sku, barcode, stock_unit, package_size_amount,
         package_size_unit, bottle_size_ml, tax_treatment, reorder_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [p.name, p.brand ?? null, p.category, p.sku ?? null, p.barcode ?? null,
       p.stock_unit, p.package_size_amount ?? null, p.package_size_unit ?? null,
       p.bottle_size_ml ?? null, p.tax_treatment, p.reorder_level ?? null],
    );
    const id = ins.rows[0].id;
    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
       VALUES ($1,'product',$2,'create',$3)`,
      [req.user!.id, id, JSON.stringify(p)],
    );
    return ins;
  });
  res.status(201).json({ id: rows[0].id });
});

productsRouter.patch('/:id', requireRole('admin', 'manager'), async (req, res) => {
  const p = ProductUpdateSchema.parse(req.body);
  const id = req.params.id;
  await withTransaction(async (c) => {
    const prior = await c.query('SELECT * FROM products WHERE id=$1', [id]);
    if (!prior.rows[0]) throw new HttpError(404, 'Product not found');
    const fields = Object.keys(p);
    if (fields.length === 0) return;
    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    await c.query(
      `UPDATE products SET ${sets}, updated_at = now() WHERE id = $1`,
      [id, ...fields.map(f => (p as Record<string, unknown>)[f] ?? null)],
    );
    await c.query(
      `INSERT INTO audit_log
        (actor_id, entity_type, entity_id, operation, previous_state, new_state)
       VALUES ($1,'product',$2,'update',$3,$4)`,
      [req.user!.id, id, JSON.stringify(prior.rows[0]), JSON.stringify(p)],
    );
  });
  res.json({ ok: true });
});
