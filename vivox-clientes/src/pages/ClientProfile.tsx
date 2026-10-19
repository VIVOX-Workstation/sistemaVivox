import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { BarChart2, Share2, Pencil, Plus, Globe, Mail, MessageCircle, Upload, Camera } from 'lucide-react';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { api } from '../api/client';
import type { Cliente, Contato, StatusCliente } from '../types';
import { OverviewTab } from '../components/ClientTabs/OverviewTab';
import { NotesTab } from '../components/ClientTabs/NotesTab';
import { ServicesTab } from '../components/ClientTabs/ServicesTab';
import { NovoChamadoModal } from '../components/gp/NovoChamadoModal';
import { AcessoPortalModal } from '../components/portal/AcessoPortalModal';
import { VxDialog } from '../components/clean/VxDialog';
import { ClienteMono } from '../components/ClienteMono';
import { STATUS_CLIENTE } from '../utils/clean';
import { PropostasTab } from '../features/propostas/PropostasTab';

// Perfil do cliente no layout clean (canvas › Perfil).
// GET/PATCH /clientes/:id, uploads de logo e capa; abas em components/ClientTabs.

type Tab = 'overview' | 'services' | 'notes' | 'propostas';
const VALID_TABS: Tab[] = ['overview', 'services', 'notes', 'propostas'];
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'services', label: 'Serviços' },
  { id: 'notes', label: 'Anotações' },
  { id: 'propostas', label: 'Propostas' },
];

const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });

const FORM_VAZIO = {
  nomeFantasia: '',
  razaoSocial: '',
  cnpjCpf: '',
  segmento: '',
  status: 'ATIVO' as StatusCliente,
  dataInicioContrato: '',
  email: '',
  telefone: '',
  localizacao: '',
  loginsSenhas: '',
  ga4PropertyId: '',
  gscSiteUrl: '',
  openpanelProjectId: '',
};

export function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [erroCarga, setErroCarga] = useState(false);
  const [erro, setErro] = useState('');
  const [propostaAlterada, setPropostaAlterada] = useState(false);
  const raw = searchParams.get('tab') as Tab;
  const activeTab: Tab = raw && VALID_TABS.includes(raw) ? raw : 'overview';

  const [novoChamado, setNovoChamado] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [portal, setPortal] = useState(false);
  const [editar, setEditar] = useState(false);
  const [visual, setVisual] = useState(false);
  const [contatoAberto, setContatoAberto] = useState(false);
  const [contato, setContato] = useState<Partial<Contato>>({});
  const [form, setForm] = useState(FORM_VAZIO);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fileLogo = useRef<HTMLInputElement>(null);
  const fileBanner = useRef<HTMLInputElement>(null);

  const selectTab = (tab: string) => {
    if (tab === activeTab) return;
    if (propostaAlterada && !confirm('Descartar as alterações não salvas da proposta?')) return;
    setSearchParams({ tab: VALID_TABS.includes(tab as Tab) ? tab : 'overview' });
  };

  const loadCliente = useCallback(async (clienteId: string) => {
    try {
      const response = await api.get(`/clientes/${clienteId}`);
      setCliente(response.data);
      setLogoUrlInput(response.data.logoUrl || '');
      setBannerUrlInput(response.data.bannerUrl || '');
      setErroCarga(false);
    } catch (error) {
      console.error('Erro ao carregar cliente', error);
      setErroCarga(true);
    }
  }, []);

  useEffect(() => {
    if (id) loadCliente(id);
  }, [id, loadCliente]);

  const patch = async (dados: Record<string, unknown>, msg: string) => {
    if (!cliente) return false;
    setErro('');
    try {
      const res = await api.patch(`/clientes/${cliente.id}`, dados);
      setCliente(res.data);
      return true;
    } catch (err) {
      console.error(err);
      setErro(msg);
      return false;
    }
  };

  const abrirEditar = () => {
    if (!cliente) return;
    setErro('');
    setForm({
      nomeFantasia: cliente.nomeFantasia || '',
      razaoSocial: cliente.razaoSocial || '',
      cnpjCpf: cliente.cnpjCpf || '',
      segmento: cliente.segmento || '',
      status: cliente.status || 'ATIVO',
      dataInicioContrato: cliente.dataInicioContrato ? cliente.dataInicioContrato.split('T')[0] : '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      localizacao: cliente.localizacao || '',
      loginsSenhas: cliente.loginsSenhas || '',
      ga4PropertyId: cliente.ga4PropertyId || '',
      gscSiteUrl: cliente.gscSiteUrl || '',
      openpanelProjectId: cliente.openpanelProjectId || '',
    });
    setEditar(true);
  };

  const salvarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = (v: string) => v.trim() || null;
    const ok = await patch(
      {
        nomeFantasia: form.nomeFantasia.trim(),
        razaoSocial: t(form.razaoSocial),
        cnpjCpf: form.cnpjCpf.trim(),
        segmento: form.segmento.trim(),
        status: form.status,
        dataInicioContrato: form.dataInicioContrato ? new Date(form.dataInicioContrato).toISOString() : null,
        email: t(form.email),
        telefone: t(form.telefone),
        localizacao: t(form.localizacao),
        loginsSenhas: t(form.loginsSenhas),
        ga4PropertyId: t(form.ga4PropertyId),
        gscSiteUrl: t(form.gscSiteUrl),
        openpanelProjectId: t(form.openpanelProjectId),
      },
      'Não foi possível salvar o cadastro.',
    );
    if (ok) setEditar(false);
  };

  const upload = async (tipo: 'logo' | 'banner', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !cliente) return;
    const fd = new FormData();
    fd.append('file', file);
    const set = tipo === 'logo' ? setUploadingLogo : setUploadingBanner;
    set(true);
    setErro('');
    try {
      const res = await api.post(`/clientes/${cliente.id}/upload-${tipo}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCliente(res.data);
      setLogoUrlInput(res.data.logoUrl || '');
      setBannerUrlInput(res.data.bannerUrl || '');
    } catch (err) {
      console.error(err);
      setErro(tipo === 'logo' ? 'Não foi possível enviar o logo.' : 'Não foi possível enviar a capa.');
    } finally {
      set(false);
    }
  };

  const salvarVisual = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await patch(
      { logoUrl: logoUrlInput.trim() || null, bannerUrl: bannerUrlInput.trim() || null },
      'Não foi possível salvar as imagens.',
    );
    if (ok) setVisual(false);
  };

  const salvarContato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    const novo = { ...contato, id: contato.id || crypto.randomUUID() } as Contato;
    const lista = contato.id
      ? (cliente.contatos || []).map((c) => (c.id === contato.id ? novo : c))
      : [...(cliente.contatos || []), novo];
    if (await patch({ contatos: lista }, 'Não foi possível salvar o contato.')) {
      setContatoAberto(false);
      setContato({});
    }
  };

  const removerContato = async (contatoId: string) => {
    if (!cliente || !confirm('Remover este contato?')) return;
    await patch({ contatos: cliente.contatos.filter((c) => c.id !== contatoId) }, 'Não foi possível remover o contato.');
  };

  if (!cliente) {
    return (
      <div className="vxp">
        <div className="pg">
          {erroCarga ? (
            <div className="card empty">
              <b>Não foi possível carregar o cliente.</b>
              <button className="btn pri sm" type="button" onClick={() => id && loadCliente(id)}>Tentar de novo</button>
            </div>
          ) : (
            <div className="animate-pulse" aria-busy="true" aria-label="Carregando perfil do cliente" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ height: 80 }} />
              <div className="grid g4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card" style={{ height: 96 }} />)}</div>
              <div className="card" style={{ height: 260 }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const [stLabel, stBd] = STATUS_CLIENTE[cliente.status] ?? [cliente.status, 'bd'];
  const tel = cliente.telefone || cliente.contatos?.[0]?.telefone;
  const mail = cliente.email || cliente.contatos?.[0]?.email;
  const site = cliente.gscSiteUrl;
  const desde = cliente.dataInicioContrato ? mesAno.format(new Date(cliente.dataInicioContrato)).replace('.', '').replace(' de ', ' ') : null;
  const fld = (k: keyof typeof form, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="fld">
      <label htmlFor={`e-${k}`}>{label}</label>
      <input id={`e-${k}`} className="inp" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...extra} />
    </div>
  );

  return (
    <div className="vxp">
      <input type="file" ref={fileLogo} onChange={(e) => upload('logo', e)} accept="image/*" hidden />
      <input type="file" ref={fileBanner} onChange={(e) => upload('banner', e)} accept="image/*" hidden />

      <div className="pg">
        {cliente.bannerUrl && (
          <div className="cover">
            <img src={resolveMediaUrl(cliente.bannerUrl)} alt={`Capa de ${cliente.nomeFantasia}`} />
          </div>
        )}

        <section style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setVisual(true)} aria-label="Trocar logo e capa" title="Trocar logo e capa" style={{ border: 0, padding: 0, background: 'none', cursor: 'pointer' }}>
            <ClienteMono cliente={cliente} lg />
          </button>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 24, fontWeight: 650, letterSpacing: '-.02em' }}>{cliente.nomeFantasia}</h1>
              <span className={stBd}>{stLabel}</span>
            </div>
            <div className="meta" style={{ marginTop: 6, gap: 14, flexWrap: 'wrap' }}>
              <span>{cliente.segmento || 'Segmento não informado'}</span>
              {desde && <span>Cliente desde {desde}</span>}
              {cliente.responsavel?.nome && <span>Responsável: {cliente.responsavel.nome}</span>}
            </div>
          </div>
          <div className="acts">
            <Link className="btn sec" to={`/cliente/${cliente.id}?tab=propostas`}>Propostas</Link>
            {site && (
              <a className="ib" href={site.startsWith('http') ? site : `https://${site}`} target="_blank" rel="noreferrer" aria-label="Abrir site" title="Site">
                <Globe className="i" aria-hidden="true" />
              </a>
            )}
            {tel && (
              <a className="ib" href={`https://wa.me/55${tel.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="Conversar no WhatsApp" title="WhatsApp">
                <MessageCircle className="i" aria-hidden="true" />
              </a>
            )}
            {mail && (
              <a className="ib" href={`mailto:${mail}`} aria-label="Enviar e-mail" title="E-mail">
                <Mail className="i" aria-hidden="true" />
              </a>
            )}
            <Link className="ib" to={`/analytics/${cliente.id}`} aria-label="Abrir Analytics do cliente" title="Analytics">
              <BarChart2 className="i" aria-hidden="true" />
            </Link>
            <button className="ib" type="button" aria-label="Acesso do cliente ao portal" title="Acesso ao portal" onClick={() => setPortal(true)}>
              <Share2 className="i" aria-hidden="true" />
            </button>
            <button className="btn sec" type="button" onClick={abrirEditar}><Pencil className="i" aria-hidden="true" />Editar cadastro</button>
            <button className="btn pri" type="button" onClick={() => setNovoChamado(true)}><Plus className="i" aria-hidden="true" />Criar chamado</button>
          </div>
        </section>

        {erro && !editar && !visual && !contatoAberto && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erro}</p>}

        <div className="tabs" role="tablist" aria-label="Seções do perfil">
          {TABS.map((t) => (
            <button key={t.id} className={t.id === activeTab ? 'tab on' : 'tab'} type="button" role="tab" aria-selected={t.id === activeTab} onClick={() => selectTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'propostas' && <PropostasTab key={cliente.id} clienteId={cliente.id} nomeCliente={cliente.nomeFantasia} onDirtyChange={setPropostaAlterada} />}
        {activeTab === 'overview' && (
          <OverviewTab
            key={recarga}
            cliente={cliente}
            onChange={loadCliente}
            onNavigateTab={selectTab}
            onEditClient={abrirEditar}
            onOpenChamado={() => setNovoChamado(true)}
            onManageContatos={() => {
              setErro('');
              setContato({});
              setContatoAberto(true);
            }}
            onEditContato={(c) => {
              setErro('');
              setContato(c);
              setContatoAberto(true);
            }}
            onRemoveContato={removerContato}
          />
        )}
        {activeTab === 'services' && <ServicesTab cliente={cliente} />}
        {activeTab === 'notes' && <NotesTab cliente={cliente} onChange={loadCliente} />}
      </div>

      <VxDialog open={editar} onClose={() => setEditar(false)} title="Editar cadastro" subtitle={cliente.nomeFantasia} lg>
        <form onSubmit={salvarCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid g2">
            {fld('nomeFantasia', 'Nome fantasia *', { required: true })}
            {fld('razaoSocial', 'Razão social')}
            {fld('cnpjCpf', 'CNPJ ou CPF *', { required: true })}
            {fld('segmento', 'Segmento *', { required: true })}
            <div className="fld">
              <label htmlFor="e-status">Status</label>
              <select id="e-status" className="inp" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StatusCliente })}>
                <option value="ATIVO">Ativo</option>
                <option value="PROSPECT">Prospect</option>
                <option value="PAUSADO">Pausado</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </div>
            {fld('dataInicioContrato', 'Início do contrato', { type: 'date' })}
            {fld('email', 'E-mail', { type: 'email' })}
            {fld('telefone', 'Telefone')}
            {fld('localizacao', 'Localização')}
            {fld('openpanelProjectId', 'OpenPanel')}
            {fld('ga4PropertyId', 'Google Analytics 4')}
            {fld('gscSiteUrl', 'Search Console', { placeholder: 'https://site.com.br/' })}
          </div>
          <div className="fld">
            <label htmlFor="e-acc">Logins, senhas ou link do cofre</label>
            <textarea id="e-acc" className="inp" rows={2} value={form.loginsSenhas} onChange={(e) => setForm({ ...form, loginsSenhas: e.target.value })} />
          </div>
          {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erro}</p>}
          <div className="acts" style={{ justifyContent: 'flex-end' }}>
            <button className="btn sec" type="button" onClick={() => setEditar(false)}>Cancelar</button>
            <button className="btn pri" type="submit">Salvar alterações</button>
          </div>
        </form>
      </VxDialog>

      <VxDialog open={visual} onClose={() => setVisual(false)} title="Logo e capa" subtitle="Aparecem no perfil e no portal do cliente.">
        <form onSubmit={salvarVisual} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ClienteMono cliente={{ nomeFantasia: cliente.nomeFantasia, logoUrl: logoUrlInput || undefined }} lg />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn sec sm" type="button" onClick={() => fileLogo.current?.click()} disabled={uploadingLogo}>
                <Upload className="i" aria-hidden="true" />{uploadingLogo ? 'Enviando...' : 'Enviar logo'}
              </button>
              {logoUrlInput && <button className="btn gh sm" type="button" onClick={() => setLogoUrlInput('')}>Remover</button>}
            </div>
          </div>
          <div className="fld">
            <label htmlFor="v-logo">Ou cole o endereço do logo</label>
            <input id="v-logo" className="inp" value={logoUrlInput} onChange={(e) => setLogoUrlInput(e.target.value)} placeholder="https://" />
          </div>
          <button
            type="button"
            className="cover"
            onClick={() => fileBanner.current?.click()}
            style={{ border: '1px dashed var(--ln2)', display: 'grid', placeItems: 'center', color: 'var(--ink3)', fontSize: 12.5, cursor: 'pointer', maxHeight: 140, font: 'inherit' }}
          >
            {bannerUrlInput ? (
              <img src={resolveMediaUrl(bannerUrlInput)} alt="Prévia da capa" style={{ gridArea: '1/1' }} />
            ) : null}
            <span style={{ gridArea: '1/1', display: 'inline-flex', alignItems: 'center', gap: 6, background: bannerUrlInput ? 'rgba(255,255,255,.88)' : undefined, padding: '4px 10px', borderRadius: 8 }}>
              <Camera className="i" aria-hidden="true" />{uploadingBanner ? 'Enviando...' : 'Clique para enviar a capa'}
            </span>
          </button>
          <div className="fld">
            <label htmlFor="v-cap">Ou cole o endereço da capa</label>
            <input id="v-cap" className="inp" value={bannerUrlInput} onChange={(e) => setBannerUrlInput(e.target.value)} placeholder="https://" />
          </div>
          {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erro}</p>}
          <div className="acts" style={{ justifyContent: 'flex-end' }}>
            <button className="btn sec" type="button" onClick={() => setVisual(false)}>Cancelar</button>
            <button className="btn pri" type="submit">Salvar</button>
          </div>
        </form>
      </VxDialog>

      <VxDialog open={contatoAberto} onClose={() => setContatoAberto(false)} title={contato.id ? 'Editar contato' : 'Novo contato'}>
        <form onSubmit={salvarContato} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fld">
            <label htmlFor="ct-n">Nome</label>
            <input id="ct-n" className="inp" required value={contato.nome || ''} onChange={(e) => setContato({ ...contato, nome: e.target.value })} />
          </div>
          <div className="fld">
            <label htmlFor="ct-c">Cargo ou função</label>
            <input id="ct-c" className="inp" value={contato.cargo || ''} onChange={(e) => setContato({ ...contato, cargo: e.target.value })} placeholder="Ex.: Diretora de marketing" />
          </div>
          <div className="grid g2">
            <div className="fld">
              <label htmlFor="ct-e">E-mail</label>
              <input id="ct-e" className="inp" type="email" value={contato.email || ''} onChange={(e) => setContato({ ...contato, email: e.target.value })} />
            </div>
            <div className="fld">
              <label htmlFor="ct-t">Telefone ou WhatsApp</label>
              <input id="ct-t" className="inp" value={contato.telefone || ''} onChange={(e) => setContato({ ...contato, telefone: e.target.value })} />
            </div>
          </div>
          {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erro}</p>}
          <div className="acts" style={{ justifyContent: 'flex-end' }}>
            <button className="btn sec" type="button" onClick={() => setContatoAberto(false)}>Cancelar</button>
            <button className="btn pri" type="submit">Salvar contato</button>
          </div>
        </form>
      </VxDialog>

      {novoChamado && (
        <NovoChamadoModal initialClienteId={cliente.id} onClose={() => setNovoChamado(false)} onChamadoCreated={() => setRecarga((r) => r + 1)} />
      )}
      <AcessoPortalModal isOpen={portal} onClose={() => setPortal(false)} clienteId={cliente.id} clienteNome={cliente.nomeFantasia} />
    </div>
  );
}
