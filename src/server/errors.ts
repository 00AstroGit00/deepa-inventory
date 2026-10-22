import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function errorHandler(
  err: unknown, _req: Request, res: Response, _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation_failed', issues: err.issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[unhandled]', err);
  return res.status(500).json({ error: 'internal_error' });
}
