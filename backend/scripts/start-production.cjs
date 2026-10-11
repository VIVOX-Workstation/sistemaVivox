const { Client } = require('pg');
const { readdirSync } = require('node:fs');
const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');

const prisma = path.resolve('node_modules/prisma/build/index.js');

function runPrisma(args, capture = false) {
  const result = spawnSync(process.execPath, [prisma, ...args], {
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Prisma ${args[0]} ${args[1]} failed.`);
  return result.stdout;
}

async function bootstrapEmptyDatabase() {
  if (process.env.BOOTSTRAP_EMPTY_DATABASE !== 'true') return;
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    // Keep simultaneous first deployments from bootstrapping the same database.
    await db.query('SELECT pg_advisory_lock(821674310)');
    const tables = await db.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    const hasMarker = tables.rows.some(row => row.tablename === '_vivox_bootstrap');
    let migrations;
    if (hasMarker) {
      // Resume only the exact migration snapshot recorded before an interrupted bootstrap.
      const marker = await db.query('SELECT migrations FROM "_vivox_bootstrap"');
      migrations = marker.rows[0].migrations;
    } else if (tables.rows.length === 0) {
      migrations = readdirSync('prisma/migrations', { withFileTypes: true })
        .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
      // Historical migrations omit changes made with db push. A fresh installation
      // therefore starts from the complete current schema, without touching existing DBs.
      const sql = runPrisma([
        'migrate', 'diff', '--from-empty', '--to-schema-datamodel',
        'prisma/schema.prisma', '--script',
      ], true);
      await db.query('BEGIN');
      try {
        await db.query(sql);
        await db.query('CREATE TABLE "_vivox_bootstrap" (migrations JSONB NOT NULL)');
        await db.query('INSERT INTO "_vivox_bootstrap" VALUES ($1)', [JSON.stringify(migrations)]);
        await db.query('COMMIT');
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
      console.log('Initialized complete schema in empty database.');
    } else {
      console.log('Existing database detected; applying normal migrations only.');
      return;
    }

    const migrationTable = await db.query("SELECT to_regclass('public._prisma_migrations') AS name");
    const applied = migrationTable.rows[0].name
      ? await db.query('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')
      : { rows: [] };
    const appliedNames = new Set(applied.rows.map(row => row.migration_name));
    for (const migration of migrations) {
      if (!appliedNames.has(migration)) runPrisma(['migrate', 'resolve', '--applied', migration]);
    }
    await db.query('DROP TABLE "_vivox_bootstrap"');
    console.log('Fresh database migration baseline completed.');
  } finally {
    await db.query('SELECT pg_advisory_unlock(821674310)').catch(() => {});
    await db.end();
  }
}

async function main() {
  await bootstrapEmptyDatabase();
  runPrisma(['migrate', 'deploy']);
  const app = spawn(process.execPath, ['dist/src/main'], { stdio: 'inherit' });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => app.kill(signal));
  app.on('error', error => { console.error(error.message); process.exit(1); });
  app.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
