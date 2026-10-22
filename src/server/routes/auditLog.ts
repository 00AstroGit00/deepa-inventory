import { Router } from 'express';
import { pool } from '../db';
import { requireAuth, requireRole } from '../auth';
import { HttpError } from '../errors';

export const auditLogRouter = Router();
auditLogRouter.use(requireAuth);

auditLogRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize ?? 50)));
  const entityType = String(req.query.entityType ?? '');
  const operation = String(req.query.operation ?? '');
  const actorEmail = String(req.query.actorEmail ?? '');
  const dateFrom = String(req.query.dateFrom ?? '');
  const dateTo = String(req.query.dateTo ?? '');

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let idx = 1;

  if (entityType) { conditions.push(`al.entity_type = $${idx++}`); params.push(entityType); }
  if (operation) { conditions.push(`al.operation = $${idx++}`); params.push(operation); }
  if (actorEmail) { conditions.push(`u.email ILIKE $${idx++}`); params.push(`%${actorEmail}%`); }
  if (dateFrom) { conditions.push(`al.occurred_at >= $${idx++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`al.occurred_at <= $${idx++}`); params.push(`${dateTo} 23:59:59`); }

  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await pool.query(
    `SELECT al.id, al.actor_id, u.email as actor_email, al.occurred_at, al.entity_type,
            al.entity_id, al.operation, al.previous_state, al.new_state, al.reason,
            al.operation_id, al.prev_hash, al.row_hash
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.actor_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY al.id DESC
      LIMIT $${idx++} OFFSET $${idx}`,
    params,
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM audit_log al LEFT JOIN users u ON u.id = al.actor_id WHERE ${conditions.join(' AND ')}`,
    params.slice(0, idx - 3),
  );

  res.json({ entries: rows, total: countRows[0].total, page, pageSize });
});