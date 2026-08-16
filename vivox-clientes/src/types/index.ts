export type StatusCliente = 'ativo' | 'pausado' | 'encerrado' | 'prospect' | 'ATIVO' | 'PAUSADO' | 'ENCERRADO' | 'PROSPECT';

export interface Contato {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
  whatsapp: string;
}

export interface FonteContexto {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  createdAt: string;
}

export interface Cliente {
  id: string;
  nomeFantasia: string;
  razaoSocial?: string;
  cnpjCpf?: string;
  segmento: string;
  responsavelId?: string;
  contatos: Contato[];
  status: StatusCliente;
  dataInicioContrato?: string; // ISO date string
  dataFimContrato?: string; // ISO date string
  logoUrl?: string;
  observacoes?: string;
  ga4PropertyId?: string;
  gscSiteUrl?: string;
  responsavel?: { nome: string }; // Incluído caso o Prisma dê include
  fontesContexto?: FonteContexto[];
}

export type TipoServico = 
  | 'GERENCIAMENTO_REDES' 
  | 'FOLDER' 
  | 'REVISTA' 
  | 'LANDING_PAGE' 
  | 'APP' 
  | 'FOTOGRAFIA' 
  | 'VIDEO' 
  | 'TRAFEGO_PAGO' 
  | 'IDENTIDADE_VISUAL';

export type StatusServico = 'ATIVO' | 'CONCLUIDO' | 'PAUSADO' | 'CANCELADO';

export interface HistoricoServico {
  id: string;
  data: string; // ISO date string
  usuario: string;
  acao: string;
  observacao: string;
}

export interface ServicoContratado {
  id: string;
  cliente_id: string;
  tipo_servico: TipoServico;
  status: StatusServico;
  data_contratacao: string; // ISO date string
  data_entrega_renovacao?: string; // ISO date string
  descricao_escopo: string;
  historico: HistoricoServico[];
}

export type TipoProducao = 'post' | 'video' | 'folder' | 'revista' | 'landing_page' | 'app' | 'foto';
export type StatusProducao = 'em_producao' | 'em_revisao' | 'aprovado' | 'publicado';

export interface Producao {
  id: string;
  cliente_id: string;
  servico_relacionado_id?: string;
  tipo: TipoProducao;
  arquivo_url: string;
  data_producao: string;
  responsavel: string;
  status: StatusProducao;
}

export interface MidiaCliente {
  id: string;
  cliente_id: string;
  arquivo_url: string;
  tags: string[];
}

// --- TIPAGENS GOOGLE ANALYTICS 4 & SEARCH CONSOLE ---

export interface GA4Overview {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  screenPageViews: number;
  engagementRate: number; // Porcentagem (0 a 100)
  averageSessionDuration: number; // Segundos
  eventCount: number;
}

export interface GA4TimelinePoint {
  date: string;
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
}

export interface GA4TrafficSource {
  sourceMedium: string;
  sessions: number;
  activeUsers: number;
  percentage: number;
}

export interface GA4DeviceDistribution {
  device: string;
  activeUsers: number;
  percentage: number;
}

export interface GA4CityMetric {
  city: string;
  country: string;
  activeUsers: number;
  sessions: number;
}

export interface GA4EventMetric {
  eventName: string;
  eventCount: number;
  totalUsers: number;
}

export interface GA4MetricsResult {
  success: boolean;
  propertyId: string;
  configured: boolean;
  error?: string;
  overview?: GA4Overview;
  timeline?: GA4TimelinePoint[];
  trafficSources?: GA4TrafficSource[];
  devices?: GA4DeviceDistribution[];
  cities?: GA4CityMetric[];
  events?: GA4EventMetric[];
}

export interface GSCOverview {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
}

export interface GSCTimelinePoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCQueryMetric {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageMetric {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCMetricsResult {
  success: boolean;
  siteUrl: string;
  configured: boolean;
  error?: string;
  overview?: GSCOverview;
  timeline?: GSCTimelinePoint[];
  queries?: GSCQueryMetric[];
  pages?: GSCPageMetric[];
}

export interface GoogleDashboardResult {
  clienteId: string;
  clienteNome: string;
  periodo: {
    startDate: string;
    endDate: string;
    days: number;
  };
  serviceAccount: {
    configured: boolean;
    clientEmail: string | null;
  };
  ga4: GA4MetricsResult;
  gsc: GSCMetricsResult;
  cachedAt?: string;
}

// --- TIPAGENS HOSPEDAGEM, VPS & ATIVOS DIGITAIS ---

export type StatusHospedagem = 'ATIVO' | 'PENDENTE_RENOVACAO' | 'MANUTENCAO' | 'EXPIRADO' | 'CANCELADO';
export type CicloRenovacao = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'BIENAL';

export interface AtivoHospedagem {
  id: string;
  clienteId: string;
  cliente?: {
    id: string;
    nomeFantasia: string;
    logoUrl?: string;
  };
  titulo: string;
  url: string;
  provedorVps?: string;
  ipServidor?: string;
  dataRenovacaoVps?: string; // ISO date string
  cicloVps: CicloRenovacao;
  custoVps?: number;
  valorCobrado?: number;
  dominio?: string;
  registradorDominio?: string;
  dataExpiracaoDominio?: string; // ISO date string
  dnsProvedor?: string;
  status: StatusHospedagem;
  sslAtivo: boolean;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  diasParaVps?: number | null;
  diasParaDominio?: number | null;
  menorDias?: number | null;
  nivelUrgencia?: 'CRITICO' | 'ATENCAO' | 'EM_DIA' | 'SEM_DATA';
}

export interface RadarHospedagemResult {
  totalAtivos: number;
  criticos7Dias: number;
  atencao30Dias: number;
  emDia: number;
  receitaMensalTotal: number;
  custoMensalTotal: number;
  margemMensal: number;
  proximasRenovacoes: AtivoHospedagem[];
}

