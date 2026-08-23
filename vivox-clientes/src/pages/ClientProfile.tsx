import { useEffect, useState, useRef } from 'react';
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
  Plus, 
  Trash2, 
  Globe, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  ShieldCheck,
  UserCheck,
  MoreVertical,
  Calendar as CalendarIcon,
  Video,
  Info,
  User,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  Link2,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente, Contato, StatusCliente } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';

import { OverviewTab } from '../components/ClientTabs/OverviewTab';
import { HostingTab } from '../components/ClientTabs/HostingTab';
import { NotesTab } from '../components/ClientTabs/NotesTab';
import { MarketTab } from '../components/ClientTabs/MarketTab';
import { ServicesTab } from '../components/ClientTabs/ServicesTab';
import { AiContentStudioTab } from '../components/ClientTabs/AiContentStudioTab';

type Tab = 'overview' | 'services' | 'ai-studio' | 'hosting' | 'market' | 'notes';

export function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as Tab;
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl || 'overview');
  const [copiado, setCopiado] = useState(false);

  // Modal para adicionar/editar contato
  const [isContatoModalOpen, setContatoModalOpen] = useState(false);
  const [currentContato, setCurrentContato] = useState<Partial<Contato>>({});

  // Modal de Personalização Visual (Logo & Banner)
  const [isVisualModalOpen, setVisualModalOpen] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Modal de Edição dos Dados Cadastrais (Nome Fantasia, Razão Social, CNPJ, Status, etc.)
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

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabSelect = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (id) {
      loadCliente(id);
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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

  // Salvar URLs digitadas no Modal
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
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center py-32 text-[#8F8271]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C7A15F] border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#1E1A16]">Carregando perfil do cliente...</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'services', label: 'Mapa de Serviços' },
    { id: 'ai-studio', label: '✨ Estúdio IA' },
    { id: 'hosting', label: 'Landing Pages' },
    { id: 'market', label: 'Mercado (IA)' },
    { id: 'notes', label: 'Anotações' },
  ];

  const primeiroContato = cliente.contatos?.[0];

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-transparent p-6 md:p-10 flex flex-col select-none">
      {/* Hidden File Inputs para Upload Instantâneo */}
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

      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        {/* ========================================================================= */}
        {/* TOP ROW: ← CLIENTE + STATUS PILL & AÇÕES RÁPIDAS (PALETA VIVOX GP)        */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
          {/* Lado Esquerdo: ← Nome do Cliente / My Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/clientes')}
              title="Voltar para clientes"
              className="w-10 h-10 rounded-full bg-[#FFFDF8] hover:bg-[#FAF2E4] flex items-center justify-center text-[#1E1A16] transition-all cursor-pointer shadow-2xs hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 text-[#1E1A16]" />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-[#1E1A16] tracking-tight">
                {cliente.nomeFantasia}
              </h1>
            </div>
          </div>

          {/* Lado Direito: Pílulas de Status, Editar Cadastro, Banner/Logo & Data */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {copiado && (
              <span className="text-[11px] font-bold text-[#247A4A] flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Link Copiado!
              </span>
            )}

            {/* Botão para Editar Dados Cadastrais */}
            <button
              onClick={openEditClientModal}
              className="px-4 py-2 rounded-full bg-[#181512] hover:bg-[#2A241E] text-[#C7A15F] text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer hover:scale-105 border border-[#C7A15F]/20"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Cadastro</span>
            </button>

            {/* Botão para Alterar Capa / Imagem da Marca */}
            <button
              onClick={() => setVisualModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#FFFDF8] hover:bg-[#FAF2E4] text-[#1E1A16] text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer hover:scale-105"
            >
              <Camera className="w-3.5 h-3.5 text-[#C7A15F]" />
              <span>Imagens / Banner</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="Copiar Link do Perfil"
              className="w-9 h-9 rounded-full bg-[#FFFDF8] hover:bg-[#FAF2E4] text-[#1E1A16] flex items-center justify-center shadow-2xs transition-all cursor-pointer hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Pílula de Status (Ativo / Prospect) */}
            <span className={`px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase shadow-2xs flex items-center gap-1.5 ${
              cliente.status === 'ATIVO'
                ? 'bg-[#247A4A]/10 text-[#247A4A] border border-[#247A4A]/30'
                : cliente.status === 'PROSPECT'
                ? 'bg-[#FFA800]/15 text-[#B45309] border border-[#FFA800]/40'
                : cliente.status === 'PAUSADO'
                ? 'bg-[#8F8271]/15 text-[#625746] border border-[#8F8271]/30'
                : 'bg-[#B83B32]/10 text-[#B83B32] border border-[#B83B32]/30'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>{cliente.status}</span>
            </span>

            {/* Pílula de Data */}
            <span className="px-4 py-2 rounded-full bg-[#FFFDF8] text-xs font-bold text-[#625746] shadow-2xs flex items-center gap-2">
              <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              <CalendarIcon className="w-3.5 h-3.5 text-[#C7A15F]" />
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAYOUT PRINCIPAL DE 2 COLUNAS CLEAN (CORES VIVOX GP)                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================================= */}
          {/* COLUNA ESQUERDA: PROFILE CARD COM BANNER & LOGO + DETALHES (COLS 1-4)   */}
          {/* ======================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Perfil do Cliente com BANNER DE CAPA & LOGO EDITÁVEL */}
            <div className="bg-[#FFFDF8] rounded-[28px] shadow-xs overflow-hidden flex flex-col">
              {/* BANNER DE CAPA DO CLIENTE */}
              <div className="w-full h-32 md:h-36 relative overflow-hidden group">
                {cliente.bannerUrl ? (
                  <img
                    src={resolveMediaUrl(cliente.bannerUrl)}
                    alt={`Banner de ${cliente.nomeFantasia}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#181512] via-[#2B2319] to-[#1E1A16] flex items-center justify-end pr-5 relative">
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C7A15F_1px,transparent_1px)] [background-size:16px_16px]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C7A15F]/40 select-none">
                      VIVOX BRAND COVER
                    </span>
                  </div>
                )}

                {/* Botão de Troca Rápida de Banner sobre a Capa */}
                <button
                  onClick={() => fileInputBannerRef.current?.click()}
                  title="Alterar imagem de capa / banner"
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-[#FFFDF8] text-[10px] font-bold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-sm hover:scale-105"
                >
                  <Camera className="w-3.5 h-3.5 text-[#C7A15F]" />
                  <span>{uploadingBanner ? 'Enviando...' : 'Capa'}</span>
                </button>
              </div>

              {/* CONTEÚDO DO PERFIL (AVATAR SOBREPOSTO + NOMES + AÇÕES) */}
              <div className="relative z-10 p-6 pt-0 space-y-5">
                {/* Linha do Avatar e Botão Editar */}
                <div className="flex items-end justify-between gap-3 -mt-10 mb-2">
                  {/* Avatar Circular com Fundo Dourado Vivox e Botão de Foto */}
                  <div 
                    onClick={() => fileInputLogoRef.current?.click()}
                    title="Clique para alterar a foto/logo do cliente"
                    className="w-20 h-20 rounded-3xl bg-[#FAF2E4] border-4 border-[#FFFDF8] shadow-md flex items-center justify-center overflow-hidden relative z-20 group cursor-pointer transition-transform hover:scale-105 shrink-0"
                  >
                    {cliente.logoUrl ? (
                      <img
                        src={resolveMediaUrl(cliente.logoUrl)}
                        alt={cliente.nomeFantasia}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-[#8A6828]">
                        {cliente.nomeFantasia.charAt(0).toUpperCase()}
                      </span>
                    )}

                    {/* Hover Overlay com Ícone de Câmera */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold gap-0.5">
                      <Camera className="w-4 h-4 text-[#C7A15F]" />
                      <span>{uploadingLogo ? '...' : 'Trocar'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={openEditClientModal}
                    title="Editar Dados Cadastrais"
                    className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E4] flex items-center justify-center text-[#8F8271] hover:text-[#1E1A16] transition-colors cursor-pointer mb-1 shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Nome e Segmento */}
                <div>
                  <h2 className="text-xl font-black text-[#1E1A16] leading-tight">
                    {cliente.nomeFantasia}
                  </h2>
                  <p className="text-xs font-semibold text-[#8F8271] mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#C7A15F]" />
                    {cliente.segmento || 'Segmento da Marca'}
                  </p>
                </div>

                {/* Barra de Ações Redondas: [ ✉ ] [ 📞 ] [ 💬 ] [ 📊 ] */}
                <div className="flex items-center gap-2.5 pt-1">
                  {(cliente.email || primeiroContato?.email) ? (
                    <a
                      href={`mailto:${cliente.email || primeiroContato?.email}`}
                      title={cliente.email || primeiroContato?.email}
                      className="w-10 h-10 rounded-2xl bg-[#181512] text-[#C7A15F] flex items-center justify-center shadow-2xs hover:scale-105 transition-all border border-[#C7A15F]/20"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  ) : (
                    <button className="w-10 h-10 rounded-2xl bg-[#FAF7F2] text-[#8F8271] opacity-60 flex items-center justify-center cursor-not-allowed">
                      <Mail className="w-4 h-4" />
                    </button>
                  )}

                  {(cliente.telefone || primeiroContato?.telefone) ? (
                    <a
                      href={`tel:${(cliente.telefone || primeiroContato?.telefone || '').replace(/\D/g, '')}`}
                      title={cliente.telefone || primeiroContato?.telefone}
                      className="w-10 h-10 rounded-2xl bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-[#1E1A16] flex items-center justify-center transition-all hover:scale-105 shadow-2xs"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  ) : (
                    <button className="w-10 h-10 rounded-2xl bg-[#FAF7F2] text-[#8F8271] opacity-60 flex items-center justify-center cursor-not-allowed">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}

                  {(cliente.telefone || primeiroContato?.telefone) ? (
                    <a
                      href={`https://wa.me/55${(cliente.telefone || primeiroContato?.telefone || '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Conversar no WhatsApp"
                      className="w-10 h-10 rounded-2xl bg-[#247A4A]/10 hover:bg-[#247A4A] hover:text-white text-[#247A4A] flex items-center justify-center transition-all hover:scale-105 shadow-2xs border border-[#247A4A]/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  ) : (
                    <button className="w-10 h-10 rounded-2xl bg-[#FAF7F2] text-[#8F8271] opacity-60 flex items-center justify-center cursor-not-allowed">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/analytics/${cliente.id}`)}
                    title="Métricas do Cliente"
                    className="w-10 h-10 rounded-2xl bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-[#1E1A16] flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-2xs"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Time Slots / Metadata Row (Cores Vivox GP) */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-[#8F8271] block mb-2">
                    Time Slots & Contrato
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    {/* Pílula de Data */}
                    <div className="px-4 py-2 rounded-2xl bg-[#FAF7F2] flex items-center gap-2 text-xs font-bold text-[#1E1A16]">
                      <span>
                        {cliente.dataInicioContrato 
                          ? new Date(cliente.dataInicioContrato).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                          : 'Contrato Ativo'}
                      </span>
                      <CalendarIcon className="w-3.5 h-3.5 text-[#C7A15F]" />
                    </div>

                    {/* Pílula de Demandas (Meetings 3) */}
                    <div 
                      onClick={() => navigate('/gp')}
                      className="px-4 py-2 rounded-2xl bg-[#FAF2E4] hover:bg-[#E8D4B4] transition-colors flex items-center gap-1.5 text-xs font-bold text-[#8A6828] cursor-pointer shadow-2xs"
                    >
                      <span>Demandas</span>
                      <span className="w-5 h-5 rounded-full bg-[#181512] text-[#C7A15F] text-[10px] flex items-center justify-center font-bold">
                        {cliente.contatos?.length || 1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Detailed Information (Cores Vivox GP) */}
            <div className="bg-[#FFFDF8] rounded-[28px] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-black text-[#1E1A16] tracking-tight">
                  Detailed Information
                </h3>
                <button
                  onClick={openEditClientModal}
                  className="text-xs font-bold text-[#8A6828] hover:text-[#1E1A16] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>

              {/* Lista de Linhas com Bolinha Preta e Ícone à Direita */}
              <div className="space-y-2.5">
                {/* Linha 1: Full Name / Razão Social */}
                <div 
                  onClick={openEditClientModal}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF2E4] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E1A16]" />
                      <span className="text-[10px] font-bold text-[#8F8271] uppercase">Razão Social</span>
                    </div>
                    <p className="text-xs font-bold text-[#1E1A16] mt-0.5 truncate pl-3.5">
                      {cliente.razaoSocial || cliente.nomeFantasia}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#247A4A]/15 text-[#247A4A] shrink-0">
                    {cliente.status}
                  </span>
                </div>

                {/* Linha 2: CNPJ / CPF */}
                <div 
                  onClick={openEditClientModal}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF2E4] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E1A16]" />
                      <span className="text-[10px] font-bold text-[#8F8271] uppercase">CNPJ / CPF</span>
                    </div>
                    <p className="font-mono text-xs font-bold text-[#1E1A16] mt-0.5 truncate pl-3.5">
                      {cliente.cnpjCpf || 'Não informado'}
                    </p>
                  </div>
                  <Info className="w-4 h-4 text-[#8F8271] shrink-0 group-hover:text-[#1E1A16]" />
                </div>

                {/* Linha 3: Email Principal */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E1A16]" />
                      <span className="text-[10px] font-bold text-[#8F8271] uppercase">Email Address</span>
                    </div>
                    <p className="text-xs font-bold text-[#1E1A16] mt-0.5 truncate pl-3.5">
                      {cliente.email || primeiroContato?.email || 'Nenhum e-mail'}
                    </p>
                  </div>
                  <Mail className="w-4 h-4 text-[#C7A15F] shrink-0" />
                </div>

                {/* Linha 4: Contact Number */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E1A16]" />
                      <span className="text-[10px] font-bold text-[#8F8271] uppercase">Contact Number</span>
                    </div>
                    <p className="text-xs font-bold text-[#1E1A16] mt-0.5 truncate pl-3.5">
                      {cliente.telefone || primeiroContato?.telefone || 'Não cadastrado'}
                    </p>
                  </div>
                  <Phone className="w-4 h-4 text-[#C7A15F] shrink-0" />
                </div>

                {/* Localização */}
                <div 
                  onClick={openEditClientModal}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF2E4] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E1A16]" />
                      <span className="text-[10px] font-bold text-[#8F8271] uppercase">Localização</span>
                    </div>
                    <p className="text-xs font-bold text-[#1E1A16] mt-0.5 truncate pl-3.5">
                      {cliente.localizacao || 'Não cadastrada'}
                    </p>
                  </div>
                  <Globe className="w-4 h-4 text-[#8A6828] shrink-0 group-hover:text-[#1E1A16]" />
                </div>

                {/* Linha 5: Designation / Responsável */}
                <div 
                  onClick={openEditClientModal}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF2E4] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E1A16]" />
                      <span className="text-[10px] font-bold text-[#8F8271] uppercase">Segmento</span>
                    </div>
                    <p className="text-xs font-bold text-[#1E1A16] mt-0.5 truncate pl-3.5">
                      {cliente.segmento || 'Não informado'}
                    </p>
                  </div>
                  <UserCheck className="w-4 h-4 text-[#8A6828] shrink-0" />
                </div>
              </div>

              {/* Botão de Adicionar / Gerenciar Contatos */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setCurrentContato({});
                    setContatoModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-xs font-bold text-[#1E1A16] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C7A15F]" />
                  <span>Gerenciar Contatos ({cliente.contatos?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Acessos e Credenciais (Visível apenas se preenchido) */}
            {cliente.loginsSenhas && (
              <div className="bg-[#FFFDF8] rounded-[28px] p-6 shadow-xs space-y-3 mt-6">
                <div className="flex items-center gap-2 pb-1">
                  <ShieldCheck className="w-4 h-4 text-[#8A6828]" />
                  <h3 className="text-sm font-black text-[#1E1A16] tracking-tight">
                    Acessos & Credenciais
                  </h3>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8D4B4]">
                  <p className="text-xs text-[#1E1A16] whitespace-pre-wrap leading-relaxed">
                    {cliente.loginsSenhas}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* COLUNA DIREITA: ABAS & HUB DE OPERAÇÕES (COLS 5-12)                     */}
          {/* ======================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Barra de Abas Estilo Pílula Limpa com Cores Vivox GP */}
            <div className="bg-[#FFFDF8] rounded-full p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#181512] text-[#C7A15F] shadow-xs border border-[#C7A15F]/20'
                      : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Renderização da Aba Ativa */}
            <div className="w-full">
              {activeTab === 'overview' && (
                <OverviewTab 
                  cliente={cliente} 
                  onChange={loadCliente} 
                  onNavigateTab={(tab) => handleTabSelect(tab as Tab)}
                />
              )}
              {activeTab === 'services' && <ServicesTab cliente={cliente} />}
              {activeTab === 'ai-studio' && <AiContentStudioTab cliente={cliente} />}
              {activeTab === 'hosting' && <HostingTab cliente={cliente} />}
              {activeTab === 'market' && <MarketTab clienteId={cliente.id} />}
              {activeTab === 'notes' && <NotesTab cliente={cliente} onChange={loadCliente} />}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR DADOS CADASTRAIS DO CLIENTE (NOME, RAZÃO, CNPJ, STATUS, ETC) */}
      {/* ========================================================================= */}
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
              <label className="block text-xs font-bold text-[#1E1A16] mb-1">Logins e Senhas</label>
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

      {/* ========================================================================= */}
      {/* MODAL: PERSONALIZAR IMAGEM (LOGO) E BANNER DE CAPA DO CLIENTE             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isVisualModalOpen}
        onClose={() => setVisualModalOpen(false)}
        title="Identidade Visual do Cliente (Logo & Capa)"
      >
        <form onSubmit={handleSaveVisualUrls} className="space-y-5">
          {/* Seção 1: Logo / Foto de Perfil */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1E1A16] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#C7A15F]" />
                Logo / Foto do Cliente
              </span>
              <button
                type="button"
                onClick={() => fileInputLogoRef.current?.click()}
                className="px-3 py-1 rounded-full bg-[#181512] text-[#C7A15F] text-[11px] font-bold flex items-center gap-1 hover:bg-[#2A241E] transition-all cursor-pointer shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{uploadingLogo ? 'Enviando...' : 'Fazer Upload'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {logoUrlInput ? (
                  <img src={resolveMediaUrl(logoUrlInput)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[#8A6828]">
                    {cliente.nomeFantasia.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#8F8271] mb-1">
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

          {/* Seção 2: Banner / Capa de Fundo */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1E1A16] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#C7A15F]" />
                Banner / Capa Superior
              </span>
              <button
                type="button"
                onClick={() => fileInputBannerRef.current?.click()}
                className="px-3 py-1 rounded-full bg-[#181512] text-[#C7A15F] text-[11px] font-bold flex items-center gap-1 hover:bg-[#2A241E] transition-all cursor-pointer shadow-2xs"
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
                <label className="block text-[11px] font-bold text-[#8F8271] mb-1">
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

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR / EDITAR CONTATO                                         */}
      {/* ========================================================================= */}
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
    </div>
  );
}
