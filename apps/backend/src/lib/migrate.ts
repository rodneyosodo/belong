import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { pool } from './db';

const migrationDirs = [
  join(import.meta.dir, '../../better-auth_migrations'),
  join(import.meta.dir, '../../migrations'),
];

const completedTable = 'migrations';

function loadMigrations() {
  const files: { name: string; dir: string }[] = [];

  for (const dir of migrationDirs) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.sql')) {
        files.push({ name: f, dir });
      }
    }
  }

  files.sort((a, b) => {
    const dirOrder = migrationDirs.indexOf(a.dir) - migrationDirs.indexOf(b.dir);
    if (dirOrder !== 0) return dirOrder;
    return a.name.localeCompare(b.name);
  });
  return files;
}

export async function runMigrations() {
  await pool.query(
    `create table if not exists "${completedTable}" ("name" text primary key, "run_at" timestamptz not null default current_timestamp)`,
  );

  const { rows: completed } = await pool.query(`select "name" from "${completedTable}"`);
  const completedNames = new Set(completed.map((r: { name: string }) => r.name));

  const migrations = loadMigrations();

  for (const { name, dir } of migrations) {
    if (completedNames.has(name)) {
      continue;
    }

    const sql = readFileSync(join(dir, name), 'utf-8');

    try {
      await pool.query('begin');
      await pool.query(sql);
      await pool.query(`insert into "${completedTable}" ("name") values ($1)`, [name]);
      await pool.query('commit');
      console.log(`  ✓ ${name}`);
    } catch (err) {
      await pool.query('rollback').catch(() => {});
      console.error(`  ✗ ${name}:`, err);
    }
  }
}
