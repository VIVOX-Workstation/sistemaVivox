import { useEffect, useState, type SyntheticEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../../api/client';
import { PropostaDocumento } from './PropostaDocumento';
import { PropostaLanding } from './PropostaLanding';
import type { DocumentoProposta } from './types';
import './propostas.css';

// Telas exportadas em public/demos/<demo>/<Tela>.dc.html. Os links entre elas já
// vêm nas próprias telas (leftbar, cards, botões); aqui só escolhemos o ambiente.
const AMBIENTES = [
  { id: 'aluno', rotulo: 'Portal do aluno', inicio: 'Catalogo.dc.html' },
  { id: 'admin', rotulo: 'Painel administrativo', inicio: 'AdminDashboard.dc.html' },
] as const;

function DemoNavegavel({ demo, titulo }: { demo: string; titulo: string }) {
  const [tela, setTela] = useState('Login.dc.html');
  const [versao, setVersao] = useState(0);
  const [atual, setAtual] = useState('Login.dc.html');
  const ambiente = atual.startsWith('Admin') ? 'admin' : 'aluno';

  // A navegação acontece dentro do iframe (mesma origem): lê a tela aberta para marcar o ambiente.
  const aoCarregar = (e: SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const arquivo = e.currentTarget.contentWindow?.location.pathname.split('/').pop();
      if (arquivo) setAtual(arquivo);
    } catch {
      /* fora da mesma origem: mantém o último estado */
    }
  };

  const abrir = (arquivo: string) => {
    setTela(arquivo);
    setAtual(arquivo);
    setVersao(v => v + 1); // remonta o iframe mesmo quando o src não muda
  };

  return (
    <div className="vxp-demo-nav">
      <div className="vxp-demo-ambientes" role="tablist" aria-label="Ambiente da demo">
        {AMBIENTES.map(a => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={ambiente === a.id}
            className={ambiente === a.id ? 'ativo' : ''}
            onClick={() => abrir(a.inicio)}
          >
            {a.rotulo}
          </button>
        ))}
        <span className="vxp-demo-dica">Dados fictícios · clique à vontade</span>
      </div>
      <iframe
        key={versao}
        className="vxp-demo-frame"
        src={`/demos/${demo}/${tela}`}
        title={`Demo — ${titulo}`}
        onLoad={aoCarregar}
      />
    </div>
  );
}

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
              <DemoNavegavel demo={documento.demo} titulo={documento.titulo} />
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
