import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, CheckCircle2, User, Plus, History as HistoryIcon, Target, FileText, X, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { GanttChart } from '../components/GanttChart';
import type { GanttTask } from '../components/GanttChart';
import { DependencyFlow } from '../components/DependencyFlow';

// Types
type StatusPlanejamento = 'BRIEFING' | 'PLANEJAMENTO' | 'EM_PRODUCAO' | 'EM_REVISAO' | 'CONCLUIDO';
type StatusEscopoItem = 'PLANEJADO' | 'EM_DESENVOLVIMENTO' | 'CONCLUIDO';
type StatusMarco = 'PENDENTE' | 'CONCLUIDO' | 'ATRASADO';

interface EscopoItem { id: string; titulo: string; descricao?: string; status: StatusEscopoItem; ordem: number; }
interface Marco { id: string; titulo: string; dataInicio?: string; dataPrevista: string; dataRealizada?: string; status: StatusMarco; dependeDeId?: string; }
interface Referencia { id: string; tipo: string; urlOuArquivo: string; descricao?: string; }
interface Historico { id: string; tipoEvento: string; descricao: string; data: string; autor: { id: string, nome: string } }
interface UserSummary { id: string; nome: string; email: string; }

interface Planejamento {
  id: string;
  servicoContratadoId: string;
  ideiaBriefing?: string;
  statusGeral: StatusPlanejamento;
  prazoEntrega?: string;
  responsaveis: UserSummary[];
  escopoItens: EscopoItem[];
  marcos: Marco[];
  referencias: Referencia[];
  historico: Historico[];
  servicoContratado: {
    tipoServico: string;
    status: string;
    cliente: { id: string, nomeFantasia: string };
  };
  flowNodes?: any;
  flowEdges?: any;
}

export function PlanejamentoServico() {
  const { id, servicoId } = useParams();
  const navigate = useNavigate();
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const creatingRef = useRef(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [viewMode, setViewMode] = useState<'gantt' | 'flow'>('gantt');

  const loadPlanejamento = async () => {
    try {
      if (!planejamento) setLoading(true);
      const { data } = await api.get(`/planejamento-servico/servico/${servicoId}`);
      if (data) {
        setPlanejamento(data);
      } else {
        // Se não existe, cria um em branco
        if (!creatingRef.current) {
          await createPlanejamento();
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404 || !planejamento) {
        if (!creatingRef.current) {
          await createPlanejamento();
        }
      } else {
        setError('Erro ao carregar planejamento');
      }
    } finally {
      setLoading(false);
    }
  };

  const createPlanejamento = async () => {
    creatingRef.current = true;
    try {
      await api.post('/planejamento-servico', {
        servicoContratadoId: servicoId,
        statusGeral: 'BRIEFING'
      });
      // Recarrega pra pegar com os includes todos formatados
      const res = await api.get(`/planejamento-servico/servico/${servicoId}`);
      setPlanejamento(res.data);
    } catch (err) {
      // Caso já tenha sido criado em paralelo (StrictMode / Race condition)
      try {
        const fallbackRes = await api.get(`/planejamento-servico/servico/${servicoId}`);
        if (fallbackRes.data) {
          setPlanejamento(fallbackRes.data);
          setError('');
          return;
        }
      } catch (_) {}
      
      setError('Erro ao inicializar planejamento');
    } finally {
      creatingRef.current = false;
    }
  };

  useEffect(() => {
    if (servicoId) {
      loadPlanejamento();
    }
  }, [servicoId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando planejamento...</div>;
  if (error || !planejamento) return <div className="p-8 text-center text-red-500">{error || 'Erro'}</div>;

  const { servicoContratado } = planejamento;

  const updateStatus = async (status: string) => {
    try {
      await api.patch(`/planejamento-servico/${planejamento.id}`, { statusGeral: status });
      loadPlanejamento();
    } catch (err) {
      alert('Erro ao atualizar status do planejamento');
    }
  };

  // --- GANTT ACTIONS ---

  const handleUpdateMarco = async (taskId: string, updates: Partial<GanttTask>) => {
    // Atualização otimista
    setPlanejamento(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        marcos: prev.marcos.map(m => m.id === taskId ? { ...m, ...updates } : m)
      };
    });

    try {
      await api.patch(`/planejamento-servico/marcos/${taskId}`, updates);
      // Não precisa recarregar se for só arrastar, mas recarregamos pra garantir o histórico
      loadPlanejamento();
    } catch (err) {
      alert('Erro ao atualizar tarefa');
      loadPlanejamento();
    }
  };

  const handleSaveModal = async () => {
    if (!editingTask) return;
    await handleUpdateMarco(editingTask.id, {
      titulo: editingTask.titulo,
      dependeDeId: editingTask.dependeDeId,
      status: editingTask.status,
    });
    setEditingTask(null);
  };

  const handleDeleteMarco = async (taskId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    // Atualização otimista
    setPlanejamento(prev => {
      if (!prev) return prev;
      return { ...prev, marcos: prev.marcos.filter(m => m.id !== taskId) };
    });

    try {
      await api.delete(`/planejamento-servico/marcos/${taskId}`);
      loadPlanejamento();
    } catch (err) {
      alert('Erro ao excluir tarefa');
      loadPlanejamento();
    }
  };

  // --- ESCOPO ACTIONS ---
  const updateBriefing = async (text: string) => {
    try {
      await api.patch(`/planejamento-servico/${planejamento.id}`, { ideiaBriefing: text });
      loadPlanejamento();
    } catch (e) {
      alert('Erro ao atualizar briefing');
    }
  };

  const handleAddNota = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const descricao = formData.get('descricao') as string;
    if (!descricao) return;
    
    try {
      await api.post(`/planejamento-servico/${planejamento.id}/notas`, { descricao });
      e.currentTarget.reset();
      loadPlanejamento();
    } catch (err) {
      alert('Erro ao adicionar nota');
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: StatusEscopoItem) => {
    // Optimistic UI update
    setPlanejamento(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        escopoItens: prev.escopoItens.map(i => i.id === itemId ? { ...i, status: newStatus } : i)
      };
    });

    try {
      await api.patch(`/planejamento-servico/escopo/${itemId}`, { status: newStatus });
      loadPlanejamento(); // Recarrega para buscar o histórico gerado
    } catch (err) {
      alert('Erro ao atualizar status do item');
      loadPlanejamento(); // Rollback
    }
  };

  const handleAddEscopoItem = async (status: StatusEscopoItem) => {
    const titulo = prompt('Título do novo item:');
    if (!titulo) return;

    try {
      await api.post(`/planejamento-servico/${planejamento.id}/escopo`, { titulo, status, ordem: 99 });
      loadPlanejamento();
    } catch (err) {
      alert('Erro ao adicionar item de escopo');
    }
  };

  const handleAddMarco = async () => {
    const titulo = prompt('Nome da Tarefa/Marco:');
    if (!titulo) return;

    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      await api.post(`/planejamento-servico/${planejamento.id}/marcos`, { 
        titulo, 
        dataInicio: today.toISOString(),
        dataPrevista: nextWeek.toISOString(), 
      });
      loadPlanejamento();
    } catch (err) {
      alert('Erro ao adicionar tarefa');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-2 shrink-0 mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {servicoContratado.cliente.nomeFantasia}
                </h1>
                <span className="text-slate-300">•</span>
                <span className="text-xl text-slate-600 font-medium">
                  {servicoContratado.tipoServico.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Prazo: {planejamento.prazoEntrega ? new Date(planejamento.prazoEntrega).toLocaleDateString() : 'Não definido'}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {planejamento.responsaveis.length > 0 ? planejamento.responsaveis.map(r => r.nome).join(', ') : 'Sem responsável'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fase Atual</label>
            <select 
              className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 shadow-sm"
              value={planejamento.statusGeral}
              onChange={(e) => updateStatus(e.target.value)}
            >
              <option value="BRIEFING">📝 Briefing</option>
              <option value="PLANEJAMENTO">🧩 Planejamento</option>
              <option value="EM_PRODUCAO">⚡ Em Produção</option>
              <option value="EM_REVISAO">👀 Em Revisão</option>
              <option value="CONCLUIDO">✅ Concluído</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA (Maior) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* IDEIA / BRIEFING */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-indigo-500" />
              Ideia & Briefing
            </h3>
            <Textarea 
              className="w-full min-h-[120px] bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 resize-none transition-colors"
              placeholder="Descreva o conceito, objetivos, público-alvo e restrições..."
              defaultValue={planejamento.ideiaBriefing || ''}
              onBlur={(e) => updateBriefing(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-2">Salva automaticamente ao clicar fora do campo.</p>
          </div>

          {/* ESCOPO */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Escopo de Entregas
              </h3>
              <Button size="sm" variant="outline" onClick={() => handleAddEscopoItem('PLANEJADO')}><Plus className="w-4 h-4 mr-1" /> Novo Item</Button>
            </div>
            
            <div className="space-y-3">
              {planejamento.escopoItens.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Nenhum item de escopo definido. Adicione funcionalidades, telas ou peças gráficas.
                </div>
              ) : (
                planejamento.escopoItens.map(item => (
                  <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <select 
                      className="mt-0.5 text-sm rounded border-slate-300 text-slate-700 bg-white cursor-pointer py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as StatusEscopoItem)}
                    >
                      <option value="PLANEJADO">Planejado</option>
                      <option value="EM_DESENVOLVIMENTO">Em Desenv.</option>
                      <option value="CONCLUIDO">Concluído</option>
                    </select>
                    <div className="flex-1">
                      <p className={`font-medium ${item.status === 'CONCLUIDO' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {item.titulo}
                      </p>
                      {item.descricao && <p className="text-sm text-slate-500 mt-1">{item.descricao}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">
          
          {/* HISTÓRICO */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[600px]">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-6">
              <HistoryIcon className="w-5 h-5 text-slate-400" />
              Histórico
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar mb-4">
              {planejamento.historico.map(evento => (
                <div key={evento.id} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-700">{evento.autor?.nome || 'Sistema'}</span>
                    <span className="text-xs text-slate-400">{new Date(evento.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 inline-block w-full">
                    {evento.descricao}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNota} className="pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <Input 
                  name="descricao"
                  placeholder="Adicionar nota manual..." 
                  className="flex-1 bg-slate-50"
                  required
                />
                <Button type="submit">Enviar</Button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* CRONOGRAMA GANTT / FLUXO (Largura Total) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Planejamento Temporal
            </h3>
            
            {/* TOGGLE GANTT/FLOW */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'gantt' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Gantt
              </button>
              <button
                onClick={() => setViewMode('flow')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'flow' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Fluxograma
              </button>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleAddMarco}><Plus className="w-4 h-4 mr-1" /> Nova Tarefa</Button>
        </div>
        
        {viewMode === 'gantt' ? (
          <GanttChart 
            tasks={planejamento.marcos} 
            onUpdateTask={handleUpdateMarco}
            onEditTask={(task) => setEditingTask(task)}
            onDeleteTask={handleDeleteMarco}
          />
        ) : (
          <DependencyFlow 
            planejamentoId={planejamento.id}
            initialNodes={planejamento.flowNodes} 
            initialEdges={planejamento.flowEdges}
            onSave={async (nodes, edges) => {
              try {
                await api.patch(`/planejamento-servico/${planejamento.id}`, {
                  flowNodes: nodes,
                  flowEdges: edges
                });
                alert('Fluxograma salvo com sucesso!');
              } catch (e) {
                alert('Erro ao salvar fluxograma');
              }
            }}
          />
        )}
      </div>

      {/* MODAL DE EDIÇÃO DA TAREFA DO GANTT */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Editar Tarefa</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título da Tarefa</label>
                <Input 
                  value={editingTask.titulo} 
                  onChange={e => setEditingTask({...editingTask, titulo: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingTask.status}
                  onChange={e => setEditingTask({...editingTask, status: e.target.value as StatusMarco})}
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="ATRASADO">Atrasado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Predecessora (Depende de)</label>
                <select 
                  className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingTask.dependeDeId || ''}
                  onChange={e => setEditingTask({...editingTask, dependeDeId: e.target.value || undefined})}
                >
                  <option value="">Nenhuma (Início Imediato)</option>
                  {planejamento.marcos.filter(m => m.id !== editingTask.id).map(m => (
                    <option key={m.id} value={m.id}>{m.titulo}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Essa tarefa só pode começar quando a predecessora terminar.</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                onClick={() => {
                  const id = editingTask.id;
                  setEditingTask(null);
                  setTimeout(() => handleDeleteMarco(id), 10); // Aguarda fechar o modal para dar o alert
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setEditingTask(null)}>Cancelar</Button>
                <Button onClick={handleSaveModal}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
