import { YouTubeService } from '../src/youtube.service';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    youtube: jest.fn().mockReturnValue({
      search: {
        list: jest.fn().mockResolvedValue({
          data: {
            items: [{ kind: 'youtube#searchResult', id: { videoId: '123' }, snippet: { title: 'Test Video' } }],
          },
        }),
      },
      videos: {
        list: jest.fn().mockResolvedValue({
          data: {
            items: [{ id: '123', snippet: { title: 'Test Video' }, statistics: { viewCount: '1000' } }],
          },
        }),
      },
      channels: {
        list: jest.fn().mockResolvedValue({
          data: {
            items: [{ id: 'abc', snippet: { title: 'Test Channel' }, statistics: { subscriberCount: '500' } }],
          },
        }),
      },
    }),
  },
}));

describe('YouTubeService', () => {
  let service: YouTubeService;

  beforeEach(() => {
    service = new YouTubeService('fake-api-key');
  });

  it('should search videos', async () => {
    const results = await service.searchVideos('test query');
    expect(results.length).toBe(1);
    expect(results[0].snippet.title).toBe('Test Video');
  });

  it('should get video details', async () => {
    const videos = await service.getVideoDetails(['123']);
    expect(videos.length).toBe(1);
    expect(videos[0].viewCount).toBe(1000);
  });

  it('should get channel details', async () => {
    const channels = await service.getChannelDetails(['abc']);
    expect(channels.length).toBe(1);
    expect(channels[0].subscriberCount).toBe(500);
  });
});
