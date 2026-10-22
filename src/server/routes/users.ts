import { Router } from 'express';
import { pool, withTransaction } from '../db';
import { requireAuth, requireRole } from '../auth';
import { HttpError } from '../errors';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const usersRouter = Router();
usersRouter.use(requireAuth);
usersRouter.use(requireRole('admin'));

const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(['admin', 'manager', 'counter']).default('counter'),
});

const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).max(200).optional(),
  role: z.enum(['admin', 'manager', 'counter']).optional(),
  is_active: z.boolean().optional(),
});

usersRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC`,
  );
  res.json(rows);
});

usersRouter.post('/', async (req, res) => {
  const u = UserCreateSchema.parse(req.body);
  const { rows } = await withTransaction(async (c) => {
    const hash = await bcrypt.hash(u.password, 12);
    const ins = await c.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3) RETURNING id`,
      [u.email, hash, u.role],
    );
    const id = ins.rows[0].id;
    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, new_state)
       VALUES ($1,'user',$2,'create',$3)`,
      [req.user!.id, id, JSON.stringify({ email: u.email, role: u.role })],
    );
    return ins;
  });
  res.status(201).json({ id: rows[0].id });
});

usersRouter.patch('/:id', async (req, res) => {
  const u = UserUpdateSchema.parse(req.body);
  const id = req.params.id;
  await withTransaction(async (c) => {
    const prior = await c.query('SELECT id, email, role, is_active FROM users WHERE id=$1', [id]);
    if (!prior.rows[0]) throw new HttpError(404, 'User not found');
    if (prior.rows[0].id === req.user!.id && u.is_active === false) {
      throw new HttpError(400, 'Cannot deactivate yourself');
    }
    if (prior.rows[0].id === req.user!.id && u.role && u.role !== 'admin') {
      throw new HttpError(400, 'Cannot change your own admin role');
    }
    const fields = Object.keys(u);
    if (fields.length === 0) return;
    const values: any[] = [id];
    let idx = 2;
    const sets = fields.map((f) => {
      const col = f === 'is_active' ? 'is_active' : f === 'password' ? 'password_hash' : f;
      const val = f === 'password' ? bcrypt.hashSync(u.password ?? '', 12) : (u as Record<string, unknown>)[f];
      values.push(val);
      return `${col} = $${idx++}`;
    }).join(', ');
    await c.query(
      `UPDATE users SET ${sets}, updated_at = now() WHERE id = $1`,
      values,
    );
    await c.query(
      `INSERT INTO audit_log
        (actor_id, entity_type, entity_id, operation, previous_state, new_state)
       VALUES ($1,'user',$2,'update',$3,$4)`,
      [req.user!.id, id, JSON.stringify(prior.rows[0]), JSON.stringify(u)],
    );
  });
  res.json({ ok: true });
});

usersRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (id === req.user!.id) throw new HttpError(400, 'Cannot delete yourself');
  await withTransaction(async (c) => {
    const prior = await c.query('SELECT id, email, role FROM users WHERE id=$1', [id]);
    if (!prior.rows[0]) throw new HttpError(404, 'User not found');
    await c.query('DELETE FROM users WHERE id=$1', [id]);
    await c.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, operation, previous_state)
       VALUES ($1,'user',$2,'delete',$3)`,
      [req.user!.id, id, JSON.stringify(prior.rows[0])],
    );
  });
  res.json({ ok: true });
});