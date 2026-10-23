import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../../api/client';
import { PropostaDocumento } from './PropostaDocumento';
import { PropostaLanding } from './PropostaLanding';
import type { DocumentoProposta } from './types';
import './propostas.css';

const DemoEnsino = lazy(() => import('./demos/ensino/DemoEnsino'));

export function PropostaPublica() {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [documento, setDocumento] = useState<DocumentoProposta | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const abaParam = searchParams.get('aba');
  const abaAtiva = abaParam === 'demo' ? 'demo' : 'proposta';

  const mudarAba = (novaAba: 'proposta' | 'demo') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (novaAba === 'demo') {
        next.set('aba', 'demo');
      } else {
        next.delete('aba');
      }
      return next;
    });
  };

  useEffect(() => {
    const abort = new AbortController();
    setErro(false);
    setDocumento(null);
    // Sem sessão e sem interceptors: nunca altera o login de quem recebeu o link.
    axios
      .get(`${getApiBaseUrl().replace(/\/$/, '')}/propostas-publicas/${encodeURIComponent(token || '')}`, {
        signal: abort.signal,
      })
      .then(({ data }) => setDocumento(data))
      .catch(() => {
        if (!abort.signal.aborted) setErro(true);
      });
    return () => abort.abort();
  }, [token, tentativa]);

  useEffect(() => {
    const tags = [
      Object.assign(document.createElement('meta'), { name: 'referrer', content: 'no-referrer' }),
      Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' }),
    ];
    tags.forEach(tag => document.head.appendChild(tag));
    return () => tags.forEach(tag => tag.remove());
  }, []);

  return (
    <main className="vxp proposta-publica">
      {erro ? (
        <div className="card empty">
          <h1>Proposta indisponível</h1>
          <p>O link pode ter sido revogado ou a conexão falhou. Solicite o link atualizado à equipe.</p>
          <button className="btn sec" onClick={() => setTentativa(n => n + 1)}>
            Tentar de novo
          </button>
        </div>
      ) : documento ? (
        documento.demo ? (
          <>
            {/* Barra fixa no topo com as duas abas */}
            <header className="vxp-demo-topbar">
              <div className="vxp-demo-topbar-inner">
                <div className="vxp-demo-topbar-left">
                  <span className="vxp-demo-pill">VIVOX</span>
                  <span className="vxp-demo-title">{documento.titulo}</span>
                </div>
                <div className="vxp-demo-tabs" role="tablist" aria-label="Navegação da proposta interativa">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaAtiva === 'proposta'}
                    className={`vxp-demo-tab-btn ${abaAtiva === 'proposta' ? 'vxp-demo-tab-active' : ''}`}
                    onClick={() => mudarAba('proposta')}
                  >
                    Proposta
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaAtiva === 'demo'}
                    className={`vxp-demo-tab-btn ${abaAtiva === 'demo' ? 'vxp-demo-tab-active' : ''}`}
                    onClick={() => mudarAba('demo')}
                  >
                    Demo da plataforma
                  </button>
                </div>
              </div>
            </header>

            {abaAtiva === 'demo' ? (
              <Suspense
                fallback={
                  <div
                    className="card animate-pulse"
                    aria-busy="true"
                    aria-label="Carregando demonstração"
                    style={{ minHeight: '80vh', background: '#0f1015' }}
                  />
                }
              >
                <DemoEnsino documento={documento} />
              </Suspense>
            ) : (
              <PropostaLanding documento={documento} onVerDemo={() => mudarAba('demo')} />
            )}
          </>
        ) : (
          <PropostaDocumento documento={documento} />
        )
      ) : (
        <div
          className="card animate-pulse"
          aria-busy="true"
          aria-label="Carregando proposta"
          style={{ minHeight: 380, background: 'var(--sk)' }}
        />
      )}
    </main>
  );
}
