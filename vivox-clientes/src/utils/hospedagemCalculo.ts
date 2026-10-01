export const OPCOES_PRAZO_MESES = [
  { meses: 1, label: '1 mês (Mensal)' },
  { meses: 3, label: '3 meses (Trimestral)' },
  { meses: 6, label: '6 meses (Semestral)' },
  { meses: 12, label: '12 meses (1 ano)' },
  { meses: 24, label: '24 meses (2 anos)' },
] as const;

export type SituacaoHospedagem = 'EM_DIA' | 'PROXIMO' | 'VENCIDA' | 'SEM_DATA';

/**
 * Retorna a data de hoje no formato YYYY-MM-DD usando o fuso horário local do usuário.
 */
export function getHojeLocal(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Calcula a data de vencimento da hospedagem adicionando N meses à data de início
 * com clamp para o último dia do mês de destino (ex: 31/01 + 1 mês -> 28/02 ou 29/02).
 * Rejeita datas inválidas como 2026-02-30 comparando toISOString.slice(0, 10) === inicio.
 * Retorna no formato YYYY-MM-DD (ou null se inválida).
 */
export function calcularVencimentoHospedagem(inicio?: string | null, meses?: number | null): string | null {
  if (!inicio || !/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !Number.isInteger(meses) || (meses as number) < 1 || (meses as number) > 120) {
    return null;
  }

  const numMeses = meses as number;
  const data = new Date(`${inicio}T00:00:00.000Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== inicio) {
    return null; // Rejeita datas que não existem no calendário (ex: 2026-02-30)
  }

  const destino = new Date(data);
  destino.setUTCDate(1);
  destino.setUTCMonth(destino.getUTCMonth() + numMeses);

  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(data.getUTCDate(), ultimoDia));

  return destino.toISOString().slice(0, 10);
}

/**
 * Retorna os dias restantes entre a data informada e a data atual (00:00:00).
 * Extrai via slice YYYY-MM-DD para evitar variações de fuso horário.
 */
export function calcularDiasRestantes(dataStr?: string | null): number | null {
  if (!dataStr) return null;
  const isoDate = dataStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;

  const [ano, mes, dia] = isoDate.split('-').map(Number);
  const dataAlvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataAlvo.setHours(0, 0, 0, 0);

  const diffMs = dataAlvo.getTime() - hoje.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Analisa a situação da hospedagem com base na data de vencimento:
 * - Vencida: dias < 0
 * - Próximo do vencimento: <= 30 dias
 * - Em dia: > 30 dias
 */
export function getSituacaoHospedagem(dataVencimentoStr?: string | null): {
  situacao: SituacaoHospedagem;
  dias: number | null;
  rotulo: string;
} {
  const dias = calcularDiasRestantes(dataVencimentoStr);

  if (dias === null) {
    return {
      situacao: 'SEM_DATA',
      dias: null,
      rotulo: 'Sem data definida',
    };
  }

  if (dias < 0) {
    return {
      situacao: 'VENCIDA',
      dias,
      rotulo: dias === -1 ? 'Vencida ontem' : `Vencida há ${Math.abs(dias)} dias`,
    };
  }

  if (dias === 0) {
    return {
      situacao: 'PROXIMO',
      dias,
      rotulo: 'Vence hoje!',
    };
  }

  if (dias <= 30) {
    return {
      situacao: 'PROXIMO',
      dias,
      rotulo: `Próximo do vencimento (${dias} ${dias === 1 ? 'dia' : 'dias'})`,
    };
  }

  return {
    situacao: 'EM_DIA',
    dias,
    rotulo: `Em dia (${dias} dias)`,
  };
}

/**
 * Formata data no formato brasileiro DD/MM/AAAA.
 * Usa slice(0, 10) diretamente na string ISO YYYY-MM-DD para garantir
 * que não haja desvio de dia por fuso horário (ex: Cuiabá UTC-4).
 */
export function formatarDataBR(dataStr?: string | null): string {
  if (!dataStr) return 'Não informada';
  const isoDate = dataStr.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [ano, mes, dia] = isoDate.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return 'Data inválida';
}
