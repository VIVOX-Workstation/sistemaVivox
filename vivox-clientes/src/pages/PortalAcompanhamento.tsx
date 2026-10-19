import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { acompanhamentoApi, type AcompanhamentoResponse, type MesComDados, type TipoPublicacao } from '../api/acompanhamento';
import { ResumoAcompanhamentoCards } from '../components/acompanhamento/ResumoAcompanhamentoCards';
import { FiltrosAcompanhamento } from '../components/acompanhamento/FiltrosAcompanhamento';
import { type Periodo, filtroApi, paramsDaUrl, periodoDaUrl, textoPeriodo, tiposDaUrl } from '../components/acompanhamento/periodo';
import { TabelaAcompanhamento } from '../components/acompanhamento/TabelaAcompanhamento';
import { PortalHeader } from '../components/portal/PortalHeader';
import './planning-workspace.css';

// Acompanhamento do portal (só leitura) no layout clean (canvas › PortalAcompanhamento).

export function PortalAcompanhamento() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDaUrl(searchParams));
  const [tipos, setTipos] = useState<TipoPublicacao[]>(() => tiposDaUrl(searchParams));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<AcompanhamentoResponse | null>(null);
  const [mesesComDados, setMesesComDados] = useState<MesComDados[]>([]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resAcomp, resMeses] = await Promise.all([
        acompanhamentoApi.getPortalAcompanhamento(filtroApi(periodo, tipos)),
        acompanhamentoApi.getPortalMeses(),
      ]);
      setDados(resAcomp);
      setMesesComDados(resMeses || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar acompanhamento do portal:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Não foi possível carregar os dados de acompanhamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, tipos]);

  const aplicarFiltros = (novoPeriodo: Periodo, novosTipos: TipoPublicacao[]) => {
    setPeriodo(novoPeriodo);
    setTipos(novosTipos);
    setSearchParams(paramsDaUrl(novoPeriodo, novosTipos), { replace: true });
  };

  return (
    <div className="vxp vxp-portal">
      <PortalHeader cliente={dados?.cliente} />
      <div className="pg" style={{ maxWidth: 1180 }}>
        <div className="ph">
          <div>
            <span className="kick">Acompanhamento mensal</span>
            <h1 style={{ marginTop: 6 }}>Resultados das publicações</h1>
          </div>
        </div>

        <FiltrosAcompanhamento
          periodo={periodo}
          tipos={tipos}
          mesesComDados={mesesComDados}
          onChangePeriodo={(p) => aplicarFiltros(p, tipos)}
          onChangeTipos={(t) => aplicarFiltros(periodo, t)}
        />

        {loading ? (
          <div className="animate-pulse" aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid g4">{[1, 2, 3, 4].map((i) => <div key={i} className="card" style={{ height: 96 }} />)}</div>
            <div className="card" style={{ height: 240 }} />
          </div>
        ) : error ? (
          <div className="card empty">
            <AlertCircle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
            <b>Erro ao carregar dados</b>
            <span>{error}</span>
            <button type="button" className="btn pri sm" onClick={() => carregarDados()}>Tentar de novo</button>
          </div>
        ) : dados ? (
          <>
            <ResumoAcompanhamentoCards resumo={dados.resumo} textoPeriodo={textoPeriodo(periodo)} tiposFiltrados={tipos} />
            <div className="sec-t">
              <h2>Publicações do período <span className="mut" style={{ fontWeight: 500 }}>{dados.publicacoes.length}</span></h2>
              <span className="mut" style={{ fontSize: 12.5 }}>Só leitura</span>
            </div>
            <div className="planning-workspace pw-embed">
              <TabelaAcompanhamento publicacoes={dados.publicacoes} readOnly={true} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default PortalAcompanhamento;
