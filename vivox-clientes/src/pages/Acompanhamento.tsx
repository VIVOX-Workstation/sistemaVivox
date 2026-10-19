import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle, Share2, Download, Upload } from 'lucide-react';
import { 
  acompanhamentoApi, 
  type AcompanhamentoResponse, 
  type MesComDados, 
  type Publicacao,
  type AcompanhamentoCliente,
  type TipoPublicacao,
} from '../api/acompanhamento';
import { ResumoAcompanhamentoCards } from '../components/acompanhamento/ResumoAcompanhamentoCards';
import { FiltrosAcompanhamento } from '../components/acompanhamento/FiltrosAcompanhamento';
import { TabelaAcompanhamento } from '../components/acompanhamento/TabelaAcompanhamento';
import { baixarJson, lerBackupJson } from '../components/acompanhamento/backupJson';
import { CronogramasPainel } from '../components/acompanhamento/CronogramasPainel';
import { AcessoPortalModal } from '../components/portal/AcessoPortalModal';
import {
  type Periodo,
  dataPadraoNova,
  filtroApi,
  paramsDaUrl,
  periodoDaUrl,
  textoPeriodo,
  tiposDaUrl,
} from '../components/acompanhamento/periodo';

const urlPara = (clienteId: string, periodo: Periodo, tipos: TipoPublicacao[], aba?: string) => {
  const params = new URLSearchParams(paramsDaUrl(periodo, tipos));
  if (aba && aba === 'cronogramas') {
    params.set('aba', 'cronogramas');
  }
  return `/acompanhamento/${clienteId}?${params.toString()}`;
};
import './planning-workspace.css';

// Mesmo limite do backend (IMPORTACAO_MAX_LINHAS)
const MAX_LINHAS_IMPORTACAO = 5000;

export function Acompanhamento() {
  const { clienteId: urlClienteId } = useParams<{ clienteId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Período (mês ou personalizado) e tipos ficam na URL para o link poder ser compartilhado
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDaUrl(searchParams));
  const [tipos, setTipos] = useState<TipoPublicacao[]>(() => tiposDaUrl(searchParams));
  const abaAtiva = searchParams.get('aba') === 'cronogramas' ? 'cronogramas' : 'publicacoes';

  // Lista de clientes para o seletor
  const [clientes, setClientes] = useState<AcompanhamentoCliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(urlClienteId || null);


  // Dados do acompanhamento
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<AcompanhamentoResponse | null>(null);
  const [mesesComDados, setMesesComDados] = useState<MesComDados[]>([]);

  const [compartilharAberto, setCompartilharAberto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const inputImportarRef = useRef<HTMLInputElement>(null);

  // Status de salvamento por linha da tabela
  const [rowStatus, setRowStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});


  const handleMudarAba = (novaAba: 'publicacoes' | 'cronogramas') => {
    if (clienteSelecionadoId) {
      navigate(urlPara(clienteSelecionadoId, periodo, tipos, novaAba));
    }
  };

  // Carrega lista inicial de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      setLoadingClientes(true);
      try {
        const res = await acompanhamentoApi.getClientes();
        setClientes(res || []);
        // Se não houver cliente na URL, mas houver clientes, seleciona o primeiro opcionalmente ou aguarda seleção
        if (!urlClienteId && res.length > 0 && !clienteSelecionadoId) {
          setClienteSelecionadoId(res[0].id);
          navigate(urlPara(res[0].id, periodo, tipos, abaAtiva), { replace: true });
        }
      } catch (err) {
        console.error('Erro ao carregar lista de clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };
    fetchClientes();
  }, []);


  // Sincroniza se o cliente na URL mudar
  useEffect(() => {
    if (urlClienteId && urlClienteId !== clienteSelecionadoId) {
      setClienteSelecionadoId(urlClienteId);
    }
  }, [urlClienteId]);

  // Carrega dados quando cliente, período ou tipos mudam
  const carregarDados = async (cId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [resAcomp, resMeses] = await Promise.all([
        acompanhamentoApi.getAcompanhamento(cId, filtroApi(periodo, tipos)),
        acompanhamentoApi.getMesesComDados(cId),
      ]);
      setDados(resAcomp);
      setMesesComDados(resMeses || []);
    } catch (err: any) {
      console.error('Erro ao carregar acompanhamento:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados de acompanhamento do cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteSelecionadoId) {
      carregarDados(clienteSelecionadoId);
    }
  }, [clienteSelecionadoId, periodo, tipos]);

  const handleMudarCliente = (novoId: string) => {
    setClienteSelecionadoId(novoId);
    navigate(urlPara(novoId, periodo, tipos, abaAtiva));
  };

  const aplicarFiltros = (novoPeriodo: Periodo, novosTipos: TipoPublicacao[]) => {
    setPeriodo(novoPeriodo);
    setTipos(novosTipos);
    if (clienteSelecionadoId) {
      navigate(urlPara(clienteSelecionadoId, novoPeriodo, novosTipos, abaAtiva), { replace: true });
    }
  };

  const recarregarResumo = () => {
    if (!clienteSelecionadoId) return;
    acompanhamentoApi.getAcompanhamento(clienteSelecionadoId, filtroApi(periodo, tipos)).then((res) => {
      setDados((prev) => (prev ? { ...prev, resumo: res.resumo } : res));
    });
  };

  const handleUpdatePublicacao = async (id: string, campo: keyof Publicacao, valor: any) => {
    // Atualização otimista local
    setDados((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        publicacoes: prev.publicacoes.map((p) =>
          p.id === id ? { ...p, [campo]: valor } : p
        ),
      };
    });

    setRowStatus((prev) => ({ ...prev, [id]: 'saving' }));

    try {
      const atualizado = await acompanhamentoApi.atualizarPublicacao(id, { [campo]: valor });
      setDados((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          publicacoes: prev.publicacoes.map((p) =>
            p.id === id ? { ...p, ...atualizado } : p
          ),
        };
      });
      setRowStatus((prev) => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => {
        setRowStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);

      // Recarrega o resumo para atualizar totais
      recarregarResumo();
    } catch (err) {
      console.error('Erro ao atualizar publicação:', err);
      setRowStatus((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleDeletePublicacao = async (id: string) => {
    try {
      await acompanhamentoApi.excluirPublicacao(id);
      setDados((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          publicacoes: prev.publicacoes.filter((p) => p.id !== id),
        };
      });
      if (clienteSelecionadoId) {
        carregarDados(clienteSelecionadoId);
      }
    } catch (err: any) {
      console.error('Erro ao excluir publicação:', err);
      alert(err.response?.data?.message || 'Erro ao excluir publicação.');
    }
  };

  const handleCriarPublicacao = async () => {
    if (!clienteSelecionadoId) return;

    // Data padrão: hoje se estiver no período, senão o primeiro dia; tipo segue o filtro se houver um só
    const dataPadrao = dataPadraoNova(periodo);
    const tipoPadrao: TipoPublicacao = tipos.length === 1 ? tipos[0] : 'POST';

    try {
      const nova = await acompanhamentoApi.criarPublicacao(clienteSelecionadoId, {
        dataPublicacao: dataPadrao.toISOString(),
        tipo: tipoPadrao,
        assunto: '',
      });

      setDados((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          publicacoes: [...prev.publicacoes, nova].sort(
            (a, b) => new Date(a.dataPublicacao).getTime() - new Date(b.dataPublicacao).getTime()
          ),
        };
      });

      // Atualiza os meses com dados caso seja o primeiro item
      acompanhamentoApi.getMesesComDados(clienteSelecionadoId).then(setMesesComDados);
      recarregarResumo();
    } catch (err: any) {
      console.error('Erro ao criar publicação:', err);
      alert(err.response?.data?.message || 'Não foi possível adicionar nova publicação.');
    }
  };

  const clienteAtual = clientes.find((c) => c.id === clienteSelecionadoId) || dados?.cliente;

  // Exporta todo o histórico do cliente (todos os períodos), não só o filtro atual
  const handleExportar = async () => {
    if (!clienteSelecionadoId) return;
    setExportando(true);
    try {
      const backup = await acompanhamentoApi.exportarPublicacoes(clienteSelecionadoId);
      const nome = backup.cliente.nomeFantasia
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'cliente';
      baixarJson(backup, `acompanhamento-${nome}-${backup.exportadoEm.slice(0, 10)}.json`);
    } catch (err: any) {
      console.error('Erro ao exportar publicações:', err);
      alert(err.response?.data?.message || 'Não foi possível exportar as publicações.');
    } finally {
      setExportando(false);
    }
  };

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo || !clienteSelecionadoId) return;

    let backup;
    try {
      backup = lerBackupJson(await arquivo.text());
    } catch (err: any) {
      alert(err.message);
      return;
    }
    const { publicacoes, clienteOrigem } = backup;
    if (publicacoes.length === 0) {
      alert('O arquivo não tem nenhuma publicação para importar.');
      return;
    }
    if (publicacoes.length > MAX_LINHAS_IMPORTACAO) {
      alert(`O arquivo tem ${publicacoes.length} publicações. Importe no máximo ${MAX_LINHAS_IMPORTACAO} por vez.`);
      return;
    }

    const nomeAtual = clienteAtual?.nomeFantasia || 'este cliente';
    const avisoOrigem = clienteOrigem && clienteOrigem !== clienteAtual?.nomeFantasia
      ? `\n\nAtenção: este backup é de "${clienteOrigem}". As publicações serão copiadas como novas para ${nomeAtual}.`
      : '';
    if (!confirm(
      `Importar ${publicacoes.length} publicação(ões) para ${nomeAtual}?\n\n` +
      `As que já existem neste cliente são atualizadas com os dados do arquivo; as demais são criadas.${avisoOrigem}`,
    )) return;

    setImportando(true);
    try {
      const res = await acompanhamentoApi.importarPublicacoes(clienteSelecionadoId, publicacoes);
      await carregarDados(clienteSelecionadoId);
      alert(`Importação concluída: ${res.criadas} criada(s), ${res.atualizadas} atualizada(s).\n\nPublicações de outros meses aparecem ao trocar o período no filtro.`);
    } catch (err: any) {
      console.error('Erro ao importar publicações:', err);
      const msg = err.response?.data?.message;
      alert(`Não foi possível importar. Nada foi gravado.\n\n${Array.isArray(msg) ? msg.slice(0, 10).join('\n') : msg || 'Erro desconhecido.'}`);
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="vxp">
      <div className="pg" style={{ maxWidth: 1320 }}>
        <div className="ph">
          <div>
            <span className="kick">Acompanhamento mensal</span>
            <h1 style={{ marginTop: 6 }}>{clienteAtual?.nomeFantasia || 'Planilha de publicações'}</h1>
            <p>Registro e conferência das postagens, formatos e métricas da conta.</p>
          </div>
          <div className="acts">
            <label htmlFor="a-cli" className="sr">Cliente</label>
            <select
              id="a-cli"
              className="inp"
              style={{ width: 220 }}
              value={clienteSelecionadoId ?? ''}
              disabled={loadingClientes}
              onChange={(e) => e.target.value && handleMudarCliente(e.target.value)}
            >
              {!clienteSelecionadoId && <option value="">Selecione um cliente</option>}
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
              ))}
            </select>
            <button className="btn sec" type="button" onClick={() => setCompartilharAberto(true)} disabled={!clienteSelecionadoId}>
              <Share2 className="i" aria-hidden="true" />Compartilhar
            </button>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Conteúdo do acompanhamento">
          {(['publicacoes', 'cronogramas'] as const).map((a) => (
            <button key={a} className={a === abaAtiva ? 'tab on' : 'tab'} type="button" role="tab" aria-selected={a === abaAtiva} onClick={() => handleMudarAba(a)}>
              {a === 'publicacoes' ? 'Publicações' : 'Cronogramas'}
            </button>
          ))}
        </div>

        {abaAtiva === 'cronogramas' ? (
          <div className="planning-workspace pw-embed">
            <CronogramasPainel clienteId={clienteSelecionadoId} clienteNome={clienteAtual?.nomeFantasia} periodoAtual={periodo} />
          </div>
        ) : (
          <>
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
                <div className="card" style={{ height: 260 }} />
              </div>
            ) : error ? (
              <div className="card empty">
                <AlertCircle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
                <b>Erro ao carregar publicações</b>
                <span>{error}</span>
                {clienteSelecionadoId && (
                  <button type="button" className="btn pri sm" onClick={() => carregarDados(clienteSelecionadoId)}>Tentar de novo</button>
                )}
              </div>
            ) : !clienteSelecionadoId ? (
              <div className="card empty">
                <b>Selecione um cliente</b>
                <span>Escolha um cliente no seletor acima para ver e editar a planilha de acompanhamento.</span>
              </div>
            ) : dados ? (
              <>
                <ResumoAcompanhamentoCards resumo={dados.resumo} textoPeriodo={textoPeriodo(periodo)} tiposFiltrados={tipos} />

                <div className="sec-t" style={{ flexWrap: 'wrap' }}>
                  <h2>Publicações do período <span className="mut" style={{ fontWeight: 500 }}>{dados.publicacoes.length}</span></h2>
                  <div className="acts">
                    <button className="btn gh sm" type="button" onClick={handleExportar} disabled={exportando} title="Baixar todas as publicações do cliente (todos os períodos) em JSON">
                      <Download className="i" aria-hidden="true" />{exportando ? 'Exportando...' : 'Exportar'}
                    </button>
                    <button className="btn gh sm" type="button" onClick={() => inputImportarRef.current?.click()} disabled={importando} title="Importar um backup JSON. Publicações existentes são atualizadas; as demais são criadas.">
                      {importando ? <RefreshCw className="i animate-spin" aria-hidden="true" /> : <Upload className="i" aria-hidden="true" />}
                      {importando ? 'Importando...' : 'Importar'}
                    </button>
                    <input ref={inputImportarRef} type="file" accept=".json,application/json" onChange={handleImportar} hidden />
                    <button className="btn pri sm" type="button" onClick={handleCriarPublicacao}>
                      <Plus className="i" aria-hidden="true" />Nova publicação
                    </button>
                  </div>
                </div>

                <div className="planning-workspace pw-embed">
                  <TabelaAcompanhamento
                    publicacoes={dados.publicacoes}
                    readOnly={false}
                    onUpdatePublicacao={handleUpdatePublicacao}
                    onDeletePublicacao={handleDeletePublicacao}
                    rowStatus={rowStatus}
                  />
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      {/* Compartilhar: o link leva o cliente direto a este período no portal, após o login */}
      {clienteSelecionadoId && (
        <AcessoPortalModal
          isOpen={compartilharAberto}
          onClose={() => setCompartilharAberto(false)}
          clienteId={clienteSelecionadoId}
          clienteNome={clienteAtual?.nomeFantasia || 'cliente'}
          caminhoDestino={`/portal/acompanhamento?${new URLSearchParams(paramsDaUrl(periodo, tipos))}`}
          descricaoDestino={`Acesse para ver o acompanhamento das suas publicações (${textoPeriodo(periodo).toLowerCase()}).`}
        />
      )}
    </div>
  );
}

export default Acompanhamento;
