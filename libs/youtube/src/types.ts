export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  channelId: string;
  channelTitle: string;
  tags?: string[];
  duration?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
}

export interface YouTubeSearchResult {
  kind: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: any;
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface NicheAnalysisReport {
  niche: string;
  totalVideosAnalyzed: number;
  averageViews: number;
  topVideos: YouTubeVideo[];
  competitorChannels: YouTubeChannel[];
  score: number; // Opportunity score 0-100
  recommendation: string;
  timestamp: string;
}

export interface VideoUploadParams {
  filePath: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
}

export interface VideoUploadResult {
  videoId: string;
  url: string;
}
