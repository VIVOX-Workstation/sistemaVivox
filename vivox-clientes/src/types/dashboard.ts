// Tipos e normalização do GET /analytics/dashboard-executivo.
// Campos novos podem faltar em API antiga: normalizeDashboard aplica defaults seguros.

export type NivelUrgencia = 'CRITICO' | 'ATENCAO' | 'EM_DIA' | 'SEM_DATA';

export interface ClienteRef {
  id: string;
  nomeFantasia: string;
}

export interface HospedagemItem {
  id: string;
  clienteId: string;
  cliente: ClienteRef;
  titulo: string;
  url: string;
  dominio?: string;
  dataExpiracaoDominio?: string;
  dataRenovacaoVps?: string;
  dataInicioHospedagem?: string;
  diasRestantes: number | null;
  nivelUrgencia: NivelUrgencia;
}

export interface UltimoCliente {
  id: string;
  nomeFantasia: string;
  segmento: string;
  status: string;
  openpanelProjectId?: string;
  logoUrl?: string;
  createdAt: string;
  responsavel?: { nome: string };
  _count: { servicosContratados: number; ativosHospedagem: number };
}

export interface TarefaAtrasada {
  id: string;
  titulo: string;
  prazo: string;
  diasAtraso: number;
  prioridade: string;
  cliente: ClienteRef | null;
  responsavel: { nome: string } | null;
}

export interface ChamadoRecente {
  id: string;
  titulo: string;
  urgencia: string;
  status: string;
  slaVencimento: string | null;
  slaVencido: boolean;
  createdAt: string;
  cliente: ClienteRef | null;
}

export interface DashboardData {
  clientes: {
    total: number;
    ativos: number;
    prospects: number;
    pausados: number;
    novosPorMes: Array<{ mes: string; total: number }>;
  };
  servicos: {
    ativos: number;
    producoesEmAndamento: number;
    oportunidadesAbertas: number;
    porTipo: Array<{ tipo: string; total: number }>;
  };
  landingPages: {
    total: number;
    criticos7Dias: number;
    atencao30Dias: number;
    emDia: number;
    proximosVencimentos: HospedagemItem[];
  };
  ultimosClientes: UltimoCliente[];
  tarefas: {
    total: number;
    abertas: number;
    emAndamento: number;
    atrasadas: number;
    vencendoSemana: number;
    concluidasSemana: number;
    horasGastas: number;
    porStatus: Array<{ status: string; total: number }>;
    porPrioridade: Array<{ prioridade: string; total: number }>;
    concluidasPorSemana: Array<{ semana: string; total: number }>;
    atrasadasLista: TarefaAtrasada[];
  };
  chamados: {
    abertos: number;
    emAndamento: number;
    resolvidosMes: number;
    slaVencidos: number;
    porUrgencia: Array<{ urgencia: string; total: number }>;
    recentes: ChamadoRecente[];
  };
  producoes: { porStatus: Array<{ status: string; total: number }> };
  analytics: {
    clientesComGa4: number;
    clientesComInstagram: number;
    clientesComOpenpanel: number;
    alcance30d: number;
    engajamento30d: number;
    serieAlcance: Array<{ data: string; alcance: number; engajamento: number }>;
    topClientesAlcance: Array<{ id: string; nomeFantasia: string; alcance: number; engajamento: number }>;
  };
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeDashboard(raw: any): DashboardData {
  const c = raw?.clientes ?? {};
  const s = raw?.servicos ?? {};
  const lp = raw?.landingPages ?? {};
  const t = raw?.tarefas ?? {};
  const ch = raw?.chamados ?? {};
  const a = raw?.analytics ?? {};
  return {
    clientes: {
      total: num(c.total),
      ativos: num(c.ativos),
      prospects: num(c.prospects),
      pausados: num(c.pausados),
      novosPorMes: arr(c.novosPorMes),
    },
    servicos: {
      ativos: num(s.ativos),
      producoesEmAndamento: num(s.producoesEmAndamento),
      oportunidadesAbertas: num(s.oportunidadesAbertas),
      porTipo: arr(s.porTipo),
    },
    landingPages: {
      total: num(lp.total),
      criticos7Dias: num(lp.criticos7Dias),
      atencao30Dias: num(lp.atencao30Dias),
      emDia: num(lp.emDia),
      proximosVencimentos: arr(lp.proximosVencimentos),
    },
    ultimosClientes: arr(raw?.ultimosClientes),
    tarefas: {
      total: num(t.total),
      abertas: num(t.abertas),
      emAndamento: num(t.emAndamento),
      atrasadas: num(t.atrasadas),
      vencendoSemana: num(t.vencendoSemana),
      concluidasSemana: num(t.concluidasSemana),
      horasGastas: num(t.horasGastas),
      porStatus: arr(t.porStatus),
      porPrioridade: arr(t.porPrioridade),
      concluidasPorSemana: arr(t.concluidasPorSemana),
      atrasadasLista: arr(t.atrasadasLista),
    },
    chamados: {
      abertos: num(ch.abertos),
      emAndamento: num(ch.emAndamento),
      resolvidosMes: num(ch.resolvidosMes),
      slaVencidos: num(ch.slaVencidos),
      porUrgencia: arr(ch.porUrgencia),
      recentes: arr(ch.recentes),
    },
    producoes: { porStatus: arr(raw?.producoes?.porStatus) },
    analytics: {
      clientesComGa4: num(a.clientesComGa4),
      clientesComInstagram: num(a.clientesComInstagram),
      clientesComOpenpanel: num(a.clientesComOpenpanel),
      alcance30d: num(a.alcance30d),
      engajamento30d: num(a.engajamento30d),
      serieAlcance: arr(a.serieAlcance),
      topClientesAlcance: arr(a.topClientesAlcance),
    },
  };
}
