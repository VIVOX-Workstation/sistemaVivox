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
  date: string; // YYYYMMDD ou YYYY-MM-DD
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
  device: string; // mobile, desktop, tablet
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

// Google Search Console (GSC)
export interface GSCOverview {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number; // Porcentagem (0 a 100)
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
