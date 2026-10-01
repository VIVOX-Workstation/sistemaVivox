import { AnalyticsService } from './analytics.service';

function makePrisma() {
  const m = () => ({
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _sum: { horasGastas: null } }),
  });
  return {
    cliente: m(),
    servicoContratado: m(),
    producao: m(),
    oportunidade: m(),
    ativoHospedagem: m(),
    tarefa: m(),
    chamado: m(),
    analyticsSnapshot: m(),
  };
}

function makeService(prisma: any) {
  return new AnalyticsService(prisma, null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any);
}

describe('AnalyticsService.getDashboardExecutivo', () => {
  it('retorna todas as listas e zeros com banco vazio', async () => {
    const r: any = await makeService(makePrisma()).getDashboardExecutivo();

    expect(r.clientes).toMatchObject({ total: 0, ativos: 0, prospects: 0, pausados: 0 });
    expect(r.clientes.novosPorMes).toHaveLength(6);
    expect(r.clientes.novosPorMes.every((x: any) => x.total === 0 && /^\d{4}-\d{2}$/.test(x.mes))).toBe(true);
    expect(r.servicos.porTipo).toEqual([]);
    expect(r.ultimosClientes).toEqual([]);

    expect(r.tarefas).toMatchObject({
      total: 0, abertas: 0, emAndamento: 0, atrasadas: 0, vencendoSemana: 0, concluidasSemana: 0, horasGastas: 0,
      atrasadasLista: [],
    });
    expect(r.tarefas.porStatus.map((x: any) => x.status)).toEqual([
      'BACKLOG', 'A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA', 'CANCELADA',
    ]);
    expect(r.tarefas.porPrioridade.map((x: any) => x.prioridade)).toEqual(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']);
    expect(r.tarefas.concluidasPorSemana).toHaveLength(8);

    expect(r.chamados).toMatchObject({ abertos: 0, emAndamento: 0, resolvidosMes: 0, slaVencidos: 0, recentes: [] });
    expect(r.chamados.porUrgencia).toHaveLength(3);
    expect(r.producoes.porStatus).toHaveLength(4);
    expect(r.analytics).toMatchObject({
      clientesComGa4: 0, clientesComInstagram: 0, clientesComOpenpanel: 0,
      alcance30d: 0, engajamento30d: 0, serieAlcance: [], topClientesAlcance: [],
    });
  });

  it('calcula atrasadas e vencendoSemana apenas sobre tarefas abertas', async () => {
    const prisma = makePrisma();
    const prazo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 1000);
    prisma.tarefa.count.mockImplementation(async ({ where }: any = {}) => {
      if (where?.prazo?.lt) return 4;
      if (where?.prazo?.gte && where?.prazo?.lte) return 2;
      return 0;
    });
    prisma.tarefa.findMany.mockImplementation(async ({ where }: any) =>
      where?.prazo?.lt
        ? [{ id: 't1', titulo: 'X', prazo, prioridade: 'ALTA', cliente: null, responsavel: { nome: 'Ana' } }]
        : [],
    );
    prisma.tarefa.groupBy.mockImplementation(async ({ by }: any) =>
      by[0] === 'status'
        ? [{ status: 'A_FAZER', _count: { _all: 5 } }, { status: 'CONCLUIDA', _count: { _all: 9 } }]
        : [],
    );

    const r: any = await makeService(prisma).getDashboardExecutivo();

    expect(r.tarefas.atrasadas).toBe(4);
    expect(r.tarefas.vencendoSemana).toBe(2);
    expect(r.tarefas.abertas).toBe(5);
    const whereAtrasadas = prisma.tarefa.count.mock.calls.find(([a]: any) => a?.where?.prazo?.lt)[0].where;
    expect(whereAtrasadas.status).toEqual({ notIn: ['CONCLUIDA', 'CANCELADA'] });
    expect(r.tarefas.atrasadasLista).toHaveLength(1);
    expect(r.tarefas.atrasadasLista[0]).toMatchObject({
      id: 't1', diasAtraso: 3, prioridade: 'ALTA', cliente: null, responsavel: { nome: 'Ana' },
    });
    expect(r.tarefas.atrasadasLista[0].prazo).toBe(prazo.toISOString());
  });
});
