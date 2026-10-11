// Explicit test URL required. Only disposable databases created by this test
// are changed; the supplied connection's database is never reset or migrated.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync, readdirSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
const { bootstrapEmptyDatabase } = require('./start-production.cjs');

const repair = readFileSync('prisma/migrations/20261011010000_repair_sync_bootstrap/migration.sql', 'utf8');
const testUrl = process.env.SYNC_BOOTSTRAP_TEST_DATABASE_URL;
if (!testUrl) throw new Error('Set SYNC_BOOTSTRAP_TEST_DATABASE_URL to an isolated PostgreSQL instance.');
const admin = new Client({ connectionString: testUrl });
const databases = [];

async function database() {
  const name = 'test_sync_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE DATABASE "${name}"`);
  databases.push(name);
  const url = new URL(testUrl);
  url.pathname = '/' + name;
  const db = new Client({ connectionString: url.toString() });
  await db.connect();
  return { db, url: url.toString() };
}

async function expectSqlError(db, sql, code) {
  await assert.rejects(db.query(sql), error => error.code === code);
}

async function main() {
  await admin.connect();
  const existing = await database();
  try {
    // Reproduce the old bootstrap: current schema, no migration seeds/triggers.
    const schema = execFileSync(process.execPath, ['node_modules/prisma/build/index.js',
      'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { encoding: 'utf8' });
    await existing.db.query(schema);
    await existing.db.query(`INSERT INTO "Tarefa" ("id","titulo","status","updatedAt","horasGastas") VALUES
      ('legacy-done','Existing completed task','CONCLUIDA',CURRENT_TIMESTAMP,2.5),
      ('legacy-custom','Existing custom task','ETAPA_CLIENTE',CURRENT_TIMESTAMP,1)`);
    await existing.db.query(repair);
    const tasks = (await existing.db.query('SELECT "id","quadroId","numero","status","horasGastas","colunaId" FROM "Tarefa" ORDER BY "id"')).rows;
    assert.equal(tasks.length, 2);
    assert(tasks.every(t => t.quadroId === 'vivox-sync-diario' && t.numero > 0));
    assert.equal(new Set(tasks.map(t => t.numero)).size, 2);
    assert.equal(tasks.find(t => t.id === 'legacy-done').horasGastas, 2.5);
    assert.equal(tasks.find(t => t.id === 'legacy-done').colunaId, 'sync-done');
    assert.equal(tasks.find(t => t.id === 'legacy-custom').status, 'ETAPA_CLIENTE');

    // Imports must receive their board, appropriate stage and a new number.
    await existing.db.query(`INSERT INTO "Tarefa" ("id","titulo","status","updatedAt")
      VALUES ('imported','New imported task','A_FAZER',CURRENT_TIMESTAMP)`);
    const imported = (await existing.db.query('SELECT * FROM "Tarefa" WHERE "id"=\'imported\'')).rows[0];
    assert.equal(imported.quadroId, 'vivox-sync-diario');
    assert.equal(imported.colunaId, 'sync-afazer');
    assert.equal(imported.numero, 3);
    // Existing customized boards and numbering are untouched on reapplication.
    await existing.db.query(`INSERT INTO "KanbanQuadro" ("id","nome","updatedAt") VALUES ('custom-board','Team board',CURRENT_TIMESTAMP);
      INSERT INTO "KanbanColuna" ("id","quadroId","nome") VALUES ('custom-column','custom-board','Custom stage');
      INSERT INTO "Tarefa" ("id","titulo","quadroId","colunaId","updatedAt") VALUES ('custom-task','Custom task','custom-board','custom-column',CURRENT_TIMESTAMP);
      UPDATE "KanbanQuadro" SET "proximoNumero"=100 WHERE "id"='vivox-sync-diario'`);
    const before = (await existing.db.query('SELECT * FROM "Tarefa" ORDER BY "id"')).rows;
    await existing.db.query(repair);
    assert.deepEqual((await existing.db.query('SELECT * FROM "Tarefa" ORDER BY "id"')).rows, before);
    assert.equal((await existing.db.query('SELECT "proximoNumero" FROM "KanbanQuadro" WHERE "id"=\'vivox-sync-diario\'')).rows[0].proximoNumero, 100);
    await expectSqlError(existing.db, `INSERT INTO "KanbanQuadro" ("id","nome","fixo","updatedAt") VALUES ('duplicate-fixed','Invalid',true,CURRENT_TIMESTAMP)`, '23505');
    await expectSqlError(existing.db, `INSERT INTO "KanbanColuna" ("id","quadroId","nome","papel") VALUES ('duplicate-doing','vivox-sync-diario','Invalid','doing')`, '23505');
    await expectSqlError(existing.db, `INSERT INTO "KanbanColuna" ("id","quadroId","nome","papel") VALUES ('invalid-role','vivox-sync-diario','Invalid','invalid')`, '23514');
    await expectSqlError(existing.db, `INSERT INTO "Tarefa" ("id","titulo","quadroId","colunaId","updatedAt") VALUES ('cross-board','Invalid','custom-board','sync-doing',CURRENT_TIMESTAMP)`, 'P0001');
    await existing.db.query(`INSERT INTO "User" ("id","nome","email","senha","updatedAt") VALUES ('test-user','Test','test@example.invalid','test',CURRENT_TIMESTAMP);
      INSERT INTO "TarefaSessao" ("id","tarefaId","usuarioId","autorId") VALUES ('timer-one','imported','test-user','test-user')`);
    await expectSqlError(existing.db, `INSERT INTO "TarefaSessao" ("id","tarefaId","usuarioId","autorId") VALUES ('timer-two','legacy-done','test-user','test-user')`, '23505');
    console.log('PASS: legacy data preserved, repair idempotent, imports assigned, board/column/timer constraints enforced.');
  } finally {
    await existing.db.end();
  }

  const fresh = await database();
  try {
    process.env.DATABASE_URL = fresh.url;
    process.env.BOOTSTRAP_EMPTY_DATABASE = 'true';
    await bootstrapEmptyDatabase();
    assert.equal((await fresh.db.query('SELECT count(*)::int AS n FROM "KanbanQuadro"')).rows[0].n, 1);
    assert.equal((await fresh.db.query('SELECT count(*)::int AS n FROM "KanbanColuna"')).rows[0].n, 5);
    const expected = readdirSync('prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).length;
    assert.equal((await fresh.db.query('SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')).rows[0].n, expected);
    assert.equal((await fresh.db.query("SELECT to_regclass('public._vivox_bootstrap') AS marker")).rows[0].marker, null);
    await fresh.db.query(`INSERT INTO "Tarefa" ("id","titulo","updatedAt") VALUES ('fresh-import','Fresh import',CURRENT_TIMESTAMP)`);
    assert.equal((await fresh.db.query('SELECT "numero" FROM "Tarefa" WHERE "id"=\'fresh-import\'')).rows[0].numero, 1);
    await bootstrapEmptyDatabase();
    assert.equal((await fresh.db.query('SELECT count(*)::int AS n FROM "KanbanQuadro"')).rows[0].n, 1);
    console.log('PASS: full fresh bootstrap creates the default board, columns and trigger, records migrations and safely restarts.');
  } finally {
    await fresh.db.end();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  for (const name of databases) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  await admin.end();
});
