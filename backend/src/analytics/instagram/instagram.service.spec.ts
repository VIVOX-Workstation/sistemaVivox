import { InstagramService } from './instagram.service';

describe('Instagram management data', () => {
  let service: InstagramService;
  let fetchMock: jest.SpyInstance;
  const reply = (data: unknown, ok = true) => Promise.resolve({ ok, json: async () => data } as Response);
  beforeEach(() => {
    service = new InstagramService();
    fetchMock = jest.spyOn(global, 'fetch');
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-16T15:00:00Z'));
  });
  afterEach(() => jest.restoreAllMocks());

  it('keeps unsupported metrics null and real zero intact without summing daily unique reach', async () => {
    fetchMock.mockImplementation((input: URL) => {
      const name = input.searchParams.get('metric');
      if (name === 'views') return reply({ data: [{ name, total_value: { value: 0 } }] });
      if (name === 'reach') return reply({ data: [{ name, values: [{ value: 100 }, { value: 100 }] }] });
      if (name === 'accounts_engaged') return reply({ data: [{ name, total_value: { value: 25 } }] });
      return reply({}, false);
    });
    expect(await service.getAccountInsights('account', 'test-token', 1, 2)).toEqual({ reach: null, views: 0, accountsEngaged: 25, profileViews: null });
  });

  it('uses equal non-overlapping UTC windows, paginates media, filters dates and caches by account/token/period', async () => {
    const media = (id: string, timestamp: string) => ({ id, timestamp, media_type: 'IMAGE', permalink: 'https://www.instagram.com/p/test', like_count: 0, comments_count: 0 });
    fetchMock.mockImplementation((input: URL) => {
      if (input.pathname.endsWith('/media')) return input.searchParams.has('after')
        ? reply({ data: [media('second', '2026-09-10T12:00:00Z'), media('old', '2026-09-08T00:00:00Z')] })
        : reply({ data: [media('today', '2026-09-16T01:00:00Z'), media('first', '2026-09-15T12:00:00Z')], paging: { next: 'ignored', cursors: { after: 'cursor' } } });
      if (input.pathname.endsWith('/insights')) {
        const metrics = input.searchParams.get('metric')!.split(',');
        return reply({ data: metrics.map(name => ({ name, total_value: { value: 10 } })) });
      }
      return reply({ id: 'account', username: 'test', followers_count: 12 });
    });
    const data = await service.getDashboard('account', 'test-token', { days: 7 });
    expect(data.period.since).toBe('2026-09-09T00:00:00.000Z');
    expect(data.period.until).toBe('2026-09-16T00:00:00.000Z');
    expect(data.previousPeriod).toEqual({ since: '2026-09-02T00:00:00.000Z', until: data.period.since });
    expect(data.recentMedia.map(item => item.id)).toEqual(['first', 'second']);
    expect(data.recentMedia[0].insights?.saved).toBe(10);
    expect(data.mediaCoverage.complete).toBe(true);
    const calls = fetchMock.mock.calls.length;
    await service.getDashboard('account', 'test-token', { days: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(calls);
    await service.getDashboard('account', 'test-token', { days: 7 }, true);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(calls);
    const refreshedCalls = fetchMock.mock.calls.length;
    await service.getDashboard('account', 'different-token', { days: 7 });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(refreshedCalls);
  });

  it('reports media failures separately from an empty period', async () => {
    fetchMock.mockImplementation((input: URL) => input.pathname.endsWith('/account') ? reply({ id: 'account' }) : reply({}, false));
    const data = await service.getDashboard('account', 'test-token', { days: 30 });
    expect(data.mediaCoverage.available).toBe(false);
    expect(data.mediaCoverage.complete).toBe(false);
    expect(data.overview.reach).toBeNull();
    expect(data.warnings.length).toBeGreaterThan(0);
  });

  it('rejects invalid preset periods before calling Meta', async () => {
    for (const days of [0, -1, NaN, 31, 7.5]) await expect(service.getDashboard('account', 'test-token', { days })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a custom since/until range', async () => {
    fetchMock.mockImplementation((input: URL) => input.pathname.endsWith('/account') ? reply({ id: 'account' }) : reply({}, false));
    const since = Math.floor(Date.parse('2026-08-01T00:00:00Z') / 1000);
    const until = Math.floor(Date.parse('2026-08-08T00:00:00Z') / 1000);
    const data = await service.getDashboard('account', 'test-token', { since, until });
    expect(data.period.since).toBe('2026-08-01T00:00:00.000Z');
    expect(data.period.until).toBe('2026-08-08T00:00:00.000Z');
    expect(data.previousPeriod).toEqual({ since: '2026-07-25T00:00:00.000Z', until: '2026-08-01T00:00:00.000Z' });
  });

  it('rejects incomplete, reversed, non-midnight and future custom dates', async () => {
    const day = 86400;
    const today = Date.parse('2026-09-16T00:00:00Z') / 1000;
    for (const period of [{ since: today }, { until: today }, { since: today, until: today }, { since: today + day, until: today + 2 * day }, { since: today - day + 1, until: today }]) {
      await expect(service.getDashboard('account', 'test-token', period)).rejects.toThrow();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps independent Instagram and Facebook hosts', async () => {
    fetchMock.mockImplementation(() => reply({ id: 'account' }));
    await service.getProfile('account', 'token', 'INSTAGRAM');
    expect((fetchMock.mock.calls[0][0] as URL).hostname).toBe('graph.instagram.com');
    await service.getProfile('account', 'token', 'FACEBOOK');
    expect((fetchMock.mock.calls[1][0] as URL).hostname).toBe('graph.facebook.com');
  });
});
