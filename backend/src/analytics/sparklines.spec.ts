import { AnalyticsService } from './analytics.service';

function makeService(followers: any[], snaps: any[]) {
  const prisma = {
    instagramFollowerSnapshot: { findMany: jest.fn().mockResolvedValue(followers) },
    analyticsSnapshot: { findMany: jest.fn().mockResolvedValue(snaps) },
  };
  return new AnalyticsService(prisma as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any);
}

const f = (clienteId: string, acc: string, day: string, n: number) => ({
  clienteId, instagramAccountId: acc, followersCount: n, capturedAt: new Date(`${day}T12:00:00Z`),
});

describe('AnalyticsService.getSparklines', () => {
  it('omite clientes sem dados', async () => {
    const r = await makeService([], []).getSparklines();
    expect(r).toEqual({});
  });

  it('prefere seguidores a alcance e usa alcance como fallback', async () => {
    const r: any = await makeService(
      [f('a', 'x', '2026-09-01', 100), f('a', 'x', '2026-09-02', 110)],
      [
        { clienteId: 'a', periodoFim: new Date('2026-09-02'), alcanceTotal: 5 },
        { clienteId: 'b', periodoFim: new Date('2026-09-02'), alcanceTotal: 10 },
        { clienteId: 'b', periodoFim: new Date('2026-09-02'), alcanceTotal: 15 },
      ],
    ).getSparklines();
    expect(r.a.metrica).toBe('seguidores');
    expect(r.a.rotulo).toBe('Seguidores');
    expect(r.b.metrica).toBe('alcance');
    expect(r.b.serie).toEqual([{ data: '2026-09-02', valor: 25 }]);
    expect(r.b.variacaoPct).toBeNull();
  });

  it('calcula variacaoPct, último valor do dia e null quando primeiro = 0', async () => {
    const r: any = await makeService(
      [
        f('a', 'x', '2026-09-01', 100),
        { ...f('a', 'x', '2026-09-02', 100), capturedAt: new Date('2026-09-02T01:00:00Z') },
        f('a', 'x', '2026-09-02', 112.5 as any),
        f('c', 'y', '2026-09-01', 0),
        f('c', 'y', '2026-09-02', 10),
      ],
      [],
    ).getSparklines();
    expect(r.a.serie).toHaveLength(2);
    expect(r.a.ultimo).toBe(112.5);
    expect(r.a.variacaoPct).toBe(12.5);
    expect(r.c.variacaoPct).toBeNull();
  });
});
