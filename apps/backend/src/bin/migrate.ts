/* eslint-disable no-console */
import { runMigrations } from '../lib/migrate';

const main = async () => {
  console.log('Running migrations...');
  await runMigrations();
  console.log('Migrations complete.');
  process.exit(0);
};

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
