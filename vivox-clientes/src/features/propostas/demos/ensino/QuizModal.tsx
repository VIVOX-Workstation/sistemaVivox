import { useState } from 'react';
import { useDemo } from './useDemo';
import { X, CheckCircle, AlertCircle, Award, ArrowRight, RotateCcw } from 'lucide-react';

export function QuizModal() {
  const { state, dispatch, alunoAtual } = useDemo();
  const ativo = state.quizAtivoModal;

  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [finalizado, setFinalizado] = useState(false);
  const [resultado, setResultado] = useState<{
    acertos: number;
    total: number;
    pontosGanhos: number;
    jaHaviaPontuado: boolean;
  } | null>(null);

  if (!ativo) return null;

  const { quiz, cursoId, moduloId } = ativo;
  const historicoPrevio = alunoAtual?.quizzesConcluidos[quiz.id];

  const handleSelect = (questaoIdx: number, altIdx: number) => {
    if (finalizado) return;
    setRespostas(prev => ({ ...prev, [questaoIdx]: altIdx }));
  };

  const todasRespondidas = quiz.questoes.every((_, idx) => respostas[idx] !== undefined);

  const submeter = () => {
    if (!todasRespondidas) return;

    let acertos = 0;
    let pontosCalculados = 0;
    quiz.questoes.forEach((q, idx) => {
      if (respostas[idx] === q.corretaIndex) {
        acertos += 1;
        pontosCalculados += q.pontos;
      }
    });

    const jaHaviaPontuado = Boolean(historicoPrevio);
    const pontosGanhos = jaHaviaPontuado ? 0 : pontosCalculados;

    dispatch({
      type: 'FINALIZAR_QUIZ',
      quizId: quiz.id,
      cursoId,
      moduloId,
      respostas: quiz.questoes.map((_, idx) => respostas[idx] ?? -1),
    });

    setResultado({
      acertos,
      total: quiz.questoes.length,
      pontosGanhos,
      jaHaviaPontuado,
    });
    setFinalizado(true);
  };

  const reiniciar = () => {
    setRespostas({});
    setFinalizado(false);
    setResultado(null);
  };

  const fechar = () => {
    dispatch({ type: 'FECHAR_QUIZ' });
  };

  return (
    <div className="vxd-modal-overlay" onClick={fechar}>
      <div className="vxd-modal-container" onClick={e => e.stopPropagation()}>
        {/* Cabeçalho do Quiz */}
        <div className="vxd-modal-header">
          <div className="vxd-modal-title-group">
            <span className="vxd-modal-eyebrow">Avaliação por Módulo</span>
            <h2>{quiz.titulo}</h2>
          </div>
          <button type="button" className="vxd-btn-close" onClick={fechar} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="vxd-modal-body">
          {finalizado && resultado ? (
            <div className="vxd-quiz-resultado-card">
              <div className="vxd-quiz-score-circle">
                <Award className="vxd-icon-gold" size={48} />
                <span className="vxd-score-num">
                  {resultado.acertos} / {resultado.total}
                </span>
                <span className="vxd-score-label">Questões Corretas</span>
              </div>

              <div className="vxd-quiz-feedback-box">
                {resultado.acertos === resultado.total ? (
                  <p className="vxd-feedback-p text-success">
                    🎉 <strong>Excelente desempenho!</strong> Você acertou todas as questões do módulo!
                  </p>
                ) : (
                  <p className="vxd-feedback-p text-warning">
                    💡 Bom aproveitamento! Revise as explicações abaixo para consolidar seu aprendizado.
                  </p>
                )}

                {resultado.pontosGanhos > 0 ? (
                  <div className="vxd-points-awarded-pill">
                    ⭐️ <strong>+{resultado.pontosGanhos} pontos</strong> creditados ao seu saldo!
                  </div>
                ) : (
                  <div className="vxd-points-already-pill">
                    ℹ️ Você já havia concluído este quiz anteriormente. Os pontos foram mantidos sem duplicação.
                  </div>
                )}
              </div>

              {/* Gabarito comentado */}
              <div className="vxd-quiz-gabarito-list">
                <h3>Gabarito e Feedback Detalhado</h3>
                {quiz.questoes.map((q, idx) => {
                  const acertou = respostas[idx] === q.corretaIndex;
                  return (
                    <div
                      key={q.id}
                      className={`vxd-gabarito-item ${acertou ? 'vxd-gab-certo' : 'vxd-gab-errado'}`}
                    >
                      <div className="vxd-gab-status">
                        {acertou ? (
                          <span className="vxd-tag-success"><CheckCircle size={14} /> Acertou (+{q.pontos} pts)</span>
                        ) : (
                          <span className="vxd-tag-danger"><AlertCircle size={14} /> Incorreta</span>
                        )}
                      </div>
                      <p className="vxd-gab-enunciado">
                        <strong>Questão {idx + 1}:</strong> {q.enunciado}
                      </p>
                      <p className="vxd-gab-resp">
                        <strong>Sua resposta:</strong>{' '}
                        {respostas[idx] !== undefined ? q.alternativas[respostas[idx]]?.texto : 'Não respondeu'}
                      </p>
                      {!acertou && (
                        <p className="vxd-gab-correta">
                          <strong>Resposta correta:</strong> {q.alternativas[q.corretaIndex]?.texto}
                        </p>
                      )}
                      {q.explicacao && (
                        <p className="vxd-gab-exp">
                          <em>Explicação: {q.explicacao}</em>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="vxd-quiz-questoes-list">
              <div className="vxd-quiz-info-strip">
                <span>Total: {quiz.questoes.length} perguntas de múltipla escolha</span>
                <span>Valor: {quiz.questoes.reduce((acc, q) => acc + q.pontos, 0)} pontos totais</span>
              </div>

              {quiz.questoes.map((q, qIdx) => (
                <div key={q.id} className="vxd-questao-card">
                  <div className="vxd-questao-header">
                    <span className="vxd-questao-num">Pergunta {qIdx + 1} de {quiz.questoes.length}</span>
                    <span className="vxd-questao-val">{q.pontos} pontos</span>
                  </div>
                  <h4 className="vxd-questao-enunciado">{q.enunciado}</h4>

                  <div className="vxd-alternativas-list">
                    {q.alternativas.map((alt, altIdx) => {
                      const selecionada = respostas[qIdx] === altIdx;
                      return (
                        <label
                          key={alt.id}
                          className={`vxd-alternativa-item ${selecionada ? 'vxd-alt-selecionada' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`questao-${qIdx}`}
                            checked={selecionada}
                            onChange={() => handleSelect(qIdx, altIdx)}
                            className="vxd-radio"
                          />
                          <span className="vxd-alt-label">{String.fromCharCode(65 + altIdx)}</span>
                          <span className="vxd-alt-texto">{alt.texto}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="vxd-modal-footer">
          {finalizado ? (
            <div className="vxd-footer-btns-spread">
              <button type="button" className="vxd-btn vxd-btn-secondary" onClick={reiniciar}>
                <RotateCcw size={16} /> Refazer Teste
              </button>
              <button type="button" className="vxd-btn vxd-btn-primary" onClick={fechar}>
                Concluir e Fechar
              </button>
            </div>
          ) : (
            <div className="vxd-footer-btns-end">
              <button type="button" className="vxd-btn vxd-btn-secondary" onClick={fechar}>
                Cancelar
              </button>
              <button
                type="button"
                className="vxd-btn vxd-btn-primary"
                disabled={!todasRespondidas}
                onClick={submeter}
              >
                Enviar Respostas <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
