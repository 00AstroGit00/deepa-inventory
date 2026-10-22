import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const dir = join(process.cwd(), 'migrations');
  const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const { rowCount } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (rowCount) { console.log(`skip  ${version}`); continue; }
    const sql = readFileSync(join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await client.query('COMMIT');
      console.log(`apply ${version}`);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`FAIL  ${version}`, e);
      process.exit(1);
    } finally {
      client.release();
    }
  }
  await pool.end();
}
main();
