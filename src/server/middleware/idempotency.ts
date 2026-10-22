import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import { pool } from '../db';

const fingerprintOf = (body: unknown) =>
  createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');

export function idempotency(required = true): RequestHandler {
  return async (req, res, next) => {
    const key = req.header('Idempotency-Key');
    if (!key) {
      if (!required) return next();
      return res.status(400).json({ error: 'Idempotency-Key header required' });
    }
    const fp = fingerprintOf(req.body);
    const claim = await pool.query(
      `INSERT INTO idempotency_keys (key, fingerprint) VALUES ($1,$2)
       ON CONFLICT (key) DO NOTHING RETURNING key`,
      [key, fp],
    );
    if (claim.rowCount === 0) {
      const { rows } = await pool.query(
        `SELECT fingerprint, response_status, response_body FROM idempotency_keys WHERE key=$1`,
        [key],
      );
      const row = rows[0];
      if (!row) return res.status(409).json({ error: 'idempotency_conflict' });
      if (row.fingerprint !== fp) {
        return res.status(422).json({ error: 'idempotency_key_reused_with_different_payload' });
      }
      if (row.response_status === 0) {
        return res.status(409).json({ error: 'request_in_flight' });
      }
      res.setHeader('Idempotency-Replayed', 'true');
      return res.status(row.response_status).json(row.response_body);
    }
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      void pool.query(
        `UPDATE idempotency_keys SET response_status=$2, response_body=$3 WHERE key=$1`,
        [key, res.statusCode, body],
      );
      return originalJson(body);
    };
    next();
  };
}
