import React from 'react';
import { Video, Layers, Target, Calendar, BarChart3, Building2, Search, Zap } from 'lucide-react';

interface QuickPromptChipsProps {
  isClientMode: boolean;
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  isClientMode,
  onSelectPrompt,
  disabled,
}) => {
  const clientPrompts = [
    {
      icon: <Video className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Roteiro de Reels',
      prompt: 'Crie um roteiro dinâmico de Reels de 30s focado no público-alvo deste cliente, incluindo gancho magnético de 3s, áudio, texto na tela e CTA.',
    },
    {
      icon: <Layers className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Carrossel Didático',
      prompt: 'Estruture um carrossel de 5 slides com headline magnética, texto escaneável para cada slide, orientação visual e legenda completa com hashtags.',
    },
    {
      icon: <Target className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Copy de Anúncio',
      prompt: 'Escreva 2 variações de copy para anúncios pagos (uma usando AIDA e outra usando PAS) destacando a principal dor resolvida pelo serviço do cliente.',
    },
    {
      icon: <Calendar className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Pautas do Mês',
      prompt: 'Sugira uma grade semanal com 4 ideias estratégicas de conteúdo distribuídas pelos pilares de autoridade, conexão, educação e venda.',
    },
    {
      icon: <BarChart3 className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Resumo Estratégico',
      prompt: 'Faça um resumo do perfil deste cliente, seus serviços contratados, tendências de mercado mapeadas e recomende os próximos passos prioritários.',
    },
  ];

  const masterPrompts = [
    {
      icon: <Building2 className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Relatório Executivo Global',
      prompt: 'Gere um relatório executivo estratégico com a visão consolidada dos clientes, serviços ativos e ritmo de produção da agência.',
    },
    {
      icon: <Search className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Mapear Upsell & Oportunidades',
      prompt: 'Analise os clientes ativos e aponte oportunidades comerciais de novos serviços (ex: tráfego pago, novas LPs, SEO).',
    },
    {
      icon: <Zap className="w-3.5 h-3.5 text-[#C7A15F]" />,
      label: 'Auditoria de Produções',
      prompt: 'Faça uma auditoria nas produções em andamento e dê recomendações operacionais para acelerar as entregas do time.',
    },
  ];

  const prompts = isClientMode ? clientPrompts : masterPrompts;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-1 pt-1">
      {prompts.map((item, index) => (
        <button
          key={index}
          type="button"
          disabled={disabled}
          onClick={() => onSelectPrompt(item.prompt)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--vx-surface)] hover:bg-[var(--vx-soft)] border border-[var(--vx-line-strong)] text-[var(--vx-ink-2)] hover:text-[var(--vx-ink)] text-xs font-medium whitespace-nowrap transition-colors duration-150 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
