import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Globe, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { ClienteMono } from '../components/ClienteMono';
import { STATUS_CLIENTE } from '../utils/clean';
import { AnalyticsTab } from '../components/ClientTabs/AnalyticsTab';
import { InstagramPerformanceDashboard } from '../components/ClientTabs/InstagramPerformanceDashboard';
import './planning-workspace.css';

// Painel de métricas do cliente no layout clean (canvas › AnalyticsCliente).
// Os painéis de cada fonte (site/GA4/OpenPanel e Instagram) seguem os componentes existentes.

type Tab = 'site_analytics' | 'instagram';

const TABS: { id: Tab; label: string }[] = [
  { id: 'site_analytics', label: 'Site e landing pages' },
  { id: 'instagram', label: 'Instagram' },
];

const isTab = (v: string | null): v is Tab => TABS.some((t) => t.id === v);
const normalizeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

export function AnalyticsDashboard() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: Tab = isTab(tabParam) ? tabParam : 'site_analytics';
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCliente = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get(`/clientes/${id}`);
      setCliente(response.data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCliente();
  }, [loadCliente]);

  if (loading || error || !cliente) {
    return (
      <div className="vxp">
        <div className="pg">
          {loading ? (
            <div className="animate-pulse" aria-busy="true" aria-label="Carregando métricas" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ height: 72 }} />
              <div className="grid g4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card" style={{ height: 96 }} />)}</div>
              <div className="card" style={{ height: 280 }} />
            </div>
          ) : (
            <div className="card empty">
              <AlertTriangle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
              <b>Não foi possível carregar este cliente.</b>
              <div className="acts">
                <Link className="btn sec sm" to="/analytics">Voltar</Link>
                <button className="btn pri sm" type="button" onClick={loadCliente}>Tentar de novo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const [stLabel, stBd] = STATUS_CLIENTE[cliente.status] ?? [cliente.status, 'bd'];
  const siteUrl = cliente.gscSiteUrl && !cliente.gscSiteUrl.startsWith('sc-domain:') ? cliente.gscSiteUrl : null;
  const igUser = cliente.instagramUsername?.replace(/^@/, '');

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <ClienteMono cliente={cliente} lg />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1>{cliente.nomeFantasia}</h1>
                <span className={stBd}>{stLabel}</span>
              </div>
              <p>Métricas do site, da busca e do Instagram.</p>
            </div>
          </div>
          <div className="acts">
            {siteUrl && (
              <a className="btn gh" href={normalizeUrl(siteUrl)} target="_blank" rel="noopener noreferrer">
                <Globe className="i" aria-hidden="true" />Site
              </a>
            )}
            {igUser && (
              <a className="btn gh" href={`https://instagram.com/${igUser}`} target="_blank" rel="noopener noreferrer">@{igUser}</a>
            )}
            <Link className="btn sec" to={`/cliente/${cliente.id}`}>Abrir perfil</Link>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Fonte das métricas">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === activeTab ? 'tab on' : 'tab'}
              type="button"
              role="tab"
              aria-selected={t.id === activeTab}
              onClick={() => setSearchParams({ tab: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="planning-workspace pw-embed">
          {activeTab === 'site_analytics' && <AnalyticsTab cliente={cliente} />}
          {activeTab === 'instagram' && <InstagramPerformanceDashboard cliente={cliente} />}
        </div>
      </div>
    </div>
  );
}
