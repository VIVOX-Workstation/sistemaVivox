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
    reach?: number;
    impressions?: number;
    saved?: number;
    video_views?: number;
    shares?: number;
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

export interface InstagramDashboardData {
  account: InstagramAccountProfile;
  period: {
    days: number;
  };
  overview: {
    reach: number;
    impressions: number;
    accountsEngaged: number;
    totalFollowers: number;
    profileViews: number;
  };
  insightsHistory: Array<{
    date: string;
    reach: number;
    impressions: number;
  }>;
  recentMedia: InstagramMediaItem[];
}
