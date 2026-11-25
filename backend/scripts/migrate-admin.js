import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';

try {
  const migrationPath = fileURLToPath(new URL('../../database/admin-panel.sql', import.meta.url));
  const migration = await readFile(migrationPath, 'utf8');
  const statements = migration.split(';').map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await pool.query(statement);
  console.log('Admin tables are ready.');
} catch (error) {
  console.error('Admin database migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
