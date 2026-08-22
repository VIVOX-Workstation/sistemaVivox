import React, { useState } from 'react';
import {
  Sparkles,
  Video,
  Layers,
  Target,
  Calendar,
  Copy,
  Check,
  PlusCircle,
  Wand2,
  RefreshCw,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { api } from '../../api/client';
import type { Cliente } from '../../types';

interface AiContentStudioTabProps {
  cliente: Cliente;
}

type ContentType = 'REELS' | 'CAROUSEL' | 'COPY_ADS' | 'CALENDAR';

export const AiContentStudioTab: React.FC<AiContentStudioTabProps> = ({ cliente }) => {
  const [tipo, setTipo] = useState<ContentType>('REELS');
  const [tema, setTema] = useState('');
  const [objetivo, setObjetivo] = useState('Engajamento e Atração de Clientes');
  const [formatoEspecifico, setFormatoEspecifico] = useState('Roteiro dinâmico de 30s a 45s');
  const [instrucoesExtras, setInstrucoesExtras] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedKanban, setIsSavedKanban] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatOptions = [
    {
      id: 'REELS' as ContentType,
      title: 'Roteiro de Reels / Shorts',
      icon: <Video className="w-4 h-4 text-[#C7A15F]" />,
      desc: 'Gancho de 3s, áudio, texto em tela e CTA persuasivo',
      defaultFormato: 'Roteiro dinâmico de 30s a 45s',
      defaultObjetivo: 'Atração de novos seguidores e autoridade',
    },
    {
      id: 'CAROUSEL' as ContentType,
      title: 'Carrossel do Instagram',
      icon: <Layers className="w-4 h-4 text-[#C7A15F]" />,
      desc: 'Slide a slide com capa magnética e legenda com hashtags',
      defaultFormato: 'Carrossel de 5 a 6 slides educativos',
      defaultObjetivo: 'Salvamentos, compartilhamentos e educação',
    },
    {
      id: 'COPY_ADS' as ContentType,
      title: 'Copy para Anúncios (Ads)',
      icon: <Target className="w-4 h-4 text-[#C7A15F]" />,
      desc: 'Frameworks AIDA e PAS para Meta Ads e Google Ads',
      defaultFormato: 'Variações para criativo estático e vídeo',
      defaultObjetivo: 'Captação de leads e conversão direta',
    },
    {
      id: 'CALENDAR' as ContentType,
      title: 'Grade Semanal de Pautas',
      icon: <Calendar className="w-4 h-4 text-[#C7A15F]" />,
      desc: '4 a 6 ideias estratégicas divididas por pilares de conteúdo',
      defaultFormato: 'Planejamento semanal multiformato',
      defaultObjetivo: 'Constância e autoridade no nicho',
    },
  ];

  const handleSelectType = (selectedType: ContentType) => {
    setTipo(selectedType);
    const option = formatOptions.find((o) => o.id === selectedType);
    if (option) {
      setFormatoEspecifico(option.defaultFormato);
      setObjetivo(option.defaultObjetivo);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setIsSavedKanban(false);

    try {
      const response = await api.post('/ia/marketing/generate', {
        clienteId: cliente.id,
        tipo,
        tema: tema.trim(),
        objetivo,
        formatoEspecifico,
        instrucoesExtras: instrucoesExtras.trim() || undefined,
      });

      setGeneratedContent(response.data.conteudoGerado);
    } catch (err: any) {
      console.error('Erro ao gerar conteúdo:', err);
      setErrorMsg(err.response?.data?.message || 'Falha ao conectar com o serviço de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendToKanban = async () => {
    if (!generatedContent) return;
    try {
      setIsSavedKanban(true);
      await api.post('/ia/productions/create-from-ai', {
        clienteId: cliente.id,
        tipo: tipo === 'REELS' ? 'VIDEO' : 'POST',
      });
    } catch (err) {
      console.error('Erro ao criar no Kanban:', err);
      setIsSavedKanban(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14120E] border border-[#2B261F] p-6 rounded-[11px] text-[#F6F0E7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#24201A] border border-[#4A4032] flex items-center justify-center text-[#C7A15F] shadow-xs shrink-0">
            <Wand2 className="w-6 h-6 text-[#C7A15F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#F6F0E7] tracking-tight">
                Estúdio de Criação de Marketing (IA)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#24201A] text-[#C7A15F] border border-[#3E3529]">
                Especialista: {cliente.nomeFantasia}
              </span>
            </div>
            <p className="text-xs text-[#8F8271] mt-0.5">
              Gere roteiros, carrosséis, anúncios e calendários estratégicos treinados no DNA e no nicho da marca.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#B9AEA0] bg-[#1E1B15] px-3.5 py-2 rounded-lg border border-[#2F2920]">
          <Lightbulb className="w-4 h-4 text-[#C7A15F]" />
          <span>Direto para o Kanban com 1 clique</span>
        </div>
      </div>

      {/* Grid: Configuração + Resultado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Configuração do Conteúdo */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FFFDF8] border border-[#D8CBB8] p-5 rounded-[11px] shadow-xs space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#625746] block mb-2">
                1. Escolha o Formato
              </label>
              <div className="grid grid-cols-2 gap-2">
                {formatOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectType(opt.id)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between gap-1 cursor-pointer ${
                      tipo === opt.id
                        ? 'bg-[#24201A] border-[#C7A15F] text-[#F6F0E7] shadow-xs'
                        : 'bg-[#FAF7F2] border-[#E2D7C7] hover:border-[#C7A15F]/60 text-[#1E1A16]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1 rounded bg-[#14120E] border border-[#3A3327]">{opt.icon}</div>
                      {tipo === opt.id && <span className="w-2 h-2 rounded-full bg-[#C7A15F]"></span>}
                    </div>
                    <div>
                      <div className="text-xs font-bold mt-1.5 leading-tight">{opt.title}</div>
                      <div
                        className={`text-[10px] mt-0.5 line-clamp-2 ${
                          tipo === opt.id ? 'text-[#8F8271]' : 'text-[#847663]'
                        }`}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário de Parâmetros */}
            <form onSubmit={handleGenerate} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#1E1A16] block mb-1">
                  2. Tema ou Assunto Principal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex: Como evitar erros fiscais na abertura de empresa"
                  className="w-full bg-[#FAF7F2] border border-[#D8CBB8] rounded-lg px-3.5 py-2 text-xs text-[#1E1A16] placeholder:text-[#847663] focus:outline-none focus:border-[#B89455] focus:ring-1 focus:ring-[#B89455]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1E1A16] block mb-1">
                    Objetivo Estratégico
                  </label>
                  <input
                    type="text"
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    placeholder="Ex: Captação de Leads"
                    className="w-full bg-[#FAF7F2] border border-[#D8CBB8] rounded-lg px-3 py-1.5 text-xs text-[#1E1A16] placeholder:text-[#847663] focus:outline-none focus:border-[#B89455]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#1E1A16] block mb-1">
                    Especificação de Formato
                  </label>
                  <input
                    type="text"
                    value={formatoEspecifico}
                    onChange={(e) => setFormatoEspecifico(e.target.value)}
                    placeholder="Ex: Roteiro 30s ou 5 slides"
                    className="w-full bg-[#FAF7F2] border border-[#D8CBB8] rounded-lg px-3 py-1.5 text-xs text-[#1E1A16] placeholder:text-[#847663] focus:outline-none focus:border-[#B89455]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1E1A16] block mb-1">
                  Instruções Extras / Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={instrucoesExtras}
                  onChange={(e) => setInstrucoesExtras(e.target.value)}
                  placeholder="Ex: Focar em tom descontraído; citar a promoção de aniversário..."
                  className="w-full bg-[#FAF7F2] border border-[#D8CBB8] rounded-lg p-2.5 text-xs text-[#1E1A16] placeholder:text-[#847663] focus:outline-none focus:border-[#B89455] resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !tema.trim()}
                className="w-full py-2.5 px-4 bg-[#B89455] hover:bg-[#9E7A3F] disabled:opacity-50 disabled:cursor-not-allowed text-[#1D160B] font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Criando com o cérebro da marca...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Conteúdo com Especialista IA</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Painel Direito: Conteúdo Gerado / Preview */}
        <div className="lg:col-span-7">
          <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-[11px] shadow-xs overflow-hidden flex flex-col min-h-[480px]">
            {/* Header do Card de Resultado */}
            <div className="p-4 border-b border-[#D8CBB8] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8A6828]" />
                <span className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                  Material Gerado
                </span>
              </div>

              {generatedContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#FFFDF8] hover:bg-[#EEE7DC] border border-[#D8CBB8] text-xs font-medium text-[#1E1A16] transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#847663]" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSendToKanban}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    {isSavedKanban ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Enviado ao Kanban!</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Enviar para Produção</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Conteúdo Gerado */}
            <div className="p-6 flex-1 flex flex-col justify-center">
              {isLoading ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-10 h-10 border-3 border-[#B89455] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-[#1E1A16]">
                    O Agente Especialista está redigindo o conteúdo...
                  </p>
                  <p className="text-[11px] text-[#847663]">
                    Aplicando diretrizes de marca, ganchos de conversão e tom de voz.
                  </p>
                </div>
              ) : generatedContent ? (
                <div className="text-xs text-[#1E1A16] leading-relaxed whitespace-pre-wrap font-sans bg-[#FAF7F2] p-5 rounded-lg border border-[#E2D7C7]">
                  {generatedContent}
                </div>
              ) : (
                <div className="text-center py-16 text-[#847663] space-y-2">
                  <Wand2 className="w-8 h-8 text-[#C7A15F] mx-auto opacity-75" />
                  <p className="text-xs font-semibold text-[#1E1A16]">Nenhum conteúdo gerado ainda.</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Selecione o formato ao lado, digite o tema desejado e clique em "Gerar Conteúdo com Especialista IA".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
