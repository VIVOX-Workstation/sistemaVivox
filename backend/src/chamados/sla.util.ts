import { UrgenciaChamado } from '@prisma/client';

function adicionarDiasUteis(data: Date, dias: number): Date {
  const resultado = new Date(data);
  let diasRestantes = dias;
  while (diasRestantes > 0) {
    resultado.setDate(resultado.getDate() + 1);
    const diaSemana = resultado.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasRestantes--;
    }
  }
  return resultado;
}

/**
 * Calcula o prazo-limite de resolução (SLA) a partir da urgência do chamado.
 * ALTA: 24h corridas. MEDIA: 3 dias úteis. BAIXA: 7 dias úteis.
 */
export function calcularSlaVencimento(
  urgencia: UrgenciaChamado | null | undefined,
  criadoEm: Date,
): Date {
  switch (urgencia) {
    case 'ALTA': {
      const vencimento = new Date(criadoEm);
      vencimento.setHours(vencimento.getHours() + 24);
      return vencimento;
    }
    case 'BAIXA':
      return adicionarDiasUteis(criadoEm, 7);
    case 'MEDIA':
    default:
      return adicionarDiasUteis(criadoEm, 3);
  }
}
