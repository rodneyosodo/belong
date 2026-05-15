import { Pool } from 'pg';

export const pool = new Pool({
  connectionString:
    (Bun.env.BELONG_DB_URI as string) || 'postgresql://belong:belong@localhost:5432/belong',
});
