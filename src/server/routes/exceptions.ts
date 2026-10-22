import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { requireAuth, requireRole } from '../auth.js';
import { z } from 'zod';

const exceptionsRouter = Router();

// Validation schemas
const AddNoteSchema = z.object({ note: z.string().min(1).max(2000) });
const UpdateExceptionStateSchema = z.object({ state: z.enum(['open', 'investigating', 'resolved', 'dismissed']) });
const ResolveExceptionSchema = z.object({
  resolutionType: z.enum(['count_error', 'spillage', 'theft', 'complimentary', 'waste', 'other']),
  resolutionNotes: z.string().max(2000).optional(),
});
const CorrectExceptionSchema = z.object({
  adjustmentAmount: z.number(),
  adjustmentUnit: z.string(),
  adjustmentReason: z.string().max(500),
});
const AssignExceptionSchema = z.object({ assignedTo: z.string().uuid() });

// GET /api/exceptions
exceptionsRouter.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 25, 100);
  const inventoryDayId = req.query.inventoryDayId as string | undefined;
  const state = req.query.state as string | undefined;
  const severity = req.query.severity as string | undefined;
  const classification = req.query.classification as string | undefined;
  const search = req.query.search as string | undefined;
  const sortBy = (req.query.sortBy as string) || 'created_at';
  const sortOrder = (req.query.sortOrder as string) || 'desc';

  const allowedSort = ['created_at', 'severity', 'state', 'variance_qty', 'estimated_financial_impact', 'product_name'];
  const allowedOrder = ['asc', 'desc'];

  const orderBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const orderDir = allowedOrder.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

  const conditions: string[] = [];
  const params: any[] = [];

  if (inventoryDayId) {
    conditions.push(`e.inventory_day_id = $${params.length + 1}`);
    params.push(inventoryDayId);
  }
  if (state) {
    conditions.push(`e.state = $${params.length + 1}`);
    params.push(state);
  }
  if (severity) {
    conditions.push(`e.severity = $${params.length + 1}`);
    params.push(severity);
  }
  if (classification) {
    conditions.push(`e.classification = $${params.length + 1}`);
    params.push(classification);
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${params.length + 1} OR e.id::text ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderByClause = `${orderBy} ${orderDir}`;

  const countQuery = `
    SELECT COUNT(*) FROM inventory_exceptions e
    JOIN products p ON p.id = e.product_id
    ${whereClause}
  `;
  const { rows: countRows } = await pool.query(countQuery, params);
  const total = Number(countRows[0].count);

  let idx = params.length + 1;
  const dataQuery = `
    SELECT
      e.id,
      e.inventory_day_id,
      e.product_id,
      e.classification,
      e.severity,
      e.opening_qty,
      e.expected_closing_qty,
      e.physical_qty,
      e.variance_qty,
      e.unit,
      e.unit_cost,
      e.cost_unit,
      e.estimated_financial_impact,
      e.expected_closing_movements,
      e.recorded_losses,
      e.physical_count_record,
      e.recurrence_count,
      e.first_detected_date,
      e.last_detected_date,
      e.state,
      e.assigned_to,
      e.assigned_at,
      e.first_reviewed_at,
      e.resolved_at,
      e.resolved_by,
      e.resolution_type,
      e.resolution_notes,
      e.created_at,
      e.updated_at,
      u.email as assigned_to_email,
      p.name as product_name,
      p.category,
      p.bottle_size_ml,
      p.package_size_amount,
      p.package_size_unit,
      p.reorder_level
    FROM inventory_exceptions e
    JOIN products p ON p.id = e.product_id
    LEFT JOIN users u ON u.id = e.assigned_to
    ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $${idx++} OFFSET $${idx}
  `;

  params.push(pageSize, (page - 1) * pageSize);
  const { rows } = await pool.query(dataQuery, params);

  const exceptions = rows.map((r: any) => ({
    id: r.id,
    inventoryDayId: r.inventory_day_id,
    productId: r.product_id,
    productName: r.product_name,
    category: r.category,
    classification: r.classification,
    severity: r.severity,
    state: r.state,
    openingQty: Number(r.opening_qty),
    expectedClosingQty: Number(r.expected_closing_qty),
    physicalQty: r.physical_qty ? Number(r.physical_qty) : null,
    varianceQty: r.variance_qty ? Number(r.variance_qty) : null,
    unit: r.unit,
    unitCost: r.unit_cost ? Number(r.unit_cost) : undefined,
    costUnit: r.cost_unit,
    estimatedFinancialImpact: r.estimated_financial_impact ? Number(r.estimated_financial_impact) : undefined,
    expectedClosingMovements: r.expected_closing_movements,
    recordedLosses: r.recorded_losses,
    physicalCountRecord: r.physical_count_record,
    recurrenceCount: Number(r.recurrence_count),
    firstDetectedDate: new Date(r.first_detected_date),
    lastDetectedDate: new Date(r.last_detected_date),
    assignedTo: r.assigned_to,
    assignedAt: r.assigned_at ? new Date(r.assigned_at) : undefined,
    firstReviewedAt: r.first_reviewed_at ? new Date(r.first_reviewed_at) : undefined,
    resolvedAt: r.resolved_at ? new Date(r.resolved_at) : undefined,
    resolvedBy: r.resolved_by,
    resolutionType: r.resolution_type,
    resolutionNotes: r.resolution_notes,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    assignedToEmail: r.assigned_to_email,
    bottleSizeMl: r.bottle_size_ml,
    packageSizeAmount: r.package_size_amount ? Number(r.package_size_amount) : undefined,
    packageSizeUnit: r.package_size_unit,
    reorderLevel: r.reorder_level ? Number(r.reorder_level) : undefined,
  }));

  res.json({
    items: exceptions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// GET /api/exceptions/:id
exceptionsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT
      e.*,
      p.name as product_name,
      p.category,
      p.bottle_size_ml,
      p.package_size_amount,
      p.package_size_unit,
      p.reorder_level,
      u.email as assigned_to_email
    FROM inventory_exceptions e
    JOIN products p ON p.id = e.product_id
    LEFT JOIN users u ON u.id = e.assigned_to
    WHERE e.id = $1`,
    [id]
  );

  if (rows.length === 0) {
    throw new HttpError(404, 'Exception not found');
  }

  const r = rows[0];
  const exception = {
    id: r.id,
    inventoryDayId: r.inventory_day_id,
    productId: r.product_id,
    productName: r.product_name,
    category: r.category,
    classification: r.classification,
    severity: r.severity,
    state: r.state,
    openingQty: Number(r.opening_qty),
    expectedClosingQty: Number(r.expected_closing_qty),
    physicalQty: r.physical_qty ? Number(r.physical_qty) : null,
    varianceQty: r.variance_qty ? Number(r.variance_qty) : null,
    unit: r.unit,
    unitCost: r.unit_cost ? Number(r.unit_cost) : undefined,
    costUnit: r.cost_unit,
    estimatedFinancialImpact: r.estimated_financial_impact ? Number(r.estimated_financial_impact) : undefined,
    expectedClosingMovements: r.expected_closing_movements,
    recordedLosses: r.recorded_losses,
    physicalCountRecord: r.physical_count_record,
    recurrenceCount: Number(r.recurrence_count),
    firstDetectedDate: new Date(r.first_detected_date),
    lastDetectedDate: new Date(r.last_detected_date),
    assignedTo: r.assigned_to,
    assignedAt: r.assigned_at ? new Date(r.assigned_at) : undefined,
    firstReviewedAt: r.first_reviewed_at ? new Date(r.first_reviewed_at) : undefined,
    resolvedAt: r.resolved_at ? new Date(r.resolved_at) : undefined,
    resolvedBy: r.resolved_by,
    resolutionType: r.resolution_type,
    resolutionNotes: r.resolution_notes,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    assignedToEmail: r.assigned_to_email,
    bottleSizeMl: r.bottle_size_ml,
    packageSizeAmount: r.package_size_amount ? Number(r.package_size_amount) : undefined,
    packageSizeUnit: r.package_size_unit,
    reorderLevel: r.reorder_level ? Number(r.reorder_level) : undefined,
  };

  res.json(exception);
});

// GET /api/exceptions/:id/history
exceptionsRouter.get('/:id/history', async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT h.*, u.email as changed_by_email
     FROM exception_status_history h
     LEFT JOIN users u ON u.id = h.changed_by
     WHERE h.exception_id = $1
     ORDER BY h.created_at DESC`,
    [id]
  );
  res.json(rows);
});

// GET /api/exceptions/:id/notes
exceptionsRouter.get('/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT n.*, u.email as author_email
     FROM exception_investigation_notes n
     LEFT JOIN users u ON u.id = n.author_id
     WHERE n.exception_id = $1
     ORDER BY n.created_at DESC`,
    [id]
  );
  res.json(rows);
});

// POST /api/exceptions/:id/notes
exceptionsRouter.post('/:id/notes', requireRole('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  const { note } = AddNoteSchema.parse(req.body);

  await pool.query(
    `INSERT INTO exception_investigation_notes (exception_id, note, author_id)
     VALUES ($1, $2, $3)`,
    [id, note, req.user!.id]
  );

  await pool.query('UPDATE inventory_exceptions SET updated_at = now(), updated_by = $1 WHERE id = $2', [req.user!.id, id]);

  res.status(201).json({ ok: true });
});

// PATCH /api/exceptions/:id/state
exceptionsRouter.patch('/:id/state', requireRole('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  const { state } = UpdateExceptionStateSchema.parse(req.body);

  const { rows } = await pool.query(
    `UPDATE inventory_exceptions
     SET state = $1, updated_at = now(), updated_by = $2
     WHERE id = $3
     RETURNING *`,
    [state, req.user!.id, id]
  );

  if (rows.length === 0) throw new HttpError(404, 'Exception not found');

  await pool.query(
    `INSERT INTO exception_status_history (exception_id, old_state, new_state, changed_by, change_reason)
     SELECT $1, state, $2, $3, 'State changed via API'
     FROM inventory_exceptions WHERE id = $1`,
    [req.params.id, state, req.user!.id]
  );

  res.json({ ok: true });
});

// POST /api/exceptions/:id/resolve
exceptionsRouter.post('/:id/resolve', requireRole('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  const { resolutionType, resolutionNotes } = ResolveExceptionSchema.parse(req.body);

  await pool.query('SELECT resolve_inventory_exception($1, $2, $2, $3)', [id, req.user!.id, resolutionType, resolutionNotes]);
  res.json({ ok: true });
});

// POST /api/exceptions/:id/correct
exceptionsRouter.post('/:id/correct', requireRole('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  const { adjustmentAmount, adjustmentUnit, adjustmentReason } = CorrectExceptionSchema.parse(req.body);

  await pool.query('SELECT correct_inventory_exception($1, $2, $3, $4, $5)', [id, req.user!.id, adjustmentAmount, adjustmentUnit, adjustmentReason]);
  res.json({ ok: true });
});

// POST /api/exceptions/:id/assign
exceptionsRouter.post('/:id/assign', requireRole('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = AssignExceptionSchema.parse(req.body);

  await pool.query('SELECT assign_inventory_exception($1, $2, $3)', [id, req.user!.id, assignedTo]);
  res.json({ ok: true });
});

export { exceptionsRouter };
