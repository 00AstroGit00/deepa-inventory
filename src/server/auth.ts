import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db';
import { HttpError } from './errors';

export type Role = 'admin' | 'manager' | 'counter';
export interface AuthUser { id: string; email: string; role: Role; }

declare global {
  namespace Express { interface Request { user?: AuthUser } }
}

export const BCRYPT_ROUNDS = 12;

export const DUMMY_HASH =
  '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const ttlHours = Number(process.env.SESSION_TTL_HOURS ?? 12);
  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' hours')::interval)`,
    [userId, hashToken(token), ttlHours],
  );
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.sid;
  if (!token) return next(new HttpError(401, 'unauthenticated'));
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.role FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.is_active`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return next(new HttpError(401, 'unauthenticated'));
  req.user = row as AuthUser;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'unauthenticated'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'forbidden'));
    next();
  };
}
