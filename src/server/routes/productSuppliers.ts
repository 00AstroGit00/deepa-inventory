import { Router } from 'express';
import { pool, withTransaction } from '../db';
import { requireAuth, requireRole } from '../auth';
import { HttpError } from '../errors';
import { z } from 'zod';

export const productSuppliersRouter = Router();
productSuppliersRouter.use(requireAuth);

const ProductSupplierSchema = z.object({
  productId: z.string().uuid(),
  supplierId: z.string().uuid(),
  supplierSku: z.string().max(64).optional().nullable(),
  purchasePrice: z.coerce.number().min(0),
  priceUnit: z.string().max(32),
  minOrderQty: z.coerce.number().positive().optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
  isPreferred: z.boolean().optional(),
  effectiveFrom: z.string().date().optional(),
  effectiveTo: z.string().date().optional().nullable(),
});

productSuppliersRouter.get('/product/:productId', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ps.*, s.name as supplier_name
       FROM product_suppliers ps
       JOIN suppliers s ON s.id = ps.supplier_id
      WHERE ps.product_id = $1 AND ps.effective_to IS NULL
      ORDER BY ps.is_preferred DESC, ps.purchase_price ASC`,
    [req.params.productId],
  );
  res.json(rows);
});

productSuppliersRouter.get('/supplier/:supplierId', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ps.*, p.name as product_name, p.stock_unit
       FROM product_suppliers ps
       JOIN products p ON p.id = ps.product_id
      WHERE ps.supplier_id = $1 AND ps.effective_to IS NULL
      ORDER BY p.name`,
    [req.params.supplierId],
  );
  res.json(rows);
});

productSuppliersRouter.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const ps = ProductSupplierSchema.parse(req.body);
  const { rows } = await withTransaction(async (c) => {
    // End any existing active pricing for this product/supplier
    await c.query(
      `UPDATE product_suppliers SET effective_to = CURRENT_DATE - INTERVAL '1 day'
       WHERE product_id = $1 AND supplier_id = $2 AND effective_to IS NULL`,
      [ps.productId, ps.supplierId],
    );
    const ins = await c.query(
      `INSERT INTO product_suppliers
        (product_id, supplier_id, supplier_sku, purchase_price, price_unit,
         min_order_qty, lead_time_days, is_preferred, effective_from, effective_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [ps.productId, ps.supplierId, ps.supplierSku ?? null, ps.purchasePrice,
       ps.priceUnit, ps.minOrderQty ?? 1, ps.leadTimeDays ?? 0,
       ps.isPreferred ?? false, ps.effectiveFrom ?? null, ps.effectiveTo ?? null],
    );
    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
       VALUES ($1,'product_supplier',$2,'create',$3)`,
      [req.user!.id, `${ps.productId}:${ps.supplierId}`, JSON.stringify(ps)],
    );
    return ins;
  });
  res.status(201).json(rows[0]);
});

productSuppliersRouter.patch('/:productId/:supplierId', requireRole('admin', 'manager'), async (req, res) => {
  const ps = ProductSupplierSchema.partial().parse(req.body);
  const { productId, supplierId } = req.params;
  await withTransaction(async (c) => {
    const prior = await c.query(
      `SELECT * FROM product_suppliers WHERE product_id=$1 AND supplier_id=$2 AND effective_to IS NULL`,
      [productId, supplierId],
    );
    if (!prior.rows[0]) throw new HttpError(404, 'Product-supplier link not found');
    const fields = Object.keys(ps);
    if (fields.length === 0) return;
    const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    await c.query(
      `UPDATE product_suppliers SET ${sets} WHERE product_id=$1 AND supplier_id=$2 AND effective_to IS NULL`,
      [productId, supplierId, ...fields.map(f => (ps as Record<string, unknown>)[f] ?? null)],
    );
    await c.query(
      `INSERT INTO audit_log
        (actor_id, entity_type, entity_id, operation, previous_state, new_state)
       VALUES ($1,'product_supplier',$2,'update',$3,$4)`,
      [req.user!.id, `${productId}:${supplierId}`, JSON.stringify(prior.rows[0]), JSON.stringify(ps)],
    );
  });
  res.json({ ok: true });
});

productSuppliersRouter.delete('/:productId/:supplierId', requireRole('admin'), async (req, res) => {
  const { productId, supplierId } = req.params;
  await withTransaction(async (c) => {
    const prior = await c.query(
      `SELECT * FROM product_suppliers WHERE product_id=$1 AND supplier_id=$2 AND effective_to IS NULL`,
      [productId, supplierId],
    );
    if (!prior.rows[0]) throw new HttpError(404, 'Product-supplier link not found');
    await c.query(
      `UPDATE product_suppliers SET effective_to = CURRENT_DATE - INTERVAL '1 day'
       WHERE product_id=$1 AND supplier_id=$2 AND effective_to IS NULL`,
      [productId, supplierId],
    );
    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, previous_state)
       VALUES ($1,'product_supplier',$2,'deactivate',$3)`,
      [req.user!.id, `${productId}:${supplierId}`, JSON.stringify(prior.rows[0])],
    );
  });
  res.json({ ok: true });
});