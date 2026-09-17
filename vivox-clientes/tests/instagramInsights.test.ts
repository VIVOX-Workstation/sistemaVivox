import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparison, metricDelta, managementInsights, rankedMedia } from '../src/components/ClientTabs/instagramInsights.ts';
import type { ManagementData } from '../src/components/ClientTabs/instagramInsights.ts';

const data = (): ManagementData => ({
  period: { days: 7, since: '2026-09-09T00:00:00Z', until: '2026-09-16T00:00:00Z', timezone: 'UTC' },
  previousPeriod: { since: '2026-09-02T00:00:00Z', until: '2026-09-09T00:00:00Z' },
  overview: { reach: 50, views: 100, accountsEngaged: 5, profileViews: 10 },
  previousOverview: { reach: 100, views: 90, accountsEngaged: 5, profileViews: 20 },
  recentMedia: [], syncedAt: '2026-09-16T01:00:00Z', warnings: [],
  mediaCoverage: { complete: true, available: true, enriched: 0, limit: 30 },
});
test('comparison distinguishes zero, unavailable, growth and decline', () => {
  assert.equal(comparison(10, 0).label, 'Base anterior zero');
  assert.equal(comparison(0, 0).label, 'Sem alteração');
  assert.equal(comparison(null, 10).label, 'Sem comparação');
  assert.equal(comparison(0, 10).percent, -100);
  assert.equal(comparison(15, 10).percent, 50);
});
test('summary shows absolute deltas, percentage points and zero-base changes honestly', () => {
  assert.equal(metricDelta(120, 100)?.label, '+20%');
  assert.equal(metricDelta(120, 100)?.absolute, '+20');
  assert.equal(metricDelta(5, 0)?.label, '+5');
  assert.equal(metricDelta(0, 5)?.label, '−100%');
  assert.equal(metricDelta(6, 4, 'points')?.label, '+2 p.p.');
  assert.equal(metricDelta(-3, -10, 'absolute')?.label, '+7');
  assert.equal(metricDelta(null, 0), null);
});
test('ranking excludes missing values and out-of-period posts, but includes real zero', () => {
  const input = data();
  input.recentMedia = [
    { id: 'zero', media_type: 'IMAGE', timestamp: '2026-09-10T00:00:00Z', insights: { saved: 0 } },
    { id: 'best', media_type: 'IMAGE', timestamp: '2026-09-11T00:00:00Z', insights: { saved: 10 } },
    { id: 'missing', media_type: 'IMAGE', timestamp: '2026-09-12T00:00:00Z' },
    { id: 'today', media_type: 'IMAGE', timestamp: '2026-09-16T00:00:00Z', insights: { saved: 100 } },
  ];
  assert.deepEqual(rankedMedia(input, 'saved').map(item => item.id), ['best', 'zero']);
  assert.equal(input.recentMedia[0].id, 'zero');
});
test('insights explain evidence, ties and missing data without inventing format superiority', () => {
  const input = data();
  input.recentMedia = ['a', 'b'].map(id => ({ id, media_type: 'IMAGE', timestamp: '2026-09-10T00:00:00Z', like_count: 2, comments_count: 1 }));
  const result = managementInsights(input);
  assert.equal(result.length, 3);
  assert.equal(result[0].title, 'O alcance merece atenção');
  assert.match(result[1].evidence, /2 publicações têm 3/);
  input.overview.reach = null;
  assert.match(managementInsights(input)[0].evidence, /não disponibilizou/);
});
