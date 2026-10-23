import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { CalendarClock, Download, FilePen, FileText, History, Menu, Send, X } from 'lucide-react';
import { VivoxLogo } from '../../components/brand/VivoxLogo';
import { formatarTamanhoBytes } from '../../api/cronogramas';
import type { DocumentoProposta } from './types';
import './proposta-pdf.css';

// pdf.js só é baixado por quem abre uma proposta em PDF.
const PdfPaginas = lazy(() => import('./PdfPaginas').then(m => ({ default: m.PdfPaginas })));

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const data = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');

/** Link público da proposta em PDF: o arquivo à esquerda e, à direita, os dados e o histórico. */
export function PropostaPdfPublica({ documento, arquivoUrl }: { documento: DocumentoProposta & { updatedAt?: string }; arquivoUrl: string }) {
  const [paginas, setPaginas] = useState<number | null>(null);
  const [atual, setAtual] = useState(1);
  const [erro, setErro] = useState(false);
  const [baixando, setBaixando] = useState(false);
  // No celular os dados ficam numa gaveta à esquerda, aberta pelo botão da barra do PDF.
  const [gaveta, setGaveta] = useState(false);
  useEffect(() => {
    if (!gaveta) return;
    const fechar = (e: KeyboardEvent) => { if (e.key === 'Escape') setGaveta(false); };
    document.addEventListener('keydown', fechar);
    return () => document.removeEventListener('keydown', fechar);
  }, [gaveta]);
  const nome = documento.nomeArquivo || `${documento.titulo}.pdf`;
  const acento = /^#[0-9a-f]{6}$/i.test(documento.corDestaque) ? documento.corDestaque : '#91672b';
  const aoVerPagina = useCallback((n: number) => setAtual(n), []);
  const vencida = documento.validade ? new Date(`${documento.validade.slice(0, 10)}T23:59:59`) < new Date() : false;
  const atualizada = documento.createdAt && documento.updatedAt
    && Date.parse(documento.updatedAt) - Date.parse(documento.createdAt) > 60_000;

  // O atributo download não vale entre origens (API em outro domínio): baixa como blob.
  const baixar = async () => {
    if (baixando) return;
    setBaixando(true);
    try {
      const resposta = await fetch(arquivoUrl, { referrerPolicy: 'no-referrer' });
      if (!resposta.ok) throw new Error(String(resposta.status));
      const url = URL.createObjectURL(await resposta.blob());
      Object.assign(document.createElement('a'), { href: url, download: nome }).click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(arquivoUrl, '_blank', 'noopener');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div className={`ppdf${gaveta ? " ppdf-gaveta-aberta" : ""}`} style={{ ['--ppdf-acento' as string]: acento }}>
      <section className="ppdf-palco" aria-label="Proposta em PDF">
        <div className="ppdf-barra" aria-live="polite">
          <button type="button" className="ppdf-icone ppdf-so-celular" onClick={() => setGaveta(true)} aria-label="Dados da proposta" aria-expanded={gaveta} aria-controls="ppdf-lateral">
            <Menu size={20} aria-hidden="true" />
          </button>
          <span className="ppdf-barra-nome" title={nome}><FileText size={14} aria-hidden="true" /> {nome}</span>
          {paginas && <span className="ppdf-barra-pagina">Página {atual} de {paginas}</span>}
          <button type="button" className="ppdf-icone ppdf-so-celular" onClick={baixar} disabled={baixando} aria-label="Baixar proposta">
            <Download size={18} aria-hidden="true" />
          </button>
        </div>
        {erro ? (
          <div className="ppdf-erro">
            <p>Não foi possível mostrar o PDF aqui.</p>
            <button type="button" className="ppdf-botao" onClick={baixar}><Download size={16} aria-hidden="true" /> Baixar o arquivo</button>
          </div>
        ) : (
          <Suspense fallback={<div className="ppdf-carregando" aria-busy="true">Carregando a proposta…</div>}>
            {paginas === null && <div className="ppdf-carregando" aria-busy="true">Carregando a proposta…</div>}
            <PdfPaginas className="ppdf-paginas" fonte={arquivoUrl} onCarregado={setPaginas} onErro={() => setErro(true)} onPagina={aoVerPagina} />
          </Suspense>
        )}
      </section>

      <div className="ppdf-fundo" onClick={() => setGaveta(false)} aria-hidden="true" />
      <aside id="ppdf-lateral" className="ppdf-lateral" aria-label="Dados da proposta">
        <div className="ppdf-lateral-topo">
          <VivoxLogo className="ppdf-logo" />
          <button type="button" className="ppdf-icone ppdf-so-celular" onClick={() => setGaveta(false)} aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="ppdf-cabeca">
          <p className="ppdf-sobretitulo">Proposta comercial</p>
          <h1>{documento.titulo}</h1>
          <p className="ppdf-para">Preparada para <strong>{documento.destinatario}</strong></p>
        </div>

        {documento.apresentacao.trim() && <p className="ppdf-apresentacao">{documento.apresentacao}</p>}

        <div className="ppdf-historico">
          <h2><History size={15} aria-hidden="true" /> Histórico</h2>
          <ol>
            {documento.createdAt && (
              <li><span><Send size={14} aria-hidden="true" /> Proposta enviada</span><time dateTime={documento.createdAt}>{dataHora(documento.createdAt)}</time></li>
            )}
            {atualizada && documento.updatedAt && (
              <li><span><FilePen size={14} aria-hidden="true" /> Proposta atualizada</span><time dateTime={documento.updatedAt}>{dataHora(documento.updatedAt)}</time></li>
            )}
            {documento.validade && (
              <li className={vencida ? 'ppdf-vencida' : ''}>
                <span><CalendarClock size={14} aria-hidden="true" /> {vencida ? 'Validade encerrada' : 'Validade da proposta'}</span>
                <time dateTime={documento.validade.slice(0, 10)}>{data(documento.validade)}</time>
              </li>
            )}
            <li>
              <span><FileText size={14} aria-hidden="true" /> Arquivo PDF</span>
              <span className="ppdf-valor">{[paginas ? `${paginas} ${paginas === 1 ? 'página' : 'páginas'}` : null, documento.tamanho ? formatarTamanhoBytes(documento.tamanho) : null].filter(Boolean).join(' · ') || '—'}</span>
            </li>
          </ol>
        </div>

        <button type="button" className="ppdf-botao" onClick={baixar} disabled={baixando}>
          <Download size={16} aria-hidden="true" /> {baixando ? 'Baixando…' : 'Baixar proposta'}
        </button>

        <p className="ppdf-rodape">Documento confidencial, destinado a {documento.destinatario}.</p>
      </aside>
    </div>
  );
}
