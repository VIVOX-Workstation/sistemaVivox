import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, History } from 'lucide-react';
import type { Cliente, ServicoContratado, StatusServico, TipoServico, Tarefa } from '../../types';
import { api } from '../../api/client';
import { tarefasApi } from '../../api/tarefas';
import { TaskFormModal } from '../gp/TaskFormModal';
import { VxDialog } from '../clean/VxDialog';
import { formatarDataBR } from '../../utils/hospedagemCalculo';
import { TODOS_SERVICOS, nomeServico } from '../../utils/clean';

// Serviços do cliente no layout clean (canvas › Perfil › Serviços).
// GET /servicos/cliente/:id, POST /servicos, PATCH /servicos/:id; tarefas para o progresso.

interface Props {
  cliente: Cliente;
}

export const SERVICOS_COM_ARQUITETURA: TipoServico[] = ['APP', 'LANDING_PAGE', 'IDENTIDADE_VISUAL'];

const STATUS_SERV: Record<string, [string, string]> = {
  ATIVO: ['Ativo', 'bd ok'],
  CONCLUIDO: ['Concluído', 'bd info'],
  PAUSADO: ['Pausado', 'bd warn'],
  CANCELADO: ['Cancelado', 'bd bad'],
};

const tipoDe = (s: ServicoContratado) => s.tipoServico || s.tipo_servico;

export function ServicesTab({ cliente }: Props) {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<ServicoContratado[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isNewModalOpen, setNewModalOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<ServicoContratado | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusServico>('ATIVO');
  const [erro, setErro] = useState('');

  // Demanda no GP criada direto do serviço
  const [selectedServiceForTask, setSelectedServiceForTask] = useState<string | null>(null);

  const [newService, setNewService] = useState({
    tipoServico: 'GERENCIAMENTO_REDES' as TipoServico,
    status: 'ATIVO' as StatusServico,
    dataContratacao: new Date().toISOString().split('T')[0],
    descricaoEscopo: '',
  });

  useEffect(() => {
    loadServicos();
    loadTarefas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id]);

  const loadServicos = async () => {
    try {
      const response = await api.get<ServicoContratado[]>(`/servicos/cliente/${cliente.id}`);
      setServicos(
        [...response.data].sort(
          (a, b) => new Date(b.dataContratacao ?? 0).getTime() - new Date(a.dataContratacao ?? 0).getTime(),
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const loadTarefas = async () => {
    try {
      setTarefas(await tarefasApi.getTarefas({ clienteId: cliente.id }));
    } catch (e) {
      console.error('Erro ao carregar tarefas do cliente:', e);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/servicos', {
        clienteId: cliente.id,
        tipoServico: newService.tipoServico,
        status: newService.status,
        dataContratacao: newService.dataContratacao
          ? new Date(newService.dataContratacao).toISOString()
          : new Date().toISOString(),
        descricaoEscopo: newService.descricaoEscopo || '',
      });
      setNewModalOpen(false);
      loadServicos();
    } catch {
      setErro('Não foi possível adicionar o serviço.');
    }
  };

  const handleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServico) return;
    setErro('');
    try {
      await api.patch(`/servicos/${selectedServico.id}`, { status: novoStatus });
      setSelectedServico(null);
      loadServicos();
    } catch {
      setErro('Não foi possível atualizar o serviço.');
    }
  };

  const abrirPlanejamento = (s: ServicoContratado) =>
    navigate(`/cliente/${cliente.id}/servicos/${s.id}/${tipoDe(s) === 'APP' ? 'devboard' : 'planejamento'}`);

  const contratar = (tipo?: TipoServico) => {
    setErro('');
    setNewService({
      tipoServico: tipo || 'GERENCIAMENTO_REDES',
      status: 'ATIVO',
      dataContratacao: new Date().toISOString().split('T')[0],
      descricaoEscopo: '',
    });
    setNewModalOpen(true);
  };

  const tiposContratados = new Set(servicos.map(tipoDe));
  const disponiveis = TODOS_SERVICOS.filter((t) => !tiposContratados.has(t.tipo));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="sec-t">
        <h2>Serviços contratados</h2>
        <button className="btn sec sm" type="button" onClick={() => contratar()}>
          <Plus className="i" aria-hidden="true" />Contratar serviço
        </button>
      </div>

      {servicos.length === 0 ? (
        <div className="card empty">
          <b>Nenhum serviço contratado ainda</b>
          <span>Contrate o primeiro serviço para liberar planejamento e tarefas.</span>
        </div>
      ) : (
        <div className="grid g3">
          {servicos.map((s) => {
            const [label, bd] = STATUS_SERV[s.status] ?? [s.status, 'bd'];
            const doServ = tarefas.filter((t) => t.servicoId === s.id);
            const feitas = doServ.filter((t) => t.status === 'CONCLUIDA').length;
            const pct = doServ.length ? Math.round((feitas / doServ.length) * 100) : 0;
            return (
              <section className="card svc" key={s.id}>
                <div className="svc-h">
                  <div>
                    <b>{nomeServico(tipoDe(s))}</b>
                    <small>
                      {s.dataContratacao ? `Desde ${formatarDataBR(s.dataContratacao)}` : 'Sem data de início'}
                      {s.descricaoEscopo ? ` · ${s.descricaoEscopo}` : ''}
                    </small>
                  </div>
                  <div className="acts" style={{ gap: 4, flex: 'none' }}>
                    <span className={bd}>{label}</span>
                    <button
                      className="ib sm"
                      type="button"
                      aria-label="Status e histórico do serviço"
                      title="Status e histórico"
                      onClick={() => {
                        setErro('');
                        setNovoStatus(s.status);
                        setSelectedServico(s);
                      }}
                    >
                      <History className="i" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="meta" style={{ justifyContent: 'space-between' }}>
                    <span>{doServ.length ? `${feitas} de ${doServ.length} entregas` : 'Nenhuma tarefa vinculada'}</span>
                    <b style={{ color: 'var(--ink)' }}>{pct}%</b>
                  </div>
                  <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="acts" style={{ flexWrap: 'wrap' }}>
                  <button className="btn sec sm" type="button" onClick={() => abrirPlanejamento(s)}>
                    {tipoDe(s) === 'APP' ? 'DevBoard' : 'Planejamento'}
                  </button>
                  <Link className="btn gh sm" to={`/gp?clienteId=${cliente.id}&servicoId=${s.id}`}>Ver tarefas</Link>
                  <button className="btn gh sm" type="button" onClick={() => setSelectedServiceForTask(s.id)}>
                    <Plus className="i" aria-hidden="true" />Tarefa
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {disponiveis.length > 0 && (
        <>
          <div className="sec-t" style={{ marginTop: 8 }}><h2>Disponíveis para contratar</h2></div>
          <div className="grid g3">
            {disponiveis.map((t) => (
              <section className="card svc disp" key={t.tipo}>
                <div className="svc-h"><div><b>{t.nome}</b><small>{t.descricao}</small></div></div>
                <button className="btn gh sm" type="button" style={{ alignSelf: 'flex-start' }} onClick={() => contratar(t.tipo)}>
                  Contratar
                </button>
              </section>
            ))}
          </div>
        </>
      )}

      <VxDialog
        open={isNewModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Contratar serviço"
        subtitle="O serviço passa a ter planejamento e tarefas no Sync."
      >
        <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fld">
            <label htmlFor="s1">Tipo de serviço</label>
            <select id="s1" className="inp" value={newService.tipoServico} onChange={(e) => setNewService({ ...newService, tipoServico: e.target.value as TipoServico })}>
              {TODOS_SERVICOS.map((t) => <option key={t.tipo} value={t.tipo}>{t.nome}</option>)}
            </select>
          </div>
          <div className="grid g2">
            <div className="fld">
              <label htmlFor="s2">Status</label>
              <select id="s2" className="inp" value={newService.status} onChange={(e) => setNewService({ ...newService, status: e.target.value as StatusServico })}>
                <option value="ATIVO">Ativo</option>
                <option value="PAUSADO">Pausado</option>
              </select>
            </div>
            <div className="fld">
              <label htmlFor="s3">Início</label>
              <input id="s3" className="inp" type="date" required value={newService.dataContratacao} onChange={(e) => setNewService({ ...newService, dataContratacao: e.target.value })} />
            </div>
          </div>
          <div className="fld">
            <label htmlFor="s4">Escopo</label>
            <textarea id="s4" className="inp" rows={3} required value={newService.descricaoEscopo} onChange={(e) => setNewService({ ...newService, descricaoEscopo: e.target.value })} placeholder="O que está incluído" />
          </div>
          {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erro}</p>}
          <div className="acts" style={{ justifyContent: 'flex-end' }}>
            <button className="btn sec" type="button" onClick={() => setNewModalOpen(false)}>Cancelar</button>
            <button className="btn pri" type="submit">Adicionar serviço</button>
          </div>
        </form>
      </VxDialog>

      <VxDialog
        open={!!selectedServico}
        onClose={() => setSelectedServico(null)}
        title={selectedServico ? nomeServico(tipoDe(selectedServico)) : ''}
        subtitle="Status do serviço e histórico de entregas."
        lg
      >
        {selectedServico && (
          <div className="grid g2" style={{ alignItems: 'start', gap: 20 }}>
            <form onSubmit={handleStatus} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="fld">
                <label htmlFor="sv-st">Status do serviço</label>
                <select id="sv-st" className="inp" value={novoStatus} onChange={(e) => setNovoStatus(e.target.value as StatusServico)}>
                  <option value="ATIVO">Ativo</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="PAUSADO">Pausado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
              {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erro}</p>}
              <button className="btn pri" type="submit" disabled={novoStatus === selectedServico.status}>Salvar status</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '50vh', overflow: 'auto' }}>
              <span className="kick" style={{ paddingBottom: 6 }}>Histórico</span>
              {!selectedServico.historico?.length ? (
                <p className="mut" style={{ fontSize: 12.5 }}>
                  Nenhum evento ainda. Tarefas concluídas no Sync aparecem aqui automaticamente.
                </p>
              ) : (
                selectedServico.historico.map((h: { id: string; acao: string; createdAt: string; usuario?: { nome: string } }) => (
                  <div className="row" key={h.id} style={{ padding: '8px 0' }}>
                    <span className="dot" style={{ background: 'var(--accent)' }} />
                    <div className="t">
                      <b style={{ whiteSpace: 'normal' }}>{h.acao}</b>
                      <small>{h.usuario?.nome || 'Equipe VIVOX'} · {new Date(h.createdAt).toLocaleString('pt-BR')}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </VxDialog>

      {selectedServiceForTask && (
        <TaskFormModal
          initialStatus="A_FAZER"
          initialClienteId={cliente.id}
          initialServicoId={selectedServiceForTask}
          onClose={() => setSelectedServiceForTask(null)}
          onTaskCreated={() => {
            loadTarefas();
            loadServicos();
          }}
        />
      )}
    </div>
  );
}
