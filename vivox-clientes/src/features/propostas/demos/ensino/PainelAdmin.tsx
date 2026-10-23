import { useState, useMemo } from 'react';
import { useDemo } from './useDemo';
import {
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Layers,
  Video,
  HelpCircle,
} from 'lucide-react';

export function PainelAdmin() {
  const { state, dispatch } = useDemo();
  const [secao, setSecao] = useState<'dashboard' | 'cursos' | 'alunos' | 'questoes' | 'resgates'>('dashboard');

  // Estados de formulários simples
  const [cursoCriando, setCursoCriando] = useState(false);
  const [novoCursoTitulo, setNovoCursoTitulo] = useState('');
  const [novoCursoDesc, setNovoCursoDesc] = useState('');
  const [novoCursoCat, setNovoCursoCat] = useState('Gestão & Negócios');

  // Adicionar Módulo
  const [moduloCriandoCursoId, setModuloCriandoCursoId] = useState<string | null>(null);
  const [novoModuloTitulo, setNovoModuloTitulo] = useState('');

  // Adicionar Aula
  const [aulaCriandoTarget, setAulaCriandoTarget] = useState<{ cursoId: string; moduloId: string } | null>(null);
  const [novaAulaTitulo, setNovaAulaTitulo] = useState('');
  const [novaAulaDuracao, setNovaAulaDuracao] = useState('15:00');
  const [novaAulaVideo, setNovaAulaVideo] = useState('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');

  // Editor de Questões
  const [cursoQuestaoId, setCursoQuestaoId] = useState<string>(state.cursos[0]?.id || '');
  const [moduloQuestaoId, setModuloQuestaoId] = useState<string>(state.cursos[0]?.modulos[0]?.id || '');
  const [novaQuestaoEnunciado, setNovaQuestaoEnunciado] = useState('');
  const [novaQuestaoAlt1, setNovaQuestaoAlt1] = useState('');
  const [novaQuestaoAlt2, setNovaQuestaoAlt2] = useState('');
  const [novaQuestaoAlt3, setNovaQuestaoAlt3] = useState('');
  const [novaQuestaoAlt4, setNovaQuestaoAlt4] = useState('');
  const [novaQuestaoCorreta, setNovaQuestaoCorreta] = useState(0);
  const [novaQuestaoPontos, setNovaQuestaoPontos] = useState(50);
  const [novaQuestaoExp, setNovaQuestaoExp] = useState('');
  const [editandoQuestao, setEditandoQuestao] = useState(false);

  // Novo Prêmio
  const [novoPremioTitulo, setNovoPremioTitulo] = useState('');
  const [novoPremioDesc, setNovoPremioDesc] = useState('');
  const [novoPremioPontos, setNovoPremioPontos] = useState(100);
  const [novoPremioIcone, setNovoPremioIcone] = useState('🎁');
  const [premioCriando, setPremioCriando] = useState(false);

  // Métricas do Dashboard
  const metricas = useMemo(() => {
    const totalAlunos = state.alunos.length;
    const totalPontos = state.alunos.reduce((acc, a) => acc + a.pontos, 0);

    // Média de conclusão
    const totalAulasGerais = state.cursos.reduce(
      (acc, c) => acc + c.modulos.reduce((mAcc, m) => mAcc + m.aulas.length, 0),
      0
    );
    let somaPercentuais = 0;
    state.alunos.forEach(aluno => {
      if (totalAulasGerais > 0) {
        const perc = Math.min(100, Math.round((aluno.concluidasAulaIds.length / totalAulasGerais) * 100));
        somaPercentuais += perc;
      }
    });
    const mediaConclusao = totalAlunos > 0 ? Math.round(somaPercentuais / totalAlunos) : 0;

    // Resgates pendentes
    const todosResgates = state.alunos.flatMap(a => a.resgates);
    const pendentes = todosResgates.filter(r => r.status === 'pendente');

    return {
      totalAlunos,
      totalPontos,
      mediaConclusao,
      pendentesCount: pendentes.length,
      todosResgates,
    };
  }, [state.alunos, state.cursos]);

  // Cursos / Modulos para editor de questoes
  const cursoAtualParaQuestoes = state.cursos.find(c => c.id === cursoQuestaoId) || state.cursos[0];
  const moduloAtualParaQuestoes =
    cursoAtualParaQuestoes?.modulos.find(m => m.id === moduloQuestaoId) ||
    cursoAtualParaQuestoes?.modulos[0];

  const handleSalvarCurso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCursoTitulo.trim()) return;
    dispatch({
      type: 'CRIAR_CURSO',
      dados: {
        titulo: novoCursoTitulo,
        descricao: novoCursoDesc || 'Descrição do novo curso cadastrado pelo administrador.',
        categoria: novoCursoCat,
        capaGradiente: 'linear-gradient(135deg, #1f2937, #111827)',
      },
    });
    setNovoCursoTitulo('');
    setNovoCursoDesc('');
    setCursoCriando(false);
  };

  const handleSalvarModulo = (cursoId: string) => {
    if (!novoModuloTitulo.trim()) return;
    dispatch({ type: 'CRIAR_MODULO', cursoId, titulo: novoModuloTitulo });
    setNovoModuloTitulo('');
    setModuloCriandoCursoId(null);
  };

  const handleSalvarAula = (cursoId: string, moduloId: string) => {
    if (!novaAulaTitulo.trim()) return;
    dispatch({
      type: 'CRIAR_AULA',
      cursoId,
      moduloId,
      dados: {
        titulo: novaAulaTitulo,
        duracao: novaAulaDuracao || '10:00',
        videoUrl: novaAulaVideo,
      },
    });
    setNovaAulaTitulo('');
    setAulaCriandoTarget(null);
  };

  const handleSalvarQuestao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoAtualParaQuestoes || !moduloAtualParaQuestoes || !novaQuestaoEnunciado.trim()) return;

    dispatch({
      type: 'SALVAR_QUESTAO',
      cursoId: cursoAtualParaQuestoes.id,
      moduloId: moduloAtualParaQuestoes.id,
      questao: {
        enunciado: novaQuestaoEnunciado,
        alternativas: [
          { id: 'alt-a', texto: novaQuestaoAlt1 || 'Opção A' },
          { id: 'alt-b', texto: novaQuestaoAlt2 || 'Opção B' },
          { id: 'alt-c', texto: novaQuestaoAlt3 || 'Opção C' },
          { id: 'alt-d', texto: novaQuestaoAlt4 || 'Opção D' },
        ],
        corretaIndex: novaQuestaoCorreta,
        pontos: Number(novaQuestaoPontos) || 50,
        explicacao: novaQuestaoExp,
      },
    });

    setNovaQuestaoEnunciado('');
    setNovaQuestaoAlt1('');
    setNovaQuestaoAlt2('');
    setNovaQuestaoAlt3('');
    setNovaQuestaoAlt4('');
    setNovaQuestaoExp('');
    setEditandoQuestao(false);
  };

  const handleSalvarPremio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPremioTitulo.trim()) return;
    dispatch({
      type: 'CRIAR_PREMIO',
      dados: {
        titulo: novoPremioTitulo,
        descricao: novoPremioDesc,
        pontos: Number(novoPremioPontos) || 100,
        icone: novoPremioIcone || '🎁',
      },
    });
    setNovoPremioTitulo('');
    setNovoPremioDesc('');
    setPremioCriando(false);
  };

  return (
    <div className="vxd-admin-layout">
      {/* Barra de Subnavegação do Admin */}
      <header className="vxd-admin-header">
        <div className="vxd-admin-title">
          <span className="vxd-admin-badge">Painel de Gestão</span>
          <h2>Ambiente Administrativo</h2>
        </div>

        <nav className="vxd-admin-nav">
          <button
            type="button"
            className={`vxd-admin-tab-btn ${secao === 'dashboard' ? 'vxd-admin-tab-active' : ''}`}
            onClick={() => setSecao('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`vxd-admin-tab-btn ${secao === 'cursos' ? 'vxd-admin-tab-active' : ''}`}
            onClick={() => setSecao('cursos')}
          >
            Cursos & Módulos
          </button>
          <button
            type="button"
            className={`vxd-admin-tab-btn ${secao === 'alunos' ? 'vxd-admin-tab-active' : ''}`}
            onClick={() => setSecao('alunos')}
          >
            Alunos & Progresso
          </button>
          <button
            type="button"
            className={`vxd-admin-tab-btn ${secao === 'questoes' ? 'vxd-admin-tab-active' : ''}`}
            onClick={() => setSecao('questoes')}
          >
            Editor de Questões
          </button>
          <button
            type="button"
            className={`vxd-admin-tab-btn ${secao === 'resgates' ? 'vxd-admin-tab-active' : ''}`}
            onClick={() => setSecao('resgates')}
          >
            Resgates & Prêmios
            {metricas.pendentesCount > 0 && (
              <span className="vxd-pill-count-danger">{metricas.pendentesCount}</span>
            )}
          </button>
        </nav>
      </header>

      {/* ============================================================== */}
      {/* 1. DASHBOARD                                                    */}
      {/* ============================================================== */}
      {secao === 'dashboard' && (
        <div className="vxd-admin-content">
          <div className="vxd-metrics-grid">
            <div className="vxd-metric-card">
              <div className="vxd-metric-icon bg-blue"><Users size={24} /></div>
              <div className="vxd-metric-data">
                <span className="vxd-metric-value">{metricas.totalAlunos}</span>
                <span className="vxd-metric-label">Alunos Ativos</span>
              </div>
            </div>

            <div className="vxd-metric-card">
              <div className="vxd-metric-icon bg-green"><CheckCircle size={24} /></div>
              <div className="vxd-metric-data">
                <span className="vxd-metric-value">{metricas.mediaConclusao}%</span>
                <span className="vxd-metric-label">Conclusão Média</span>
              </div>
            </div>

            <div className="vxd-metric-card">
              <div className="vxd-metric-icon bg-gold"><Sparkles size={24} /></div>
              <div className="vxd-metric-data">
                <span className="vxd-metric-value">{metricas.totalPontos}</span>
                <span className="vxd-metric-label">Pontos em Circulação</span>
              </div>
            </div>

            <div className="vxd-metric-card">
              <div className="vxd-metric-icon bg-amber"><Clock size={24} /></div>
              <div className="vxd-metric-data">
                <span className="vxd-metric-value">{metricas.pendentesCount}</span>
                <span className="vxd-metric-label">Resgates Pendentes</span>
              </div>
            </div>
          </div>

          {/* Fila de Resgates Pendentes Imediata */}
          <div className="vxd-admin-card mt-6">
            <div className="vxd-card-header-spread">
              <div>
                <h3>Solicitações de Resgate Pendentes</h3>
                <p>Aprovações realizadas aqui refletem instantaneamente no saldo e perfil do aluno.</p>
              </div>
              <button
                type="button"
                className="vxd-btn vxd-btn-sm vxd-btn-secondary"
                onClick={() => setSecao('resgates')}
              >
                Ver todos os resgates →
              </button>
            </div>

            {metricas.todosResgates.filter(r => r.status === 'pendente').length === 0 ? (
              <div className="vxd-card-empty-sm">
                <span>✓ Nenhuma solicitação pendente no momento.</span>
              </div>
            ) : (
              <div className="vxd-table-responsive">
                <table className="vxd-table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Prêmio Solicitado</th>
                      <th>Custo</th>
                      <th>Data</th>
                      <th>Ações de Aprovação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.todosResgates
                      .filter(r => r.status === 'pendente')
                      .map(resgate => (
                        <tr key={resgate.id}>
                          <td><strong>{resgate.alunoNome}</strong></td>
                          <td>{resgate.premioTitulo}</td>
                          <td><strong>{resgate.pontos} pts</strong></td>
                          <td>{new Date(resgate.data).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <div className="vxd-btn-group">
                              <button
                                type="button"
                                className="vxd-btn vxd-btn-sm vxd-btn-success"
                                onClick={() => dispatch({ type: 'APROVAR_RESGATE', resgateId: resgate.id })}
                              >
                                <Check size={14} /> Aprovar
                              </button>
                              <button
                                type="button"
                                className="vxd-btn vxd-btn-sm vxd-btn-danger"
                                onClick={() => dispatch({ type: 'REJEITAR_RESGATE', resgateId: resgate.id })}
                              >
                                <X size={14} /> Rejeitar
                              </button>
                            </div>
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
      {/* 2. CURSOS & MÓDULOS (CRUD COMPLETO)                            */}
      {/* ============================================================== */}
      {secao === 'cursos' && (
        <div className="vxd-admin-content">
          <div className="vxd-card-header-spread">
            <div>
              <h2>Gestão de Cursos, Módulos e Aulas</h2>
              <p>Cadastre novos cursos, organize as ementas, reordene módulos e configure videoaulas.</p>
            </div>
            <button
              type="button"
              className="vxd-btn vxd-btn-primary"
              onClick={() => setCursoCriando(true)}
            >
              <Plus size={16} /> Novo Curso
            </button>
          </div>

          {cursoCriando && (
            <form className="vxd-form-box" onSubmit={handleSalvarCurso}>
              <h4>Cadastrar Novo Curso</h4>
              <div className="vxd-form-grid">
                <div className="vxd-field">
                  <label>Título do Curso</label>
                  <input
                    type="text"
                    required
                    value={novoCursoTitulo}
                    onChange={e => setNovoCursoTitulo(e.target.value)}
                    placeholder="Ex: Gestão de Projetos Avançada"
                    className="vxd-input"
                  />
                </div>
                <div className="vxd-field">
                  <label>Categoria</label>
                  <input
                    type="text"
                    value={novoCursoCat}
                    onChange={e => setNovoCursoCat(e.target.value)}
                    className="vxd-input"
                  />
                </div>
                <div className="vxd-field vxd-field-full">
                  <label>Descrição</label>
                  <textarea
                    rows={2}
                    value={novoCursoDesc}
                    onChange={e => setNovoCursoDesc(e.target.value)}
                    placeholder="Breve resumo da proposta do curso..."
                    className="vxd-input"
                  />
                </div>
              </div>
              <div className="vxd-form-actions">
                <button
                  type="button"
                  className="vxd-btn vxd-btn-secondary"
                  onClick={() => setCursoCriando(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="vxd-btn vxd-btn-primary">
                  Salvar Curso
                </button>
              </div>
            </form>
          )}

          {/* Árvore de Cursos */}
          <div className="vxd-tree-list">
            {state.cursos.map((curso, cIdx) => (
              <div key={curso.id} className="vxd-curso-tree-item">
                <div className="vxd-curso-tree-header">
                  <div className="vxd-curso-title-badge">
                    <span className="vxd-order-pill">#{cIdx + 1}</span>
                    <h3>{curso.titulo}</h3>
                    <span className={`vxd-status-pill ${curso.ativo ? 'vxd-pill-active' : 'vxd-pill-inactive'}`}>
                      {curso.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="vxd-tree-actions">
                    <button
                      type="button"
                      className="vxd-btn-icon"
                      title="Subir na ordem"
                      disabled={cIdx === 0}
                      onClick={() => dispatch({ type: 'REORDENAR_CURSO', cursoId: curso.id, direcao: 'subir' })}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="vxd-btn-icon"
                      title="Descer na ordem"
                      disabled={cIdx === state.cursos.length - 1}
                      onClick={() => dispatch({ type: 'REORDENAR_CURSO', cursoId: curso.id, direcao: 'descer' })}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      className="vxd-btn-icon"
                      title={curso.ativo ? 'Desativar curso' : 'Ativar curso'}
                      onClick={() =>
                        dispatch({
                          type: 'ATUALIZAR_CURSO',
                          cursoId: curso.id,
                          dados: { ativo: !curso.ativo },
                        })
                      }
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="vxd-btn-icon vxd-text-danger"
                      title="Excluir curso"
                      onClick={() => {
                        if (confirm(`Excluir o curso "${curso.titulo}"?`)) {
                          dispatch({ type: 'EXCLUIR_CURSO', cursoId: curso.id });
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Módulos do Curso */}
                <div className="vxd-modulos-tree-body">
                  {curso.modulos.map(modulo => (
                    <div key={modulo.id} className="vxd-modulo-tree-item">
                      <div className="vxd-modulo-tree-header">
                        <div className="vxd-mod-title-row">
                          <Layers size={16} className="vxd-icon-gold" />
                          <strong>{modulo.titulo}</strong>
                          <span className="vxd-muted-count">({modulo.aulas.length} aulas)</span>
                          {modulo.quiz && (
                            <span className="vxd-badge-info">Quiz ({modulo.quiz.questoes.length} perguntas)</span>
                          )}
                        </div>

                        <div className="vxd-tree-actions-sm">
                          <button
                            type="button"
                            className="vxd-btn vxd-btn-xs vxd-btn-secondary"
                            onClick={() => setAulaCriandoTarget({ cursoId: curso.id, moduloId: modulo.id })}
                          >
                            <Plus size={12} /> Aula
                          </button>
                          <button
                            type="button"
                            className="vxd-btn-icon-xs vxd-text-danger"
                            title="Remover módulo"
                            onClick={() => {
                              if (confirm(`Remover o módulo "${modulo.titulo}"?`)) {
                                dispatch({ type: 'EXCLUIR_MODULO', cursoId: curso.id, moduloId: modulo.id });
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Modal/Formulário para adicionar aula no módulo */}
                      {aulaCriandoTarget?.cursoId === curso.id && aulaCriandoTarget?.moduloId === modulo.id && (
                        <div className="vxd-form-box-sm">
                          <h5>Nova Aula em "{modulo.titulo}"</h5>
                          <div className="vxd-form-grid">
                            <div className="vxd-field">
                              <label>Título da Aula</label>
                              <input
                                type="text"
                                className="vxd-input"
                                value={novaAulaTitulo}
                                onChange={e => setNovaAulaTitulo(e.target.value)}
                                placeholder="Ex: Aula 03 - Métricas Chave"
                              />
                            </div>
                            <div className="vxd-field">
                              <label>Duração (MM:SS)</label>
                              <input
                                type="text"
                                className="vxd-input"
                                value={novaAulaDuracao}
                                onChange={e => setNovaAulaDuracao(e.target.value)}
                              />
                            </div>
                            <div className="vxd-field vxd-field-full">
                              <label>URL de Streaming/Embed (YouTube ou Vimeo)</label>
                              <input
                                type="text"
                                className="vxd-input"
                                value={novaAulaVideo}
                                onChange={e => setNovaAulaVideo(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="vxd-form-actions-sm">
                            <button
                              type="button"
                              className="vxd-btn vxd-btn-xs vxd-btn-secondary"
                              onClick={() => setAulaCriandoTarget(null)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="vxd-btn vxd-btn-xs vxd-btn-primary"
                              onClick={() => handleSalvarAula(curso.id, modulo.id)}
                            >
                              Adicionar Aula
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lista de Aulas do Módulo */}
                      <ul className="vxd-aulas-tree-list">
                        {modulo.aulas.map(aula => (
                          <li key={aula.id} className="vxd-aula-tree-item">
                            <div className="vxd-aula-name">
                              <Video size={14} />
                              <span>{aula.titulo}</span>
                              <small className="vxd-muted">({aula.duracao})</small>
                            </div>
                            <button
                              type="button"
                              className="vxd-btn-icon-xs vxd-text-danger"
                              onClick={() =>
                                dispatch({
                                  type: 'EXCLUIR_AULA',
                                  cursoId: curso.id,
                                  moduloId: modulo.id,
                                  aulaId: aula.id,
                                })
                              }
                            >
                              <Trash2 size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Adicionar Módulo */}
                  {moduloCriandoCursoId === curso.id ? (
                    <div className="vxd-form-box-sm">
                      <div className="vxd-field">
                        <label>Título do Módulo</label>
                        <input
                          type="text"
                          className="vxd-input"
                          value={novoModuloTitulo}
                          onChange={e => setNovoModuloTitulo(e.target.value)}
                          placeholder="Ex: Módulo 3: Prática Avançada"
                        />
                      </div>
                      <div className="vxd-form-actions-sm">
                        <button
                          type="button"
                          className="vxd-btn vxd-btn-xs vxd-btn-secondary"
                          onClick={() => setModuloCriandoCursoId(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="vxd-btn vxd-btn-xs vxd-btn-primary"
                          onClick={() => handleSalvarModulo(curso.id)}
                        >
                          Salvar Módulo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="vxd-btn vxd-btn-sm vxd-btn-secondary mt-3"
                      onClick={() => setModuloCriandoCursoId(curso.id)}
                    >
                      <Plus size={14} /> Adicionar Módulo a este Curso
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ALUNOS & DESEMPENHO                                         */}
      {/* ============================================================== */}
      {secao === 'alunos' && (
        <div className="vxd-admin-content">
          <div className="vxd-section-header-row">
            <div>
              <h2>Alunos e Acompanhamento de Desempenho</h2>
              <p>Métricas de progresso, aulas concluídas, aproveitamento em questionários e pontuação acumulada.</p>
            </div>
          </div>

          <div className="vxd-table-responsive">
            <table className="vxd-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Email</th>
                  <th>Aulas Concluídas</th>
                  <th>Quizzes Realizados</th>
                  <th>Saldo de Pontos</th>
                  <th>Resgates</th>
                </tr>
              </thead>
              <tbody>
                {state.alunos.map(aluno => (
                  <tr key={aluno.id}>
                    <td>
                      <div className="vxd-aluno-cell">
                        <span className="vxd-avatar-sm">{aluno.avatar}</span>
                        <strong>{aluno.nome}</strong>
                      </div>
                    </td>
                    <td>{aluno.email}</td>
                    <td>
                      <strong>{aluno.concluidasAulaIds.length}</strong> aulas
                    </td>
                    <td>
                      {Object.keys(aluno.quizzesConcluidos).length} avaliações
                    </td>
                    <td>
                      <span className="vxd-badge-gold">
                        <Sparkles size={12} /> {aluno.pontos} pts
                      </span>
                    </td>
                    <td>
                      {aluno.resgates.length} solicitações ({aluno.resgates.filter(r => r.status === 'aprovado').length} aprovadas)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. EDITOR DE QUESTÕES (MÚLTIPLA ESCOLHA & PONTUAÇÃO)           */}
      {/* ============================================================== */}
      {secao === 'questoes' && (
        <div className="vxd-admin-content">
          <div className="vxd-card-header-spread">
            <div>
              <h2>Editor de Avaliações e Questionários</h2>
              <p>Gerencie perguntas de múltipla escolha, respostas corretas e pontuação por acerto.</p>
            </div>
            <button
              type="button"
              className="vxd-btn vxd-btn-primary"
              onClick={() => setEditandoQuestao(true)}
            >
              <Plus size={16} /> Nova Questão
            </button>
          </div>

          {/* Seletores de Contexto */}
          <div className="vxd-questoes-filters">
            <div className="vxd-field">
              <label>Selecione o Curso</label>
              <select
                className="vxd-input"
                value={cursoAtualParaQuestoes?.id || ''}
                onChange={e => {
                  setCursoQuestaoId(e.target.value);
                  const c = state.cursos.find(item => item.id === e.target.value);
                  if (c?.modulos[0]) setModuloQuestaoId(c.modulos[0].id);
                }}
              >
                {state.cursos.map(c => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>
            </div>

            <div className="vxd-field">
              <label>Selecione o Módulo</label>
              <select
                className="vxd-input"
                value={moduloAtualParaQuestoes?.id || ''}
                onChange={e => setModuloQuestaoId(e.target.value)}
              >
                {cursoAtualParaQuestoes?.modulos.map(m => (
                  <option key={m.id} value={m.id}>{m.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Formulário de Criação/Edição de Questão */}
          {editandoQuestao && (
            <form className="vxd-form-box" onSubmit={handleSalvarQuestao}>
              <h4>Cadastrar Questão em "{moduloAtualParaQuestoes?.titulo}"</h4>
              <div className="vxd-form-grid">
                <div className="vxd-field vxd-field-full">
                  <label>Enunciado da Pergunta</label>
                  <input
                    type="text"
                    required
                    className="vxd-input"
                    value={novaQuestaoEnunciado}
                    onChange={e => setNovaQuestaoEnunciado(e.target.value)}
                    placeholder="Ex: Qual o principal benefício da liderança servidora?"
                  />
                </div>

                <div className="vxd-field">
                  <label>Alternativa A</label>
                  <input
                    type="text"
                    required
                    className="vxd-input"
                    value={novaQuestaoAlt1}
                    onChange={e => setNovaQuestaoAlt1(e.target.value)}
                  />
                </div>
                <div className="vxd-field">
                  <label>Alternativa B</label>
                  <input
                    type="text"
                    required
                    className="vxd-input"
                    value={novaQuestaoAlt2}
                    onChange={e => setNovaQuestaoAlt2(e.target.value)}
                  />
                </div>
                <div className="vxd-field">
                  <label>Alternativa C</label>
                  <input
                    type="text"
                    required
                    className="vxd-input"
                    value={novaQuestaoAlt3}
                    onChange={e => setNovaQuestaoAlt3(e.target.value)}
                  />
                </div>
                <div className="vxd-field">
                  <label>Alternativa D</label>
                  <input
                    type="text"
                    required
                    className="vxd-input"
                    value={novaQuestaoAlt4}
                    onChange={e => setNovaQuestaoAlt4(e.target.value)}
                  />
                </div>

                <div className="vxd-field">
                  <label>Qual é a alternativa correta?</label>
                  <select
                    className="vxd-input"
                    value={novaQuestaoCorreta}
                    onChange={e => setNovaQuestaoCorreta(Number(e.target.value))}
                  >
                    <option value={0}>Alternativa A</option>
                    <option value={1}>Alternativa B</option>
                    <option value={2}>Alternativa C</option>
                    <option value={3}>Alternativa D</option>
                  </select>
                </div>

                <div className="vxd-field">
                  <label>Pontos por acerto</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    step={10}
                    className="vxd-input"
                    value={novaQuestaoPontos}
                    onChange={e => setNovaQuestaoPontos(Number(e.target.value))}
                  />
                </div>

                <div className="vxd-field vxd-field-full">
                  <label>Explicação / Feedback do Gabarito</label>
                  <input
                    type="text"
                    className="vxd-input"
                    value={novaQuestaoExp}
                    onChange={e => setNovaQuestaoExp(e.target.value)}
                    placeholder="Justificativa exibida para o aluno após a submissão..."
                  />
                </div>
              </div>

              <div className="vxd-form-actions">
                <button
                  type="button"
                  className="vxd-btn vxd-btn-secondary"
                  onClick={() => setEditandoQuestao(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="vxd-btn vxd-btn-primary">
                  Salvar Questão
                </button>
              </div>
            </form>
          )}

          {/* Lista de Questões do Quiz Atual */}
          <div className="vxd-questoes-list">
            {!moduloAtualParaQuestoes?.quiz || moduloAtualParaQuestoes.quiz.questoes.length === 0 ? (
              <div className="vxd-card-empty">
                <HelpCircle size={32} className="vxd-muted" />
                <p>Nenhuma questão cadastrada para este módulo ainda.</p>
                <button
                  type="button"
                  className="vxd-btn vxd-btn-secondary"
                  onClick={() => setEditandoQuestao(true)}
                >
                  Criar Primeira Questão
                </button>
              </div>
            ) : (
              moduloAtualParaQuestoes.quiz.questoes.map((q, idx) => (
                <div key={q.id} className="vxd-admin-questao-card">
                  <div className="vxd-questao-head">
                    <div>
                      <span className="vxd-tag-gold">{q.pontos} pontos</span>
                      <h4>Questão {idx + 1}: {q.enunciado}</h4>
                    </div>
                    <button
                      type="button"
                      className="vxd-btn-icon-sm vxd-text-danger"
                      title="Excluir questão"
                      onClick={() => {
                        if (confirm('Excluir esta questão da avaliação?')) {
                          dispatch({
                            type: 'EXCLUIR_QUESTAO',
                            cursoId: cursoAtualParaQuestoes.id,
                            moduloId: moduloAtualParaQuestoes.id,
                            questaoId: q.id,
                          });
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="vxd-admin-alt-grid">
                    {q.alternativas.map((alt, aIdx) => (
                      <div
                        key={alt.id}
                        className={`vxd-admin-alt-box ${
                          aIdx === q.corretaIndex ? 'vxd-alt-correct' : ''
                        }`}
                      >
                        <strong>{String.fromCharCode(65 + aIdx)})</strong> {alt.texto}
                        {aIdx === q.corretaIndex && (
                          <span className="vxd-correct-tag">✓ Resposta Correta</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explicacao && (
                    <p className="vxd-admin-exp">
                      <strong>Comentário do gabarito:</strong> {q.explicacao}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. RESGATES & PRÊMIOS                                          */}
      {/* ============================================================== */}
      {secao === 'resgates' && (
        <div className="vxd-admin-content">
          <div className="vxd-card-header-spread">
            <div>
              <h2>Fila de Resgates e Catálogo de Recompensas</h2>
              <p>Aprove ou recuse pedidos de resgate e gerencie os itens disponíveis na loja de gamificação.</p>
            </div>
            <button
              type="button"
              className="vxd-btn vxd-btn-primary"
              onClick={() => setPremioCriando(true)}
            >
              <Plus size={16} /> Novo Prêmio
            </button>
          </div>

          {premioCriando && (
            <form className="vxd-form-box" onSubmit={handleSalvarPremio}>
              <h4>Novo Prêmio da Loja</h4>
              <div className="vxd-form-grid">
                <div className="vxd-field">
                  <label>Título do Prêmio</label>
                  <input
                    type="text"
                    required
                    className="vxd-input"
                    value={novoPremioTitulo}
                    onChange={e => setNovoPremioTitulo(e.target.value)}
                    placeholder="Ex: Mochila Executiva VIVOX"
                  />
                </div>
                <div className="vxd-field">
                  <label>Custo em Pontos</label>
                  <input
                    type="number"
                    min={50}
                    max={5000}
                    step={50}
                    className="vxd-input"
                    value={novoPremioPontos}
                    onChange={e => setNovoPremioPontos(Number(e.target.value))}
                  />
                </div>
                <div className="vxd-field">
                  <label>Emoji/Ícone</label>
                  <input
                    type="text"
                    className="vxd-input"
                    value={novoPremioIcone}
                    onChange={e => setNovoPremioIcone(e.target.value)}
                    placeholder="Ex: 🎒"
                  />
                </div>
                <div className="vxd-field vxd-field-full">
                  <label>Descrição</label>
                  <input
                    type="text"
                    className="vxd-input"
                    value={novoPremioDesc}
                    onChange={e => setNovoPremioDesc(e.target.value)}
                    placeholder="Detalhes sobre a entrega ou fruição do prêmio..."
                  />
                </div>
              </div>
              <div className="vxd-form-actions">
                <button
                  type="button"
                  className="vxd-btn vxd-btn-secondary"
                  onClick={() => setPremioCriando(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="vxd-btn vxd-btn-primary">
                  Cadastrar Prêmio
                </button>
              </div>
            </form>
          )}

          {/* Tabela de Todos os Resgates */}
          <div className="vxd-admin-card mb-6">
            <h3>Fila de Resgates Solicitados</h3>
            {metricas.todosResgates.length === 0 ? (
              <p className="vxd-empty-hint">Nenhuma solicitação de resgate registrada.</p>
            ) : (
              <div className="vxd-table-responsive">
                <table className="vxd-table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Prêmio</th>
                      <th>Pontos</th>
                      <th>Data</th>
                      <th>Status Atual</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.todosResgates.map(resgate => (
                      <tr key={resgate.id}>
                        <td><strong>{resgate.alunoNome}</strong></td>
                        <td>{resgate.premioTitulo}</td>
                        <td><strong>{resgate.pontos} pts</strong></td>
                        <td>{new Date(resgate.data).toLocaleDateString('pt-BR')}</td>
                        <td>
                          {resgate.status === 'pendente' && <span className="vxd-badge-warning">⏳ Pendente</span>}
                          {resgate.status === 'aprovado' && <span className="vxd-badge-success">✓ Aprovado</span>}
                          {resgate.status === 'rejeitado' && <span className="vxd-badge-danger">✕ Recusado</span>}
                        </td>
                        <td>
                          {resgate.status === 'pendente' ? (
                            <div className="vxd-btn-group">
                              <button
                                type="button"
                                className="vxd-btn vxd-btn-xs vxd-btn-success"
                                onClick={() => dispatch({ type: 'APROVAR_RESGATE', resgateId: resgate.id })}
                              >
                                Aprovar
                              </button>
                              <button
                                type="button"
                                className="vxd-btn vxd-btn-xs vxd-btn-danger"
                                onClick={() => dispatch({ type: 'REJEITAR_RESGATE', resgateId: resgate.id })}
                              >
                                Rejeitar
                              </button>
                            </div>
                          ) : (
                            <span className="vxd-muted">Concluído</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Catálogo de Prêmios */}
          <div className="vxd-admin-card">
            <h3>Prêmios Ativos na Plataforma</h3>
            <div className="vxd-premios-admin-grid">
              {state.premios.map(premio => (
                <div key={premio.id} className="vxd-premio-admin-card">
                  <div className="vxd-premio-admin-top">
                    <span className="vxd-premio-emoji">{premio.icone}</span>
                    <button
                      type="button"
                      className={`vxd-badge-toggle ${premio.disponivel ? 'vxd-toggle-on' : 'vxd-toggle-off'}`}
                      onClick={() =>
                        dispatch({
                          type: 'ATUALIZAR_PREMIO',
                          premioId: premio.id,
                          dados: { disponivel: !premio.disponivel },
                        })
                      }
                    >
                      {premio.disponivel ? 'Disponível' : 'Pausado'}
                    </button>
                  </div>
                  <h4>{premio.titulo}</h4>
                  <p>{premio.descricao}</p>
                  <div className="vxd-premio-admin-pts">
                    <strong>{premio.pontos}</strong> pontos necessários
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
