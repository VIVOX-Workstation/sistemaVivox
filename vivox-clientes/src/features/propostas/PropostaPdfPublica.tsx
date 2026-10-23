import { lazy, Suspense, useCallback, useState } from 'react';
import { ArrowDown, CalendarClock, CalendarDays, Download, FileText, Layers } from 'lucide-react';
import { VivoxLogo } from '../../components/brand/VivoxLogo';
import { formatarTamanhoBytes } from '../../api/cronogramas';
import type { DocumentoProposta } from './types';
import './proposta-pdf.css';

// pdf.js só é baixado por quem abre uma proposta em PDF.
const PdfPaginas = lazy(() => import('./PdfPaginas').then(m => ({ default: m.PdfPaginas })));

const dataLonga = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

export function PropostaPdfPublica({ documento, arquivoUrl }: { documento: DocumentoProposta; arquivoUrl: string }) {
  const [paginas, setPaginas] = useState<number | null>(null);
  const [atual, setAtual] = useState(1);
  const [erro, setErro] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const nome = documento.nomeArquivo || `${documento.titulo}.pdf`;
  const acento = /^#[0-9a-f]{6}$/i.test(documento.corDestaque) ? documento.corDestaque : '#91672b';
  const aoVerPagina = useCallback((n: number) => setAtual(n), []);

  // O atributo download não vale entre origens (API em outro domínio): baixa como blob.
  const baixar = async () => {
    if (baixando) return;
    setBaixando(true);
    try {
      const resposta = await fetch(arquivoUrl, { referrerPolicy: 'no-referrer' });
      if (!resposta.ok) throw new Error(String(resposta.status));
      const url = URL.createObjectURL(await resposta.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: nome });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(arquivoUrl, '_blank', 'noopener');
    } finally {
      setBaixando(false);
    }
  };

  const vencida = documento.validade ? new Date(`${documento.validade.slice(0, 10)}T23:59:59`) < new Date() : false;

  return (
    <div className="ppdf" style={{ ['--ppdf-acento' as string]: acento }}>
      <header className="ppdf-topo">
        <VivoxLogo className="ppdf-logo" />
        <button type="button" className="ppdf-botao ppdf-botao-claro" onClick={baixar} disabled={baixando}>
          <Download size={16} aria-hidden="true" /> <span>{baixando ? 'Baixando…' : 'Baixar PDF'}</span>
        </button>
      </header>

      <section className="ppdf-capa">
        <div className="ppdf-capa-texto">
          <p className="ppdf-sobretitulo">Proposta comercial</p>
          <h1>{documento.titulo}</h1>
          <p className="ppdf-para">Preparada para <strong>{documento.destinatario}</strong></p>
          {documento.apresentacao.trim() && <p className="ppdf-apresentacao">{documento.apresentacao}</p>}
          <div className="ppdf-acoes">
            <a className="ppdf-botao ppdf-botao-forte" href="#ppdf-leitor"><ArrowDown size={16} aria-hidden="true" /> Ler a proposta</a>
            <button type="button" className="ppdf-botao ppdf-botao-claro" onClick={baixar} disabled={baixando}>
              <Download size={16} aria-hidden="true" /> {baixando ? 'Baixando…' : 'Baixar PDF'}
            </button>
          </div>
        </div>

        <dl className="ppdf-dados">
          {documento.createdAt && <div><dt><CalendarDays size={15} aria-hidden="true" /> Enviada em</dt><dd>{dataLonga(documento.createdAt)}</dd></div>}
          {documento.validade && <div className={vencida ? 'ppdf-vencida' : ''}><dt><CalendarClock size={15} aria-hidden="true" /> {vencida ? 'Validade encerrada em' : 'Válida até'}</dt><dd>{dataLonga(documento.validade)}</dd></div>}
          <div><dt><Layers size={15} aria-hidden="true" /> Páginas</dt><dd>{paginas ?? '—'}</dd></div>
          <div><dt><FileText size={15} aria-hidden="true" /> Arquivo</dt><dd title={nome}>PDF{documento.tamanho ? ` · ${formatarTamanhoBytes(documento.tamanho)}` : ''}</dd></div>
        </dl>
      </section>

      <section id="ppdf-leitor" className="ppdf-leitor" aria-label="Proposta em PDF">
        <div className="ppdf-barra" aria-live="polite">
          <span className="ppdf-barra-nome" title={nome}>{nome}</span>
          {paginas && <span className="ppdf-barra-pagina">Página {atual} de {paginas}</span>}
        </div>
        {erro ? (
          <div className="ppdf-erro">
            <p>Não foi possível mostrar o PDF aqui.</p>
            <button type="button" className="ppdf-botao ppdf-botao-forte" onClick={baixar}><Download size={16} aria-hidden="true" /> Baixar o arquivo</button>
          </div>
        ) : (
          <Suspense fallback={<div className="ppdf-carregando" aria-busy="true">Carregando a proposta…</div>}>
            {paginas === null && <div className="ppdf-carregando" aria-busy="true">Carregando a proposta…</div>}
            <PdfPaginas className="ppdf-paginas" fonte={arquivoUrl} onCarregado={setPaginas} onErro={() => setErro(true)} onPagina={aoVerPagina} />
          </Suspense>
        )}
      </section>

      <footer className="ppdf-rodape">
        <VivoxLogo className="ppdf-logo" />
        <p>Documento confidencial, destinado a {documento.destinatario}.</p>
      </footer>
    </div>
  );
}
