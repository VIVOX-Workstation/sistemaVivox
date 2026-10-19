import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import type { Cliente } from '../../types';
import type { Chamado, StatusChamado } from '../../api/chamados';

// Central de chamados no layout clean (canvas › Chamados). Recebe os chamados já
// carregados pelo VivoxGP (GET /chamados); detalhe e criação usam os modais do GP.

interface Props {
  chamados: Chamado[];
  clientes: Cliente[];
  loading: boolean;
  erro: boolean;
  onOpen: (c: Chamado) => void;
  onNovo: () => void;
  onStatus: (id: string, s: StatusChamado) => void;
  onRecarregar: () => void;
}

const COLUNAS: { id: StatusChamado; nome: string; cor: string }[] = [
  { id: 'ABERTO', nome: 'Aberto', cor: '#B23A30' },
  { id: 'EM_ANDAMENTO', nome: 'Em atendimento', cor: '#C88700' },
  { id: 'RESOLVIDO', nome: 'Resolvido', cor: '#0E9F4F' },
];

const CATEGORIA: Record<string, string> = { BUG: 'Bug', AJUSTE: 'Ajuste', DUVIDA: 'Dúvida', ACESSO: 'Acesso', OUTRO: 'Outro' };
const URG: Record<string, [string, string]> = { ALTA: ['Alta', 'bd bad plain'], MEDIA: ['Média', 'bd warn plain'], BAIXA: ['Baixa', 'bd plain'] };

function sla(c: Chamado): [string, string] {
  if (c.status === 'RESOLVIDO') {
    if (!c.resolvidoEm) return ['Resolvido', 'bd'];
    const h = Math.max(0, Math.round((new Date(c.resolvidoEm).getTime() - new Date(c.createdAt).getTime()) / 36e5));
    return [h < 48 ? `Resolvido em ${h} h` : `Resolvido em ${Math.round(h / 24)} dias`, 'bd'];
  }
  if (!c.slaVencimento) return ['Sem SLA', 'bd info'];
  const diff = (new Date(c.slaVencimento).getTime() - Date.now()) / 36e5;
  if (diff < 0) {
    const h = Math.abs(diff);
    return [h < 24 ? 'SLA vencido' : `SLA vencido há ${Math.round(h / 24)} ${Math.round(h / 24) === 1 ? 'dia' : 'dias'}`, 'bd bad'];
  }
  if (diff < 24) return [`Vence em ${Math.max(1, Math.round(diff))} h`, 'bd warn'];
  const d = Math.round(diff / 24);
  return [`Vence em ${d} ${d === 1 ? 'dia' : 'dias'}`, 'bd ok'];
}

export function ChamadosView({ chamados, clientes, loading, erro, onOpen, onNovo, onStatus, onRecarregar }: Props) {
  const [mostrar, setMostrar] = useState<'abertos' | 'todos'>('abertos');
  const nomeCliente = useMemo(() => new Map(clientes.map((c) => [c.id, c.nomeFantasia])), [clientes]);
  const colunas = mostrar === 'abertos' ? COLUNAS.slice(0, 2) : COLUNAS;

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div>
            <h1>Central de chamados</h1>
            <p>Pedidos de suporte dos clientes, com prazo de atendimento por prioridade.</p>
          </div>
          <div className="acts">
            <div className="seg" role="group" aria-label="Mostrar">
              {(['abertos', 'todos'] as const).map((f) => (
                <button key={f} type="button" className={f === mostrar ? 'on' : ''} aria-pressed={f === mostrar} onClick={() => setMostrar(f)}>
                  {f === 'abertos' ? 'Em aberto' : 'Todos'}
                </button>
              ))}
            </div>
            <button className="ib" type="button" aria-label="Atualizar" title="Atualizar" onClick={onRecarregar} disabled={loading}>
              <RefreshCw className={`i ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <button className="btn pri" type="button" onClick={onNovo}><Plus className="i" aria-hidden="true" />Novo chamado</button>
          </div>
        </div>

        {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>Não foi possível carregar os chamados. Tente atualizar.</p>}

        <div className="cols" style={{ gridTemplateColumns: `repeat(${colunas.length}, minmax(260px, 1fr))` }}>
          {colunas.map((col) => {
            const itens = chamados
              .filter((c) => c.status === col.id)
              .sort((a, b) => new Date(a.slaVencimento ?? a.createdAt).getTime() - new Date(b.slaVencimento ?? b.createdAt).getTime());
            return (
              <section className="cc" key={col.id} aria-label={col.nome}>
                <div className="cc-h"><span className="dot" style={{ background: col.cor }} />{col.nome} <em>{itens.length}</em></div>
                {loading && chamados.length === 0 && <div className="card animate-pulse" style={{ height: 96 }} />}
                {!loading && itens.length === 0 && <div className="cc-vazio">Nenhum chamado</div>}
                {itens.map((c) => {
                  const [slaTxt, slaBd] = sla(c);
                  const [urg, urgBd] = URG[c.urgencia ?? ''] ?? ['Média', 'bd warn plain'];
                  const prox = col.id === 'ABERTO' ? 'EM_ANDAMENTO' : col.id === 'EM_ANDAMENTO' ? 'RESOLVIDO' : null;
                  return (
                    <div className="ck" key={c.id}>
                      <button className="ck-b" type="button" onClick={() => onOpen(c)}>
                        <small>{nomeCliente.get(c.clienteId) ?? 'Cliente'} · {CATEGORIA[c.categoria ?? ''] ?? 'Chamado'}</small>
                        <b>{c.titulo || c.itemTitulo || c.descricaoProblema.slice(0, 80)}</b>
                      </button>
                      <span className="ck-f">
                        <span className={slaBd}>{slaTxt}</span>
                        <span className={urgBd}>{urg}</span>
                      </span>
                      {prox && (
                        <button className="btn gh sm" type="button" style={{ alignSelf: 'flex-start' }} onClick={() => onStatus(c.id, prox)}>
                          {prox === 'EM_ANDAMENTO' ? 'Atender' : 'Marcar como resolvido'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
