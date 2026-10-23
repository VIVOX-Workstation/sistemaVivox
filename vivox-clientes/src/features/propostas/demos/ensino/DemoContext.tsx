import { useReducer, type ReactNode } from 'react';
import type { Curso, Modulo, Aula, Questao, Resgate } from './types';
import { cursosIniciais, premiosIniciais, alunosIniciais } from './seed';
import { DemoContext, type DemoState, type DemoAction } from './contextDef';

const estadoInicial: DemoState = {
  cursos: cursosIniciais,
  premios: premiosIniciais,
  alunos: alunosIniciais,
  alunoAtualId: 'aluno-demo',
  ambiente: 'aluno',
  cursoAtivoId: null,
  aulaAtivaId: null,
  quizAtivoModal: null,
};

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'SET_AMBIENTE':
      return { ...state, ambiente: action.ambiente };

    case 'LOGIN_ALUNO':
      return { ...state, alunoAtualId: action.alunoId };

    case 'LOGOUT_ALUNO':
      return { ...state, alunoAtualId: null, cursoAtivoId: null, aulaAtivaId: null };

    case 'SELECIONAR_CURSO':
      return { ...state, cursoAtivoId: action.cursoId, aulaAtivaId: null };

    case 'SELECIONAR_AULA': {
      const { cursoId, aulaId } = action;
      const alunosAtualizados = state.alunos.map(aluno => {
        if (aluno.id === state.alunoAtualId) {
          return { ...aluno, ultimaAula: { cursoId, aulaId } };
        }
        return aluno;
      });
      return {
        ...state,
        cursoAtivoId: cursoId,
        aulaAtivaId: aulaId,
        alunos: alunosAtualizados,
      };
    }

    case 'ABRIR_QUIZ': {
      const curso = state.cursos.find(c => c.id === action.cursoId);
      const modulo = curso?.modulos.find(m => m.id === action.moduloId);
      if (!modulo?.quiz) return state;
      return {
        ...state,
        quizAtivoModal: {
          cursoId: action.cursoId,
          moduloId: action.moduloId,
          quiz: modulo.quiz,
        },
      };
    }

    case 'FECHAR_QUIZ':
      return { ...state, quizAtivoModal: null };

    case 'TOGGLE_CONCLUIR_AULA': {
      if (!state.alunoAtualId) return state;
      const alunos = state.alunos.map(aluno => {
        if (aluno.id !== state.alunoAtualId) return aluno;
        const jaConcluida = aluno.concluidasAulaIds.includes(action.aulaId);
        const concluidas = jaConcluida
          ? aluno.concluidasAulaIds.filter(id => id !== action.aulaId)
          : [...aluno.concluidasAulaIds, action.aulaId];
        return { ...aluno, concluidasAulaIds: concluidas };
      });
      return { ...state, alunos };
    }

    case 'FINALIZAR_QUIZ': {
      if (!state.alunoAtualId) return state;
      const curso = state.cursos.find(c => c.id === action.cursoId);
      const modulo = curso?.modulos.find(m => m.id === action.moduloId);
      const quiz = modulo?.quiz;
      if (!quiz) return state;

      let acertos = 0;
      let totalPontosPossiveis = 0;
      quiz.questoes.forEach((q, idx) => {
        if (action.respostas[idx] === q.corretaIndex) {
          acertos += 1;
          totalPontosPossiveis += q.pontos;
        }
      });

      const aluno = state.alunos.find(a => a.id === state.alunoAtualId);
      if (!aluno) return state;

      const jaHaviaConcluido = Boolean(aluno.quizzesConcluidos[action.quizId]);

      // Se já havia feito e recebido pontos, não duplica pontos
      const pontosGanhos = jaHaviaConcluido ? 0 : totalPontosPossiveis;

      const novosHistorico = [...aluno.historicoPontos];
      if (pontosGanhos > 0) {
        novosHistorico.unshift({
          id: `trans-${Date.now()}`,
          data: new Date().toISOString(),
          tipo: 'ganho',
          descricao: `Avaliação: ${quiz.titulo} (${acertos}/${quiz.questoes.length} acertos)`,
          pontos: pontosGanhos,
        });
      }

      const alunos = state.alunos.map(a => {
        if (a.id !== state.alunoAtualId) return a;
        return {
          ...a,
          pontos: a.pontos + pontosGanhos,
          quizzesConcluidos: {
            ...a.quizzesConcluidos,
            [action.quizId]: {
              acertos,
              total: quiz.questoes.length,
              pontosGanhos: jaHaviaConcluido ? aluno.quizzesConcluidos[action.quizId]!.pontosGanhos : pontosGanhos,
              respondidoEm: new Date().toISOString(),
            },
          },
          historicoPontos: novosHistorico,
        };
      });

      return { ...state, alunos };
    }

    case 'SOLICITAR_RESGATE': {
      if (!state.alunoAtualId) return state;
      const premio = state.premios.find(p => p.id === action.premioId);
      const aluno = state.alunos.find(a => a.id === state.alunoAtualId);
      if (!premio || !aluno || aluno.pontos < premio.pontos) return state;

      const novoResgate: Resgate = {
        id: `resg-${Date.now()}`,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        premioId: premio.id,
        premioTitulo: premio.titulo,
        pontos: premio.pontos,
        data: new Date().toISOString(),
        status: 'pendente',
      };

      const alunos = state.alunos.map(a => {
        if (a.id !== state.alunoAtualId) return a;
        return {
          ...a,
          pontos: a.pontos - premio.pontos,
          resgates: [novoResgate, ...a.resgates],
          historicoPontos: [
            {
              id: `trans-${Date.now()}`,
              data: new Date().toISOString(),
              tipo: 'resgate' as const,
              descricao: `Solicitação de resgate: ${premio.titulo}`,
              pontos: -premio.pontos,
            },
            ...a.historicoPontos,
          ],
        };
      });

      return { ...state, alunos };
    }

    case 'APROVAR_RESGATE': {
      const alunos = state.alunos.map(aluno => {
        const resgateIdx = aluno.resgates.findIndex(r => r.id === action.resgateId);
        if (resgateIdx === -1) return aluno;
        const resgates = aluno.resgates.map(r => (r.id === action.resgateId ? { ...r, status: 'aprovado' as const } : r));
        return { ...aluno, resgates };
      });
      return { ...state, alunos };
    }

    case 'REJEITAR_RESGATE': {
      const alunos = state.alunos.map(aluno => {
        const resgate = aluno.resgates.find(r => r.id === action.resgateId);
        if (!resgate || resgate.status !== 'pendente') return aluno;
        const resgates = aluno.resgates.map(r => (r.id === action.resgateId ? { ...r, status: 'rejeitado' as const } : r));
        return {
          ...aluno,
          pontos: aluno.pontos + resgate.pontos,
          resgates,
          historicoPontos: [
            {
              id: `trans-ref-${Date.now()}`,
              data: new Date().toISOString(),
              tipo: 'reembolso' as const,
              descricao: `Reembolso por recusa de resgate: ${resgate.premioTitulo}`,
              pontos: resgate.pontos,
            },
            ...aluno.historicoPontos,
          ],
        };
      });
      return { ...state, alunos };
    }

    case 'CRIAR_CURSO': {
      const novoCurso: Curso = {
        id: `c-${Date.now()}`,
        titulo: action.dados.titulo,
        descricao: action.dados.descricao,
        categoria: action.dados.categoria,
        capaGradiente: action.dados.capaGradiente || 'linear-gradient(135deg, #1f2937, #374151)',
        ativo: true,
        ordem: state.cursos.length + 1,
        modulos: [],
      };
      return { ...state, cursos: [...state.cursos, novoCurso] };
    }

    case 'ATUALIZAR_CURSO': {
      const cursos = state.cursos.map(c => (c.id === action.cursoId ? { ...c, ...action.dados } : c));
      return { ...state, cursos };
    }

    case 'EXCLUIR_CURSO': {
      const cursos = state.cursos.filter(c => c.id !== action.cursoId);
      return {
        ...state,
        cursos,
        cursoAtivoId: state.cursoAtivoId === action.cursoId ? null : state.cursoAtivoId,
        aulaAtivaId: state.cursoAtivoId === action.cursoId ? null : state.aulaAtivaId,
      };
    }

    case 'REORDENAR_CURSO': {
      const idx = state.cursos.findIndex(c => c.id === action.cursoId);
      if (idx === -1) return state;
      const targetIdx = action.direcao === 'subir' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= state.cursos.length) return state;
      const novos = [...state.cursos];
      [novos[idx], novos[targetIdx]] = [novos[targetIdx]!, novos[idx]!];
      return { ...state, cursos: novos.map((c, i) => ({ ...c, ordem: i + 1 })) };
    }

    case 'CRIAR_MODULO': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const novoModulo: Modulo = {
          id: `m-${Date.now()}`,
          cursoId: c.id,
          titulo: action.titulo,
          ordem: c.modulos.length + 1,
          aulas: [],
        };
        return { ...c, modulos: [...c.modulos, novoModulo] };
      });
      return { ...state, cursos };
    }

    case 'ATUALIZAR_MODULO': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const modulos = c.modulos.map(m => (m.id === action.moduloId ? { ...m, titulo: action.titulo } : m));
        return { ...c, modulos };
      });
      return { ...state, cursos };
    }

    case 'EXCLUIR_MODULO': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const modulos = c.modulos.filter(m => m.id !== action.moduloId);
        return { ...c, modulos };
      });
      return { ...state, cursos };
    }

    case 'CRIAR_AULA': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const modulos = c.modulos.map(m => {
          if (m.id !== action.moduloId) return m;
          const novaAula: Aula = {
            id: `a-${Date.now()}`,
            moduloId: m.id,
            titulo: action.dados.titulo,
            duracao: action.dados.duracao || '10:00',
            videoUrl: action.dados.videoUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            descricao: action.dados.descricao,
            ordem: m.aulas.length + 1,
          };
          return { ...m, aulas: [...m.aulas, novaAula] };
        });
        return { ...c, modulos };
      });
      return { ...state, cursos };
    }

    case 'ATUALIZAR_AULA': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const modulos = c.modulos.map(m => {
          if (m.id !== action.moduloId) return m;
          const aulas = m.aulas.map(a => (a.id === action.aulaId ? { ...a, ...action.dados } : a));
          return { ...m, aulas };
        });
        return { ...c, modulos };
      });
      return { ...state, cursos };
    }

    case 'EXCLUIR_AULA': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const modulos = c.modulos.map(m => {
          if (m.id !== action.moduloId) return m;
          const aulas = m.aulas.filter(a => a.id !== action.aulaId);
          return { ...m, aulas };
        });
        return { ...c, modulos };
      });
      return {
        ...state,
        cursos,
        aulaAtivaId: state.aulaAtivaId === action.aulaId ? null : state.aulaAtivaId,
      };
    }

    case 'SALVAR_QUESTAO': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const modulos = c.modulos.map(m => {
          if (m.id !== action.moduloId) return m;
          const quizAtual = m.quiz || {
            id: `q-${Date.now()}`,
            moduloId: m.id,
            titulo: `Avaliação: ${m.titulo}`,
            questoes: [],
          };
          let novasQuestoes: Questao[];
          if (action.questao.id) {
            novasQuestoes = quizAtual.questoes.map(q =>
              q.id === action.questao.id ? ({ ...q, ...action.questao } as Questao) : q
            );
          } else {
            const novaQ: Questao = {
              id: `q-${Date.now()}`,
              enunciado: action.questao.enunciado,
              alternativas: action.questao.alternativas,
              corretaIndex: action.questao.corretaIndex,
              pontos: action.questao.pontos || 50,
              explicacao: action.questao.explicacao,
            };
            novasQuestoes = [...quizAtual.questoes, novaQ];
          }
          return { ...m, quiz: { ...quizAtual, questoes: novasQuestoes } };
        });
        return { ...c, modulos };
      });
      return { ...state, cursos };
    }

    case 'EXCLUIR_QUESTAO': {
      const cursos = state.cursos.map(c => {
        if (c.id !== action.cursoId) return c;
        const modulos = c.modulos.map(m => {
          if (m.id !== action.moduloId || !m.quiz) return m;
          const questoes = m.quiz.questoes.filter(q => q.id !== action.questaoId);
          return { ...m, quiz: { ...m.quiz, questoes } };
        });
        return { ...c, modulos };
      });
      return { ...state, cursos };
    }

    case 'CRIAR_PREMIO': {
      const novoPremio = {
        id: `p-${Date.now()}`,
        titulo: action.dados.titulo,
        descricao: action.dados.descricao,
        pontos: action.dados.pontos,
        icone: action.dados.icone || '🎁',
        disponivel: true,
      };
      return { ...state, premios: [...state.premios, novoPremio] };
    }

    case 'ATUALIZAR_PREMIO': {
      const premios = state.premios.map(p => (p.id === action.premioId ? { ...p, ...action.dados } : p));
      return { ...state, premios };
    }

    default:
      return state;
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, estadoInicial);

  const alunoAtual = state.alunos.find(a => a.id === state.alunoAtualId);
  const todosResgates = state.alunos.flatMap(a => a.resgates);

  return (
    <DemoContext.Provider value={{ state, dispatch, alunoAtual, todosResgates }}>
      {children}
    </DemoContext.Provider>
  );
}
