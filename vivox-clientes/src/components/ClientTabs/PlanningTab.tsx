import React, { useState } from 'react';
import type { Cliente } from '../../types';
import { BookOpen, FileText, Link as LinkIcon, Plus, Lightbulb, MessageSquare, Target } from 'lucide-react';
import { Button } from '../Button';
import { StrategyMindMap } from '../StrategyMindMap';

interface Props {
  cliente: Cliente;
}

export function PlanningTab({ cliente }: Props) {
  return (
    <div className="h-full flex gap-6">
      
      {/* PAINEL ESQUERDO: Fontes / Briefing */}
      <div className="w-1/4 flex flex-col gap-4 border-r border-slate-200 pr-6 min-w-[280px]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Fontes & Contexto
          </h3>
          <button className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-1">
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              Briefing Inicial
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">Reunião de kickoff realizada em 10/05 detalhando o público alvo AB.</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-1">
              <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              Concorrentes mapeados
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">Lista de 3 concorrentes locais com forte presença no TikTok.</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-1">
              <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              Feedback da Reunião Q2
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">Cliente quer mudar o tom de voz para algo mais bem humorado.</p>
          </div>

        </div>
      </div>

      {/* PAINEL DIREITO: Mapa Mental Estratégico */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Mapa Mental de Estratégia
          </h3>
          <Button variant="primary" size="sm" className="gap-2">
            <Target className="w-4 h-4" />
            Salvar Mapa
          </Button>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-inner relative overflow-hidden">
          <StrategyMindMap />
        </div>
      </div>

    </div>
  );
}
