import { lazy, Suspense, useEffect, useState, type DragEvent, type FormEvent } from 'react';
import axios from 'axios';
import { ExternalLink, FileText, UploadCloud, X } from 'lucide-react';
import { api } from '../../api/client';
import { formatarTamanhoBytes } from '../../api/cronogramas';
import type { Proposta } from './types';
import './proposta-pdf.css';

const PdfPaginas = lazy(() => import('./PdfPaginas').then(m => ({ default: m.PdfPaginas })));

const MAX_BYTES = 30 * 1024 * 1024; // igual a PROPOSTA_PDF_MAX_BYTES no backend
const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

/** Envio (sem proposta) ou edição (com proposta) de uma proposta em PDF. */
export function PropostaPdfForm({ base, proposta, nomeCliente, onSalvo, onVoltar, onDirtyChange }: {
  base: string;
  proposta?: Proposta;
  nomeCliente: string;
  onSalvo: (proposta: Proposta) => void;
  onVoltar: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [titulo, setTitulo] = useState(proposta?.titulo ?? '');
  const [destinatario, setDestinatario] = useState(proposta?.destinatario ?? nomeCliente);
  const [apresentacao, setApresentacao] = useState(proposta?.apresentacao ?? '');
  const [validade, setValidade] = useState(proposta?.validade?.slice(0, 10) ?? '');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  // Prévia: o arquivo escolhido agora ou o já salvo (baixado com a sessão da equipe).
  const [previa, setPrevia] = useState<string | null>(null);
  const [paginas, setPaginas] = useState<number | null>(null);

  const alterado = !!arquivo || titulo !== (proposta?.titulo ?? '') || destinatario !== (proposta?.destinatario ?? nomeCliente)
    || apresentacao !== (proposta?.apresentacao ?? '') || validade !== (proposta?.validade?.slice(0, 10) ?? '');
  useEffect(() => { onDirtyChange(alterado); return () => onDirtyChange(false); }, [alterado, onDirtyChange]);

  useEffect(() => {
    let url: string | null = null;
    let cancelado = false;
    setPaginas(null);
    if (arquivo) {
      url = URL.createObjectURL(arquivo);
      setPrevia(url);
    } else if (proposta) {
      void api.get(`${base}/${proposta.id}/arquivo`, { responseType: 'blob' }).then(({ data }) => {
        if (cancelado) return;
        url = URL.createObjectURL(data);
        setPrevia(url);
      }).catch(() => { if (!cancelado) setPrevia(null); });
    } else setPrevia(null);
    return () => { cancelado = true; if (url) URL.revokeObjectURL(url); };
  }, [arquivo, proposta, base]);

  const escolher = (lista: FileList | null) => {
    const f = lista?.[0];
    if (!f) return;
    setErro('');
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return setErro('Escolha um arquivo PDF.');
    if (f.size > MAX_BYTES) return setErro('O PDF pode ter no máximo 30 MB.');
    setArquivo(f);
    // Sugere o título pelo nome do arquivo quando ainda está em branco.
    if (!titulo.trim()) setTitulo(f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim());
  };
  const soltar = (e: DragEvent) => { e.preventDefault(); setArrastando(false); escolher(e.dataTransfer.files); };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (progresso !== null) return;
    if (!proposta && !arquivo) return setErro('Escolha o PDF da proposta.');
    setErro(''); setProgresso(0);
    const dados = new FormData();
    dados.append('titulo', titulo.trim());
    dados.append('destinatario', destinatario.trim());
    dados.append('apresentacao', apresentacao);
    dados.append('validade', validade);
    if (arquivo) dados.append('arquivo', arquivo);
    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p: { loaded: number; total?: number }) => { if (p.total) setProgresso(Math.round((p.loaded * 100) / p.total)); },
      };
      const { data } = proposta ? await api.patch(`${base}/${proposta.id}/pdf`, dados, config) : await api.post(`${base}/pdf`, dados, config);
      setArquivo(null);
      onSalvo(data);
    } catch (error) {
      const mensagem = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setErro(mensagem ? `Não foi possível salvar: ${Array.isArray(mensagem) ? mensagem.join('; ') : mensagem}` : 'Não foi possível enviar o PDF. Tente novamente.');
    } finally {
      setProgresso(null);
    }
  };

  const abrirPdf = () => { if (previa) window.open(previa, '_blank', 'noopener'); };
  const ocupado = progresso !== null;

  return (
    <form className="ppdf-form" onSubmit={salvar} aria-busy={ocupado}>
      <section className="card ppdf-form-campos">
        <div className="acts" style={{ justifyContent: 'space-between' }}>
          <b>{proposta ? 'Proposta em PDF' : 'Enviar proposta em PDF'}</b>
          <button type="button" className="btn sec sm" onClick={onVoltar} disabled={ocupado}>Voltar às propostas</button>
        </div>

        {arquivo ? (
          <div className="ppdf-arquivo">
            <FileText size={22} aria-hidden="true" style={{ color: '#91672b', flex: 'none' }} />
            <div><b>{arquivo.name}</b><small>{formatarTamanhoBytes(arquivo.size)}{proposta ? ' · vai substituir o arquivo atual' : ''}</small></div>
            <button type="button" className="btn sec sm" onClick={() => setArquivo(null)} disabled={ocupado} aria-label="Remover arquivo escolhido"><X size={14} aria-hidden="true" /></button>
          </div>
        ) : (
          <label
            className={`ppdf-solta${arrastando ? ' arrastando' : ''}`}
            onDragOver={e => { e.preventDefault(); setArrastando(true); }}
            onDragLeave={() => setArrastando(false)}
            onDrop={soltar}
          >
            <input type="file" accept="application/pdf,.pdf" onChange={e => { escolher(e.target.files); e.target.value = ''; }} disabled={ocupado} />
            <span className="ppdf-solta-icone"><UploadCloud size={22} aria-hidden="true" /></span>
            <b>{proposta ? 'Substituir o PDF' : 'Arraste o PDF aqui ou clique para escolher'}</b>
            <span className="mut">Somente PDF, até 30 MB.</span>
          </label>
        )}

        <div className="fld"><label htmlFor="ppdf-titulo">Título da proposta</label><input id="ppdf-titulo" className="inp" required maxLength={200} value={titulo} onChange={e => setTitulo(e.target.value)} disabled={ocupado} /></div>
        <div className="proposta-editor-campos">
          <div className="fld"><label htmlFor="ppdf-destinatario">Destinatário</label><input id="ppdf-destinatario" className="inp" required maxLength={200} value={destinatario} onChange={e => setDestinatario(e.target.value)} disabled={ocupado} /></div>
          <div className="fld"><label htmlFor="ppdf-validade">Validade (opcional)</label><input id="ppdf-validade" className="inp" type="date" value={validade} onChange={e => setValidade(e.target.value)} disabled={ocupado} /></div>
        </div>
        <div className="fld">
          <label htmlFor="ppdf-apresentacao">Mensagem de apresentação (opcional)</label>
          <textarea id="ppdf-apresentacao" className="inp" maxLength={5000} value={apresentacao} onChange={e => setApresentacao(e.target.value)} disabled={ocupado}
            placeholder="Aparece na capa do link, acima do PDF." />
        </div>

        {ocupado && <div className="ppdf-progresso" role="progressbar" aria-valuenow={progresso ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Envio do PDF"><div style={{ width: `${progresso}%` }} /></div>}
        {erro && <p role="alert" style={{ color: 'var(--bad)', margin: 0 }}>{erro}</p>}
        <div className="acts">
          <button className="btn pri" type="submit" disabled={ocupado || (!proposta && !arquivo)}>{ocupado ? `Enviando… ${progresso}%` : proposta ? 'Salvar alterações' : 'Enviar proposta'}</button>
          {alterado && !ocupado && <span className="mut" role="status">Alterações não salvas</span>}
        </div>
      </section>

      <aside className="ppdf-lado" aria-label="Prévia e dados do arquivo">
        <div className="ppdf-miniatura">
          {previa ? (
            <Suspense fallback={<p>Carregando prévia…</p>}>
              <PdfPaginas fonte={previa} maxPaginas={1} onCarregado={setPaginas} />
            </Suspense>
          ) : <p>A primeira página aparece aqui.</p>}
        </div>
        {(proposta || arquivo) && (
          <dl className="card ppdf-ficha">
            {proposta?.createdAt && <div><dt>Criada em</dt><dd>{dataHora(proposta.createdAt)}</dd></div>}
            {proposta && <div><dt>Criada por</dt><dd>{proposta.criadoPor?.nome ?? '—'}</dd></div>}
            {proposta?.createdAt && Date.parse(proposta.updatedAt) - Date.parse(proposta.createdAt) > 60_000 && <div><dt>Última alteração</dt><dd>{dataHora(proposta.updatedAt)}</dd></div>}
            <div><dt>Arquivo</dt><dd>{arquivo?.name ?? proposta?.nomeArquivo ?? '—'}</dd></div>
            <div><dt>Tamanho e páginas</dt><dd>{formatarTamanhoBytes(arquivo?.size ?? proposta?.tamanho ?? 0)}{paginas ? ` · ${paginas} ${paginas === 1 ? 'página' : 'páginas'}` : ''}</dd></div>
            {previa && <button type="button" className="btn sec sm" onClick={abrirPdf}><ExternalLink size={14} aria-hidden="true" /> Abrir PDF</button>}
          </dl>
        )}
      </aside>
    </form>
  );
}
