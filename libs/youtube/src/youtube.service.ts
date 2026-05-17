import { google, youtube_v3 } from 'googleapis';
import * as fs from 'fs';
import { YouTubeVideo, YouTubeChannel, YouTubeSearchResult, VideoUploadParams, VideoUploadResult } from './types';

export class YouTubeService {
  private youtube: youtube_v3.Youtube;

  constructor(auth: string | any) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: auth,
    });
  }

  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeSearchResult[]> {
    const response = await this.youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      relevanceLanguage: 'en',
    });

    return (response.data.items as YouTubeSearchResult[]) || [];
  }

  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
    const response = await this.youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: videoIds,
    });

    return (response.data.items || []).map((item) => ({
      id: item.id!,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || '',
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
      likeCount: parseInt(item.statistics?.likeCount || '0', 10),
      commentCount: parseInt(item.statistics?.commentCount || '0', 10),
      channelId: item.snippet?.channelId || '',
      channelTitle: item.snippet?.channelTitle || '',
      tags: item.snippet?.tags || [],
      duration: item.contentDetails?.duration || '',
    }));
  }

  async getChannelDetails(channelIds: string[]): Promise<YouTubeChannel[]> {
    const response = await this.youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: channelIds,
    });

    return (response.data.items || []).map((item) => ({
      id: item.id!,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      subscriberCount: parseInt(item.statistics?.subscriberCount || '0', 10),
      videoCount: parseInt(item.statistics?.videoCount || '0', 10),
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
      publishedAt: item.snippet?.publishedAt || '',
    }));
  }

  async getAuthenticatedChannelDetails(): Promise<YouTubeChannel[]> {
    const response = await this.youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
    });

    return (response.data.items || []).map((item) => ({
      id: item.id!,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      subscriberCount: parseInt(item.statistics?.subscriberCount || '0', 10),
      videoCount: parseInt(item.statistics?.videoCount || '0', 10),
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
      publishedAt: item.snippet?.publishedAt || '',
    }));
  }

  async updateChannelDescription(channelId: string, description: string): Promise<void> {
    // Önce mevcut kanal bilgilerini almalıyız (başlık vb. kaybolmaması için)
    const channelResponse = await this.youtube.channels.list({
      part: ['snippet'],
      id: [channelId],
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Kanal bulunamadı.');
    }

    const channel = channelResponse.data.items[0];
    const snippet = channel.snippet!;

    // Sadece açıklamayı güncelliyoruz
    snippet.description = description;

    await this.youtube.channels.update({
      part: ['snippet'],
      requestBody: {
        id: channelId,
        snippet: snippet,
      },
    });
  }

  async uploadVideo(params: VideoUploadParams): Promise<VideoUploadResult> {
    const response = await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: params.title,
          description: params.description,
          tags: params.tags,
          categoryId: params.categoryId || '28', // Bilim ve Teknoloji
        },
        status: {
          privacyStatus: params.privacyStatus || 'unlisted',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(params.filePath),
      },
    });

    const videoId = response.data.id!;
    return {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }
}
