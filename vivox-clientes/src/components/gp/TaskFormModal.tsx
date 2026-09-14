import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { StatusTarefa, PrioridadeTarefa, Cliente, Projeto, Tarefa } from '../../types';
import { tarefasApi } from '../../api/tarefas';
import { api } from '../../api/client';
import { carregarOpcoesTarefa, type UserOption } from '../../api/opcoesTarefa';
import {
  X,
  Plus,
  Sparkles,
  Trash2,
  Loader2,
  Calendar,
  User as UserIcon,
  FolderKanban,
  Flame,
  ListChecks,
  ChevronDown
} from 'lucide-react';

import './TaskFormModal.css';

const EMPTY_WORKSPACES: Projeto[] = [];

interface TaskFormModalProps {
  initialTitle?: string;
  initialDescription?: string;
  initialChecklist?: string[];
  initialStatus?: StatusTarefa;
  initialWorkspaceId?: string | null;
  initialClienteId?: string | null;
  initialServicoId?: string | null;
  workspaces?: Projeto[];
  onClose: () => void;
  onTaskCreated: (tarefa: Tarefa) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  initialTitle = '',
  initialDescription = '',
  initialChecklist = [],
  initialStatus = 'A_FAZER',
  initialWorkspaceId = null,
  initialClienteId = null,
  initialServicoId = null,
  workspaces = EMPTY_WORKSPACES,
  onClose,
  onTaskCreated,
}) => {
  const [detalhado, setDetalhado] = useState(false);
  const [mostrarChecklist, setMostrarChecklist] = useState(initialChecklist.length > 0);
  const [mostrarProjeto, setMostrarProjeto] = useState(false);
  const [erro, setErro] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const [titulo, setTitulo] = useState(initialTitle);
  const [descricao, setDescricao] = useState(initialDescription);
  const [status, setStatus] = useState<StatusTarefa>(initialStatus);
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('MEDIA');
  const [projetoId, setProjetoId] = useState<string>(initialWorkspaceId || '');
  const [responsavelId, setResponsavelId] = useState('');
  const [clienteId, setClienteId] = useState(initialClienteId || '');
  const [servicoId, setServicoId] = useState(initialServicoId || '');
  const [prazo, setPrazo] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [checklist, setChecklist] = useState<string[]>(initialChecklist);
  const [novoItem, setNovoItem] = useState('');

  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicosCliente, setServicosCliente] = useState<any[]>([]);
  const [listaWorkspaces, setListaWorkspaces] = useState<Projeto[]>(workspaces);
  const [loading, setLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !submittingRef.current) {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== 'Tab') return;
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
    );
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };

  const carregarServicos = async (cId: string) => {
    if (!cId) {
      setServicosCliente([]);
      return;
    }
    try {
      const res = await api.get(`/servicos/cliente/${cId}`);
      setServicosCliente(res.data || []);
    } catch {
      setServicosCliente([]);
    }
  };

  useEffect(() => {
    if (initialClienteId) {
      carregarServicos(initialClienteId);
    }
  }, [initialClienteId]);

  useEffect(() => {
    const carregarDependencias = async () => {
      try {
        const opcoes = await carregarOpcoesTarefa();
        const wsRes = workspaces.length > 0 ? workspaces : opcoes.workspaces;
        setUsuarios(opcoes.usuarios);
        setClientes(opcoes.clientes);
        setListaWorkspaces(wsRes);

        // Se houver initialClienteId e existir um workspace para este cliente, pré-seleciona
        if (initialClienteId && !initialWorkspaceId && wsRes) {
          const wsDoCliente = wsRes.find((w: any) => w.clienteId === initialClienteId);
          if (wsDoCliente) {
            setProjetoId(wsDoCliente.id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar usuários/clientes/workspaces:', err);
      }
    };

    carregarDependencias();
  }, [initialClienteId, initialWorkspaceId, workspaces]);

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItem.trim()) return;
    setChecklist([...checklist, novoItem.trim()]);
    setNovoItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleGerarChecklistIa = async () => {
    if (!titulo.trim()) {
      alert('Preencha o título da tarefa primeiro para que a IA possa gerar o checklist adequado.');
      return;
    }
    setLoadingAi(true);
    try {
      const sugestoes = await tarefasApi.gerarChecklistIa({
        titulo,
        descricao,
        clienteId: clienteId || undefined,
      });
      setChecklist(sugestoes);
    } catch (err) {
      console.error('Erro ao gerar checklist via IA:', err);
      setErro('Não foi possível gerar o checklist. Tente novamente.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || submittingRef.current || loadingAi) return;

    submittingRef.current = true;
    setErro('');
    setLoading(true);
    try {
      const criada = await tarefasApi.createTarefa({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        status,
        prioridade,
        projetoId: projetoId || undefined,
        responsavelId: responsavelId || undefined,
        clienteId: clienteId || undefined,
        servicoId: servicoId || undefined,
        prazo: prazo ? new Date(prazo).toISOString() : undefined,
        horasEstimadas: horasEstimadas ? Number(horasEstimadas) : undefined,
        checklist: checklist.length > 0 ? checklist : undefined,
      });

      onTaskCreated(criada);
      onClose();
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      setErro('Não foi possível criar a tarefa. Seus dados foram mantidos; tente novamente.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return createPortal(
    <div className="task-create-overlay">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Criar tarefa" className="task-create-dialog" onKeyDown={handleDialogKeyDown}>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={loading} className="task-create-fields">
            <div className="task-create-heading">
              <input aria-label="Nome da tarefa" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome da tarefa" className="task-create-title" />
              <button type="button" className={`task-create-icon ${prioridade === 'URGENTE' ? 'is-urgent' : ''}`} aria-label="Marcar como urgente" aria-pressed={prioridade === 'URGENTE'} title="Marcar como urgente" onClick={() => setPrioridade(prioridade === 'URGENTE' ? 'MEDIA' : 'URGENTE')}><Flame size={18} /></button>
              <button type="button" className="task-create-icon" aria-label="Fechar" onClick={onClose}><X size={19} /></button>
            </div>

            <textarea aria-label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" rows={2} className="task-create-description" />

            <div className="task-create-row">
              <label htmlFor="create-responsavel">Responsável</label>
              <div className="task-create-inline-control"><UserIcon size={16} />
                <select id="create-responsavel" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                  <option value="">Não atribuído</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="task-create-row">
              <label htmlFor="create-prazo">Prazo</label>
              <div className="task-create-inline-control"><Calendar size={16} />
                <input id="create-prazo" type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
              </div>
            </div>

            <div className="task-create-tools">
              <button type="button" aria-expanded={mostrarChecklist || detalhado} aria-controls="create-checklist" onClick={() => setMostrarChecklist(!mostrarChecklist)} disabled={detalhado}><ListChecks size={15} />Checklist{checklist.length > 0 && <span>{checklist.length}</span>}</button>
              <button type="button" aria-expanded={mostrarProjeto || detalhado} aria-controls="create-project" onClick={() => setMostrarProjeto(!mostrarProjeto)} disabled={detalhado}><FolderKanban size={15} /><span className="task-create-project-name">{listaWorkspaces.find((ws) => ws.id === projetoId)?.nome || 'Projeto'}</span><ChevronDown size={13} /></button>
            </div>

            {(mostrarProjeto || detalhado) && (
              <div id="create-project" className="task-create-extra">
                <label htmlFor="create-workspace">Projeto / Workspace</label>
                <select id="create-workspace" value={projetoId} onChange={(e) => setProjetoId(e.target.value)}>
                  <option value="">Workspace geral</option>
                  {listaWorkspaces.map((ws) => <option key={ws.id} value={ws.id}>{ws.nome}</option>)}
                </select>
              </div>
            )}

            {detalhado && (
              <div id="create-details" className="task-create-extra task-create-grid">
                <div><label htmlFor="create-status">Status inicial</label>
                  <select id="create-status" value={status} onChange={(e) => setStatus(e.target.value as StatusTarefa)}>
                    <option value="BACKLOG">Backlog</option><option value="A_FAZER">A fazer</option><option value="EM_ANDAMENTO">Em andamento</option><option value="EM_REVISAO">Em revisão</option><option value="CONCLUIDA">Concluída</option>
                  </select>
                </div>
                <div><label htmlFor="create-prioridade">Prioridade</label>
                  <select id="create-prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value as PrioridadeTarefa)}>
                    <option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option>
                  </select>
                </div>
                <div><label htmlFor="create-cliente">Cliente</label>
                  <select id="create-cliente" value={clienteId} onChange={(e) => { setClienteId(e.target.value); setServicoId(''); carregarServicos(e.target.value); }}>
                    <option value="">Nenhum cliente</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
                  </select>
                </div>
                <div><label htmlFor="create-horas">Horas estimadas</label>
                  <input id="create-horas" type="number" min="0" step="0.5" value={horasEstimadas} onChange={(e) => setHorasEstimadas(e.target.value)} placeholder="Ex.: 2" />
                </div>
                {clienteId && <div className="task-create-full"><label htmlFor="create-servico">Serviço contratado</label>
                  <select id="create-servico" value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
                    <option value="">Nenhum (demanda avulsa)</option>
                    {servicosCliente.map((srv) => <option key={srv.id} value={srv.id}>{srv.tipoServico?.replace(/_/g, ' ')} ({srv.status})</option>)}
                  </select>
                </div>}
              </div>
            )}

            {(mostrarChecklist || detalhado) && (
              <div id="create-checklist" className="task-create-extra">
                <div className="task-create-checklist-heading">
                  <label htmlFor="create-item">Checklist</label>
                  <button type="button" onClick={handleGerarChecklistIa} disabled={loadingAi || !titulo.trim()}>{loadingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}Gerar com IA</button>
                </div>
                <ul className="task-create-checklist">
                  {checklist.map((item, idx) => <li key={idx}><ListChecks size={14} /><span>{item}</span><button type="button" aria-label={`Remover item: ${item}`} onClick={() => handleRemoveChecklistItem(idx)}><Trash2 size={14} /></button></li>)}
                </ul>
                <div className="task-create-add-item">
                  <input id="create-item" value={novoItem} onChange={(e) => setNovoItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { handleAddChecklistItem(e); } }} placeholder="Adicionar um item…" />
                  <button type="button" aria-label="Adicionar item" disabled={!novoItem.trim()} onClick={handleAddChecklistItem}><Plus size={18} /></button>
                </div>
              </div>
            )}
          </fieldset>

          {erro && <p role="alert" className="task-create-error">{erro}</p>}
          <div className="task-create-footer">
            <button type="submit" className="task-create-primary" disabled={loading || loadingAi || !titulo.trim()}>{loading && <Loader2 size={16} className="animate-spin" />}{loading ? 'Criando…' : 'Criar tarefa'}</button>
            <button type="button" disabled={loading} onClick={onClose}>Cancelar</button>
            <button type="button" disabled={loading} className="task-create-details-toggle" aria-expanded={detalhado} aria-controls="create-details" onClick={() => setDetalhado(!detalhado)}>{detalhado ? 'Formulário simples' : 'Formulário detalhado'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
