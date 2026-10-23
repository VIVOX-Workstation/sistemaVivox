import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { PropostaDocumento } from './PropostaDocumento';
import { modeloEnsino } from './modeloEnsino';
import { PropostaHtmlEditor } from './PropostaHtmlEditor';
import { normalizarModeloLegado } from './modeloLegado';
import axios from 'axios';
import { FileText, Share2 } from 'lucide-react';
import { VxDialog } from '../../components/clean/VxDialog';
import { PropostaPdfForm } from './PropostaPdfForm';
import { formatarTamanhoBytes } from '../../api/cronogramas';
import type { DocumentoProposta, Proposta } from './types';

function vazia(nome: string): DocumentoProposta {
  return { titulo: 'Nova proposta', destinatario: nome, apresentacao: '', validade: null, corDestaque: '#91672b', demo: null, secoes: [] };
}
function editavel(proposta: DocumentoProposta): DocumentoProposta {
  proposta = normalizarModeloLegado(proposta);
  return { titulo: proposta.titulo, destinatario: proposta.destinatario, apresentacao: proposta.apresentacao,
    validade: proposta.validade?.slice(0, 10) || null, corDestaque: proposta.corDestaque, demo: proposta.demo ?? null,
    ...(proposta.createdAt ? { createdAt: proposta.createdAt } : {}),
    secoes: proposta.secoes.map(s => ({ ...s })) };
}

export function PropostasTab({ clienteId, nomeCliente, onDirtyChange }: { clienteId: string; nomeCliente: string; onDirtyChange: (dirty: boolean) => void }) {
  const [lista, setLista] = useState<Proposta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [documento, setDocumento] = useState<DocumentoProposta | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [original, setOriginal] = useState('');
  const [preview, setPreview] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [link, setLink] = useState('');
  const [compartilhadaLista, setCompartilhadaLista] = useState<Proposta | null>(null);
  const [feedbackLink, setFeedbackLink] = useState('');
  // Proposta em PDF aberta no formulário: { } para enviar uma nova, { proposta } para editar.
  const [pdf, setPdf] = useState<{ proposta?: Proposta } | null>(null);
  const [pdfAlterado, setPdfAlterado] = useState(false);
  const base = `/clientes/${clienteId}/propostas`;
  const alterado = documento !== null && JSON.stringify(documento) !== original;
  const atual = lista.find(p => p.id === id);

  const carregar = useCallback(async () => {
    setCarregando(true); setErroCarga(false);
    try { setLista((await api.get(base)).data); }
    catch { setErroCarga(true); }
    finally { setCarregando(false); }
  }, [base]);
  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => { onDirtyChange(alterado || pdfAlterado); return () => onDirtyChange(false); }, [alterado, pdfAlterado, onDirtyChange]);
  useEffect(() => {
    if (!alterado) return;
    const proteger = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const protegerLink = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      if (!confirm('Descartar as alterações não salvas?')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', proteger);
    document.addEventListener('click', protegerLink, true);
    return () => { window.removeEventListener('beforeunload', proteger); document.removeEventListener('click', protegerLink, true); };
  }, [alterado]);

  const abrirPdf = (proposta?: Proposta) => {
    setErro(''); setAviso(''); setLink('');
    setPdf(proposta ? { proposta } : {});
  };
  const fecharPdf = () => {
    if (pdfAlterado && !confirm('Descartar as alterações não salvas?')) return;
    setPdf(null); setAviso('');
  };
  const pdfSalvo = (data: Proposta) => {
    const anterior = lista.find(p => p.id === data.id);
    const salva = { ...data, compartilhada: anterior?.compartilhada || false, criadoPor: anterior?.criadoPor ?? data.criadoPor };
    setLista(ls => [salva, ...ls.filter(p => p.id !== data.id)]);
    setPdf({ proposta: salva });
    setAviso(anterior ? 'Proposta atualizada.' : 'Proposta enviada. Gere o link para compartilhar com o cliente.');
    if (!anterior) void carregar(); // traz "criada por" do servidor
  };
  const abrir = (proposta?: Proposta, ensino = false) => {
    if (proposta?.formato === 'pdf') return abrirPdf(proposta);
    if (alterado && !confirm('Descartar as alterações não salvas?')) return;
    const dados = proposta ? editavel(proposta) : ensino ? { ...editavel(modeloEnsino), destinatario: nomeCliente } : vazia(nomeCliente);
    setDocumento(dados); setId(proposta?.id || null);
    setOriginal(proposta ? JSON.stringify(dados) : '');
    setPreview(false); setErro(''); setAviso(''); setLink('');
  };
  const fechar = () => {
    if (alterado && !confirm('Descartar as alterações não salvas?')) return;
    setDocumento(null); setId(null); setErro(''); setAviso(''); setLink('');
  };
  const campo = <K extends keyof DocumentoProposta>(key: K, value: DocumentoProposta[K]) => {
    if (documento) setDocumento({ ...documento, [key]: value });
  };
  const salvar = async (event: FormEvent) => {
    event.preventDefault(); if (!documento || ocupado) return;
    setOcupado(true); setErro(''); setAviso('');
    try {
      const { createdAt: _createdAt, ...conteudo } = documento;
      const { data } = id ? await api.patch(`${base}/${id}`, conteudo) : await api.post(base, conteudo);
      const dados = editavel(data);
      setDocumento(dados); setOriginal(JSON.stringify(dados)); setId(data.id);
      setLista(anteriores => [{ ...data, compartilhada: atual?.compartilhada || false }, ...anteriores.filter(p => p.id !== data.id)]);
      setAviso('Proposta salva.');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (error.response?.status === 400 && message) setErro(`Não foi possível salvar: ${Array.isArray(message) ? message.join('; ') : message}`);
        else if (error.response?.status === 403) setErro('Sua conta não tem permissão para editar propostas.');
        else if (error.response?.status === 404) setErro('Cliente ou proposta indisponível. Confira se o backend está atualizado.');
        else if (!error.response) setErro('Não foi possível conectar ao servidor. As alterações continuam no editor; tente salvar novamente.');
        else setErro('O servidor não conseguiu salvar a proposta. As alterações continuam no editor; tente novamente.');
      } else setErro('A resposta do servidor não pôde ser lida. Reabra a lista para verificar se a proposta foi salva.');
    }
    finally { setOcupado(false); }
  };
  const compartilhar = async (proposta = atual, renovar = false) => {
    if (!proposta || ocupado || (documento && alterado)) return;
    if (renovar && proposta.compartilhada && !confirm('Gerar um novo link de visualização? O link anterior deixará de funcionar.')) return;
    setOcupado(true); setErro(''); setAviso('');
    try {
      const endpoint = `${base}/${proposta.id}/compartilhar`;
      let token: string | null = null;
      if (proposta.compartilhada && !renovar) {
        const { data } = await api.get(endpoint);
        token = data.token;
        if (!token && !confirm('Este link foi criado antes da recuperação de links. Gerar um novo link para poder consultá-lo depois? O anterior deixará de funcionar.')) return;
      }
      if (!token) token = (await api.post(endpoint)).data.token;
      setLink(`${window.location.origin}/proposta/${token}`);
      setFeedbackLink('');
      setLista(ls => ls.map(p => p.id === proposta.id ? { ...p, compartilhada: true } : p));
      if (!documento) setCompartilhadaLista(proposta);
      setAviso('Link disponível para copiar ou visualizar. Quem receber poderá ver a proposta sem login, sem acesso à edição.');
    } catch (error) {
      const mensagem = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setErro(typeof mensagem === 'string' ? mensagem : 'Não foi possível obter o link da proposta. Tente novamente.');
    }
    finally { setOcupado(false); }
  };
  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(link); setFeedbackLink('Link copiado.'); }
    catch { setFeedbackLink('Selecione e copie o link no campo acima.'); }
  };
  const revogar = async () => {
    if (!id || ocupado || !confirm('Desativar o link desta proposta?')) return;
    setOcupado(true); setErro(''); setAviso('');
    try {
      await api.delete(`${base}/${id}/compartilhar`); setLink('');
      setLista(ls => ls.map(p => p.id === id ? { ...p, compartilhada: false } : p));
      setAviso('Link desativado.');
    } catch { setErro('Não foi possível desativar o link.'); }
    finally { setOcupado(false); }
  };
  const excluir = async (proposta = atual) => {
    if (!proposta || ocupado || !confirm(`Excluir a proposta “${proposta.titulo}” definitivamente? O link também deixará de funcionar.`)) return;
    setOcupado(true); setErro(''); setAviso('');
    try {
      await api.delete(`${base}/${proposta.id}`); setLista(ls => ls.filter(p => p.id !== proposta.id));
      if (id === proposta.id) { setDocumento(null); setId(null); setLink(''); }
      if (pdf?.proposta?.id === proposta.id) { setPdf(null); setPdfAlterado(false); }
      setAviso('Proposta excluída.');
    } catch { setErro('Não foi possível excluir a proposta.'); }
    finally { setOcupado(false); }
  };
  const mover = (index: number, deslocamento: number) => {
    if (!documento) return;
    const secoes = [...documento.secoes];
    [secoes[index], secoes[index + deslocamento]] = [secoes[index + deslocamento], secoes[index]];
    campo('secoes', secoes);
  };

  return <div className="proposta-editor">
    {erro && <p role="alert" style={{ color: 'var(--bad)' }}>{erro}</p>}
    {aviso && <p role="status">{aviso}</p>}
    {pdf ? <>
      <PropostaPdfForm key={pdf.proposta?.id ?? 'nova'} base={base} proposta={pdf.proposta} nomeCliente={nomeCliente}
        onSalvo={pdfSalvo} onVoltar={fecharPdf} onDirtyChange={setPdfAlterado} />
      {pdf.proposta && (() => {
        const p = lista.find(item => item.id === pdf.proposta?.id) ?? pdf.proposta;
        return <div className="acts">
          <button className="btn sec" disabled={ocupado || pdfAlterado} onClick={() => compartilhar(p)}><Share2 className="i" aria-hidden="true" />{p.compartilhada ? 'Ver link ativo' : 'Gerar link para o cliente'}</button>
          <button className="btn dg" disabled={ocupado} onClick={() => excluir(p)}>Excluir proposta</button>
        </div>;
      })()}
    </> : !documento ? <>
      <div className="acts"><button className="btn pri" onClick={() => abrir()}>Criar proposta</button><button className="btn sec" onClick={() => abrir(undefined, true)}>Usar modelo de ensino</button><button className="btn sec" onClick={() => abrirPdf()}><FileText className="i" aria-hidden="true" />Enviar PDF</button></div>
      {carregando ? <div className="card animate-pulse" aria-busy="true" aria-label="Carregando propostas" style={{ height: 160, background: 'var(--sk)' }} />
        : erroCarga ? <div className="card empty"><p>Não foi possível carregar as propostas.</p><button className="btn sec" onClick={carregar}>Tentar de novo</button></div>
          : lista.length === 0 ? <div className="card empty"><b>Nenhuma proposta criada</b><p>Comece em branco, use o modelo da plataforma de ensino ou envie uma proposta pronta em PDF.</p></div>
            : <section className="card"><div className="tw"><table className="tbl"><thead><tr><th>Proposta</th><th>Criação</th><th>Compartilhamento</th><th>Atualizada</th><th>Ações</th></tr></thead><tbody>{lista.map(p => <tr key={p.id}><td>{p.titulo}{p.formato === 'pdf' && <span className="ppdf-tipo">PDF</span>}<span className="ppdf-sub">{p.destinatario}{p.formato === 'pdf' && p.tamanho ? ` · ${formatarTamanhoBytes(p.tamanho)}` : ''}</span></td><td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '—'}<span className="ppdf-sub">{p.criadoPor?.nome ? `por ${p.criadoPor.nome}` : ''}</span></td><td>{p.compartilhada ? 'Link ativo' : 'Não compartilhada'}</td><td>{new Date(p.updatedAt).toLocaleDateString('pt-BR')}</td><td><div className="acts"><button className="btn sec sm" disabled={ocupado} onClick={() => abrir(p)}>Editar proposta</button><button className="btn sec sm" type="button" disabled={ocupado} aria-label={`${p.compartilhada ? 'Ver link ativo de' : 'Compartilhar'} ${p.titulo}`} onClick={() => compartilhar(p)}><Share2 className="i" aria-hidden="true" />{p.compartilhada ? 'Ver link ativo' : 'Compartilhar'}</button><button className="btn dg sm" type="button" disabled={ocupado} aria-label={`Excluir proposta ${p.titulo}`} onClick={() => excluir(p)}>Excluir proposta</button></div></td></tr>)}</tbody></table></div></section>}
    </> : <>
      <div className="acts">
        <button className="btn sec" disabled={ocupado} onClick={fechar}>Voltar às propostas</button>
        <button className="btn sec" onClick={() => setPreview(!preview)}>{preview ? 'Editar conteúdo' : 'Prévia do cliente'}</button>
        {!preview && <button className="btn pri" form="proposta-form" type="submit" disabled={ocupado}>{ocupado ? 'Aguarde…' : 'Salvar proposta'}</button>}
        <span className="mut" role="status">{alterado ? 'Alterações não salvas' : 'Salvo'}</span>
      </div>
      {preview ? <PropostaDocumento documento={documento} /> : <form id="proposta-form" className="proposta-editor" onSubmit={salvar}>
        <fieldset disabled={ocupado} className="proposta-editor" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <section className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
            <div className="fld"><label htmlFor="proposta-titulo">Título da proposta</label><input id="proposta-titulo" className="inp" required maxLength={200} value={documento.titulo} onChange={e => campo('titulo', e.target.value)} /></div>
            <div className="fld"><label htmlFor="proposta-destinatario">Nome do destinatário na proposta</label><input id="proposta-destinatario" className="inp" required maxLength={200} value={documento.destinatario} onChange={e => campo('destinatario', e.target.value)} /></div>
            <div className="fld"><label htmlFor="proposta-apresentacao">Apresentação</label><textarea id="proposta-apresentacao" className="inp" maxLength={5000} value={documento.apresentacao} onChange={e => campo('apresentacao', e.target.value)} /></div>
            <div className="proposta-editor-campos">
              <div className="fld"><label htmlFor="proposta-validade">Validade (opcional)</label><input id="proposta-validade" className="inp" type="date" value={documento.validade || ''} onChange={e => campo('validade', e.target.value || null)} /></div>
              <div className="fld"><label htmlFor="proposta-cor">Cor de destaque</label><input id="proposta-cor" className="inp" type="color" value={documento.corDestaque} onChange={e => campo('corDestaque', e.target.value)} /></div>
              <div className="fld"><label htmlFor="proposta-demo">Demo interativa</label><select id="proposta-demo" className="inp" value={documento.demo || ''} onChange={e => campo('demo', (e.target.value as 'ensino') || null)}><option value="">Nenhuma</option><option value="ensino">Plataforma de ensino</option></select></div>
            </div>
          </section>
          <p className="mut">No modelo, clique nos textos dos cartões e tabelas para editar diretamente, mantendo o visual. Nas seções de texto, use Markdown. Confira o resultado em “Prévia do cliente”.</p>
          {documento.secoes.map((s, i) => <section className="card" key={i} style={{ padding: 24, display: 'grid', gap: 16 }}>
            <div className="acts"><b>Seção {i + 1}</b><button className="btn sec sm" type="button" disabled={i === 0} onClick={() => mover(i, -1)}>Subir</button><button className="btn sec sm" type="button" disabled={i === documento.secoes.length - 1} onClick={() => mover(i, 1)}>Descer</button><button className="btn dg sm" type="button" onClick={() => { if (confirm('Remover esta seção?')) campo('secoes', documento.secoes.filter((_, n) => n !== i)); }}>Remover seção</button></div>
            <div className="fld"><label htmlFor={`proposta-secao-${i}`}>Título da seção</label><input id={`proposta-secao-${i}`} className="inp" required maxLength={200} value={s.titulo} onChange={e => campo('secoes', documento.secoes.map((v, n) => n === i ? { ...v, titulo: e.target.value } : v))} /></div>
            {s.html !== undefined ? <>
              <PropostaHtmlEditor secao={s} cor={documento.corDestaque} disabled={ocupado} onChange={html => campo('secoes', documento.secoes.map((v, n) => n === i ? { ...v, html } : v))} />
              <details><summary>Editar código HTML da seção</summary><div className="fld"><label htmlFor={`proposta-html-${i}`}>HTML da seção</label><textarea id={`proposta-html-${i}`} className="inp proposta-secao-input" maxLength={100000} value={s.html} onChange={e => campo('secoes', documento.secoes.map((v, n) => n === i ? { ...v, html: e.target.value } : v))} /></div></details>
            </> : <div className="fld"><label htmlFor={`proposta-texto-${i}`}>Conteúdo da seção</label><textarea id={`proposta-texto-${i}`} className="inp proposta-secao-input" maxLength={30000} value={s.texto} onChange={e => campo('secoes', documento.secoes.map((v, n) => n === i ? { ...v, texto: e.target.value } : v))} /></div>}
          </section>)}
          <div><button className="btn sec" type="button" disabled={documento.secoes.length >= 50} onClick={() => campo('secoes', [...documento.secoes, { titulo: 'Nova seção', texto: '' }])}>Adicionar seção</button></div>
        </fieldset>
      </form>}
      <div className="acts">
        {!preview && <button className="btn pri" form="proposta-form" type="submit" disabled={ocupado}>{ocupado ? 'Aguarde…' : 'Salvar proposta'}</button>}
        {id && <><button className="btn sec" disabled={ocupado || alterado} onClick={() => compartilhar()}>{atual?.compartilhada ? 'Ver link ativo' : 'Gerar link para o cliente'}</button>{atual?.compartilhada && <><button className="btn sec" disabled={ocupado || alterado} onClick={() => compartilhar(atual, true)}>Gerar novo link</button><button className="btn sec" disabled={ocupado} onClick={revogar}>Desativar link</button></>}<button className="btn dg" disabled={ocupado} onClick={() => excluir()}>Excluir proposta</button></>}
      </div>
      {atual?.compartilhada && <p className="mut">As alterações salvas também aparecem no link compartilhado. Gerar um novo link invalida o anterior.</p>}
      {link && <section className="card" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <div className="fld"><label htmlFor="proposta-link">Link para compartilhar</label><input id="proposta-link" className="inp" readOnly value={link} onFocus={e => e.target.select()} /></div>
        <div className="acts"><button className="btn sec" onClick={copiarLink}>Copiar link</button><a className="btn sec" href={link} target="_blank" rel="noreferrer">Abrir proposta</a></div>
        {feedbackLink && <p role="status">{feedbackLink}</p>}
      </section>}
    </>}
    <VxDialog open={compartilhadaLista !== null} onClose={() => { setCompartilhadaLista(null); setLink(''); setFeedbackLink(''); }}
      title="Compartilhar proposta" subtitle={compartilhadaLista?.titulo}>
      <div style={{ display: 'grid', gap: 16 }}>
        <p>Este link permite somente visualizar esta proposta, sem login e sem acesso à edição ou aos dados internos do cliente.</p>
        <div className="fld"><label htmlFor="proposta-link-lista">Link de visualização</label><input id="proposta-link-lista" className="inp" readOnly value={link} onFocus={e => e.target.select()} /></div>
        <div className="acts"><button className="btn pri" type="button" onClick={copiarLink}>Copiar link</button><a className="btn sec" href={link} target="_blank" rel="noreferrer">Visualizar proposta</a><button className="btn sec" type="button" disabled={ocupado} onClick={() => { if (compartilhadaLista) void compartilhar({ ...compartilhadaLista, compartilhada: true }, true); }}>Gerar novo link</button></div>
        {feedbackLink && <p role="status">{feedbackLink}</p>}
      </div>
    </VxDialog>
  </div>;
}
