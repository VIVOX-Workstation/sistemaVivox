import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, CalendarDays, Clock3 } from 'lucide-react';
import type { DocumentoProposta } from './types';
import { documentoHtml } from './documentoHtml';
import './propostas.css';

export function PropostaDocumento({ documento }: { documento: DocumentoProposta }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [altura, setAltura] = useState(600);
  const [baixando, setBaixando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [erroDownload, setErroDownload] = useState('');
  const html = useMemo(() => documentoHtml(documento), [documento]);
  useEffect(() => {
    const iframe = frame.current;
    let observer: ResizeObserver | undefined;
    const preparar = () => {
      observer?.disconnect();
      const pagina = iframe?.contentDocument?.querySelector('.document');
      if (!pagina) return;
      const medir = () => setAltura(Math.ceil(pagina.getBoundingClientRect().height));
      observer = new ResizeObserver(medir); observer.observe(pagina); medir();
    };
    iframe?.addEventListener('load', preparar); preparar();
    return () => { iframe?.removeEventListener('load', preparar); observer?.disconnect(); };
  }, [html]);
  const baixar = async () => {
    if (baixando) return;
    setBaixando(true); setErroDownload(''); setProgresso('Preparando PDF…');
    try {
      const { baixarProposta } = await import('./baixarProposta');
      await baixarProposta(documento, (pagina, total) => setProgresso(`Gerando PDF: ${pagina} de ${total}`));
      setProgresso('PDF gerado.');
    } catch { setErroDownload('Não foi possível gerar o PDF. Tente novamente.'); setProgresso(''); }
    finally { setBaixando(false); }
  };
  const criada = documento.createdAt ? new Date(documento.createdAt) : null;
  const dataCriacao = criada && !Number.isNaN(criada.getTime())
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Cuiaba' }).format(criada) : 'Ainda não salva';
  return <section className="proposta-visualizador" aria-label="Visualização da proposta em rolagem contínua">
    <div className="proposta-palco">
      <div className="proposta-quadro">
        <iframe ref={frame} className="proposta-frame" title={`Proposta: ${documento.titulo}`}
          sandbox="allow-same-origin" referrerPolicy="no-referrer" srcDoc={html} style={{ height: altura }} />
      </div>
    </div>
    <aside className="proposta-barra-direita" aria-label="Informações da proposta">
      <h2>Informações da proposta</h2>
      <p className="proposta-sidebar-titulo">{documento.titulo}</p>
      <dl>
        <div><dt><Clock3 aria-hidden="true" />Criada em</dt><dd>{criada && !Number.isNaN(criada.getTime()) ? <time dateTime={documento.createdAt}>{dataCriacao}</time> : dataCriacao}</dd></div>
        <div><dt><CalendarDays aria-hidden="true" />Válida até</dt><dd>{documento.validade ? <time dateTime={documento.validade.slice(0, 10)}>{documento.validade.slice(0, 10).split('-').reverse().join('/')}</time> : 'Não informada'}</dd></div>
      </dl>
      <button className="btn pri" type="button" disabled={baixando} onClick={baixar}><Download className="i" aria-hidden="true" />{baixando ? 'Gerando PDF…' : 'Baixar proposta'}</button>
      {progresso && <p className="mut" role="status">{progresso}</p>}
      {erroDownload && <p role="alert" style={{ color: 'var(--bad)' }}>{erroDownload}</p>}
      <p className="mut proposta-somente-leitura">Somente visualização · O PDF inclui a proposta completa.</p>
    </aside>
  </section>;
}
