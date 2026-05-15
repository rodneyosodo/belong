import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { pool } from './db';

const migrationsDir = join(import.meta.dir, '../../migrations');
const completedTable = 'migrations';

const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

export async function runMigrations() {
  await pool.query(
    `create table if not exists "${completedTable}" ("name" text primary key, "run_at" timestamptz not null default current_timestamp)`,
  );

  const { rows: completed } = await pool.query(
    `select "name" from "${completedTable}"`,
  );
  const completedNames = new Set(completed.map((r: { name: string }) => r.name));

  for (const file of migrations) {
    if (completedNames.has(file)) {
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf-8');

    await pool.query('begin');

    try {
      await pool.query(sql);
      await pool.query(`insert into "${completedTable}" ("name") values ($1)`, [file]);
      await pool.query('commit');
      console.log(`  ✓ ${file}`);
    } catch (err) {
      await pool.query('rollback');
      console.error(`  ✗ ${file}:`, err);
      throw err;
    }
  }
}
