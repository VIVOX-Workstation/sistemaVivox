export interface OpenPanelOverview {
  uniqueVisitors: number;
  totalSessions: number;
  totalScreenViews: number;
  bounceRate: number; // Porcentagem (0 a 100)
  avgSessionDuration: number; // Segundos
  viewsPerSession: number;
}

export interface OpenPanelTimelinePoint {
  date: string; // YYYY-MM-DD
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
