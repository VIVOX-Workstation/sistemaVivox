import { useState, useMemo } from 'react';
import { useDemo } from './useDemo';
import { VideoPlayer } from './VideoPlayer';
import {
  BookOpen,
  History,
  PlayCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  LogOut,
  ChevronRight,
  Check,
  FileQuestion,
} from 'lucide-react';
import type { Curso } from './types';

export function PortalAluno() {
  const { state, dispatch, alunoAtual } = useDemo();
  const [abaInterna, setAbaInterna] = useState<'cursos' | 'sala' | 'loja' | 'extrato'>('cursos');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Cursos ativos
  const cursosAtivos = useMemo(() => state.cursos.filter(c => c.ativo), [state.cursos]);

  // Identificar última aula para "Continuar de onde parou"
  const ultimaAulaInfo = useMemo(() => {
    if (!alunoAtual?.ultimaAula) return null;
    const c = state.cursos.find(curso => curso.id === alunoAtual.ultimaAula?.cursoId);
    if (!c) return null;
    const m = c.modulos.find(mod => mod.aulas.some(a => a.id === alunoAtual.ultimaAula?.aulaId));
    const a = m?.aulas.find(aula => aula.id === alunoAtual.ultimaAula?.aulaId);
    if (!a) return null;
    return { curso: c, modulo: m, aula: a };
  }, [state.cursos, alunoAtual?.ultimaAula]);

  // Se o aluno não está logado
  if (!alunoAtual) {
    return (
      <div className="vxd-aluno-login-box">
        <div className="vxd-login-card">
          <div className="vxd-login-icon">🎓</div>
          <h2>Portal do Aluno</h2>
          <p>Experimente o ambiente de aprendizagem com um perfil de aluno pré-configurado.</p>
          <div className="vxd-login-actions">
            <button
              type="button"
              className="vxd-btn vxd-btn-primary vxd-btn-block"
              onClick={() => dispatch({ type: 'LOGIN_ALUNO', alunoId: 'aluno-demo' })}
            >
              Entrar como Mariana Silva (Aluna Demo)
            </button>
            <div className="vxd-login-divider"><span>ou selecione outro aluno</span></div>
            <div className="vxd-login-users-grid">
              {state.alunos.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className="vxd-user-chip"
                  onClick={() => dispatch({ type: 'LOGIN_ALUNO', alunoId: a.id })}
                >
                  <span className="vxd-user-avatar">{a.avatar}</span>
                  <div className="vxd-user-info">
                    <strong>{a.nome}</strong>
                    <small>{a.pontos} pts</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cálculos de progresso do curso
  const calcularProgressoCurso = (curso: Curso) => {
    const totalAulas = curso.modulos.reduce((acc, m) => acc + m.aulas.length, 0);
    if (totalAulas === 0) return { total: 0, concluidas: 0, percentual: 0 };
    const todasAulasIds = curso.modulos.flatMap(m => m.aulas.map(a => a.id));
    const concluidas = todasAulasIds.filter(id => alunoAtual.concluidasAulaIds.includes(id)).length;
    return {
      total: totalAulas,
      concluidas,
      percentual: Math.round((concluidas / totalAulas) * 100),
    };
  };

  // Curso e Aula selecionados atualmente para visualização na sala de aula
  const cursoSelecionado = state.cursos.find(c => c.id === state.cursoAtivoId) || cursosAtivos[0];
  const aulaSelecionada =
    cursoSelecionado?.modulos.flatMap(m => m.aulas).find(a => a.id === state.aulaAtivaId) ||
    cursoSelecionado?.modulos[0]?.aulas[0];

  const abrirAula = (cursoId: string, aulaId: string) => {
    dispatch({ type: 'SELECIONAR_AULA', cursoId, aulaId });
    setAbaInterna('sala');
  };

  const handleSolicitarResgate = (premioId: string, premioTitulo: string) => {
    dispatch({ type: 'SOLICITAR_RESGATE', premioId });
    setMensagemSucesso(`Solicitação de resgate para "${premioTitulo}" enviada com sucesso! Aguarde a aprovação no Painel Administrativo.`);
    setTimeout(() => setMensagemSucesso(''), 6000);
  };

  return (
    <div className="vxd-portal-aluno-layout">
      {/* Barra de Perfil e Navegação do Aluno */}
      <header className="vxd-aluno-topbar">
        <div className="vxd-aluno-profile">
          <div className="vxd-aluno-avatar-wrap">
            <span className="vxd-aluno-avatar">{alunoAtual.avatar}</span>
          </div>
          <div className="vxd-aluno-details">
            <div className="vxd-aluno-greeting">
              Olá, <strong>{alunoAtual.nome}</strong> 👋
            </div>
            <div className="vxd-aluno-sub">
              {alunoAtual.email} • {alunoAtual.concluidasAulaIds.length} aulas concluídas
            </div>
          </div>
        </div>

        {/* Saldo de Pontos em Destaque */}
        <div className="vxd-aluno-top-actions">
          <div
            className="vxd-aluno-points-badge"
            title="Seu saldo de pontos acumulados"
            onClick={() => setAbaInterna('extrato')}
          >
            <Sparkles className="vxd-icon-gold" size={18} />
            <div className="vxd-points-text">
              <span className="vxd-points-value">{alunoAtual.pontos}</span>
              <span className="vxd-points-sub">pontos disponíveis</span>
            </div>
          </div>

          <button
            type="button"
            className="vxd-btn-ghost-logout"
            onClick={() => dispatch({ type: 'LOGOUT_ALUNO' })}
            title="Trocar ou sair do aluno demo"
            aria-label="Sair"
          >
            <LogOut size={16} />
            <span className="vxd-hide-mobile">Trocar Aluno</span>
          </button>
        </div>
      </header>

      {/* Menu em Abas do Portal do Aluno */}
      <nav className="vxd-aluno-subnav">
        <button
          type="button"
          className={`vxd-subnav-btn ${abaInterna === 'cursos' ? 'vxd-subnav-active' : ''}`}
          onClick={() => setAbaInterna('cursos')}
        >
          <BookOpen size={16} /> Meus Cursos
        </button>
        {cursoSelecionado && aulaSelecionada && (
          <button
            type="button"
            className={`vxd-subnav-btn ${abaInterna === 'sala' ? 'vxd-subnav-active' : ''}`}
            onClick={() => setAbaInterna('sala')}
          >
            <PlayCircle size={16} /> Sala de Aula
          </button>
        )}
        <button
          type="button"
          className={`vxd-subnav-btn ${abaInterna === 'loja' ? 'vxd-subnav-active' : ''}`}
          onClick={() => setAbaInterna('loja')}
        >
          <ShoppingBag size={16} /> Loja de Recompensas
          {alunoAtual.resgates.some(r => r.status === 'pendente') && (
            <span className="vxd-pill-count">
              {alunoAtual.resgates.filter(r => r.status === 'pendente').length}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`vxd-subnav-btn ${abaInterna === 'extrato' ? 'vxd-subnav-active' : ''}`}
          onClick={() => setAbaInterna('extrato')}
        >
          <History size={16} /> Extrato de Pontos
        </button>
      </nav>

      {/* Alerta de Feedback */}
      {mensagemSucesso && (
        <div className="vxd-alert-sucesso">
          <CheckCircle2 size={18} />
          <span>{mensagemSucesso}</span>
          <button type="button" onClick={() => setMensagemSucesso('')} className="vxd-btn-close-sm">✕</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 1: MEUS CURSOS & CATÁLOGO                                  */}
      {/* ============================================================== */}
      {abaInterna === 'cursos' && (
        <div className="vxd-aluno-tab-content">
          {/* Card em Destaque: Continuar de onde parou */}
          {ultimaAulaInfo && (
            <div className="vxd-resume-banner">
              <div className="vxd-resume-content">
                <span className="vxd-resume-tag">
                  <PlayCircle size={14} /> Continuar de onde parou
                </span>
                <h3 className="vxd-resume-title">{ultimaAulaInfo.aula.titulo}</h3>
                <p className="vxd-resume-course">
                  Curso: <strong>{ultimaAulaInfo.curso.titulo}</strong> • {ultimaAulaInfo.modulo?.titulo}
                </p>
              </div>
              <button
                type="button"
                className="vxd-btn vxd-btn-gold"
                onClick={() => abrirAula(ultimaAulaInfo.curso.id, ultimaAulaInfo.aula.id)}
              >
                Retomar Aula <ArrowRight size={16} />
              </button>
            </div>
          )}

          <div className="vxd-section-header-row">
            <div>
              <h2>Cursos Disponíveis</h2>
              <p>Explore as formações, assista às videoaulas e conquiste pontos nas avaliações.</p>
            </div>
          </div>

          <div className="vxd-cursos-grid">
            {cursosAtivos.map(curso => {
              const progresso = calcularProgressoCurso(curso);
              const primeiraAula = curso.modulos[0]?.aulas[0];

              return (
                <div key={curso.id} className="vxd-curso-card">
                  {/* Capa com gradiente CSS */}
                  <div
                    className="vxd-curso-cover"
                    style={{ background: curso.capaGradiente }}
                  >
                    <span className="vxd-curso-categoria-tag">{curso.categoria}</span>
                    <h3 className="vxd-curso-cover-title">{curso.titulo}</h3>
                  </div>

                  <div className="vxd-curso-body">
                    <p className="vxd-curso-desc">{curso.descricao}</p>

                    {/* Barra de Progresso do Curso */}
                    <div className="vxd-progresso-block">
                      <div className="vxd-progresso-header">
                        <span>Progresso do Aluno</span>
                        <strong>{progresso.percentual}%</strong>
                      </div>
                      <div className="vxd-progresso-track">
                        <div
                          className="vxd-progresso-bar"
                          style={{ width: `${progresso.percentual}%` }}
                        />
                      </div>
                      <div className="vxd-progresso-sub">
                        <span>{progresso.concluidas} de {progresso.total} aulas concluídas</span>
                        <span>{curso.modulos.length} módulos</span>
                      </div>
                    </div>

                    <div className="vxd-curso-actions">
                      <button
                        type="button"
                        className="vxd-btn vxd-btn-primary vxd-btn-block"
                        onClick={() => {
                          if (primeiraAula) {
                            abrirAula(curso.id, primeiraAula.id);
                          } else {
                            dispatch({ type: 'SELECIONAR_CURSO', cursoId: curso.id });
                            setAbaInterna('sala');
                          }
                        }}
                      >
                        {progresso.concluidas > 0 ? 'Continuar Curso' : 'Iniciar Curso'} <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: SALA DE AULA & PLAYER                                   */}
      {/* ============================================================== */}
      {abaInterna === 'sala' && (
        <div className="vxd-sala-de-aula">
          {cursoSelecionado && aulaSelecionada ? (
            <div className="vxd-sala-grid">
              {/* Coluna Principal: Player e Conteúdo */}
              <div className="vxd-sala-main">
                <div className="vxd-sala-breadcrumb">
                  <button
                    type="button"
                    className="vxd-btn-link"
                    onClick={() => setAbaInterna('cursos')}
                  >
                    ← Voltar aos cursos
                  </button>
                  <span className="vxd-bc-sep">/</span>
                  <span>{cursoSelecionado.titulo}</span>
                  <span className="vxd-bc-sep">/</span>
                  <span className="vxd-bc-active">{aulaSelecionada.titulo}</span>
                </div>

                {/* Player de Vídeo */}
                <VideoPlayer
                  titulo={aulaSelecionada.titulo}
                  duracao={aulaSelecionada.duracao}
                  videoUrl={aulaSelecionada.videoUrl}
                  concluida={alunoAtual.concluidasAulaIds.includes(aulaSelecionada.id)}
                  onConcluir={() =>
                    dispatch({ type: 'TOGGLE_CONCLUIR_AULA', aulaId: aulaSelecionada.id })
                  }
                />

                {/* Descrição e Anotações da Aula */}
                <div className="vxd-aula-descricao-card">
                  <h4>Sobre esta aula</h4>
                  <p>
                    {aulaSelecionada.descricao ||
                      'Acompanhe as instruções práticas, faça as anotações necessárias e complete a avaliação ao final do módulo para pontuar na gamificação.'}
                  </p>

                  <div className="vxd-aula-nav-buttons">
                    {/* Botões Próxima / Anterior */}
                    {(() => {
                      const todasAulas = cursoSelecionado.modulos.flatMap(m => m.aulas);
                      const currentIdx = todasAulas.findIndex(a => a.id === aulaSelecionada.id);
                      const anterior = currentIdx > 0 ? todasAulas[currentIdx - 1] : null;
                      const proxima = currentIdx < todasAulas.length - 1 ? todasAulas[currentIdx + 1] : null;

                      return (
                        <>
                          <button
                            type="button"
                            className="vxd-btn vxd-btn-secondary"
                            disabled={!anterior}
                            onClick={() => anterior && abrirAula(cursoSelecionado.id, anterior.id)}
                          >
                            ← Aula Anterior
                          </button>
                          <button
                            type="button"
                            className="vxd-btn vxd-btn-secondary"
                            disabled={!proxima}
                            onClick={() => proxima && abrirAula(cursoSelecionado.id, proxima.id)}
                          >
                            Próxima Aula →
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Coluna Lateral: Grade de Módulos e Aulas */}
              <aside className="vxd-sala-sidebar">
                <div className="vxd-sidebar-header">
                  <h3>Conteúdo do Curso</h3>
                  {(() => {
                    const p = calcularProgressoCurso(cursoSelecionado);
                    return (
                      <span className="vxd-sidebar-progress-pill">
                        {p.percentual}% concluído
                      </span>
                    );
                  })()}
                </div>

                <div className="vxd-modulos-accordion">
                  {cursoSelecionado.modulos.map((modulo, mIdx) => (
                    <div key={modulo.id} className="vxd-modulo-group">
                      <div className="vxd-modulo-header">
                        <span className="vxd-mod-num">Módulo {mIdx + 1}</span>
                        <h4>{modulo.titulo}</h4>
                      </div>

                      <div className="vxd-aulas-list">
                        {modulo.aulas.map((aula, aIdx) => {
                          const isAtiva = aula.id === aulaSelecionada.id;
                          const isConcluida = alunoAtual.concluidasAulaIds.includes(aula.id);

                          return (
                            <button
                              key={aula.id}
                              type="button"
                              className={`vxd-aula-item ${isAtiva ? 'vxd-aula-ativa' : ''} ${
                                isConcluida ? 'vxd-aula-concluida' : ''
                              }`}
                              onClick={() => abrirAula(cursoSelecionado.id, aula.id)}
                            >
                              <div className="vxd-aula-icon">
                                {isConcluida ? (
                                  <Check className="vxd-check-icon" size={14} />
                                ) : (
                                  <span>{aIdx + 1}</span>
                                )}
                              </div>
                              <div className="vxd-aula-text">
                                <span className="vxd-aula-title">{aula.titulo}</span>
                                <span className="vxd-aula-time">
                                  <Clock size={11} /> {aula.duracao}
                                </span>
                              </div>
                            </button>
                          );
                        })}

                        {/* Avaliação do Módulo */}
                        {modulo.quiz && (
                          <div className="vxd-quiz-button-wrap">
                            {(() => {
                              const quizDone = alunoAtual.quizzesConcluidos[modulo.quiz.id];
                              return (
                                <button
                                  type="button"
                                  className={`vxd-btn-quiz ${
                                    quizDone ? 'vxd-quiz-completed' : 'vxd-quiz-pending'
                                  }`}
                                  onClick={() =>
                                    dispatch({
                                      type: 'ABRIR_QUIZ',
                                      cursoId: cursoSelecionado.id,
                                      moduloId: modulo.id,
                                    })
                                  }
                                >
                                  <FileQuestion size={16} />
                                  <div className="vxd-btn-quiz-text">
                                    <strong>{modulo.quiz.titulo}</strong>
                                    <span>
                                      {quizDone
                                        ? `✓ Concluído (${quizDone.acertos}/${quizDone.total} acertos)`
                                        : 'Fazer avaliação e ganhar pontos'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          ) : (
            <div className="vxd-card-empty">
              <p>Nenhuma aula selecionada no momento.</p>
              <button
                type="button"
                className="vxd-btn vxd-btn-primary"
                onClick={() => setAbaInterna('cursos')}
              >
                Voltar aos cursos
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: LOJA DE RECOMPENSAS                                     */}
      {/* ============================================================== */}
      {abaInterna === 'loja' && (
        <div className="vxd-aluno-tab-content">
          <div className="vxd-loja-header-banner">
            <div className="vxd-loja-intro">
              <span className="vxd-eyebrow-pill">Gamificação Ativa</span>
              <h2>Loja de Recompensas</h2>
              <p>
                Troque os pontos acumulados por prêmios reais, mentorias e benefícios exclusivos.
                Cada avaliação concluída soma pontos para o seu saldo!
              </p>
            </div>
            <div className="vxd-loja-balance-card">
              <div className="vxd-balance-badge-gold">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="vxd-balance-title">Seu Saldo Atual</span>
                <div className="vxd-balance-val">{alunoAtual.pontos} <small>pontos</small></div>
              </div>
            </div>
          </div>

          {/* Grid de Prêmios */}
          <div className="vxd-premios-grid">
            {state.premios.map(premio => {
              const temSaldo = alunoAtual.pontos >= premio.pontos;
              const jaSolicitouPendente = alunoAtual.resgates.some(
                r => r.premioId === premio.id && r.status === 'pendente'
              );

              return (
                <div key={premio.id} className="vxd-premio-card">
                  <div className="vxd-premio-icon">{premio.icone}</div>
                  <div className="vxd-premio-body">
                    <h3 className="vxd-premio-title">{premio.titulo}</h3>
                    <p className="vxd-premio-desc">{premio.descricao}</p>
                    
                    <div className="vxd-premio-footer">
                      <div className="vxd-premio-cost">
                        <strong>{premio.pontos}</strong> <span>pontos</span>
                      </div>

                      <button
                        type="button"
                        className={`vxd-btn ${
                          temSaldo && !jaSolicitouPendente
                            ? 'vxd-btn-gold'
                            : 'vxd-btn-disabled'
                        }`}
                        disabled={!temSaldo || jaSolicitouPendente}
                        onClick={() => handleSolicitarResgate(premio.id, premio.titulo)}
                      >
                        {jaSolicitouPendente
                          ? 'Aguardando Aprovação'
                          : temSaldo
                          ? 'Solicitar Resgate'
                          : 'Pontos Insuficientes'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista de Resgates Solicitados pelo Aluno */}
          <div className="vxd-meus-resgates-section">
            <h3>Minhas Solicitações de Resgate</h3>
            {alunoAtual.resgates.length === 0 ? (
              <p className="vxd-empty-hint">Você ainda não solicitou nenhum resgate de prêmio.</p>
            ) : (
              <div className="vxd-table-responsive">
                <table className="vxd-table">
                  <thead>
                    <tr>
                      <th>Prêmio</th>
                      <th>Custo</th>
                      <th>Data</th>
                      <th>Status do Resgate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunoAtual.resgates.map(resgate => (
                      <tr key={resgate.id}>
                        <td>
                          <strong>{resgate.premioTitulo}</strong>
                        </td>
                        <td>{resgate.pontos} pts</td>
                        <td>{new Date(resgate.data).toLocaleDateString('pt-BR')}</td>
                        <td>
                          {resgate.status === 'pendente' && (
                            <span className="vxd-badge-warning">⏳ Pendente de Aprovação</span>
                          )}
                          {resgate.status === 'aprovado' && (
                            <span className="vxd-badge-success">✓ Aprovado pela Coordenação</span>
                          )}
                          {resgate.status === 'rejeitado' && (
                            <span className="vxd-badge-danger">✕ Recusado (Pontos Reembolsados)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 4: EXTRATO DE PONTOS                                       */}
      {/* ============================================================== */}
      {abaInterna === 'extrato' && (
        <div className="vxd-aluno-tab-content">
          <div className="vxd-section-header-row">
            <div>
              <h2>Extrato de Gamificação</h2>
              <p>Histórico completo de pontuação por avaliações e resgates de prêmios.</p>
            </div>
            <div className="vxd-extrato-summary">
              <span>Saldo Atual: <strong>{alunoAtual.pontos} pts</strong></span>
            </div>
          </div>

          <div className="vxd-table-responsive">
            <table className="vxd-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Operação</th>
                  <th>Descrição</th>
                  <th>Pontos</th>
                </tr>
              </thead>
              <tbody>
                {alunoAtual.historicoPontos.map(item => (
                  <tr key={item.id}>
                    <td>
                      {new Date(item.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      {item.tipo === 'ganho' && <span className="vxd-badge-success">Ganho de Pontos</span>}
                      {item.tipo === 'resgate' && <span className="vxd-badge-warning">Resgate de Prêmio</span>}
                      {item.tipo === 'reembolso' && <span className="vxd-badge-info">Reembolso</span>}
                    </td>
                    <td>{item.descricao}</td>
                    <td className={item.pontos >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                      {item.pontos >= 0 ? `+${item.pontos}` : item.pontos} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
