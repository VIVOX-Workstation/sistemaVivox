export interface FollowerChange {
  gained: number | null;
  lost: number | null;
  net: number | null;
  source: 'meta' | 'snapshots' | 'unavailable';
  observedSince?: string;
  observedUntil?: string;
}
export interface FollowerSnapshot { capturedAt: Date; followersCount: number }
export const unavailableFollowers = (): FollowerChange => ({ gained: null, lost: null, net: null, source: 'unavailable' });
export const SNAPSHOT_TOLERANCE_MS = 36 * 60 * 60 * 1000;

export function followerChangeFromSnapshots(snapshots: FollowerSnapshot[], since: string, until: string): FollowerChange {
  const boundary = (date: string) => snapshots.filter(item => item.capturedAt.getTime() <= Date.parse(date) && item.capturedAt.getTime() >= Date.parse(date) - SNAPSHOT_TOLERANCE_MS)
    .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())[0];
  const start = boundary(since);
  const end = boundary(until);
  if (!start || !end || end.capturedAt <= start.capturedAt) return unavailableFollowers();
  return { gained: null, lost: null, net: end.followersCount - start.followersCount, source: 'snapshots', observedSince: start.capturedAt.toISOString(), observedUntil: end.capturedAt.toISOString() };
}

export function followerChangeFromMeta(data: any): FollowerChange {
  const metric = data?.data?.find((item: any) => item.name === 'follows_and_unfollows');
  const breakdown = metric?.total_value?.breakdowns?.find((item: any) => item.dimension_keys?.includes('follow_type'));
  const dimension = breakdown?.dimension_keys?.indexOf('follow_type');
  const value = (name: string): number | null => {
    const result = breakdown?.results?.find((item: any) => item.dimension_values?.[dimension] === name)?.value;
    return typeof result === 'number' && Number.isFinite(result) && result >= 0 ? result : null;
  };
  const gained = value('FOLLOWER');
  const lost = value('NON_FOLLOWER');
  return { gained, lost, net: gained !== null && lost !== null ? gained - lost : null, source: gained !== null && lost !== null ? 'meta' : 'unavailable' };
}
