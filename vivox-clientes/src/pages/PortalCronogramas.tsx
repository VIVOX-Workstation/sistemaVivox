import { useState, useEffect } from 'react';
import { Eye, AlertCircle } from 'lucide-react';
import { cronogramasApi, type Cronograma, formatarTamanhoBytes, formatarMesReferencia } from '../api/cronogramas';
import { portalApi } from '../api/portal';
import { PortalHeader } from '../components/portal/PortalHeader';
import { PdfViewerModal } from '../components/acompanhamento/PdfViewerModal';

// Cronogramas do portal no layout clean (canvas › PortalCronogramas).

const dataBR = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
};

export function PortalCronogramas() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [cliente, setCliente] = useState<{ nomeFantasia: string; logoUrl?: string | null } | null>(null);
  const [visualizando, setVisualizando] = useState<Cronograma | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    const [cronosRes, mapaRes] = await Promise.allSettled([cronogramasApi.portalListar(), portalApi.getMapaServicos()]);
    if (cronosRes.status === 'fulfilled') {
      setCronogramas(cronosRes.value || []);
    } else {
      console.error('Erro ao listar cronogramas do portal:', cronosRes.reason);
      setError(cronosRes.reason?.response?.data?.message || 'Não foi possível carregar os cronogramas.');
    }
    if (mapaRes.status === 'fulfilled') setCliente(mapaRes.value.cliente);
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="vxp vxp-portal">
      <PortalHeader cliente={cliente} />
      <div className="pg" style={{ maxWidth: 1000 }}>
        <div className="ph">
          <div>
            <span className="kick">Documentos e planejamento</span>
            <h1 style={{ marginTop: 6 }}>Cronogramas</h1>
            <p>Planejamentos enviados pela equipe VIVOX, em PDF.</p>
          </div>
        </div>

        {loading ? (
          <div className="card animate-pulse" style={{ height: 220 }} aria-busy="true" />
        ) : error ? (
          <div className="card empty">
            <AlertCircle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
            <b>Erro ao carregar cronogramas</b>
            <span>{error}</span>
            <button type="button" className="btn pri sm" onClick={carregarDados}>Tentar de novo</button>
          </div>
        ) : cronogramas.length === 0 ? (
          <div className="card empty">
            <b>Nenhum cronograma disponível ainda</b>
            <span>Quando a equipe enviar um cronograma em PDF, ele aparece aqui.</span>
          </div>
        ) : (
          <section className="card">
            {cronogramas.map((c) => (
              <div className="row" key={c.id}>
                <span className="fi">PDF</span>
                <div className="t">
                  <b>{c.titulo || c.nomeArquivo}</b>
                  <small>{formatarMesReferencia(c.mes, c.ano)} · {formatarTamanhoBytes(c.tamanho)} · enviado em {dataBR(c.createdAt)}</small>
                </div>
                <button className="btn sec sm" type="button" onClick={() => setVisualizando(c)}>
                  <Eye className="i" aria-hidden="true" />Ver
                </button>
              </div>
            ))}
          </section>
        )}
      </div>

      {visualizando && (
        <PdfViewerModal
          isOpen={Boolean(visualizando)}
          onClose={() => setVisualizando(null)}
          titulo={visualizando.titulo}
          nomeArquivo={visualizando.nomeArquivo}
          fetchBlob={() => cronogramasApi.portalBaixarArquivo(visualizando.id)}
        />
      )}
    </div>
  );
}

export default PortalCronogramas;
