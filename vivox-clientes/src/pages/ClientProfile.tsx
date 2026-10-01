import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { 
  ArrowLeft, 
  Building2, 
  BarChart2, 
  Mail, 
  Phone, 
  MessageCircle, 
  Share2, 
  Edit2, 
  Globe, 
  CheckCircle2, 
  UserCheck,
  Calendar as CalendarIcon,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  Ticket,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  StickyNote,
  ExternalLink,
  Plus
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente, Contato, StatusCliente } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';

import { OverviewTab } from '../components/ClientTabs/OverviewTab';
import { NotesTab } from '../components/ClientTabs/NotesTab';
import { ServicesTab } from '../components/ClientTabs/ServicesTab';
import { NovoChamadoModal } from '../components/gp/NovoChamadoModal';
import { chamadosApi } from '../api/chamados';
import { formatarDataBR } from '../utils/hospedagemCalculo';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import './planning-workspace.css';

type Tab = 'overview' | 'services' | 'notes';
const VALID_TABS: Tab[] = ['overview', 'services', 'notes'];

function ClientProfileSkeleton() {
  return (
    <div className="planning-workspace w-full space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando perfil do cliente">
      <div className="pw-lg-scene" aria-hidden="true" />
      <div className="w-full space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="h-6 w-48 rounded-lg bg-white/40" />

        {/* Header Hero skeleton */}
        <div className="pw-glass-panel p-6 h-56 rounded-3xl" />

        {/* Tabs skeleton */}
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-xl bg-white/40" />
          <div className="h-10 w-36 rounded-xl bg-white/40" />
          <div className="h-10 w-28 rounded-xl bg-white/40" />
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pw-glass-card h-28 rounded-2xl" />
          ))}
        </div>
        <div className="pw-glass-panel h-64 rounded-3xl" />
      </div>
    </div>
  );
}

export function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const raw = searchParams.get('tab') as Tab;
    return raw && VALID_TABS.includes(raw) ? raw : 'overview';
  });
  const [copiado, setCopiado] = useState(false);

  // Chamados em aberto deste cliente
  const [chamadosAbertos, setChamadosAbertos] = useState(0);
  const [isNovoChamadoModalOpen, setNovoChamadoModalOpen] = useState(false);

  // Modal para adicionar/editar contato
  const [isContatoModalOpen, setContatoModalOpen] = useState(false);
  const [currentContato, setCurrentContato] = useState<Partial<Contato>>({});

  // Modal de Personalização Visual (Logo & Banner)
  const [isVisualModalOpen, setVisualModalOpen] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Modal de Edição dos Dados Cadastrais
  const [isEditClientModalOpen, setEditClientModalOpen] = useState(false);
  const [editClientForm, setEditClientForm] = useState({
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
  });

  const fileInputLogoRef = useRef<HTMLInputElement>(null);
  const fileInputBannerRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Ativar efeitos Liquid Glass nos nós de vidro do container
  useLiquidGlass(workspaceRef, !!cliente);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (VALID_TABS.includes(tabParam as Tab)) {
        if (tabParam !== activeTab) {
          setActiveTab(tabParam as Tab);
        }
      } else {
        // Query antiga (?tab=ai-studio|hosting|market) cai para overview
        setActiveTab('overview');
        setSearchParams({ tab: 'overview' });
      }
    }
  }, [searchParams]);

  const handleTabSelect = (tab: Tab) => {
    const target = VALID_TABS.includes(tab) ? tab : 'overview';
    setActiveTab(target);
    setSearchParams({ tab: target });
  };

  useEffect(() => {
    if (id) {
      loadCliente(id);
      loadChamadosAbertos(id);
    }
  }, [id]);

  const loadCliente = async (clienteId: string) => {
    try {
      const response = await api.get(`/clientes/${clienteId}`);
      setCliente(response.data);
      setLogoUrlInput(response.data.logoUrl || '');
      setBannerUrlInput(response.data.bannerUrl || '');
    } catch (error) {
      console.error("Erro ao carregar cliente", error);
    }
  };

  const loadChamadosAbertos = async (clienteId: string) => {
    try {
      const [abertos, emAndamento] = await Promise.all([
        chamadosApi.getChamados({ clienteId, status: 'ABERTO' }),
        chamadosApi.getChamados({ clienteId, status: 'EM_ANDAMENTO' }),
      ]);
      setChamadosAbertos(abertos.length + emAndamento.length);
    } catch (error) {
      console.error("Erro ao carregar chamados do cliente", error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Alteração rápida de status do cliente direto no cabeçalho
  const handleQuickStatusChange = async (novoStatus: StatusCliente) => {
    if (!cliente || cliente.status === novoStatus) return;
    try {
      const res = await api.patch(`/clientes/${cliente.id}`, { status: novoStatus });
      setCliente(res.data);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status do cliente.');
    }
  };

  const openEditClientModal = () => {
    if (!cliente) return;
    setEditClientForm({
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
    setEditClientModalOpen(true);
  };

  const handleSaveClientData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    try {
      const payload: any = {
        nomeFantasia: editClientForm.nomeFantasia.trim(),
        razaoSocial: editClientForm.razaoSocial.trim() || null,
        cnpjCpf: editClientForm.cnpjCpf.trim(),
        segmento: editClientForm.segmento.trim(),
        status: editClientForm.status,
        dataInicioContrato: editClientForm.dataInicioContrato ? new Date(editClientForm.dataInicioContrato).toISOString() : null,
        email: editClientForm.email.trim() || null,
        telefone: editClientForm.telefone.trim() || null,
        localizacao: editClientForm.localizacao.trim() || null,
        loginsSenhas: editClientForm.loginsSenhas.trim() || null,
        ga4PropertyId: editClientForm.ga4PropertyId.trim() || null,
        gscSiteUrl: editClientForm.gscSiteUrl.trim() || null,
        openpanelProjectId: editClientForm.openpanelProjectId.trim() || null,
      };

      const res = await api.patch(`/clientes/${cliente.id}`, payload);
      setCliente(res.data);
      setEditClientModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar dados do cliente.');
    }
  };

  // Upload Direto de Arquivo Logo
  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cliente) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingLogo(true);
    try {
      const res = await api.post(`/clientes/${cliente.id}/upload-logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCliente(res.data);
      setLogoUrlInput(res.data.logoUrl || '');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar imagem do logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload Direto de Arquivo Banner
  const handleUploadBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cliente) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingBanner(true);
    try {
      const res = await api.post(`/clientes/${cliente.id}/upload-banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCliente(res.data);
      setBannerUrlInput(res.data.bannerUrl || '');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar imagem do banner.');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Salvar URLs digitadas no Modal Visual
  const handleSaveVisualUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    try {
      const res = await api.patch(`/clientes/${cliente.id}`, {
        logoUrl: logoUrlInput.trim() || null,
        bannerUrl: bannerUrlInput.trim() || null,
      });
      setCliente(res.data);
      setVisualModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar imagens da marca.');
    }
  };

  const handleSaveContato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    const newContato = {
      ...currentContato,
      id: currentContato.id || crypto.randomUUID(),
    } as Contato;

    let novosContatos = [...(cliente.contatos || [])];
    if (currentContato.id) {
      novosContatos = novosContatos.map(c => c.id === currentContato.id ? newContato : c);
    } else {
      novosContatos.push(newContato);
    }

    try {
      await api.patch(`/clientes/${cliente.id}`, { contatos: novosContatos });
      loadCliente(cliente.id);
      setContatoModalOpen(false);
      setCurrentContato({});
    } catch (err) {
      alert("Erro ao salvar contato.");
    }
  };

  const handleDeleteContato = async (contatoId: string) => {
    if (!cliente) return;
    if (confirm('Remover este contato?')) {
      const novosContatos = cliente.contatos.filter(c => c.id !== contatoId);
      try {
        await api.patch(`/clientes/${cliente.id}`, { contatos: novosContatos });
        loadCliente(cliente.id);
      } catch (err) {
        alert("Erro ao remover contato.");
      }
    }
  };

  if (!cliente) {
    return <ClientProfileSkeleton />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'services', label: 'Mapa de Serviços', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'notes', label: 'Anotações', icon: <StickyNote className="w-4 h-4" /> },
  ];

  const primeiroContato = cliente.contatos?.[0];
  const telefoneContato = cliente.telefone || primeiroContato?.telefone;
  const emailContato = cliente.email || primeiroContato?.email;
  const siteUrl = cliente.gscSiteUrl;

  return (
    <div ref={workspaceRef} className="planning-workspace w-full space-y-6 select-none">
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* Hidden File Inputs para Upload Direto */}
      <input
        type="file"
        ref={fileInputLogoRef}
        onChange={handleUploadLogoFile}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputBannerRef}
        onChange={handleUploadBannerFile}
        accept="image/*"
        className="hidden"
      />

      <div className="w-full space-y-6">
        {/* ========================================================================= */}
        {/* 1. BREADCRUMB & VOLTAR                                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-xs">
            <button
              onClick={() => navigate('/clientes')}
              title="Voltar para a lista de clientes"
              className="pw-glass-control px-3 py-1.5 rounded-full font-bold text-[#625746] hover:text-[#1E1A16] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Clientes</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#C7A15F]" />
            <span className="font-bold text-[#1E1A16] truncate max-w-[240px] sm:max-w-md">
              {cliente.nomeFantasia}
            </span>
          </nav>

          {copiado && (
            <div className="px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#CEEAD6] text-[#247A4A] text-xs font-bold flex items-center gap-1.5 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Link do perfil copiado!</span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. CABEÇALHO DO CLIENTE COMPACTO (HERO CARD COM LIQUID GLASS)             */}
        {/* ========================================================================= */}
        <div className="pw-glass-panel p-5 md:p-6 rounded-[28px] overflow-hidden relative space-y-5">
          {/* Se houver banner, exibir faixa sutil de topo integrada */}
          {cliente.bannerUrl && (
            <div className="w-full h-24 sm:h-28 rounded-2xl overflow-hidden relative group -mt-1 -mx-1 mb-2">
              <img
                src={resolveMediaUrl(cliente.bannerUrl)}
                alt={`Banner de ${cliente.nomeFantasia}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/70 via-black/20 to-transparent" />
              <button
                type="button"
                onClick={() => fileInputBannerRef.current?.click()}
                title="Trocar capa superior"
                className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-[#FFFDF8] text-[11.5px] font-bold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-sm"
              >
                <Camera className="w-3 h-3 text-[#C7A15F]" />
                <span>{uploadingBanner ? 'Enviando...' : 'Trocar Capa'}</span>
              </button>
            </div>
          )}

          {/* Linha Principal de Identidade + Ações Rápidas */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Lado Esquerdo: Avatar + Dados de Identificação */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar do Cliente com Hover para Troca */}
              <div
                onClick={() => fileInputLogoRef.current?.click()}
                title="Clique para alterar a logo da marca"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FAF2E4] border-2 border-white/90 shadow-md flex items-center justify-center overflow-hidden shrink-0 relative group cursor-pointer transition-transform hover:scale-105"
              >
                {cliente.logoUrl ? (
                  <img
                    src={resolveMediaUrl(cliente.logoUrl)}
                    alt={cliente.nomeFantasia}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-[#8A6828]">
                    {cliente.nomeFantasia.charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Hover overlay de câmera */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10.5px] font-bold gap-0.5">
                  <Camera className="w-4 h-4 text-[#C7A15F]" />
                  <span>{uploadingLogo ? '...' : 'Trocar'}</span>
                </div>
              </div>

              {/* Textos de Identificação */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1E1A16] tracking-tight truncate">
                    {cliente.nomeFantasia}
                  </h1>

                  {/* Seletor / Dropdown Rápido de Status */}
                  <div className="relative inline-block">
                    <select
                      value={cliente.status}
                      onChange={(e) => handleQuickStatusChange(e.target.value as StatusCliente)}
                      aria-label="Alterar status do cliente"
                      title="Clique para alterar o status da conta"
                      className={`text-[11.5px] font-black tracking-wider uppercase px-3 py-1 rounded-full cursor-pointer outline-none border transition-all appearance-none pr-6 shadow-2xs ${
                        cliente.status === 'ATIVO'
                          ? 'text-[#247A4A] bg-[#247A4A]/10 border-[#247A4A]/30 hover:bg-[#247A4A]/20'
                          : cliente.status === 'PROSPECT'
                          ? 'text-[#B45309] bg-[#FFA800]/15 border-[#FFA800]/40 hover:bg-[#FFA800]/25'
                          : cliente.status === 'PAUSADO'
                          ? 'text-[#625746] bg-[#8F8271]/15 border-[#8F8271]/30 hover:bg-[#8F8271]/25'
                          : 'text-[#B83B32] bg-[#B83B32]/10 border-[#B83B32]/30 hover:bg-[#B83B32]/20'
                      }`}
                    >
                      <option value="ATIVO">🟢 ATIVO</option>
                      <option value="PROSPECT">⚡ PROSPECT</option>
                      <option value="PAUSADO">⏸️ PAUSADO</option>
                      <option value="ENCERRADO">🔴 ENCERRADO</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  </div>
                </div>

                {cliente.razaoSocial && cliente.razaoSocial !== cliente.nomeFantasia && (
                  <p className="text-xs text-[#8F8271] truncate font-medium">
                    {cliente.razaoSocial}
                  </p>
                )}

                {/* Badges de Meta-informação */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#625746] bg-white/70 px-2.5 py-0.5 rounded-full border border-[#E8D4B4]/50">
                    <Building2 className="w-3 h-3 text-[#C7A15F]" />
                    <span>{cliente.segmento || 'Segmento não informado'}</span>
                  </span>

                  {cliente.responsavel?.nome && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#625746] bg-white/70 px-2.5 py-0.5 rounded-full border border-[#E8D4B4]/50">
                      <UserCheck className="w-3 h-3 text-[#C7A15F]" />
                      <span>Resp: {cliente.responsavel.nome}</span>
                    </span>
                  )}

                  {cliente.dataInicioContrato && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#625746] bg-white/70 px-2.5 py-0.5 rounded-full border border-[#E8D4B4]/50">
                      <CalendarIcon className="w-3 h-3 text-[#C7A15F]" />
                      <span>Desde {formatarDataBR(cliente.dataInicioContrato)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lado Direito: Ações Principais Agrupadas & Links Úteis */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Links de Contato Rápido (Ícones em Vidro) */}
              <div className="flex items-center gap-1.5">
                {siteUrl && (
                  <a
                    href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Abrir site (${siteUrl})`}
                    className="pw-glass-control w-9 h-9 rounded-xl flex items-center justify-center text-[#1E1A16] hover:bg-white transition-all shadow-2xs"
                  >
                    <Globe className="w-4 h-4 text-[#7A6440]" />
                  </a>
                )}

                {telefoneContato && (
                  <a
                    href={`https://wa.me/55${telefoneContato.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Conversar no WhatsApp (${telefoneContato})`}
                    className="pw-glass-control w-9 h-9 rounded-xl flex items-center justify-center text-[#247A4A] bg-[#247A4A]/10 border-[#247A4A]/30 hover:bg-[#247A4A]/20 transition-all shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}

                {emailContato && (
                  <a
                    href={`mailto:${emailContato}`}
                    title={`Enviar e-mail (${emailContato})`}
                    className="pw-glass-control w-9 h-9 rounded-xl flex items-center justify-center text-[#1E1A16] hover:bg-white transition-all shadow-2xs"
                  >
                    <Mail className="w-4 h-4 text-[#7A6440]" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/analytics/${cliente.id}`)}
                  title="Acessar painel de Analytics da conta"
                  className="pw-glass-control w-9 h-9 rounded-xl flex items-center justify-center text-[#1E1A16] hover:bg-white transition-all cursor-pointer shadow-2xs"
                >
                  <BarChart2 className="w-4 h-4 text-[#7A6440]" />
                </button>
              </div>

              {/* Botões de Ação Agrupados */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Criar Chamado */}
                <button
                  type="button"
                  onClick={() => setNovoChamadoModalOpen(true)}
                  className="pw-glass-control pw-glass-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-[1.02]"
                >
                  <Ticket className="w-4 h-4 text-[#C7A15F]" />
                  <span>Criar Chamado</span>
                </button>

                {/* Editar Cadastro */}
                <button
                  type="button"
                  onClick={openEditClientModal}
                  className="pw-glass-control px-3.5 py-2 text-xs font-bold text-[#1E1A16] hover:bg-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#8A6828]" />
                  <span>Editar Cadastro</span>
                </button>

                {/* Personalizar Logo & Capa */}
                <button
                  type="button"
                  onClick={() => setVisualModalOpen(true)}
                  title="Alterar Logo e Capa do cliente"
                  className="pw-glass-control px-3 py-2 text-xs font-bold text-[#1E1A16] hover:bg-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5 text-[#8A6828]" />
                  <span className="hidden sm:inline">Capa / Logo</span>
                </button>

                {/* Copiar Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copiar link do cliente"
                  className="pw-glass-control p-2 text-xs font-bold text-[#1E1A16] hover:bg-white flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. NAVEGAÇÃO DE ABAS EM PILLS GLASS                                       */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                className={`pw-glass-tab px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  isActive ? 'is-active text-[#7A6440]' : 'text-[#625746]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. CONTEÚDO DA ABA ATIVA (LARGURA TOTAL SEM ESTOURO DE FUNDO)             */}
        {/* ========================================================================= */}
        <div className="w-full min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              cliente={cliente}
              onChange={loadCliente}
              onNavigateTab={(t) => handleTabSelect(t as Tab)}
              onEditClient={openEditClientModal}
              onOpenChamado={() => setNovoChamadoModalOpen(true)}
              onManageContatos={() => {
                setCurrentContato({});
                setContatoModalOpen(true);
              }}
            />
          )}

          {activeTab === 'services' && <ServicesTab cliente={cliente} />}

          {activeTab === 'notes' && <NotesTab cliente={cliente} onChange={loadCliente} />}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAIS PRESERVADOS COM TODA A LÓGICA DE DADOS                             */}
      {/* ========================================================================= */}

      {/* Modal: Editar Dados Cadastrais */}
      <Modal
        isOpen={isEditClientModalOpen}
        onClose={() => setEditClientModalOpen(false)}
        title="Editar Cadastro do Cliente"
      >
        <form onSubmit={handleSaveClientData} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Nome Fantasia *</label>
              <Input
                required
                value={editClientForm.nomeFantasia}
                onChange={(e) => setEditClientForm({ ...editClientForm, nomeFantasia: e.target.value })}
                placeholder="Ex: Supermercado Modelo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Razão Social</label>
              <Input
                value={editClientForm.razaoSocial}
                onChange={(e) => setEditClientForm({ ...editClientForm, razaoSocial: e.target.value })}
                placeholder="Ex: Modelo Comércio de Alimentos LTDA"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">CNPJ / CPF *</label>
              <Input
                required
                value={editClientForm.cnpjCpf}
                onChange={(e) => setEditClientForm({ ...editClientForm, cnpjCpf: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Segmento *</label>
              <Input
                required
                value={editClientForm.segmento}
                onChange={(e) => setEditClientForm({ ...editClientForm, segmento: e.target.value })}
                placeholder="Ex: Varejo Alimentício"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Status da Conta</label>
              <Select
                value={editClientForm.status}
                onChange={(e) => setEditClientForm({ ...editClientForm, status: e.target.value as StatusCliente })}
              >
                <option value="ATIVO">🟢 Ativo</option>
                <option value="PROSPECT">⚡ Prospect</option>
                <option value="PAUSADO">⏸️ Pausado</option>
                <option value="ENCERRADO">🔴 Encerrado</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#FAF2E4]">
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Início do Contrato</label>
              <Input
                type="date"
                value={editClientForm.dataInicioContrato}
                onChange={(e) => setEditClientForm({ ...editClientForm, dataInicioContrato: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">OpenPanel Project ID</label>
              <Input
                value={editClientForm.openpanelProjectId}
                onChange={(e) => setEditClientForm({ ...editClientForm, openpanelProjectId: e.target.value })}
                placeholder="ID de monitoramento"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">E-mail Corporativo</label>
              <Input
                type="email"
                value={editClientForm.email}
                onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                placeholder="Ex: contato@cliente.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Telefone Principal</label>
              <Input
                value={editClientForm.telefone}
                onChange={(e) => setEditClientForm({ ...editClientForm, telefone: e.target.value })}
                placeholder="Ex: (00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Localização</label>
              <Input
                value={editClientForm.localizacao}
                onChange={(e) => setEditClientForm({ ...editClientForm, localizacao: e.target.value })}
                placeholder="Ex: São Paulo, SP"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Logins e Senhas / Vault</label>
              <Input
                value={editClientForm.loginsSenhas}
                onChange={(e) => setEditClientForm({ ...editClientForm, loginsSenhas: e.target.value })}
                placeholder="Cole aqui acessos ou link de vault"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Google Analytics 4 Property ID</label>
              <Input
                value={editClientForm.ga4PropertyId}
                onChange={(e) => setEditClientForm({ ...editClientForm, ga4PropertyId: e.target.value })}
                placeholder="Ex: 123456789"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Google Search Console URL</label>
              <Input
                value={editClientForm.gscSiteUrl}
                onChange={(e) => setEditClientForm({ ...editClientForm, gscSiteUrl: e.target.value })}
                placeholder="https://exemplo.com.br/"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#FAF2E4]">
            <Button type="button" variant="ghost" onClick={() => setEditClientModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Identidade Visual (Logo & Capa) */}
      <Modal
        isOpen={isVisualModalOpen}
        onClose={() => setVisualModalOpen(false)}
        title="Identidade Visual do Cliente (Logo & Capa)"
      >
        <form onSubmit={handleSaveVisualUrls} className="space-y-5">
          {/* Seção Logo */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1E1A16] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#C7A15F]" />
                Logo / Foto do Cliente
              </span>
              <button
                type="button"
                onClick={() => fileInputLogoRef.current?.click()}
                className="px-3 py-1 rounded-full bg-[#181512] text-[#C7A15F] text-[12px] font-bold flex items-center gap-1 hover:bg-[#2A241E] transition-all cursor-pointer shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{uploadingLogo ? 'Enviando...' : 'Fazer Upload'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {logoUrlInput ? (
                  <img src={resolveMediaUrl(logoUrlInput)} alt="Preview Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[#8A6828]">
                    {cliente.nomeFantasia.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-[12px] font-bold text-[#8F8271] mb-1">
                  Ou cole a URL direta da imagem:
                </label>
                <Input
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Seção Banner */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1E1A16] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#C7A15F]" />
                Banner / Capa Superior
              </span>
              <button
                type="button"
                onClick={() => fileInputBannerRef.current?.click()}
                className="px-3 py-1 rounded-full bg-[#181512] text-[#C7A15F] text-[12px] font-bold flex items-center gap-1 hover:bg-[#2A241E] transition-all cursor-pointer shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{uploadingBanner ? 'Enviando...' : 'Fazer Upload'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="w-full h-24 rounded-xl bg-gradient-to-r from-[#181512] via-[#2B2319] to-[#1E1A16] overflow-hidden flex items-center justify-center shadow-2xs">
                {bannerUrlInput ? (
                  <img src={resolveMediaUrl(bannerUrlInput)} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#C7A15F]/60">
                    Nenhum banner personalizado configurado
                  </span>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#8F8271] mb-1">
                  Ou cole a URL direta do banner:
                </label>
                <Input
                  value={bannerUrlInput}
                  onChange={(e) => setBannerUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setVisualModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Imagens
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adicionar / Editar Contato */}
      <Modal
        isOpen={isContatoModalOpen}
        onClose={() => setContatoModalOpen(false)}
        title={currentContato.id ? 'Editar Contato' : 'Adicionar Novo Contato'}
      >
        <form onSubmit={handleSaveContato} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1E1A16] mb-1">Nome Completo</label>
            <Input
              required
              value={currentContato.nome || ''}
              onChange={(e) => setCurrentContato({ ...currentContato, nome: e.target.value })}
              placeholder="Ex: Carlos Mendes"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1E1A16] mb-1">Cargo / Função</label>
            <Input
              value={currentContato.cargo || ''}
              onChange={(e) => setCurrentContato({ ...currentContato, cargo: e.target.value })}
              placeholder="Ex: Diretor Comercial"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">E-mail</label>
              <Input
                type="email"
                value={currentContato.email || ''}
                onChange={(e) => setCurrentContato({ ...currentContato, email: e.target.value })}
                placeholder="carlos@empresa.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Telefone / WhatsApp</label>
              <Input
                value={currentContato.telefone || ''}
                onChange={(e) => setCurrentContato({ ...currentContato, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setContatoModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Contato
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo Chamado */}
      {isNovoChamadoModalOpen && (
        <NovoChamadoModal
          initialClienteId={cliente.id}
          onClose={() => setNovoChamadoModalOpen(false)}
          onChamadoCreated={() => loadChamadosAbertos(cliente.id)}
        />
      )}
    </div>
  );
}
