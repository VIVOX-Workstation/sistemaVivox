export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookPageAccount {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  };
}

export interface FacebookPagesResponse {
  data: FacebookPageAccount[];
}

export interface InstagramAccountProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface InstagramMetricValue {
  value: number;
  end_time?: string;
}

export interface InstagramInsightItem {
  name: string;
  period: string;
  values: InstagramMetricValue[];
  title?: string;
  description?: string;
  id?: string;
}

export interface InstagramInsightsResponse {
  data: InstagramInsightItem[];
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    reach?: number | null;
    impressions?: number | null;
    views?: number | null;
    saved?: number | null;
    video_views?: number;
    shares?: number | null;
  };
}

export interface InstagramMediaListResponse {
  data: InstagramMediaItem[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

export interface InstagramOverview {
  reach: number | null;
  views: number | null;
  accountsEngaged: number | null;
  profileViews: number | null;
}

export interface InstagramDashboardData {
  followers: {
    current: import('./follower-history').FollowerChange;
    previous: import('./follower-history').FollowerChange;
    historySince?: string;
  };
  account: InstagramAccountProfile;
  period: { days: number; since: string; until: string; timezone: 'UTC' };
  previousPeriod: { since: string; until: string };
  overview: InstagramOverview & { totalFollowers: number | null };
  previousOverview: InstagramOverview;
  syncedAt: string;
  warnings: string[];
  mediaCoverage: { complete: boolean; fetched: number; enriched: number; limit: number; available: boolean };
  insightsHistory: Array<{ date: string; reach: number }>;
  recentMedia: InstagramMediaItem[];
}
