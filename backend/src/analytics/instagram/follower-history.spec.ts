import { followerChangeFromMeta, followerChangeFromSnapshots } from './follower-history';

describe('follower changes', () => {
  it('does not fabricate history from one observation or old observations', () => {
    expect(followerChangeFromSnapshots([{ capturedAt: new Date('2026-09-16'), followersCount: 32 }], '2026-09-01', '2026-09-17').net).toBeNull();
    expect(followerChangeFromSnapshots([{ capturedAt: new Date('2026-08-01'), followersCount: 32 }, { capturedAt: new Date('2026-09-16'), followersCount: 40 }], '2026-09-01', '2026-09-17').net).toBeNull();
  });
  it('reports a decline from observations near both boundaries with their actual dates', () => {
    const result = followerChangeFromSnapshots([
      { capturedAt: new Date('2026-08-31T20:00:00Z'), followersCount: 100 },
      { capturedAt: new Date('2026-09-07T20:00:00Z'), followersCount: 97 },
      { capturedAt: new Date('2026-09-09T20:00:00Z'), followersCount: 200 },
    ], '2026-09-01T00:00:00Z', '2026-09-08T00:00:00Z');
    expect(result.net).toBe(-3);
    expect(result.source).toBe('snapshots');
    expect(result.observedSince).toBe('2026-08-31T20:00:00.000Z');
    expect(result.gained).toBeNull();
  });
  it('reads labeled Meta breakdowns, preserves zero and rejects missing dimensions', () => {
    const response = (results: any[]) => ({ data: [{ name: 'follows_and_unfollows', total_value: { breakdowns: [{ dimension_keys: ['follow_type'], results }] } }] });
    expect(followerChangeFromMeta(response([{ dimension_values: ['FOLLOWER'], value: 0 }, { dimension_values: ['NON_FOLLOWER'], value: 2 }]))).toMatchObject({ gained: 0, lost: 2, net: -2, source: 'meta' });
    expect(followerChangeFromMeta(response([{ dimension_values: ['FOLLOWER'], value: 10 }])).net).toBeNull();
    expect(followerChangeFromMeta({ data: [] }).net).toBeNull();
  });
});
