import { Fragment, useState, useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy, Check, Eye, EyeOff, Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { Cliente, ServicoContratado, Tarefa, AtivoHospedagem, Contato } from '../../types';
import type { Chamado } from '../../api/chamados';
import { api } from '../../api/client';
import { chamadosApi } from '../../api/chamados';
import { calcularDiasRestantes, formatarDataBR } from '../../utils/hospedagemCalculo';
import { nomeServico } from '../../utils/clean';

// Visão geral do cliente no layout clean (canvas › Perfil › Visão geral).
// Serviços, tarefas, chamados e hospedagens vêm das APIs do próprio cliente.

interface Props {
  cliente: Cliente;
  onChange: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
  onEditClient?: () => void;
  onOpenChamado?: () => void;
  onManageContatos?: () => void;
  onEditContato?: (c: Contato) => void;
  onRemoveContato?: (id: string) => void;
}

const ETAPA: Record<string, [string, string]> = {
  BACKLOG: ['Backlog', '#7A7A80'],
  A_FAZER: ['A fazer', '#7A7A80'],
  EM_ANDAMENTO: ['Em andamento', '#C88700'],
  EM_REVISAO: ['Em revisão', '#1B79E3'],
  CONCLUIDA: ['Concluída', '#0E9F4F'],
};

function diasHospedagem(h: AtivoHospedagem): number | null {
  if (typeof h.menorDias === 'number') return h.menorDias;
  const v = typeof h.diasParaVps === 'number' ? h.diasParaVps : calcularDiasRestantes(h.dataRenovacaoVps);
  const d = typeof h.diasParaDominio === 'number' ? h.diasParaDominio : calcularDiasRestantes(h.dataExpiracaoDominio);
  if (v === null) return d;
  if (d === null) return v;
  return Math.min(v, d);
}

const iniciais = (nome: string) =>
  nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export function OverviewTab({
  cliente,
  onChange,
  onNavigateTab,
  onEditClient,
  onOpenChamado,
  onManageContatos,
  onEditContato,
  onRemoveContato,
}: Props) {
  const [servicos, setServicos] = useState<ServicoContratado[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [hospedagens, setHospedagens] = useState<AtivoHospedagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [obsSalva, setObsSalva] = useState(false);

  useEffect(() => {
    setObservacoes(cliente.observacoes || '');
  }, [cliente.observacoes]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      setLoading(true);
      const [rS, rT, rC, rH] = await Promise.allSettled([
        api.get<ServicoContratado[]>(`/servicos/cliente/${cliente.id}`),
        api.get<Tarefa[]>('/tarefas', { params: { clienteId: cliente.id } }),
        chamadosApi.getChamados({ clienteId: cliente.id }),
        api.get<AtivoHospedagem[]>(`/hospedagens/cliente/${cliente.id}`),
      ]);
      if (!vivo) return;
      if (rS.status === 'fulfilled') setServicos(rS.value.data || []);
      if (rT.status === 'fulfilled') setTarefas(rT.value.data || []);
      if (rC.status === 'fulfilled') setChamados(rC.value || []);
      if (rH.status === 'fulfilled') setHospedagens(rH.value.data || []);
      setLoading(false);
    })();
    return () => {
      vivo = false;
    };
  }, [cliente.id]);

  const salvarObservacoes = async () => {
    setSalvandoObs(true);
    try {
      await api.patch(`/clientes/${cliente.id}`, { observacoes });
      onChange(cliente.id);
      setObsSalva(true);
      setTimeout(() => setObsSalva(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoObs(false);
    }
  };

  const copiar = (texto: string, campo: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(campo);
    setTimeout(() => setCopiado(null), 2000);
  };

  const ativos = servicos.filter((s) => s.status === 'ATIVO');
  const abertas = useMemo(() => tarefas.filter((t) => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA'), [tarefas]);
  const atrasadas = abertas.filter((t) => {
    const d = t.prazo ? calcularDiasRestantes(t.prazo) : null;
    return d !== null && d < 0;
  });
  const chamadosAbertos = chamados.filter((c) => c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO');
  const menorHosp = hospedagens.reduce<number | null>((m, h) => {
    const d = diasHospedagem(h);
    return d === null ? m : m === null ? d : Math.min(m, d);
  }, null);

  const proximas = useMemo(
    () =>
      abertas
        .filter((t) => t.prazo)
        .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
        .slice(0, 6),
    [abertas],
  );

  const etapas = Object.keys(ETAPA).map((k) => ({ k, n: tarefas.filter((t) => t.status === k).length }));
  const maxEtapa = Math.max(0, ...etapas.map((e) => e.n));

  const site = cliente.gscSiteUrl;
  const dados: Array<[string, ReactNode]> = [
    ['Razão social', cliente.razaoSocial || '—'],
    [
      'CNPJ ou CPF',
      cliente.cnpjCpf ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {cliente.cnpjCpf}
          <button className="ib sm" type="button" aria-label="Copiar CNPJ ou CPF" onClick={() => copiar(cliente.cnpjCpf || '', 'doc')} style={{ width: 24, height: 24 }}>
            {copiado === 'doc' ? <Check className="i" aria-hidden="true" /> : <Copy className="i" aria-hidden="true" />}
          </button>
        </span>
      ) : (
        '—'
      ),
    ],
    ['E-mail', cliente.email ? <a href={`mailto:${cliente.email}`} style={{ color: 'var(--acc-ink)' }}>{cliente.email}</a> : '—'],
    ['Telefone', cliente.telefone || '—'],
    ['Localização', cliente.localizacao || '—'],
    [
      'Site',
      site ? (
        <a href={site.startsWith('http') ? site : `https://${site}`} target="_blank" rel="noreferrer" style={{ color: 'var(--acc-ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {site.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          <ExternalLink className="i" aria-hidden="true" style={{ width: 13, height: 13 }} />
        </a>
      ) : (
        '—'
      ),
    ],
    ['Google Analytics 4', cliente.ga4PropertyId || 'Não configurado'],
    ['OpenPanel', cliente.openpanelProjectId || 'Não configurado'],
  ];

  const kpiBtn = { textAlign: 'left', font: 'inherit', cursor: 'pointer', border: 0 } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={`grid g4${loading ? ' animate-pulse' : ''}`}>
        <button className="card kpi" type="button" onClick={() => onNavigateTab?.('services')} style={kpiBtn}>
          <span>Serviços ativos</span><b>{ativos.length}</b>
          <small>
            {ativos.length ? ativos.map((s) => nomeServico(s.tipoServico || s.tipo_servico)).join(', ').replace(/(^|, )(\S)/g, (m) => m.toLowerCase()).replace(/^./, (c) => c.toUpperCase()) : 'nenhum serviço ativo'}
          </small>
        </button>
        <Link className={`card kpi${menorHosp !== null && menorHosp <= 7 ? ' alert' : ''}`} to="/hospedagens">
          <span>Hospedagens e domínios</span><b>{hospedagens.length}</b>
          <small>
            {menorHosp === null
              ? 'sem renovações cadastradas'
              : menorHosp < 0
              ? 'há item vencido'
              : `próximo vence em ${menorHosp} ${menorHosp === 1 ? 'dia' : 'dias'}`}
          </small>
        </Link>
        <Link className={`card kpi${atrasadas.length ? ' alert' : ''}`} to={`/gp?clienteId=${cliente.id}`}>
          <span>Tarefas em aberto</span><b>{abertas.length}</b>
          <small>{atrasadas.length ? `${atrasadas.length} ${atrasadas.length === 1 ? 'atrasada' : 'atrasadas'}` : 'nenhuma atrasada'}</small>
        </Link>
        <button className="card kpi" type="button" onClick={onOpenChamado} style={kpiBtn}>
          <span>Chamados</span><b>{chamadosAbertos.length}</b>
          <small>{chamadosAbertos.length ? 'em atendimento' : 'nenhum em aberto · criar'}</small>
        </button>
      </div>

      <div className="grid vxp-14-1" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="card">
            <div className="ch"><h2>Próximas entregas</h2><Link to={`/gp?clienteId=${cliente.id}`}>Abrir tarefas</Link></div>
            {!loading && proximas.length === 0 && <div className="empty"><span>Nenhuma entrega com prazo no momento.</span></div>}
            {proximas.map((t) => {
              const d = calcularDiasRestantes(t.prazo);
              const [etapa, cor] = ETAPA[t.status] ?? [t.status, '#7A7A80'];
              return (
                <Link className="row" key={t.id} to={`/gp/tarefa/${t.id}`}>
                  <span className="dot" style={{ background: cor }} />
                  <div className="t">
                    <b>{t.titulo}</b>
                    <small>{etapa}{t.responsavel?.nome ? ` · ${t.responsavel.nome}` : ''}</small>
                  </div>
                  <span className={`bd plain${d !== null && d < 0 ? ' bad' : ''}`}>{formatarDataBR(t.prazo)}</span>
                </Link>
              );
            })}
          </section>

          <section className="card cp" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="sec-t"><h2>Tarefas por etapa</h2><span className="mut" style={{ fontSize: 12.5 }}>{tarefas.length} no total</span></div>
            {tarefas.length === 0 ? (
              <span className="mut">Nenhuma tarefa registrada para este cliente.</span>
            ) : (
              etapas.map((e) => (
                <div className="hb" key={e.k}>
                  <span>{ETAPA[e.k][0]}</span>
                  <div className="bar"><i style={{ width: `${maxEtapa ? Math.round((e.n / maxEtapa) * 100) : 0}%`, background: ETAPA[e.k][1] }} /></div>
                  <b style={{ textAlign: 'right' }}>{e.n}</b>
                </div>
              ))
            )}
          </section>

          <section className="card cp" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="sec-t">
              <h2>Diretrizes da marca</h2>
              {obsSalva && <span className="meta"><Check className="i" aria-hidden="true" />Salvo agora</span>}
            </div>
            <label htmlFor="ov-obs" className="sr">Diretrizes da marca</label>
            <textarea
              id="ov-obs"
              className="inp"
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Tom de voz, regras da marca e particularidades do cliente"
            />
            <button
              className="btn sec sm"
              type="button"
              style={{ alignSelf: 'flex-end' }}
              onClick={salvarObservacoes}
              disabled={salvandoObs || observacoes === (cliente.observacoes || '')}
            >
              {salvandoObs ? 'Salvando...' : 'Salvar diretrizes'}
            </button>
          </section>
        </div>

        <section className="card">
          <div className="ch">
            <h2>Dados do cliente</h2>
            {onEditClient && <button className="btn gh sm" type="button" onClick={onEditClient}>Editar</button>}
          </div>
          <div className="cp">
            <dl className="dl" style={{ margin: 0 }}>
              {dados.map(([dt, dd]) => (
                <Fragment key={dt}><dt>{dt}</dt><dd>{dd}</dd></Fragment>
              ))}
            </dl>
          </div>

          <div className="ch" style={{ borderTop: '1px solid var(--ln)' }}>
            <h2>Contatos</h2>
            {onManageContatos && (
              <button className="btn gh sm" type="button" onClick={onManageContatos}><Plus className="i" aria-hidden="true" />Adicionar</button>
            )}
          </div>
          {!cliente.contatos?.length && <div className="cp mut" style={{ fontSize: 12.5 }}>Nenhum contato cadastrado.</div>}
          {cliente.contatos?.map((c) => (
            <div className="row" key={c.id}>
              <span className="av">{iniciais(c.nome || '?')}</span>
              <div className="t">
                <b>{c.nome}</b>
                <small>{[c.cargo, c.telefone || c.whatsapp, c.email].filter(Boolean).join(' · ') || 'Contato'}</small>
              </div>
              {onEditContato && (
                <button className="ib sm" type="button" aria-label={`Editar ${c.nome}`} onClick={() => onEditContato(c)}><Pencil className="i" aria-hidden="true" /></button>
              )}
              {onRemoveContato && (
                <button className="ib sm" type="button" aria-label={`Remover ${c.nome}`} onClick={() => onRemoveContato(c.id)}><Trash2 className="i" aria-hidden="true" /></button>
              )}
            </div>
          ))}

          <div className="ch" style={{ borderTop: '1px solid var(--ln)' }}>
            <h2>Acessos</h2>
            {cliente.loginsSenhas && (
              <div className="acts">
                <button className="btn gh sm" type="button" onClick={() => setMostrarSenhas(!mostrarSenhas)}>
                  {mostrarSenhas ? <EyeOff className="i" aria-hidden="true" /> : <Eye className="i" aria-hidden="true" />}
                  {mostrarSenhas ? 'Ocultar' : 'Revelar'}
                </button>
                <button className="btn gh sm" type="button" onClick={() => copiar(cliente.loginsSenhas || '', 'senhas')}>
                  {copiado === 'senhas' ? <Check className="i" aria-hidden="true" /> : <Copy className="i" aria-hidden="true" />}Copiar
                </button>
              </div>
            )}
          </div>
          <div className="cp">
            {!cliente.loginsSenhas ? (
              <span className="mut" style={{ fontSize: 12.5 }}>Nenhum login ou link de cofre cadastrado.</span>
            ) : mostrarSenhas ? (
              <pre className="cred" style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12.5, maxHeight: 180, overflow: 'auto' }}>
                {cliente.loginsSenhas}
              </pre>
            ) : (
              <span className="mut" style={{ fontSize: 12.5 }}>Oculto. Use Revelar para ver.</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
