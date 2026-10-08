import type { FiltroAcompanhamento, TipoPublicacao } from '../../api/acompanhamento';

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const TIPOS_PUBLICACAO: { id: TipoPublicacao; label: string }[] = [
  { id: 'POST', label: 'Post' },
  { id: 'REELS', label: 'Reels' },
  { id: 'CARROSSEL', label: 'Carrossel' },
  { id: 'STORY', label: 'Story' },
  { id: 'VIDEO', label: 'Vídeo' },
];

// Mês inteiro ou intervalo escolhido no calendário (datas AAAA-MM-DD, inclusivas)
export type Periodo =
  | { modo: 'mes'; ano: number; mes: number }
  | { modo: 'personalizado'; inicio: string; fim: string };

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, '0');

/** Date local -> "AAAA-MM-DD" (sem passar por UTC) */
export function paraIso(data: Date): string {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

/** "AAAA-MM-DD" -> Date local ao meio-dia (evita pular de dia em qualquer fuso) */
export function deIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d, 12);
}

export function mesAtual(): Periodo {
  const hoje = new Date();
  return { modo: 'mes', ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
}

export function periodoDaUrl(params: URLSearchParams): Periodo {
  const inicio = params.get('inicio');
  const fim = params.get('fim');
  if (inicio && fim && DATA_ISO.test(inicio) && DATA_ISO.test(fim)) {
    return inicio <= fim ? { modo: 'personalizado', inicio, fim } : { modo: 'personalizado', inicio: fim, fim: inicio };
  }
  const ano = Number(params.get('ano'));
  const mes = Number(params.get('mes'));
  if (Number.isInteger(ano) && ano > 0 && Number.isInteger(mes) && mes >= 1 && mes <= 12) {
    return { modo: 'mes', ano, mes };
  }
  return mesAtual();
}

export function tiposDaUrl(params: URLSearchParams): TipoPublicacao[] {
  const validos = new Set(TIPOS_PUBLICACAO.map((t) => t.id));
  return (params.get('tipos') || '')
    .split(',')
    .filter((t): t is TipoPublicacao => validos.has(t as TipoPublicacao));
}

export function paramsDaUrl(periodo: Periodo, tipos: TipoPublicacao[]): Record<string, string> {
  const base: Record<string, string> =
    periodo.modo === 'mes'
      ? { ano: String(periodo.ano), mes: String(periodo.mes) }
      : { inicio: periodo.inicio, fim: periodo.fim };
  if (tipos.length > 0) base.tipos = tipos.join(',');
  return base;
}

export function filtroApi(periodo: Periodo, tipos: TipoPublicacao[]): FiltroAcompanhamento {
  return periodo.modo === 'mes'
    ? { ano: periodo.ano, mes: periodo.mes, tipos }
    : { inicio: periodo.inicio, fim: periodo.fim, tipos };
}

function diaMes(iso: string, comAno: boolean): string {
  const d = deIso(iso);
  return `${d.getDate()} de ${MESES_NOMES[d.getMonth()].toLowerCase()}${comAno ? ` de ${d.getFullYear()}` : ''}`;
}

/** "Em janeiro de 2025" | "Em 10 de março de 2025" | "De 16 de janeiro a 28 de fevereiro de 2025" */
export function textoPeriodo(periodo: Periodo): string {
  if (periodo.modo === 'mes') return `Em ${MESES_NOMES[periodo.mes - 1].toLowerCase()} de ${periodo.ano}`;
  if (periodo.inicio === periodo.fim) return `Em ${diaMes(periodo.inicio, true)}`;
  const mesmoAno = periodo.inicio.slice(0, 4) === periodo.fim.slice(0, 4);
  return `De ${diaMes(periodo.inicio, !mesmoAno)} a ${diaMes(periodo.fim, true)}`;
}

/** "16/01/2025 – 28/02/2025" */
export function rotuloCurto(periodo: Periodo): string {
  if (periodo.modo === 'mes') return `${MESES_NOMES[periodo.mes - 1]} de ${periodo.ano}`;
  const fmt = (iso: string) => deIso(iso).toLocaleDateString('pt-BR');
  return periodo.inicio === periodo.fim ? fmt(periodo.inicio) : `${fmt(periodo.inicio)} – ${fmt(periodo.fim)}`;
}

/** Limites do período como "AAAA-MM-DD" */
export function limites(periodo: Periodo): { inicio: string; fim: string } {
  if (periodo.modo === 'personalizado') return { inicio: periodo.inicio, fim: periodo.fim };
  const ultimoDia = new Date(periodo.ano, periodo.mes, 0).getDate();
  return {
    inicio: `${periodo.ano}-${pad(periodo.mes)}-01`,
    fim: `${periodo.ano}-${pad(periodo.mes)}-${pad(ultimoDia)}`,
  };
}

/** Data sugerida para uma nova publicação: hoje se estiver no período, senão o primeiro dia */
export function dataPadraoNova(periodo: Periodo): Date {
  const { inicio, fim } = limites(periodo);
  const hoje = paraIso(new Date());
  return hoje >= inicio && hoje <= fim ? new Date() : deIso(inicio);
}
