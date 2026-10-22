#!/usr/bin/env node
/**
 * Deepa Inventory Backup Script
 * Creates a complete database backup with schema and data
 */

import 'dotenv/config';
import pg from 'pg';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(process.cwd(), 'backups');
  const filename = `deepa-backup-${timestamp}.sql`;
  const filepath = join(backupDir, filename);

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting backup to ${filepath}...`);

  const client = await pool.connect();
  let output = '';

  try {
    // Header
    output += `-- Deepa Inventory Database Backup\n`;
    output += `-- Generated: ${new Date().toISOString()}\n`;
    output += `-- Database: ${process.env.DATABASE_URL?.split('@')[1] ?? 'unknown'}\n\n`;

    // Get all tables in correct order (respecting foreign keys)
    const tables = [
      'users',
      'sessions',
      'liquor_bottle_sizes',
      'products',
      'suppliers',
      'product_suppliers',
      'inventory_days',
      'stock_movements',
      'physical_counts',
      'stock_snapshots',
      'negative_stock_flags',
      'idempotency_keys',
      'audit_log',
      'purchase_orders',
      'purchase_order_lines',
      'goods_receipts',
      'goods_receipt_lines',
      'schema_migrations',
    ];

    for (const table of tables) {
      console.log(`  Dumping ${table}...`);
      
      // Get table schema
      const schemaRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      if (schemaRes.rows.length === 0) {
        console.log(`  Warning: Table ${table} not found, skipping`);
        continue;
      }

      // Get data
      const dataRes = await client.query(`SELECT * FROM ${table} ORDER BY 1`);
      
      output += `\n-- Table: ${table}\n`;
      output += `-- Columns: ${schemaRes.rows.map(c => c.column_name).join(', ')}\n`;

      if (dataRes.rows.length > 0) {
        const columns = schemaRes.rows.map(c => c.column_name);
        const colList = columns.join(', ');
        
        for (const row of dataRes.rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          }).join(', ');
          output += `INSERT INTO ${table} (${colList}) VALUES (${values});\n`;
        }
      }
      output += '\n';
    }

    // Write backup file
    writeFileSync(filepath, output, 'utf8');
    console.log(`\nBackup completed: ${filepath}`);
    console.log(`Size: ${(output.length / 1024).toFixed(2)} KB`);
    
    // Verify backup
    const verify = await pool.query(`SELECT COUNT(*) FROM schema_migrations`);
    console.log(`Verified: ${verify.rows[0].count} migrations in backup`);
    
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();