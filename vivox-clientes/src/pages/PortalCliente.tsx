import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { portalApi, type MapaServicosResponse, type ServicoMapaItem } from '../api/portal';
import { PortalHeader } from '../components/portal/PortalHeader';
import { VxDialog } from '../components/clean/VxDialog';

// Início do portal do cliente no layout clean (canvas › Portal).
// GET /portal/mapa-servicos e POST de interesse em serviço.

const STATUS_SERVICO: Record<string, [string, string]> = {
  ATIVO: ['Ativo', 'bd ok'],
  CONCLUIDO: ['Concluído', 'bd info'],
  PAUSADO: ['Pausado', 'bd warn'],
};

const dataBR = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
};

export function PortalCliente() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MapaServicosResponse | null>(null);

  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoMapaItem | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await portalApi.getMapaServicos());
    } catch (err: unknown) {
      console.error('Erro ao carregar mapa de serviços:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Não foi possível carregar seus serviços.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirInteresse = (s: ServicoMapaItem) => {
    setServicoSelecionado(s);
    setMensagem('');
    setErroModal(null);
    setEnviado(false);
  };

  const enviarInteresse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoSelecionado) return;
    setEnviando(true);
    setErroModal(null);
    try {
      await portalApi.registrarInteresse({ tipoServico: servicoSelecionado.tipoServico, mensagem: mensagem.trim() || undefined });
      setData((prev) =>
        prev
          ? { ...prev, servicos: prev.servicos.map((s) => (s.tipoServico === servicoSelecionado.tipoServico ? { ...s, interesseRegistrado: true } : s)) }
          : prev,
      );
      setEnviado(true);
    } catch (err: unknown) {
      console.error('Erro ao registrar interesse:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErroModal(msg || 'Não foi possível enviar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const contratados = data?.servicos.filter((s) => s.contratado) || [];
  const disponiveis = data?.servicos.filter((s) => !s.contratado) || [];
  const primeiroNome = user?.nome?.split(' ')[0];

  return (
    <div className="vxp vxp-portal">
      <PortalHeader cliente={data?.cliente} />
      <div className="pg" style={{ maxWidth: 1100 }}>
        <div className="ph">
          <div>
            <h1>Olá{primeiroNome ? `, ${primeiroNome}` : ''}</h1>
            <p>Acompanhe o que a VIVOX está fazendo{data?.cliente ? ` pela ${data.cliente.nomeFantasia}` : ''}.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid g3 animate-pulse" aria-busy="true">{[1, 2, 3].map((i) => <div key={i} className="card" style={{ height: 150 }} />)}</div>
        ) : error ? (
          <div className="card empty">
            <AlertCircle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
            <b>Erro ao carregar serviços</b>
            <span>{error}</span>
            <button type="button" className="btn pri sm" onClick={carregar}>Tentar de novo</button>
          </div>
        ) : (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="sec-t"><h2>Seus serviços</h2></div>
              {contratados.length === 0 ? (
                <div className="card empty"><span>Nenhum serviço ativo no momento.</span></div>
              ) : (
                <div className="grid g3">
                  {contratados.map((s) => {
                    const [label, bd] = STATUS_SERVICO[s.status ?? 'ATIVO'] ?? [s.status ?? 'Ativo', 'bd'];
                    const desde = dataBR(s.dataContratacao);
                    return (
                      <div className="card sv" key={s.tipoServico}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b>{s.label}</b><span className={bd}>{label}</span></div>
                        <p>{s.descricao}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                          <span className="mut">{desde ? 'Contratado em' : 'Situação'}</span>
                          <span>{desde || 'Em vigência'}</span>
                        </div>
                        {s.tipoServico === 'GERENCIAMENTO_REDES' && (
                          <Link className="btn sec sm" to="/portal/acompanhamento" style={{ alignSelf: 'flex-start' }}>Ver acompanhamento</Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {disponiveis.length > 0 && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="sec-t"><h2>Outros serviços da VIVOX</h2></div>
                <div className="grid g3">
                  {disponiveis.map((s) => (
                    <div className="card sv disp" key={s.tipoServico}>
                      <b>{s.label}</b>
                      <p>{s.descricao}</p>
                      {s.interesseRegistrado ? (
                        <span className="meta" style={{ color: 'var(--ok)' }}><Check className="i" aria-hidden="true" />Interesse enviado</span>
                      ) : (
                        <button className="btn sec sm" type="button" style={{ alignSelf: 'flex-start' }} onClick={() => abrirInteresse(s)}>Tenho interesse</button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <VxDialog
        open={!!servicoSelecionado}
        onClose={() => setServicoSelecionado(null)}
        title={enviado ? 'Pedido enviado' : 'Falar sobre este serviço'}
        subtitle={enviado ? 'O seu atendimento VIVOX vai falar com você em breve.' : servicoSelecionado?.label}
      >
        {enviado ? (
          <div className="acts" style={{ justifyContent: 'flex-end' }}>
            <button className="btn pri" type="button" onClick={() => setServicoSelecionado(null)}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={enviarInteresse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="fld">
              <label htmlFor="in1">Mensagem <span className="mut" style={{ fontWeight: 500 }}>(opcional)</span></label>
              <textarea id="in1" className="inp" rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Ex.: Gostaria de saber prazos e investimento" />
            </div>
            {erroModal && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erroModal}</p>}
            <div className="acts" style={{ justifyContent: 'flex-end' }}>
              <button className="btn sec" type="button" onClick={() => setServicoSelecionado(null)}>Cancelar</button>
              <button className="btn pri" type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar interesse'}</button>
            </div>
          </form>
        )}
      </VxDialog>
    </div>
  );
}

export default PortalCliente;
