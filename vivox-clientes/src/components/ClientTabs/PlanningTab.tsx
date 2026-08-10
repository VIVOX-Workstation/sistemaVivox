import React, { useState, useEffect } from 'react';
import type { Cliente, FonteContexto } from '../../types';
import { BookOpen, FileText, Link as LinkIcon, Plus, Lightbulb, Target, Trash2, Edit2, X, Brain } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { StrategyMindMap } from '../StrategyMindMap';
import { api } from '../../api/client';
import { Modal } from '../Modal';

interface Props {
  cliente: Cliente;
}

export function PlanningTab({ cliente }: Props) {
  const [fontes, setFontes] = useState<FonteContexto[]>(cliente.fontesContexto || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiTreeData, setAiTreeData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
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
    }
  };

  const handleDelete = async (fonteId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta fonte?')) return;
    try {
      await api.delete(`/clientes/fontes/${fonteId}`);
      loadFontes();
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'LINK': return <LinkIcon className="w-4 h-4" />;
      case 'ARQUIVO': return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const handleGenerateMindmap = async () => {
    try {
      setIsGenerating(true);
      const res = await api.post(`/ia/generate-mindmap/${cliente.id}`);
      if (res.data) {
        setAiTreeData(res.data);
      }
    } catch (error) {
      console.error('Erro ao gerar mapa mental:', error);
      alert('Houve um erro ao gerar o mapa com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex gap-6">
      
      {/* PAINEL ESQUERDO: Fontes / Briefing */}
      <div className="w-1/4 flex flex-col gap-4 border-r border-slate-200 pr-6 min-w-[280px]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Fontes & Contexto
          </h3>
          <button 
            onClick={() => openModal()}
            className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {fontes.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              Nenhuma fonte ou contexto cadastrado. Clique no "+" para adicionar.
            </div>
          ) : (
            fontes.map(fonte => (
              <div key={fonte.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors group relative">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-1 pr-12">
                  <span className="text-slate-400 group-hover:text-indigo-500">{getIcon(fonte.tipo)}</span>
                  {fonte.titulo}
                </div>
                {fonte.descricao && (
                  <p className="text-xs text-slate-500 line-clamp-3">{fonte.descricao}</p>
                )}
                
                {/* Botões de Ação (Aparecem no hover) */}
                <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 rounded shadow-sm border border-slate-200">
                  <button onClick={() => openModal(fonte)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(fonte.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PAINEL DIREITO: Mapa Mental Estratégico */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Mapa Mental de Estratégia
          </h3>
          <div className="flex gap-2">
            <Button onClick={handleGenerateMindmap} disabled={isGenerating} size="sm" variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
              {isGenerating ? (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-2" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Gerar com IA
            </Button>
            <Button variant="primary" size="sm" className="gap-2">
              <Target className="w-4 h-4" />
              Salvar Mapa
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-inner relative overflow-hidden">
          <StrategyMindMap fontes={fontes} aiTreeData={aiTreeData} />
        </div>
      </div>

      {/* MODAL DE FONTE */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Fonte' : 'Nova Fonte/Contexto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <Input 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              required 
              placeholder="Ex: Briefing Inicial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select 
              className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="TEXTO">Texto / Anotação</option>
              <option value="LINK">Link / URL</option>
              <option value="ARQUIVO">Documento / Arquivo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo (Texto ou Link)</label>
            <Textarea 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              placeholder="Descreva o contexto ou cole o link..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar Fonte</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
