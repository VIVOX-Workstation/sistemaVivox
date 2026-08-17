import React, { useState, useEffect, useMemo } from 'react';
import type { Cliente, FonteContexto } from '../../types';
import {
  BookOpen,
  FileText,
  Link as LinkIcon,
  Plus,
  Lightbulb,
  Target,
  Trash2,
  Edit2,
  X,
  Brain,
  Sparkles,
  Award,
  Users,
  Compass,
  Layers,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  FolderOpen,
  Maximize2,
} from 'lucide-react';
import { StrategyMindMap } from '../StrategyMindMap';
import { api } from '../../api/client';

interface Props {
  cliente: Cliente;
}

export function PlanningTab({ cliente }: Props) {
  const [fontes, setFontes] = useState<FonteContexto[]>(cliente.fontesContexto || []);
  const [activeSubTab, setActiveSubTab] = useState<'matriz' | 'funil' | 'mindmap' | 'fontes'>('matriz');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiTreeData, setAiTreeData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  
  // Form state do Modal
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('TEXTO'); // LINK, ARQUIVO, TEXTO

  useEffect(() => {
    setFontes(cliente.fontesContexto || []);
  }, [cliente.fontesContexto]);

  const loadFontes = async () => {
    try {
      const res = await api.get(`/clientes/${cliente.id}`);
      setFontes(res.data.fontesContexto || []);
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (fonte?: FonteContexto) => {
    if (fonte) {
      setEditingId(fonte.id);
      setTitulo(fonte.titulo);
      setDescricao(fonte.descricao || '');
      setTipo(fonte.tipo);
    } else {
      setEditingId(null);
      setTitulo('');
      setDescricao('');
      setTipo('TEXTO');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSource(true);
    try {
      const data = { titulo, descricao, tipo };
      if (editingId) {
        await api.patch(`/clientes/fontes/${editingId}`, data);
      } else {
        await api.post(`/clientes/${cliente.id}/fontes`, data);
      }
      setIsModalOpen(false);
      loadFontes();
    } catch (error) {
      alert('Erro ao salvar fonte');
    } finally {
      setSavingSource(false);
    }
  };

  const handleDelete = async (fonteId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este briefing/fonte?')) return;
    try {
      await api.delete(`/clientes/fontes/${fonteId}`);
      loadFontes();
    } catch (error) {
      alert('Erro ao excluir fonte');
    }
  };

  const handleGenerateMindmap = async () => {
    try {
      setIsGenerating(true);
      const res = await api.post(`/ia/generate-mindmap/${cliente.id}`);
      if (res.data) {
        setAiTreeData(res.data);
        setActiveSubTab('mindmap');
      }
    } catch (error) {
      console.error('Erro ao gerar mapa mental:', error);
      alert('Houve um erro ao gerar a inteligência estratégica.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSourceIcon = (t: string) => {
    switch (t) {
      case 'LINK': return <LinkIcon className="w-4 h-4 text-[#8A6828]" />;
      case 'ARQUIVO': return <FileText className="w-4 h-4 text-[#247A4A]" />;
      default: return <BookOpen className="w-4 h-4 text-[#B89455]" />;
    }
  };

  // Pilares Estratégicos Padrão Vivox (Adaptados ao nicho da cliente ou gerais)
  const pilaresEstrategicos = useMemo(() => {
    return [
      {
        id: 'pilar-1',
        numero: '01',
        titulo: 'Posicionamento & Autoridade High-Ticket',
        categoria: 'Branding & Percepção',
        tagCor: '#C7A15F',
        descricao: 'Construção de autoridade inquestionável no nicho de pediatria integrativa e atendimento humanizado premium.',
        itens: [
          { rotulo: 'Proposta Única (UVP)', valor: 'Cuidado pediátrico integral, medicina preventiva e acompanhamento familiar contínuo sem pressa.' },
          { rotulo: 'Tom de Voz', valor: 'Acolhedor, técnico-científico acessível, empático e sofisticado.' },
          { rotulo: 'Diferencial Central', valor: 'Consultas de longa duração, canal direto no WhatsApp e planos de acompanhamento por fases do bebê.' }
        ]
      },
      {
        id: 'pilar-2',
        numero: '02',
        titulo: 'Persona Alvo & ICP (Mães & Famílias)',
        categoria: 'Público Qualificado',
        tagCor: '#8A6828',
        descricao: 'Famílias classe A/B que priorizam a saúde preventiva do filho em relação a consultas de convênio rápidas.',
        itens: [
          { rotulo: 'Dores Principais', valor: 'Insegurança nos primeiros meses, consultas frias de 10 min, excesso de medicamentos desnecessários.' },
          { rotulo: 'Desejos Centrais', valor: 'Paz de espírito, desenvolvimento saudável e uma médica de confiança disponível.' },
          { rotulo: 'Quebra de Objeção', valor: 'O valor da consulta particular se paga na prevenção de emergências e na atenção 24/7.' }
        ]
      },
      {
        id: 'pilar-3',
        numero: '03',
        titulo: 'Aquisição & Funil de Conversão',
        categoria: 'Tráfego & Vendas',
        tagCor: '#247A4A',
        descricao: 'Captação ativa via Google Search (SEO orgânico) e anúncios segmentados para mães na região.',
        itens: [
          { rotulo: 'Canais de Entrada', valor: 'Google Search Console (Termos locais), Instagram Reels e Google Meu Negócio (GMB).' },
          { rotulo: 'Oferta Front-End', valor: 'Consulta de Puericultura e Avaliação Integral do Desenvolvimento.' },
          { rotulo: 'Conversão Direta', valor: 'Landing Page de Alta Conversão com botão direto para o WhatsApp da secretária.' }
        ]
      },
      {
        id: 'pilar-4',
        numero: '04',
        titulo: 'Retenção & LTV (Planos Contínuos)',
        categoria: 'Fidelização & Encantamento',
        tagCor: '#4A4032',
        descricao: 'Transformação de consultas avulsas em planos anuais de acompanhamento do bebê.',
        itens: [
          { rotulo: 'Produto Core', valor: 'Plano Acompanhamento Baby Tia Manu (12 meses de acompanhamento).' },
          { rotulo: 'Experiência Clínica', valor: 'Consultório sensorial, recepção acolhedora e kits educativos de orientação.' },
          { rotulo: 'Pós-Consulta', valor: 'Mensagens de acompanhamento após vacinas e retorno pontual dos exames.' }
        ]
      }
    ];
  }, []);

  // Metas do Trimestre / OKRs
  const okrs = useMemo(() => {
    return [
      { titulo: 'Aumentar Pacientes de Planos Anuais', meta: '30 Famílias Ativas', atual: 22, progresso: 73, status: 'Em Ritmo Acelerado' },
      { titulo: 'Alcance Mensal em Reels Educativos', meta: '100.000 Contas Únicas', atual: 84500, progresso: 84, status: 'Quase Concluído' },
      { titulo: 'Primeira Página no Google (Pediatra Cuiabá)', meta: 'Top 3 Resultados Orgânicos', atual: 2, progresso: 90, status: 'Meta Batida' },
      { titulo: 'Avaliações 5 Estrelas no Google Maps', meta: '150 Avaliações Positivas', atual: 138, progresso: 92, status: 'Excelente' },
    ];
  }, []);

  return (
    <div className="space-y-6 w-full">
      
      {/* 👑 CABEÇALHO EXECUTIVO STICKY */}
      <div className="sticky top-0 z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#14120E]/95 backdrop-blur-md text-[#F6F0E7] p-4 sm:p-5 rounded-[11px] border border-[#2B261F] shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C7A15F] animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C7A15F]">
              Planejamento Estratégico • {cliente.nomeFantasia}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C7A15F]/20 text-[#C7A15F] border border-[#C7A15F]/40">
              <ShieldCheck className="w-2.5 h-2.5" />
              Matriz Ativa Q3 / 2026
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAF7F2] mt-0.5 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#C7A15F]" />
            DIRETRIZES ESTRATÉGICAS, BRANDING & ROADMAP
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Visões */}
          <div className="flex items-center bg-[#24201A] p-1 rounded-lg border border-[#4A4032]">
            <button
              onClick={() => setActiveSubTab('matriz')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'matriz'
                  ? 'bg-[#C7A15F] text-[#14120E] shadow-xs'
                  : 'text-[#A89880] hover:text-[#FAF7F2]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matriz & Pilares</span>
            </button>

            <button
              onClick={() => setActiveSubTab('funil')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'funil'
                  ? 'bg-[#C7A15F] text-[#14120E] shadow-xs'
                  : 'text-[#A89880] hover:text-[#FAF7F2]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Funil de Conteúdo</span>
            </button>

            <button
              onClick={() => setActiveSubTab('mindmap')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'mindmap'
                  ? 'bg-[#C7A15F] text-[#14120E] shadow-xs'
                  : 'text-[#A89880] hover:text-[#FAF7F2]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sinapse 3D</span>
            </button>

            <button
              onClick={() => setActiveSubTab('fontes')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'fontes'
                  ? 'bg-[#C7A15F] text-[#14120E] shadow-xs'
                  : 'text-[#A89880] hover:text-[#FAF7F2]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Briefings ({fontes.length})</span>
            </button>
          </div>

          <button
            onClick={handleGenerateMindmap}
            disabled={isGenerating}
            className="h-9 px-3.5 rounded-lg border border-[#C7A15F]/60 bg-[#C7A15F]/15 hover:bg-[#C7A15F]/25 text-[#C7A15F] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Gerar sinapse com Inteligência Artificial"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Gerando...' : 'Inteligência IA'}</span>
          </button>

          <button
            onClick={() => openModal()}
            className="h-9 px-3.5 rounded-lg bg-[#C7A15F] hover:bg-[#B89455] text-[#14120E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Briefing</span>
          </button>
        </div>
      </div>

      {/* 1️⃣ VISÃO: MATRIZ & PILARES ESTRATÉGICOS */}
      {activeSubTab === 'matriz' && (
        <div className="space-y-6 animate-fade-in">
          {/* CARDS DOS 4 PILARES ESTRATÉGICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pilaresEstrategicos.map((pilar) => (
              <div
                key={pilar.id}
                className="bg-[#FFFDF8] rounded-[12px] border border-[#D8CBB8] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#FAF2E4] border border-[#E8D4B4] text-[#8A6828] text-xs font-black flex items-center justify-center font-mono">
                        {pilar.numero}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6828]">
                        {pilar.categoria}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#C7A15F] opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <h3 className="text-base font-bold text-[#1E1A16] mb-1 tracking-tight">
                    {pilar.titulo}
                  </h3>
                  <p className="text-xs text-[#625746] mb-4 leading-relaxed">
                    {pilar.descricao}
                  </p>

                  <div className="space-y-2.5 bg-[#FAF7F2] p-3.5 rounded-lg border border-[#EEE7DC]">
                    {pilar.itens.map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#847663] block mb-0.5">
                          {item.rotulo}
                        </span>
                        <p className="text-xs font-medium text-[#1E1A16] leading-snug">
                          {item.valor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EEE7DC] flex items-center justify-between text-[11px]">
                  <span className="text-[#847663] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#247A4A]" />
                    Pilar Validado
                  </span>
                  <button
                    onClick={() => setActiveSubTab('funil')}
                    className="text-[#8A6828] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Ver Aplicação no Funil <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* METAS DO TRIMESTRE & OKRS EXECUTIVOS */}
          <div className="bg-[#FFFDF8] rounded-[12px] border border-[#D8CBB8] shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#EEE7DC] pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1A16] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#B89455]" />
                  OKRs & Metas Estratégicas do Trimestre (Q3)
                </h3>
                <p className="text-xs text-[#625746] mt-0.5">
                  Indicadores-chave de sucesso monitorados semanalmente pelo time de Growth da Vivox.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
                4 Metas em Andamento
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {okrs.map((okr, index) => (
                <div key={index} className="bg-[#FAF7F2] p-4 rounded-lg border border-[#EEE7DC] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6828] block mb-1">
                      {okr.status}
                    </span>
                    <h4 className="text-xs font-bold text-[#1E1A16] leading-tight mb-2">
                      {okr.titulo}
                    </h4>
                    <div className="flex items-baseline justify-between text-xs mb-1.5">
                      <span className="text-[#625746] text-[11px]">Meta: <strong>{okr.meta}</strong></span>
                      <span className="font-black text-[#1E1A16] font-mono">{okr.progresso}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#EEE7DC] h-2 rounded-full overflow-hidden mt-2">
                    <div
                      style={{ width: `${okr.progresso}%` }}
                      className={`h-full rounded-full transition-all ${
                        okr.progresso >= 85 ? 'bg-[#247A4A]' : 'bg-[#B89455]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ VISÃO: LINHA EDITORIAL & FUNIL DE CONTEÚDO */}
      {activeSubTab === 'funil' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* TOPO DE FUNIL */}
            <div className="bg-[#FFFDF8] rounded-[12px] border border-[#D8CBB8] shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EEE7DC]">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C7A15F]/15 text-[#8A6828] border border-[#C7A15F]/30">
                    TOPO DE FUNIL (60%)
                  </span>
                  <span className="text-xs font-bold text-[#625746]">Atração & Alcance</span>
                </div>

                <h3 className="text-sm font-bold text-[#1E1A16] mb-2">
                  Descoberta, Mitos & Dúvidas Rápidas
                </h3>
                <p className="text-xs text-[#625746] mb-4">
                  Conteúdos que viralizam no Reels e no Google, atraindo mães e famílias que ainda não conhecem a clínica.
                </p>

                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "3 Mitos sobre a Febre do Bebê"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Reels Curto com gancho impactante nos primeiros 3s.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "O que nunca te contaram sobre o salto dos 3 meses"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Carrossel de 6 lâminas salvável.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "Guia de Primeiros Socorros na Introdução Alimentar"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Vídeo explicativo demonstrando na prática.</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEE7DC] text-[11px] text-[#8A6828] font-bold">
                🎯 Meta: 100k+ impressões orgânicas mensais
              </div>
            </div>

            {/* MEIO DE FUNIL */}
            <div className="bg-[#FFFDF8] rounded-[12px] border border-[#D8CBB8] shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EEE7DC]">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8A6828]/15 text-[#8A6828] border border-[#8A6828]/30">
                    MEIO DE FUNIL (30%)
                  </span>
                  <span className="text-xs font-bold text-[#625746]">Conexão & Autoridade</span>
                </div>

                <h3 className="text-sm font-bold text-[#1E1A16] mb-2">
                  Método Pediátrico, Bastidores & Casos
                </h3>
                <p className="text-xs text-[#625746] mb-4">
                  Conteúdos que provam a competência técnica e humanização, gerando confiança absoluta nas mães.
                </p>

                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "Por que uma consulta de 1 hora muda tudo"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Bastidores no consultório explicando a metodologia.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "Relato real de uma mãe sobre a evolução do sono"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Depoimento com antes e depois documentado.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "Como funciona o suporte contínuo via WhatsApp"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Stories narrativos respondendo dúvidas reais.</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEE7DC] text-[11px] text-[#8A6828] font-bold">
                🎯 Meta: Aumento de 40% na taxa de engajamento
              </div>
            </div>

            {/* FUNDO DE FUNIL */}
            <div className="bg-[#FFFDF8] rounded-[12px] border border-[#D8CBB8] shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EEE7DC]">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#247A4A]/15 text-[#247A4A] border border-[#247A4A]/30">
                    FUNDO DE FUNIL (10%)
                  </span>
                  <span className="text-xs font-bold text-[#247A4A]">Conversão Direta</span>
                </div>

                <h3 className="text-sm font-bold text-[#1E1A16] mb-2">
                  Agendamento de Consultas & Planos Baby
                </h3>
                <p className="text-xs text-[#625746] mb-4">
                  Chamadas claras para ação (CTA) direcionando para a secretária e para a Landing Page de agendamento.
                </p>

                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "Abertura de Vagas para o Acompanhamento Baby"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Post estático elegante com link direto na Bio/Stories.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "Últimos horários de atendimento da semana"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Sequência de 3 Stories com sticker de WhatsApp.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF7F2] border border-[#EEE7DC] text-xs">
                    <span className="font-bold text-[#1E1A16] block">📌 "Consulta Pré-Natal Pediátrica para Gestantes"</span>
                    <span className="text-[11px] text-[#847663]">Formato: Anúncio patrocinado com botão 'Fale Conosco'.</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEE7DC] text-[11px] text-[#247A4A] font-bold">
                🎯 Meta: 25+ novos leads qualificados por semana
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ VISÃO: MAPA MENTAL 3D / SINAPSE NEURAL */}
      {activeSubTab === 'mindmap' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center text-[#8A6828]">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1A16]">
                  Sinapse Neural & Rede de Conexões Estratégicas
                </h3>
                <p className="text-xs text-[#625746]">
                  Visualização tridimensional interativa interligando os pilares de branding, audiência e metas.
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateMindmap}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg bg-[#14120E] text-[#C7A15F] text-xs font-bold hover:bg-[#2B261F] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Recalculando Sinapses...' : 'Atualizar com IA'}
            </button>
          </div>

          <div className="h-[520px] rounded-[12px] overflow-hidden border border-[#2B261F] shadow-xl relative">
            <StrategyMindMap fontes={fontes} aiTreeData={aiTreeData} />
          </div>
        </div>
      )}

      {/* 4️⃣ VISÃO: BRIEFINGS & REPOSITÓRIO DE FONTES */}
      {activeSubTab === 'fontes' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1A16]">
                Repositório de Briefings, Documentos & Contexto
              </h3>
              <p className="text-xs text-[#625746] mt-0.5">
                Fontes utilizadas pelos motores de Inteligência Artificial da Vivox para direcionar a criação de conteúdo.
              </p>
            </div>

            <button
              onClick={() => openModal()}
              className="px-3.5 py-1.5 rounded-lg bg-[#C7A15F] hover:bg-[#B89455] text-[#14120E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Adicionar Documento
            </button>
          </div>

          {fontes.length === 0 ? (
            <div className="bg-[#FAF7F2] rounded-[12px] border border-dashed border-[#D8CBB8] p-8 text-center">
              <BookOpen className="w-8 h-8 text-[#8A6828] mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-[#1E1A16] mb-1">Nenhum briefing ou fonte cadastrada ainda.</p>
              <p className="text-[11px] text-[#847663] mb-4">Adicione anotações de reuniões, links de sites ou arquivos para alimentar o cérebro estratégico.</p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-[#C7A15F] text-[#14120E] text-xs font-bold rounded-lg hover:bg-[#B89455] transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Primeiro Briefing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fontes.map((fonte) => (
                <div
                  key={fonte.id}
                  className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs hover:border-[#C7A15F] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
                        {getSourceIcon(fonte.tipo)}
                        {fonte.tipo}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(fonte)}
                          className="p-1 text-[#847663] hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(fonte.id)}
                          className="p-1 text-[#847663] hover:text-[#B83B32] hover:bg-[#FBEBEB] rounded transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-[#1E1A16] mb-1 leading-snug">
                      {fonte.titulo}
                    </h4>

                    {fonte.descricao && (
                      <p className="text-xs text-[#625746] line-clamp-3 leading-relaxed mt-1">
                        {fonte.descricao}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#EEE7DC] flex items-center justify-between text-[10px] text-[#847663]">
                    <span>Sincronizado com RAG IA</span>
                    <span className="text-[#247A4A] font-bold">● Ativo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 📝 MODAL DE CADASTRO/EDIÇÃO DE BRIEFING (DESIGN SYSTEM VIVOX) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#14120E]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FAF7F2] rounded-[14px] border border-[#D8CBB8] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#14120E] text-[#FAF7F2] border-b border-[#2B261F]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C7A15F]" />
                <h3 className="font-bold text-sm">
                  {editingId ? 'Editar Briefing / Contexto' : 'Novo Briefing / Fonte Estratégica'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A89880] hover:text-[#FAF7F2] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E1A16] mb-1">
                  Título do Documento / Briefing
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  placeholder="Ex: Briefing de Posicionamento Pediátrico"
                  className="w-full h-10 px-3 rounded-lg bg-[#FFFDF8] border border-[#D8CBB8] text-xs text-[#1E1A16] focus:outline-none focus:border-[#8A6828]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1A16] mb-1">
                  Tipo de Fonte
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#FFFDF8] border border-[#D8CBB8] text-xs text-[#1E1A16] focus:outline-none focus:border-[#8A6828] cursor-pointer"
                >
                  <option value="TEXTO">📝 Anotação / Briefing em Texto</option>
                  <option value="LINK">🔗 Link Externo / Site / Artigo</option>
                  <option value="ARQUIVO">📄 Documento / Diretriz Clínica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1A16] mb-1">
                  Conteúdo / Diretrizes Estratégicas
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={5}
                  placeholder="Descreva os objetivos, diferenciais ou cole o conteúdo e link..."
                  className="w-full p-3 rounded-lg bg-[#FFFDF8] border border-[#D8CBB8] text-xs text-[#1E1A16] focus:outline-none focus:border-[#8A6828]"
                />
              </div>

              <div className="pt-3 border-t border-[#D8CBB8] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] text-xs font-bold text-[#625746] hover:bg-[#EEE7DC] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSource}
                  className="px-4 py-2 rounded-lg bg-[#14120E] text-xs font-bold text-[#C7A15F] hover:bg-[#2B261F] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {savingSource ? 'Salvando...' : 'Salvar Briefing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
