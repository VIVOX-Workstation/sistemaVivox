// Smoke HTTP local: usa somente fixtures próprias e as remove ao terminar.
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const origem = process.env.PROPOSTAS_TEST_API_URL || 'http://127.0.0.1:3000';
if (process.env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost'].includes(new URL(origem).hostname)) {
  throw new Error('Este smoke deve ser executado somente no backend local de desenvolvimento.');
}
const prisma = new PrismaClient();
const usuarios = [];
let cliente;
const identificador = randomUUID();

async function http(caminho, { token, method = 'GET', body, status = 200 } = {}) {
  const resposta = await fetch(`${origem}${caminho}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(resposta.status, status, `${method} ${caminho}`);
  return { data: await resposta.json(), headers: resposta.headers };
}

async function main() {
  try {
    cliente = await prisma.cliente.create({ data: {
      nomeFantasia: `TESTE FICTÍCIO links ${identificador}`, cnpjCpf: identificador,
      segmento: 'Teste automatizado', contatos: [], status: 'PROSPECT',
    } });
    for (const [role, modulos] of [['ADMIN', []], ['COLABORADOR', ['CLIENTES']], ['COLABORADOR', ['EDUCACIONAL']], ['CLIENTE', []]]) {
      const user = await prisma.user.create({ data: {
        nome: 'TESTE FICTÍCIO links', email: `${randomUUID()}@example.invalid`, senha: randomUUID(), role, modulos,
      } });
      usuarios.push(user);
    }
    const tokens = usuarios.map(user => jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '5m' }));
    const [admin, colaborador, semModulo, portal] = tokens;
    const base = `/clientes/${cliente.id}/propostas`;
    const documento = { titulo: 'Proposta fictícia', destinatario: 'Teste', apresentacao: 'Teste HTTP', corDestaque: '#91672b', secoes: [] };
    const { data: proposta } = await http(base, { token: admin, method: 'POST', body: documento, status: 201 });
    const endpoint = `${base}/${proposta.id}/compartilhar`;
    const { data: gerado } = await http(endpoint, { token: admin, method: 'POST', status: 201 });
    for (const token of [admin, colaborador, admin]) {
      const recuperado = await http(endpoint, { token });
      assert.equal(recuperado.data.token, gerado.token);
      assert.equal(recuperado.headers.get('cache-control'), 'no-store');
    }
    for (const token of [semModulo, portal]) await http(endpoint, { token, status: 403 });
    await http(endpoint, { status: 401 });
    await http(`/clientes/outro-cliente/propostas/${proposta.id}/compartilhar`, { token: admin, status: 404 });
    const registro = await prisma.proposta.findUniqueOrThrow({ where: { id: proposta.id } });
    assert.notEqual(registro.linkTokenCriptografado, gerado.token);
    assert.equal(registro.linkHash, createHash('sha256').update(gerado.token).digest('hex'));
    const { data: lista } = await http(base, { token: colaborador });
    assert.equal(lista[0].compartilhada, true);
    assert.equal('linkTokenCriptografado' in lista[0], false);
    const { data: publico } = await http(`/propostas-publicas/${gerado.token}`);
    assert.equal(publico.titulo, documento.titulo);
    for (const campo of ['clienteId', 'cliente', 'linkHash', 'linkTokenCriptografado']) assert.equal(campo in publico, false);
    const { data: novo } = await http(endpoint, { token: admin, method: 'POST', status: 201 });
    assert.notEqual(novo.token, gerado.token);
    await http(`/propostas-publicas/${gerado.token}`, { status: 404 });
    await http(endpoint, { token: admin, method: 'DELETE' });
    assert.equal((await http(endpoint, { token: admin })).data.token, null);
    await http(`/propostas-publicas/${novo.token}`, { status: 404 });
    // Legado: o hash antigo continua válido; consultar não regenera nem revoga.
    await prisma.proposta.update({ where: { id: proposta.id }, data: { linkHash: registro.linkHash, linkTokenCriptografado: null } });
    assert.equal((await http(endpoint, { token: admin })).data.token, null);
    await http(`/propostas-publicas/${gerado.token}`);
    console.log('HTTP: link estável, permissões por papel/módulo, isolamento por cliente, criptografia, allowlist pública, renovação, revogação e legado passaram.');
  } finally {
    if (cliente) await prisma.cliente.delete({ where: { id: cliente.id } });
    if (usuarios.length) await prisma.user.deleteMany({ where: { id: { in: usuarios.map(u => u.id) } } });
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
