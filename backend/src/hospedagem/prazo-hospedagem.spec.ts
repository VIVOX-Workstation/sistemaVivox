import { calcularVencimentoHospedagem } from './prazo-hospedagem';

describe('Vencimento da hospedagem', () => {
  it.each([
    ['2026-10-01', 12, '2027-10-01'],
    ['2024-02-29', 12, '2025-02-28'],
    ['2026-01-31', 1, '2026-02-28'],
    ['2023-08-31', 6, '2024-02-29'],
    ['2026-12-31', 3, '2027-03-31'],
  ])('calcula %s mais %s meses como %s', (inicio, meses, esperado) => {
    expect(calcularVencimentoHospedagem(inicio, meses).toISOString()).toBe(`${esperado}T00:00:00.000Z`);
  });

  it.each([['2026-02-30', 12], ['2026-10-01', 0], ['2026-10-01', 1.5], ['inválida', 12]])(
    'rejeita data/prazo inválido', (inicio, meses) => {
      expect(() => calcularVencimentoHospedagem(inicio as string, meses as number)).toThrow();
    },
  );
});
