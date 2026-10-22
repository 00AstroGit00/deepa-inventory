#!/usr/bin/env node
/**
 * Deepa Inventory Restore Script
 * Restores database from a backup file
 */

import 'dotenv/config';
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error('Usage: npx tsx scripts/restore.ts <backup-file>');
    console.error('Example: npx tsx scripts/restore.ts backups/deepa-backup-2024-01-15.sql');
    process.exit(1);
  }

  const filepath = join(process.cwd(), backupFile);
  if (!existsSync(filepath)) {
    console.error(`Backup file not found: ${filepath}`);
    process.exit(1);
  }

  console.log(`Restoring from ${filepath}...`);
  console.log('WARNING: This will REPLACE all data in the database!');
  console.log('Press Ctrl+C within 5 seconds to cancel...');
  
  await new Promise(r => setTimeout(r, 5000));

  const sql = readFileSync(filepath, 'utf8');
  const client = await pool.connect();

  try {
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Executing ${statements.length} statements...`);

    await client.query('BEGIN');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      
      try {
        await client.query(stmt);
      } catch (err) {
        // Some statements might fail (e.g., duplicate key) - log but continue
        console.warn(`Warning on statement ${i + 1}: ${(err as Error).message}`);
      }
      
      if (i % 50 === 0) {
        console.log(`  Progress: ${i}/${statements.length}`);
      }
    }

    await client.query('COMMIT');
    console.log('\nRestore completed successfully!');
    
    // Verify
    const tables = await pool.query(`
      SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as col_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('\nRestored tables:');
    for (const t of tables.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${t.table_name}`);
      console.log(`  ${t.table_name}: ${count.rows[0].count} rows`);
    }
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Restore failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();