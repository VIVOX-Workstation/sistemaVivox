import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../../api/client';
import { PropostaDocumento } from './PropostaDocumento';
import type { DocumentoProposta } from './types';

export function PropostaPublica() {
  const { token } = useParams();
  const [documento, setDocumento] = useState<DocumentoProposta | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setErro(false); setDocumento(null);
    // Sem sessão e sem interceptors: nunca altera o login de quem recebeu o link.
    axios.get(`${getApiBaseUrl().replace(/\/$/, '')}/propostas-publicas/${encodeURIComponent(token || '')}`, { signal: abort.signal })
      .then(({ data }) => setDocumento(data))
      .catch(() => { if (!abort.signal.aborted) setErro(true); });
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
  return <main className="vxp proposta-publica">
    {erro ? <div className="card empty"><h1>Proposta indisponível</h1><p>O link pode ter sido revogado ou a conexão falhou. Solicite o link atualizado à equipe.</p><button className="btn sec" onClick={() => setTentativa(n => n + 1)}>Tentar de novo</button></div>
      : documento ? <PropostaDocumento documento={documento} />
        : <div className="card animate-pulse" aria-busy="true" aria-label="Carregando proposta" style={{ minHeight: 380, background: 'var(--sk)' }} />}
  </main>;
}
