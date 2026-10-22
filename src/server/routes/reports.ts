import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../auth';
import { buildReconciliation, ReconciliationRow } from '../../domain/inventory';
import { toCsv } from '../../domain/csvSafe';

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

async function loadReconciliation(date: string): Promise<ReconciliationRow[]> {
  const dayRes = await pool.query(
    'SELECT id FROM inventory_days WHERE inventory_date = $1', [date]);
  const dayId = dayRes.rows[0]?.id ?? null;
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
     LEFT JOIN stock_movements m ON m.product_id=p.id AND m.inventory_day_id=$1
     LEFT JOIN physical_counts pc ON pc.product_id=p.id AND pc.inventory_day_id=$1
     WHERE p.is_active
     GROUP BY p.id, p.name, p.stock_unit, pc.amount
     ORDER BY p.name`,
    [dayId],
  );
  return rows.map((r: any) => buildReconciliation({
    productId: r.id, productName: r.name, unit: r.stock_unit,
    opening: Number(r.opening), receipts: Number(r.receipts),
    consumption: Number(r.consumption), spillage: Number(r.spillage),
    transferIn: Number(r.transfer_in), transferOut: Number(r.transfer_out),
    adjustments: Number(r.adjustments),
    physicalCount: r.physical == null ? null : Number(r.physical),
  }));
}

reportsRouter.get('/reconciliation.csv', async (req, res) => {
  const date = String(req.query.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'date required' });
  const rows = await loadReconciliation(date);
  const csv = toCsv(
    ['date', 'product', 'unit', 'opening', 'receipts', 'consumption', 'spillage',
     'transfer_in', 'transfer_out', 'adjustments', 'expected', 'physical', 'variance'],
    rows.map(r => ({
      date, product: r.productName, unit: r.unit,
      opening: r.opening, receipts: r.receipts, consumption: r.consumption,
      spillage: r.spillage, transfer_in: r.transferIn, transfer_out: r.transferOut,
      adjustments: r.adjustments, expected: r.expectedClosing,
      physical: r.physicalCount ?? '', variance: r.variance ?? '',
    })),
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="reconciliation-${date}.csv"`);
  res.send('\uFEFF' + csv);
});

reportsRouter.get('/dashboard', async (_req, res) => {
  const [lowStock, openDays, negative, counts] = await Promise.all([
    pool.query(
      `SELECT p.id, p.name, p.stock_unit,
              COALESCE(SUM(m.amount),0)::numeric AS on_hand,
              p.reorder_level
         FROM products p
         LEFT JOIN stock_movements m ON m.product_id = p.id
        WHERE p.is_active AND p.reorder_level IS NOT NULL
        GROUP BY p.id, p.name, p.stock_unit, p.reorder_level
       HAVING COALESCE(SUM(m.amount),0) < p.reorder_level
        ORDER BY p.name LIMIT 50`),
    pool.query(`SELECT COUNT(*)::int AS n FROM inventory_days WHERE status IN ('open','counting')`),
    pool.query(`SELECT COUNT(*)::int AS n FROM negative_stock_flags WHERE NOT resolved`),
    pool.query(`SELECT COUNT(*)::int AS n FROM physical_counts WHERE entered_at > now() - interval '1 day'`),
  ]);
  res.json({
    lowStock: lowStock.rows.map((r: any) => ({
      id: r.id, name: r.name, unit: r.stock_unit,
      onHand: Number(r.on_hand), reorderLevel: Number(r.reorder_level),
    })),
    openInventoryDays: openDays.rows[0].n,
    unresolvedNegativeStock: negative.rows[0].n,
    countsLast24h: counts.rows[0].n,
  });
});

// Stock movement report
reportsRouter.get('/stock-movements', async (req, res) => {
  const dateFrom = String(req.query.from ?? '');
  const dateTo = String(req.query.to ?? '');
  const productId = String(req.query.productId ?? '');
  const movementType = String(req.query.type ?? '');
  const limit = Math.min(Number(req.query.limit ?? 500), 2000);

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let idx = 1;

  if (dateFrom) { conditions.push(`id.inventory_date >= $${idx++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`id.inventory_date <= $${idx++}`); params.push(dateTo); }
  if (productId) { conditions.push(`m.product_id = $${idx++}`); params.push(productId); }
  if (movementType) { conditions.push(`m.movement_type = $${idx++}`); params.push(movementType); }

  params.push(limit);
  const { rows } = await pool.query(
    `SELECT m.id, id.inventory_date as date, p.name as product, p.stock_unit as unit,
            m.movement_type, m.amount, m.unit as movement_unit, m.reason,
            u.email as created_by, m.created_at
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       JOIN inventory_days id ON id.id = m.inventory_day_id
       LEFT JOIN users u ON u.id = m.created_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT $${idx}`,
    params,
  );
  res.json(rows);
});

reportsRouter.get('/stock-movements.csv', async (req, res) => {
  const dateFrom = String(req.query.from ?? '');
  const dateTo = String(req.query.to ?? '');
  const productId = String(req.query.productId ?? '');
  const movementType = String(req.query.type ?? '');

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let idx = 1;

  if (dateFrom) { conditions.push(`id.inventory_date >= $${idx++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`id.inventory_date <= $${idx++}`); params.push(dateTo); }
  if (productId) { conditions.push(`m.product_id = $${idx++}`); params.push(productId); }
  if (movementType) { conditions.push(`m.movement_type = $${idx++}`); params.push(movementType); }

  const { rows } = await pool.query(
    `SELECT m.id, id.inventory_date as date, p.name as product, p.stock_unit as unit,
            m.movement_type, m.amount, m.unit as movement_unit, m.reason,
            u.email as created_by, m.created_at
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       JOIN inventory_days id ON id.id = m.inventory_day_id
       LEFT JOIN users u ON u.id = m.created_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY m.created_at DESC`,
    params,
  );
  const csv = toCsv(
    ['id', 'date', 'product', 'unit', 'type', 'amount', 'movement_unit', 'reason', 'created_by', 'created_at'],
    rows.map(r => ({
      id: r.id, date: r.date, product: r.product, unit: r.unit,
      type: r.movement_type, amount: r.amount, movement_unit: r.movement_unit,
      reason: r.reason ?? '', created_by: r.created_by ?? '', created_at: r.created_at,
    })),
  );
  const filename = `stock-movements-${dateFrom || 'all'}-to-${dateTo || 'all'}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
});

// Spillage & Adjustments report
reportsRouter.get('/spillage-adjustments', async (req, res) => {
  const dateFrom = String(req.query.from ?? '');
  const dateTo = String(req.query.to ?? '');
  const type = String(req.query.type ?? '');

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let idx = 1;

  if (dateFrom) { conditions.push(`id.inventory_date >= $${idx++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`id.inventory_date <= $${idx++}`); params.push(dateTo); }
  if (type) { conditions.push(`m.movement_type = $${idx++}`); params.push(type); }

  const { rows } = await pool.query(
    `SELECT m.id, id.inventory_date as date, p.name as product, p.stock_unit as unit,
            m.movement_type, m.amount, m.reason, u.email as created_by, m.created_at
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       JOIN inventory_days id ON id.id = m.inventory_day_id
       LEFT JOIN users u ON u.id = m.created_by
      WHERE m.movement_type IN ('spillage','adjustment')
        AND ${conditions.join(' AND ')}
      ORDER BY m.created_at DESC`,
    params,
  );
  res.json(rows);
});

reportsRouter.get('/spillage-adjustments.csv', async (req, res) => {
  const dateFrom = String(req.query.from ?? '');
  const dateTo = String(req.query.to ?? '');
  const type = String(req.query.type ?? '');

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let idx = 1;

  if (dateFrom) { conditions.push(`id.inventory_date >= $${idx++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`id.inventory_date <= $${idx++}`); params.push(dateTo); }
  if (type) { conditions.push(`m.movement_type = $${idx++}`); params.push(type); }

  const { rows } = await pool.query(
    `SELECT m.id, id.inventory_date as date, p.name as product, p.stock_unit as unit,
            m.movement_type, m.amount, m.reason, u.email as created_by, m.created_at
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       JOIN inventory_days id ON id.id = m.inventory_day_id
       LEFT JOIN users u ON u.id = m.created_by
      WHERE m.movement_type IN ('spillage','adjustment')
        AND ${conditions.join(' AND ')}
      ORDER BY m.created_at DESC`,
    params,
  );
  const csv = toCsv(
    ['id', 'date', 'product', 'unit', 'type', 'amount', 'reason', 'created_by', 'created_at'],
    rows.map(r => ({
      id: r.id, date: r.date, product: r.product, unit: r.unit,
      type: r.movement_type, amount: r.amount, reason: r.reason ?? '',
      created_by: r.created_by ?? '', created_at: r.created_at,
    })),
  );
  const filename = `spillage-adjustments-${dateFrom || 'all'}-to-${dateTo || 'all'}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
});

// Purchase cost history
reportsRouter.get('/purchase-cost-history', async (req, res) => {
  const productId = String(req.query.productId ?? '');
  const supplierId = String(req.query.supplierId ?? '');
  const limit = Math.min(Number(req.query.limit ?? 200), 1000);

  const conditions: string[] = ['ps.effective_to IS NULL'];
  const params: any[] = [];
  let idx = 1;

  if (productId) { conditions.push(`ps.product_id = $${idx++}`); params.push(productId); }
  if (supplierId) { conditions.push(`ps.supplier_id = $${idx++}`); params.push(supplierId); }

  params.push(limit);
  const { rows } = await pool.query(
    `SELECT ps.*, p.name as product_name, p.stock_unit, s.name as supplier_name
       FROM product_suppliers ps
       JOIN products p ON p.id = ps.product_id
       JOIN suppliers s ON s.id = ps.supplier_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ps.effective_from DESC
      LIMIT $${idx}`,
    params,
  );
  res.json(rows);
});

reportsRouter.get('/purchase-cost-history.csv', async (req, res) => {
  const productId = String(req.query.productId ?? '');
  const supplierId = String(req.query.supplierId ?? '');

  const conditions: string[] = ['ps.effective_to IS NULL'];
  const params: any[] = [];
  let idx = 1;

  if (productId) { conditions.push(`ps.product_id = $${idx++}`); params.push(productId); }
  if (supplierId) { conditions.push(`ps.supplier_id = $${idx++}`); params.push(supplierId); }

  const { rows } = await pool.query(
    `SELECT ps.*, p.name as product_name, p.stock_unit, s.name as supplier_name
       FROM product_suppliers ps
       JOIN products p ON p.id = ps.product_id
       JOIN suppliers s ON s.id = ps.supplier_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ps.effective_from DESC`,
    params,
  );
  const csv = toCsv(
    ['product', 'supplier', 'supplier_sku', 'purchase_price', 'price_unit', 'min_order_qty', 'lead_time_days', 'is_preferred', 'effective_from', 'effective_to'],
    rows.map(r => ({
      product: r.product_name, supplier: r.supplier_name, supplier_sku: r.supplier_sku ?? '',
      purchase_price: r.purchase_price, price_unit: r.price_unit,
      min_order_qty: r.min_order_qty, lead_time_days: r.lead_time_days,
      is_preferred: r.is_preferred, effective_from: r.effective_from, effective_to: r.effective_to ?? '',
    })),
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="purchase-cost-history.csv"`);
  res.send('\uFEFF' + csv);
});

// Inventory valuation (latest cost)
reportsRouter.get('/valuation', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category, p.stock_unit, p.bottle_size_ml,
            COALESCE(SUM(m.amount),0)::numeric AS on_hand,
            COALESCE((
              SELECT ps.purchase_price
              FROM product_suppliers ps
              WHERE ps.product_id = p.id AND ps.effective_to IS NULL
              ORDER BY ps.is_preferred DESC, ps.purchase_price ASC
              LIMIT 1
            ), 0) AS latest_cost,
            COALESCE((
              SELECT ps.price_unit
              FROM product_suppliers ps
              WHERE ps.product_id = p.id AND ps.effective_to IS NULL
              ORDER BY ps.is_preferred DESC, ps.purchase_price ASC
              LIMIT 1
            ), p.stock_unit) AS cost_unit
       FROM products p
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE p.is_active
      GROUP BY p.id, p.name, p.category, p.stock_unit, p.bottle_size_ml
      HAVING COALESCE(SUM(m.amount),0) > 0
      ORDER BY p.name`,
  );
  const data = rows.map((r: any) => {
    const onHand = Number(r.on_hand);
    const latestCost = Number(r.latest_cost);
    let value = onHand * latestCost;
    return {
      id: r.id, name: r.name, category: r.category, unit: r.stock_unit,
      onHand, latestCost, costUnit: r.cost_unit, value: +value.toFixed(2),
    };
  });
  const totalValue = data.reduce((s, r) => s + r.value, 0);
  res.json({ items: data, totalValue: +totalValue.toFixed(2) });
});

reportsRouter.get('/valuation.csv', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category, p.stock_unit, p.bottle_size_ml,
            COALESCE(SUM(m.amount),0)::numeric AS on_hand,
            COALESCE((
              SELECT ps.purchase_price
              FROM product_suppliers ps
              WHERE ps.product_id = p.id AND ps.effective_to IS NULL
              ORDER BY ps.is_preferred DESC, ps.purchase_price ASC
              LIMIT 1
            ), 0) AS latest_cost
       FROM products p
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE p.is_active
      GROUP BY p.id, p.name, p.category, p.stock_unit, p.bottle_size_ml
      HAVING COALESCE(SUM(m.amount),0) > 0
      ORDER BY p.name`,
  );
  const data = rows.map((r: any) => {
    const onHand = Number(r.on_hand);
    const latestCost = Number(r.latest_cost);
    const value = onHand * latestCost;
    return { name: r.name, category: r.category, unit: r.stock_unit, onHand, latestCost, value: +value.toFixed(2) };
  });
  const totalValue = data.reduce((s, r) => s + r.value, 0);
  const csv = toCsv(
    ['product', 'category', 'unit', 'on_hand', 'latest_cost', 'value'],
    [...data.map(r => ({ ...r })), { product: 'TOTAL', category: '', unit: '', onHand: '', latestCost: '', value: +totalValue.toFixed(2) }],
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="inventory-valuation.csv"`);
  res.send('\uFEFF' + csv);
});

// Stock health report
reportsRouter.get('/stock-health', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category, p.stock_unit, p.reorder_level, p.bottle_size_ml,
            COALESCE(SUM(m.amount),0)::numeric AS on_hand,
            COALESCE((
              SELECT ps.purchase_price
              FROM product_suppliers ps
              WHERE ps.product_id = p.id AND ps.effective_to IS NULL
              ORDER BY ps.is_preferred DESC, ps.purchase_price ASC
              LIMIT 1
            ), 0) AS latest_cost
       FROM products p
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE p.is_active
      GROUP BY p.id, p.name, p.category, p.stock_unit, p.reorder_level, p.bottle_size_ml
      ORDER BY p.name`,
  );
  const data = rows.map((r: any) => {
    const onHand = Number(r.on_hand);
    const reorder = r.reorder_level ? Number(r.reorder_level) : 0;
    const latestCost = Number(r.latest_cost);
    let status = 'ok';
    if (onHand <= 0) status = 'out_of_stock';
    else if (reorder > 0 && onHand <= reorder) status = 'low_stock';
    else if (reorder > 0 && onHand <= reorder * 1.5) status = 'watch';
    return {
      id: r.id, name: r.name, category: r.category, unit: r.stock_unit,
      onHand, reorderLevel: reorder, latestCost, status,
      needsReorder: reorder > 0 && onHand <= reorder,
    };
  });
  res.json(data);
});

reportsRouter.get('/stock-health.csv', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category, p.stock_unit, p.reorder_level,
            COALESCE(SUM(m.amount),0)::numeric AS on_hand,
            COALESCE((
              SELECT ps.purchase_price
              FROM product_suppliers ps
              WHERE ps.product_id = p.id AND ps.effective_to IS NULL
              ORDER BY ps.is_preferred DESC, ps.purchase_price ASC
              LIMIT 1
            ), 0) AS latest_cost
       FROM products p
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE p.is_active
      GROUP BY p.id, p.name, p.category, p.stock_unit, p.reorder_level
      ORDER BY p.name`,
  );
  const data = rows.map((r: any) => {
    const onHand = Number(r.on_hand);
    const reorder = r.reorder_level ? Number(r.reorder_level) : 0;
    const latestCost = Number(r.latest_cost);
    let status = 'ok';
    if (onHand <= 0) status = 'out_of_stock';
    else if (reorder > 0 && onHand <= reorder) status = 'low_stock';
    else if (reorder > 0 && onHand <= reorder * 1.5) status = 'watch';
    return {
      product: r.name, category: r.category, unit: r.stock_unit,
      onHand, reorderLevel: reorder, latestCost, status,
    };
  });
  const csv = toCsv(
    ['product', 'category', 'unit', 'on_hand', 'reorder_level', 'latest_cost', 'status'],
    data,
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="stock-health.csv"`);
  res.send('\uFEFF' + csv);
});
