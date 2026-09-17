import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import { InstagramManagementInsights, MetricComparison, FollowersSummary } from '../src/components/ClientTabs/InstagramManagementInsights';
import type { ManagementData } from '../src/components/ClientTabs/instagramInsights';

const fixture: ManagementData = {
  followers: { current: { gained: 15, lost: 3, net: 12, source: 'meta' }, previous: { gained: 8, lost: 2, net: 6, source: 'meta' } },
  period: { days: 7, since: '2026-09-09T00:00:00Z', until: '2026-09-16T00:00:00Z', timezone: 'UTC' },
  previousPeriod: { since: '2026-09-02T00:00:00Z', until: '2026-09-09T00:00:00Z' },
  overview: { reach: 1500, views: 3000, accountsEngaged: 60, profileViews: 120 },
  previousOverview: { reach: 1000, views: 2000, accountsEngaged: 50, profileViews: 100 },
  syncedAt: '2026-09-16T12:00:00Z', warnings: [], mediaCoverage: { complete: true, available: true, enriched: 8, limit: 30 },
  recentMedia: Array.from({ length: 8 }, (_, i) => ({ id: String(i), caption: `Conteúdo de teste ${i + 1} — bastidores, novidades e dicas para a audiência.`, media_type: i % 3 === 0 ? 'VIDEO' : i % 2 ? 'IMAGE' : 'CAROUSEL_ALBUM', thumbnail_url: 'https://picsum.photos/120/120', media_url: 'https://picsum.photos/120/120', timestamp: '2026-09-12T12:00:00Z', like_count: 30 - i, comments_count: i, insights: { reach: 400 + i, saved: i === 0 ? null : i * 2, shares: i * 3 } })),
};
function Preview() {
  const [empty, setEmpty] = useState(false);
  const data = empty ? { ...fixture, followers: undefined, recentMedia: [], overview: { reach: null, views: null, accountsEngaged: null, profileViews: null } } : fixture;
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8"><p className="text-sm text-amber-800">Prévia de teste · dados fictícios</p><button className="rounded-lg border bg-white p-2" onClick={() => setEmpty(!empty)}>Alternar dados ausentes</button><InstagramManagementInsights data={data} loading={false} /><div className="grid gap-4 rounded-xl bg-white p-4 sm:grid-cols-3"><MetricComparison current={1500} previous={1000} /><MetricComparison current={750} previous={1000} /><MetricComparison current={6} previous={4} mode="points" /><FollowersSummary data={data} /></div><InstagramManagementInsights data={data} loading={false} section="ranking" /></main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
