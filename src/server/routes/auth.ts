import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { pool } from '../db';
import { LoginSchema } from '../../shared/schemas';
import {
  BCRYPT_ROUNDS, DUMMY_HASH, createSession, destroySession, requireAuth,
} from '../auth';
import { HttpError } from '../errors';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60_000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false,
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body);
  const { rows } = await pool.query(
    'SELECT id, password_hash, role, is_active FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok || !user.is_active) {
    throw new HttpError(401, 'Invalid credentials');
  }
  const token = await createSession(user.id);
  res.cookie('sid', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: Number(process.env.SESSION_TTL_HOURS ?? 12) * 3_600_000,
  });
  res.json({ id: user.id, email, role: user.role });
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  const token = req.cookies?.sid;
  if (token) await destroySession(token);
  res.clearCookie('sid').json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

authRouter.post('/change-password', requireAuth, async (req, res) => {
  const current = String(req.body?.currentPassword ?? '');
  const next = String(req.body?.newPassword ?? '');
  if (next.length < 12) throw new HttpError(400, 'New password must be at least 12 characters');
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user!.id]);
  if (!(await bcrypt.compare(current, rows[0].password_hash))) {
    throw new HttpError(401, 'Current password is incorrect');
  }
  const hash = await bcrypt.hash(next, BCRYPT_ROUNDS);
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user!.id]);
  await pool.query('DELETE FROM sessions WHERE user_id=$1', [req.user!.id]);
  res.clearCookie('sid').json({ ok: true, reauthRequired: true });
});
