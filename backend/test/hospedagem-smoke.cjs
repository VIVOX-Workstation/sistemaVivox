// Execute against the local Docker stack: docker compose exec -T backend node test/hospedagem-smoke.cjs
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');

async function main() {
  let pronto = false;
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    try { pronto = (await fetch('http://localhost:3000')).ok; } catch {}
    if (pronto) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(pronto, 'Backend não respondeu na porta 3000.');
  const prisma = new PrismaClient();
  let cliente;
  let usuario;
  try {
    usuario = await prisma.user.create({ data: { nome: 'Teste temporário hospedagem', email: `smoke-${randomUUID()}@example.invalid`, senha: 'inacessivel', role: 'ADMIN' } });
    const token = jwt.sign({ sub: usuario.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'troque-por-um-segredo-forte', { expiresIn: '5m' });
    async function request(path, method = 'GET', body, status = 200) {
      const res = await fetch(`http://localhost:3000${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body && { body: JSON.stringify(body) }),
      });
      const data = await res.json();
      assert.equal(res.status, status, JSON.stringify(data));
      return data;
    }
    cliente = await prisma.cliente.create({ data: { nomeFantasia: 'Teste temporário hospedagem', cnpjCpf: randomUUID(), segmento: 'Teste', contatos: [], status: 'ATIVO' } });
    const servico = await prisma.servicoContratado.create({ data: { clienteId: cliente.id, tipoServico: 'LANDING_PAGE', status: 'ATIVO', dataContratacao: new Date() } });
    const item = { id: 'item-teste', titulo: 'LP de teste', estrutura: [], etapas: [], status: 'BRIEFING', createdAt: new Date().toISOString() };
    const planejamento = await request('/planejamento-servico', 'POST', { servicoContratadoId: servico.id, flowNodes: [item] }, 201);
    assert.equal(planejamento.flowNodes[0].id, item.id);
    const payload = { clienteId: cliente.id, titulo: item.titulo, url: 'https://example.com', servicoContratadoId: servico.id, itemPlanejadoId: item.id, dataInicioHospedagem: '2024-02-29', prazoHospedagemMeses: 12 };
    const ativo = await request('/hospedagens', 'POST', payload, 201);
    assert.equal(ativo.dataRenovacaoVps.slice(0, 10), '2025-02-28');
    await request('/hospedagens', 'POST', payload, 409);
    const atualizado = await request(`/hospedagens/${ativo.id}`, 'PATCH', { prazoHospedagemMeses: 24 });
    assert.equal(atualizado.dataRenovacaoVps.slice(0, 10), '2026-02-28');
    assert.equal(atualizado.cicloVps, 'BIENAL');
    await request(`/hospedagens/${ativo.id}`, 'PATCH', { dataInicioHospedagem: '2026-02-30' }, 400);
    const lista = await request(`/hospedagens/cliente/${cliente.id}`);
    assert.equal(lista.length, 1);
    assert.equal(lista[0].itemPlanejadoId, item.id);
    const radar = await request('/hospedagens/radar');
    assert.ok(radar.proximasRenovacoes.some(row => row.id === ativo.id));
    const dashboard = await request('/analytics/dashboard-executivo');
    assert.ok(dashboard.landingPages.proximosVencimentos.some(row => row.id === ativo.id));
    console.log('Smoke OK: planejamento persiste item, hospedagem calcula/recalcula, duplicata e data inválida rejeitadas, radar integrado.');
  } finally {
    if (cliente) await prisma.cliente.delete({ where: { id: cliente.id } });
    if (usuario) await prisma.user.delete({ where: { id: usuario.id } });
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
