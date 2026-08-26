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
  bannerUrl?: string;
  observacoes?: string;
  email?: string;
  telefone?: string;
  localizacao?: string;
  loginsSenhas?: string;
  ga4PropertyId?: string;
  gscSiteUrl?: string;
  openpanelProjectId?: string;
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
  clienteId?: string;
  cliente_id?: string;
  cliente?: {
    id: string;
    nomeFantasia: string;
    logoUrl?: string;
  };
  tipoServico?: TipoServico;
  tipo_servico?: TipoServico;
  status: StatusServico;
  dataContratacao?: string; // ISO date string
  data_contratacao?: string;
  dataEntrega?: string;
  data_entrega_renovacao?: string;
  descricaoEscopo?: string;
  descricao_escopo?: string;
  historico?: any[];
  tarefas?: any[];
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

export interface GA4PageMetric {
  pagePath: string;
  screenPageViews: number;
  sessions: number;
  activeUsers: number;
  bounceRate: number;
}

export interface GA4EventMetric {
  eventName: string;
  eventCount: number;
  totalUsers: number;
}

export interface GA4RealtimePage {
  pageTitle: string;
  activeUsers: number;
}

export interface GA4RealtimeDevice {
  device: string;
  activeUsers: number;
  percentage: number;
}

export interface GA4RealtimeMinutePoint {
  minutesAgo: number;
  activeUsers: number;
}

export interface GA4RealtimeMetric {
  activeUsersNow: number; // Últimos 30 min
  activeUsers5Min: number; // Últimos 5 min
  screenPageViewsNow: number;
  eventCountNow: number;
  perMinuteTimeline: GA4RealtimeMinutePoint[];
  pages: GA4RealtimePage[];
  devices: GA4RealtimeDevice[];
}

export interface GA4MetricsResult {
  success: boolean;
  propertyId: string;
  configured: boolean;
  error?: string;
  overview?: GA4Overview;
  timeline?: GA4TimelinePoint[];
  pages?: GA4PageMetric[];
  trafficSources?: GA4TrafficSource[];
  devices?: GA4DeviceDistribution[];
  cities?: GA4CityMetric[];
  events?: GA4EventMetric[];
  realtime?: GA4RealtimeMetric;
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

// OpenPanel
export interface OpenPanelOverview {
  uniqueVisitors: number;
  totalSessions: number;
  totalScreenViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  viewsPerSession: number;
}

export interface OpenPanelTimelinePoint {
  date: string;
  uniqueVisitors: number;
  totalSessions: number;
  totalScreenViews: number;
}

export interface OpenPanelBreakdownItem {
  name: string;
  sessions: number;
  pageviews: number;
  percentage: number;
}

export interface OpenPanelPageMetric {
  path: string;
  origin: string;
  sessions: number;
  pageviews: number;
}

export interface OpenPanelWhatsappClick {
  createdAt: string;
  mensagem: string;
  botao: string;
  cidade: string;
  dispositivo: string;
  navegador: string;
}

export interface OpenPanelMetricsResult {
  success: boolean;
  projectId: string;
  configured: boolean;
  error?: string;
  overview?: OpenPanelOverview;
  timeline?: OpenPanelTimelinePoint[];
  pages?: OpenPanelPageMetric[];
  referrers?: OpenPanelBreakdownItem[];
  devices?: OpenPanelBreakdownItem[];
  browsers?: OpenPanelBreakdownItem[];
  os?: OpenPanelBreakdownItem[];
  countries?: OpenPanelBreakdownItem[];
  utmSources?: OpenPanelBreakdownItem[];
  utmMediums?: OpenPanelBreakdownItem[];
  utmCampaigns?: OpenPanelBreakdownItem[];
  liveVisitors?: number;
  whatsappClicksCount?: number;
  whatsappClicks?: OpenPanelWhatsappClick[];
}

export interface OpenPanelDashboardResult {
  clienteId: string;
  clienteNome: string;
  range: string;
  openpanel: OpenPanelMetricsResult;
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

export interface Oportunidade {
  id: string;
  clienteId: string;
  servicoSugerido: TipoServico;
  justificativa?: string;
  status: 'ABERTA' | 'APRESENTADA' | 'ACEITA' | 'RECUSADA';
  origem?: 'persistida' | 'calculada';
  createdAt: string;
  updatedAt: string;
}

// --- TIPAGENS VIVOX GP (PROJETOS, TAREFAS & BITRIX STYLE) ---

export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type StatusTarefa = 
  | 'BACKLOG' 
  | 'A_FAZER' 
  | 'EM_ANDAMENTO' 
  | 'EM_REVISAO' 
  | 'CONCLUIDA' 
  | 'CANCELADA';

export interface TarefaChecklist {
  id: string;
  tarefaId: string;
  titulo: string;
  concluido: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface TarefaComentario {
  id: string;
  tarefaId: string;
  autorId: string;
  autor?: {
    id: string;
    nome: string;
    email: string;
  };
  texto: string;
  createdAt: string;
}

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  clienteId?: string;
  cliente?: {
    id: string;
    nomeFantasia: string;
  };
  responsavelId?: string;
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  _count?: {
    tarefas: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  prazo?: string; // ISO string
  dataInicio?: string; // ISO string
  dataConclusao?: string; // ISO string
  horasEstimadas?: number;
  horasGastas?: number;
  tags: string[];
  ordem: number;
  autorId?: string;
  autor?: {
    id: string;
    nome: string;
    email: string;
  };
  responsavelId?: string;
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  clienteId?: string;
  cliente?: {
    id: string;
    nomeFantasia: string;
    logoUrl?: string;
  };
  projetoId?: string;
  projeto?: {
    id: string;
    nome: string;
    cor?: string;
  };
  servicoId?: string;
  servico?: {
    id: string;
    tipoServico: string;
    status: string;
  };
  checklist: TarefaChecklist[];
  comentarios?: TarefaComentario[];
  _count?: {
    checklist: number;
    comentarios: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MetricasTarefas {
  total: number;
  emAndamento: number;
  atrasadas: number;
  concluidasSemana: number;
  horasGastasTotal: number;
}

// --- TIPAGENS VIVOX EDUCACIONAL ---
export interface AulaProgresso {
  id: string;
  aulaId: string;
  usuarioId: string;
  concluidoEm: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Aula {
  id: string;
  moduloId: string;
  titulo: string;
  descricao?: string;
  videoUrl: string;
  duracaoSeg?: number;
  ordem: number;
  capaUrl?: string;
  capaPosX?: number;
  capaPosY?: number;
  createdAt: string;
  updatedAt: string;
  progresso?: AulaProgresso;
}

export interface Modulo {
  id: string;
  cursoId: string;
  titulo: string;
  ordem: number;
  aulas: Aula[];
  createdAt: string;
  updatedAt: string;
}

export interface Curso {
  id: string;
  titulo: string;
  descricao?: string;
  capaUrl?: string;
  capaPosX?: number;
  capaPosY?: number;
  publicado: boolean;
  ordem: number;
  modulos: Modulo[];
  progressoPercentual?: number;
  createdAt: string;
  updatedAt: string;
}