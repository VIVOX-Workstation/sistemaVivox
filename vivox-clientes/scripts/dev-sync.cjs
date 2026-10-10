#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { parseEnv } = require('node:util');

const frontendDir = path.resolve(__dirname, '..');
const projectDir = path.resolve(frontendDir, '..');
const backendDir = path.join(projectDir, 'backend');
const backendPort = 3001;
const frontendPort = 5174;
const children = new Set();
let stopping = false;
let shutdownPromise;

function localEnvironment() {
  if (typeof parseEnv !== 'function') {
    throw new Error('Use uma versão de Node.js compatível com o projeto: 20.19+ ou 22.12+.');
  }
  let values;
  try {
    values = parseEnv(fs.readFileSync(path.join(projectDir, '.env'), 'utf8'));
  } catch {
    throw new Error('Não foi possível ler o .env na raiz do sistemaVivox. O conteúdo não foi exibido.');
  }
  const env = { ...process.env, ...values };
  let database;
  try {
    database = new URL(env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL ausente ou inválida no ambiente local.');
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol) ||
      !['postgres', 'localhost', '127.0.0.1'].includes(database.hostname.toLowerCase())) {
    throw new Error('dev:sync aceita somente PostgreSQL local (postgres, localhost ou 127.0.0.1). Nenhuma migração foi executada.');
  }
  // Connection parameters must not override the local host through libpq or a service file.
  const forbidden = new Set(['host', 'hostaddr', 'port', 'service', 'servicefile', 'options']);
  if (Array.from(database.searchParams.keys()).some(key => forbidden.has(key.toLowerCase()))) {
    throw new Error('DATABASE_URL contém parâmetros que podem substituir a conexão local. Nenhuma migração foi executada.');
  }
  database.hostname = '127.0.0.1';
  database.port = '5432';
  env.DATABASE_URL = database.href;
  env.HOST = '127.0.0.1';
  env.PORT = String(backendPort);
  env.NODE_ENV = 'development';
  env.REDIS_HOST = '127.0.0.1';
  env.REDIS_PORT = '6379';
  env.S3_ENDPOINT = 'http://127.0.0.1:9000';
  env.S3_PUBLIC_URL = 'http://localhost:9000/' + encodeURIComponent(env.S3_BUCKET || 'vivox-media');
  env.S3_FORCE_PATH_STYLE = 'true';
  env.CORS_ORIGINS = 'http://localhost:5174,http://127.0.0.1:5174';
  env.VITE_API_URL = 'http://localhost:3001';
  for (const key of ['PGHOST', 'PGHOSTADDR', 'PGPORT', 'PGSERVICE', 'PGSERVICEFILE', 'PGOPTIONS']) delete env[key];
  return env;
}

function requireFile(file, hint) {
  if (!fs.existsSync(file)) throw new Error(hint);
  return file;
}

function assertPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', error => {
      reject(new Error(error.code === 'EADDRINUSE'
        ? 'A porta ' + port + ' está ocupada. Encerre a execução anterior nessa porta antes de rodar dev:sync. Nenhum serviço existente foi encerrado.'
        : 'Não foi possível reservar a porta local ' + port + '. Verifique as permissões de rede.'));
    });
    server.listen({ host: '127.0.0.1', port, exclusive: true }, () => server.close(resolve));
  });
}

function spawnNode(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', shell: false, windowsHide: true });
  children.add(child);
  child.once('close', () => children.delete(child));
  return child;
}

function runStep(label, args, cwd, env) {
  if (stopping) return Promise.reject(new Error('Inicialização interrompida.'));
  console.log('[dev:sync] ' + label);
  const child = spawnNode(args, cwd, env);
  return new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error('Não foi possível executar: ' + label + '.')));
    child.once('exit', (code, signal) => code === 0
      ? resolve()
      : reject(new Error(label + ' falhou (' + (signal || 'código ' + code) + ').')));
  });
}

function stopChild(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise(resolve => {
    let finished = false;
    const done = () => { if (!finished) { finished = true; clearTimeout(deadline); resolve(); } };
    child.once('close', done);
    const deadline = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} done(); }, 4000);
    if (process.platform === 'win32') {
      const taskkill = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
      const killer = spawn(taskkill, ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', shell: false });
      killer.once('error', () => { try { child.kill(); } catch {} });
      killer.once('close', () => { if (child.exitCode !== null || child.signalCode !== null) done(); });
    } else {
      try { child.kill('SIGTERM'); } catch { done(); }
    }
  });
}

function shutdown(code) {
  if (shutdownPromise) return shutdownPromise;
  stopping = true;
  shutdownPromise = Promise.all(Array.from(children, stopChild)).then(() => process.exit(code));
  return shutdownPromise;
}

function startService(label, args, cwd, env) {
  const child = spawnNode(args, cwd, env);
  child.once('error', () => {
    if (!stopping) { console.error('[dev:sync] Não foi possível iniciar ' + label + '.'); void shutdown(1); }
  });
  child.once('exit', code => {
    if (!stopping) { console.error('[dev:sync] ' + label + ' foi encerrado; parando os serviços desta execução.'); void shutdown(code || 1); }
  });
  return child;
}

async function waitForBackend() {
  const deadline = Date.now() + 120000;
  while (!stopping && Date.now() < deadline) {
    const ready = await new Promise(resolve => {
      const socket = net.createConnection({ host: '127.0.0.1', port: backendPort });
      const finish = value => { socket.removeAllListeners(); socket.destroy(); resolve(value); };
      socket.setTimeout(500, () => finish(false));
      socket.once('connect', () => finish(true));
      socket.once('error', () => finish(false));
    });
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('O backend não iniciou na porta 3001 em até 120 segundos. Confira PostgreSQL, Redis e MinIO no Docker.');
}

async function main() {
  const env = localEnvironment();
  const prisma = requireFile(path.join(backendDir, 'node_modules', 'prisma', 'build', 'index.js'), 'Instale as dependências do backend com npm ci antes de rodar dev:sync.');
  const nest = requireFile(path.join(backendDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js'), 'O Nest CLI local não foi encontrado. Execute npm ci no backend.');
  const vite = requireFile(path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js'), 'Instale as dependências de vivox-clientes com npm ci antes de rodar dev:sync.');
  const schema = path.join(backendDir, 'prisma', 'schema.prisma');
  await Promise.all([assertPortFree(backendPort), assertPortFree(frontendPort)]);
  console.log('[dev:sync] Base: ' + projectDir);
  console.log('[dev:sync] PostgreSQL 127.0.0.1:5432 · Redis 127.0.0.1:6379 · MinIO 127.0.0.1:9000');
  await runStep('Gerando Prisma Client', [prisma, 'generate', '--schema', schema], backendDir, env);
  await runStep('Aplicando migrações locais pendentes', [prisma, 'migrate', 'deploy', '--schema', schema], backendDir, env);
  await runStep('Compilando backend', ['--max-old-space-size=4096', nest, 'build'], backendDir, env);
  const backendEntry = requireFile(path.join(backendDir, 'dist', 'src', 'main.js'), 'A compilação não gerou backend/dist/src/main.js. Confira os logs do build.');
  await Promise.all([assertPortFree(backendPort), assertPortFree(frontendPort)]);
  if (stopping) return;
  console.log('[dev:sync] Iniciando backend local; a primeira carga pode levar até 120 segundos.');
  startService('Backend', [backendEntry], backendDir, env);
  await waitForBackend();
  if (stopping) return;
  startService('Frontend', [vite, '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'], frontendDir, env);
  console.log('[dev:sync] VVOX Sync: http://localhost:5174/gp');
  console.log('[dev:sync] API: http://localhost:3001 · Ctrl+C encerra ambos.');
}

process.on('SIGINT', () => { void shutdown(0); });
process.on('SIGTERM', () => { void shutdown(0); });
main().catch(error => {
  if (!stopping) console.error('[dev:sync] ' + error.message);
  void shutdown(1);
});
