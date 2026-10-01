import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlarmClock, LifeBuoy, Server } from 'lucide-react';
import type { DashboardData } from '../../types/dashboard';
import { formatarDataBR } from '../../utils/hospedagemCalculo';
import { Section, Panel, EmptyList, PRIORIDADE_LABEL, humanize } from './DashboardShared';

const pill = 'text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap';
const PILL_DANGER = `${pill} text-[#B83B32] bg-[#FDF2F2] border-[#FCDAD7]`;
const PILL_WARN = `${pill} text-[#8A6828] bg-[#FAF2E4] border-[#E8D4B4]`;
const PILL_OK = `${pill} text-[#247A4A] bg-[#E6F4EA] border-[#CEEAD6]`;

export function AttentionSection({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { tarefas, chamados, landingPages } = data;
  const hospedagens = landingPages.proximosVencimentos.filter(
    (h) => h.nivelUrgencia === 'CRITICO' || h.nivelUrgencia === 'ATENCAO',
  );
  const row =
    'w-full text-left p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-colors flex items-start justify-between gap-2 cursor-pointer';

  return (
    <Section title="Precisa de atenção hoje" icon={<AlertTriangle className="w-4 h-4" />}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel>
          <div className="flex items-center gap-2 mb-3 text-[13px] font-bold text-[#1E1A16]">
            <AlarmClock className="w-4 h-4 text-[#B83B32]" /> Tarefas atrasadas
          </div>
          {tarefas.atrasadasLista.length === 0 ? (
            <EmptyList message="Nenhuma tarefa atrasada. Bom trabalho!" />
          ) : (
            <div className="space-y-2">
              {tarefas.atrasadasLista.map((t) => (
                <button key={t.id} type="button" className={row} onClick={() => navigate(`/gp/tarefa/${t.id}`)}>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E1A16] truncate">{t.titulo}</p>
                    <p className="text-[11.5px] text-[#5E574C] truncate">
                      {t.cliente?.nomeFantasia ?? 'Sem cliente'}
                      {t.responsavel ? ` · ${t.responsavel.nome}` : ''} · {PRIORIDADE_LABEL[t.prioridade] ?? humanize(t.prioridade)}
                    </p>
                  </div>
                  <span className={PILL_DANGER}>{t.diasAtraso}d de atraso</span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 mb-3 text-[13px] font-bold text-[#1E1A16]">
            <LifeBuoy className="w-4 h-4 text-[#8A6828]" /> Chamados e SLA
          </div>
          {chamados.recentes.length === 0 ? (
            <EmptyList message="Nenhum chamado em aberto." />
          ) : (
            <div className="space-y-2">
              {chamados.recentes.map((c) => (
                <button key={c.id} type="button" className={row} onClick={() => navigate('/gp')}>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E1A16] truncate">{c.titulo}</p>
                    <p className="text-[11.5px] text-[#5E574C] truncate">
                      {c.cliente?.nomeFantasia ?? 'Sem cliente'} · {humanize(c.urgencia)} · {humanize(c.status)}
                    </p>
                  </div>
                  {c.slaVencido ? (
                    <span className={PILL_DANGER}>SLA vencido</span>
                  ) : c.slaVencimento ? (
                    <span className={PILL_WARN}>SLA {formatarDataBR(c.slaVencimento)}</span>
                  ) : (
                    <span className={PILL_OK}>Sem SLA</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 mb-3 text-[13px] font-bold text-[#1E1A16]">
            <Server className="w-4 h-4 text-[#7A6440]" /> Hospedagens e domínios
          </div>
          {hospedagens.length === 0 ? (
            <EmptyList message="Nenhuma renovação crítica nos próximos 30 dias." />
          ) : (
            <div className="space-y-2">
              {hospedagens.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={row}
                  onClick={() => navigate(`/cliente/${h.clienteId}`)}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E1A16] truncate">{h.cliente?.nomeFantasia}</p>
                    <p className="text-[11.5px] text-[#5E574C] truncate">{h.dominio || h.url || h.titulo}</p>
                  </div>
                  <span className={h.nivelUrgencia === 'CRITICO' ? PILL_DANGER : PILL_WARN}>
                    {typeof h.diasRestantes === 'number' && h.diasRestantes < 0
                      ? `Vencido há ${Math.abs(h.diasRestantes)}d`
                      : `Vence em ${h.diasRestantes}d`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </Section>
  );
}
