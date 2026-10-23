import type { Curso, Premio, Aluno } from './types';

export const cursosIniciais: Curso[] = [
  {
    id: 'c1',
    titulo: 'Liderança Estratégica e Gestão de Pessoas',
    descricao: 'Domine técnicas modernas de liderança, delegação eficaz, cultura de alta performance e resolução de conflitos em equipes multidisciplinares.',
    capaGradiente: 'linear-gradient(135deg, #1e1b18 0%, #3d2f1d 50%, #876228 100%)',
    categoria: 'Gestão & Negócios',
    ativo: true,
    ordem: 1,
    modulos: [
      {
        id: 'm1',
        cursoId: 'c1',
        titulo: 'Módulo 1: Fundamentos da Liderança Moderna',
        ordem: 1,
        aulas: [
          {
            id: 'a1',
            moduloId: 'm1',
            titulo: 'Aula 1: O Papel do Líder no Século XXI',
            duracao: '14:20',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 1,
            descricao: 'Visão sistêmica sobre o papel do gestor contemporâneo, transitando de chefe controlador para facilitador de resultados e mentor de pessoas.'
          },
          {
            id: 'a2',
            moduloId: 'm1',
            titulo: 'Aula 2: Delegação com Propósito e Autonomia',
            duracao: '18:45',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 2,
            descricao: 'Como definir metas claras, estabelecer alinhamentos de expectativas e conceder autonomia com responsabilidade.'
          },
          {
            id: 'a3',
            moduloId: 'm1',
            titulo: 'Aula 3: Cultura de Responsabilização (Accountability)',
            duracao: '16:10',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 3,
            descricao: 'Estruturação de rituais de acompanhamento e prestação de contas que engajam ao invés de desmotivar.'
          }
        ],
        quiz: {
          id: 'q1',
          moduloId: 'm1',
          titulo: 'Avaliação de Conhecimento — Fundamentos da Liderança',
          questoes: [
            {
              id: 'q1_1',
              enunciado: 'Qual a principal diferença entre liderança tradicional e a liderança servidora contemporânea?',
              alternativas: [
                { id: 'alt1', texto: 'A liderança tradicional foca apenas em prazos; a moderna ignora metas financeiras.' },
                { id: 'alt2', texto: 'A moderna atua como facilitadora e mentora, desenvolvendo a autonomia da equipe em direção aos objetivos.' },
                { id: 'alt3', texto: 'A contemporânea delega todas as decisões sem acompanhamento ou rituais de checagem.' },
                { id: 'alt4', texto: 'Não há diferença significativa além dos termos utilizados em apresentações corporativas.' }
              ],
              corretaIndex: 1,
              pontos: 50,
              explicacao: 'O líder contemporâneo atua eliminando barreiras e capacitando o time para alcançar resultados superiores com autonomia.'
            },
            {
              id: 'q2_2',
              enunciado: 'Ao delegar uma tarefa crítica para um liderado, qual o passo fundamental para garantir o alinhamento?',
              alternativas: [
                { id: 'alt5', texto: 'Explicar o objetivo final, critérios de sucesso e combinar marcos intermediários de revisão.' },
                { id: 'alt6', texto: 'Cobrar atualizações diárias a cada hora para certificar-se da execução.' },
                { id: 'alt7', texto: 'Aguardar a data de entrega sem qualquer contato intermediário.' },
                { id: 'alt8', texto: 'Repassar a tarefa sem explicar o contexto estratégico para evitar sobrecarga.' }
              ],
              corretaIndex: 0,
              pontos: 50,
              explicacao: 'Definir claramente o "porquê", o "o quê" e pontos de verificação cria segurança mútua e foco no resultado.'
            },
            {
              id: 'q3_3',
              enunciado: 'O que caracteriza uma cultura saudável de accountability em um time de alto rendimento?',
              alternativas: [
                { id: 'alt9', texto: 'Procura de culpados imediatos diante de qualquer desvio no cronograma.' },
                { id: 'alt10', texto: 'Compromisso transparente com compromissos assumidos e postura ativa na solução de problemas.' },
                { id: 'alt11', texto: 'Centralização de todas as aprovações na diretoria executiva.' },
                { id: 'alt12', texto: 'Ausência total de métricas ou indicadores quantitativos de desempenho.' }
              ],
              corretaIndex: 1,
              pontos: 50,
              explicacao: 'Accountability é assumir a responsabilidade pelo resultado antes, durante e depois da execução.'
            }
          ]
        }
      },
      {
        id: 'm2',
        cursoId: 'c1',
        titulo: 'Módulo 2: Comunicação Estratégica e Feedbacks',
        ordem: 2,
        aulas: [
          {
            id: 'a4',
            moduloId: 'm2',
            titulo: 'Aula 1: Modelos de Feedback Construtivo (SBI)',
            duracao: '15:30',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 1,
            descricao: 'Aplicação prática do método Situação-Comportamento-Impacto para conversas difíceis sem atrito emocional.'
          },
          {
            id: 'a5',
            moduloId: 'm2',
            titulo: 'Aula 2: Alinhamento de Expectativas e Reuniões 1-on-1',
            duracao: '20:15',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 2,
            descricao: 'Como estruturar reuniões periódicas individuais que geram confiança e destravam o potencial da equipe.'
          }
        ],
        quiz: {
          id: 'q2',
          moduloId: 'm2',
          titulo: 'Avaliação de Conhecimento — Feedback & Comunicação',
          questoes: [
            {
              id: 'q2_1',
              enunciado: 'Na metodologia de feedback SBI, o que significa a sigla?',
              alternativas: [
                { id: 'sb1', texto: 'Sistema, Balanço e Indicador' },
                { id: 'sb2', texto: 'Situação, Comportamento e Impacto' },
                { id: 'sb3', texto: 'Supervisão, Bloqueio e Instrução' },
                { id: 'sb4', texto: 'Sinergia, Benefício e Inovação' }
              ],
              corretaIndex: 1,
              pontos: 50,
              explicacao: 'SBI (Situation, Behavior, Impact) descreve o momento exato, a ação observável e o efeito gerado.'
            },
            {
              id: 'q2_2',
              enunciado: 'Qual a principal finalidade de uma reunião 1-on-1 entre líder e liderado?',
              alternativas: [
                { id: 'sb5', texto: 'Apenas cobrança de metas da semana.' },
                { id: 'sb6', texto: 'Um espaço de escuta ativa dedicado ao desenvolvimento, carreira e destrave de obstáculos do liderado.' },
                { id: 'sb7', texto: 'Substituir as reuniões de status geral da equipe.' },
                { id: 'sb8', texto: 'Aplicar advertências formais de RH.' }
              ],
              corretaIndex: 1,
              pontos: 50,
              explicacao: 'A 1-on-1 pertence primordialmente ao liderado para alinhamento contínuo e desenvolvimento humano.'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'c2',
    titulo: 'Marketing Digital e Aquisição de Clientes',
    descricao: 'Estratégias consolidadas de funis de atração, inbound marketing, nutrição de leads e campanhas focadas em ROI e vendas consistentes.',
    capaGradiente: 'linear-gradient(135deg, #111e2e 0%, #17385c 50%, #2b74b8 100%)',
    categoria: 'Marketing & Vendas',
    ativo: true,
    ordem: 2,
    modulos: [
      {
        id: 'm3',
        cursoId: 'c2',
        titulo: 'Módulo 1: Funis de Conversão e Posicionamento',
        ordem: 1,
        aulas: [
          {
            id: 'a6',
            moduloId: 'm3',
            titulo: 'Aula 1: Anatomia de um Funil de Vendas de Alta Conversão',
            duracao: '19:40',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 1,
            descricao: 'Etapas de topo, meio e fundo de funil, com métricas chave e taxas de passagem saudáveis em cada estágio.'
          },
          {
            id: 'a7',
            moduloId: 'm3',
            titulo: 'Aula 2: Proposta Única de Valor e Diferenciação',
            duracao: '17:50',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 2,
            descricao: 'Construção da narrativa que posiciona sua oferta como a escolha inevitável para seu cliente ideal.'
          }
        ],
        quiz: {
          id: 'q3',
          moduloId: 'm3',
          titulo: 'Quiz Rápido: Funis de Vendas',
          questoes: [
            {
              id: 'q3_1',
              enunciado: 'Qual a principal métrica para avaliar a eficiência do topo para o meio do funil?',
              alternativas: [
                { id: 'f1', texto: 'Custo de Aquisição de Clientes (CAC) imediato.' },
                { id: 'f2', texto: 'Taxa de conversão de visitantes em leads qualificados.' },
                { id: 'f3', texto: 'Número de curtidas no perfil social.' },
                { id: 'f4', texto: 'Tempo médio de carregamento dos servidores.' }
              ],
              corretaIndex: 1,
              pontos: 50,
              explicacao: 'A conversão de visitantes anônimos em contatos identificados valida a atratividade da isca ou proposta inicial.'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'c3',
    titulo: 'Inovação Ágil e Transformação Digital',
    descricao: 'Como aplicar frameworks ágeis como Scrum e Kanban para acelerar entregas, testar hipóteses rapidamente e inovar com foco no usuário.',
    capaGradiente: 'linear-gradient(135deg, #10261e 0%, #19523c 50%, #319e73 100%)',
    categoria: 'Inovação & Tecnologia',
    ativo: true,
    ordem: 3,
    modulos: [
      {
        id: 'm4',
        cursoId: 'c3',
        titulo: 'Módulo 1: Mentalidade Ágil e Ciclos Curtos',
        ordem: 1,
        aulas: [
          {
            id: 'a8',
            moduloId: 'm4',
            titulo: 'Aula 1: O Manifesto Ágil na Prática Corporativa',
            duracao: '13:15',
            videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            ordem: 1,
            descricao: 'Os 4 valores e 12 princípios traduzidos para a operação diária de empresas modernas.'
          }
        ]
      }
    ]
  }
];

export const premiosIniciais: Premio[] = [
  {
    id: 'p1',
    titulo: 'Sessão Individual de Mentoria 1-on-1 (45 min)',
    descricao: 'Encontro exclusivo online com especialista sênior para aceleração de carreira e resolução de desafios práticos.',
    pontos: 400,
    icone: '🎓',
    disponivel: true
  },
  {
    id: 'p2',
    titulo: 'Camiseta Oficial VIVOX Academy',
    descricao: 'Camiseta de algodão egípcio com estampa exclusiva da comunidade, entregue diretamente no endereço informado.',
    pontos: 150,
    icone: '👕',
    disponivel: true
  },
  {
    id: 'p3',
    titulo: 'Livro "Estratégia & Liderança Exponencial"',
    descricao: 'Exemplar físico do best-seller autografado, com dicas táticas para transformar sua gestão.',
    pontos: 200,
    icone: '📚',
    disponivel: true
  },
  {
    id: 'p4',
    titulo: 'Acesso VIP ao Fórum de Líderes por 6 Meses',
    descricao: 'Entrada exclusiva na comunidade restrita de executivos com networking diário e estudos de caso confidenciais.',
    pontos: 300,
    icone: '💎',
    disponivel: true
  },
  {
    id: 'p5',
    titulo: 'Certificado Físico Premium com Selo Holográfico',
    descricao: 'Emissão e envio postal do diploma com moldura comemorativa e selo de excelência acadêmica.',
    pontos: 100,
    icone: '📜',
    disponivel: true
  }
];

export const alunosIniciais: Aluno[] = [
  {
    id: 'aluno-demo',
    nome: 'Mariana Silva',
    email: 'mariana.silva@exemplo.com',
    avatar: '👩‍💼',
    pontos: 250,
    concluidasAulaIds: ['a1', 'a2'],
    quizzesConcluidos: {
      'q1': {
        acertos: 3,
        total: 3,
        pontosGanhos: 150,
        respondidoEm: '2026-10-21T14:30:00.000Z'
      }
    },
    resgates: [
      {
        id: 'resg-1',
        alunoId: 'aluno-demo',
        alunoNome: 'Mariana Silva',
        premioId: 'p2',
        premioTitulo: 'Camiseta Oficial VIVOX Academy',
        pontos: 150,
        data: '2026-10-22T09:15:00.000Z',
        status: 'pendente'
      }
    ],
    historicoPontos: [
      {
        id: 't1',
        data: '2026-10-20T10:00:00.000Z',
        tipo: 'ganho',
        descricao: 'Bônus de boas-vindas na plataforma',
        pontos: 100
      },
      {
        id: 't2',
        data: '2026-10-21T14:30:00.000Z',
        tipo: 'ganho',
        descricao: 'Avaliação: Fundamentos da Liderança (3/3 acertos)',
        pontos: 150
      },
      {
        id: 't3',
        data: '2026-10-22T09:15:00.000Z',
        tipo: 'resgate',
        descricao: 'Resgate de prêmio: Camiseta Oficial VIVOX Academy',
        pontos: -150
      }
    ],
    ultimaAula: {
      cursoId: 'c1',
      aulaId: 'a3'
    }
  },
  {
    id: 'aluno-2',
    nome: 'Carlos Eduardo Costa',
    email: 'carlos.costa@empresa.com.br',
    avatar: '👨‍💼',
    pontos: 450,
    concluidasAulaIds: ['a1', 'a2', 'a3', 'a4', 'a5'],
    quizzesConcluidos: {
      'q1': { acertos: 3, total: 3, pontosGanhos: 150, respondidoEm: '2026-10-18T11:00:00.000Z' },
      'q2': { acertos: 2, total: 2, pontosGanhos: 100, respondidoEm: '2026-10-19T16:20:00.000Z' }
    },
    resgates: [
      {
        id: 'resg-2',
        alunoId: 'aluno-2',
        alunoNome: 'Carlos Eduardo Costa',
        premioId: 'p3',
        premioTitulo: 'Livro "Estratégia & Liderança Exponencial"',
        pontos: 200,
        data: '2026-10-20T17:00:00.000Z',
        status: 'aprovado'
      }
    ],
    historicoPontos: [
      { id: 't2_1', data: '2026-10-18T10:00:00.000Z', tipo: 'ganho', descricao: 'Bônus de início de trilha', pontos: 200 },
      { id: 't2_2', data: '2026-10-18T11:00:00.000Z', tipo: 'ganho', descricao: 'Avaliação: Fundamentos da Liderança', pontos: 150 },
      { id: 't2_3', data: '2026-10-19T16:20:00.000Z', tipo: 'ganho', descricao: 'Avaliação: Feedback & Comunicação', pontos: 100 },
      { id: 't2_4', data: '2026-10-20T17:00:00.000Z', tipo: 'resgate', descricao: 'Resgate: Livro Estratégia & Liderança', pontos: -200 }
    ],
    ultimaAula: { cursoId: 'c1', aulaId: 'a5' }
  },
  {
    id: 'aluno-3',
    nome: 'Beatriz Almeida',
    email: 'beatriz.almeida@techcorp.io',
    avatar: '👩‍💻',
    pontos: 180,
    concluidasAulaIds: ['a1', 'a6'],
    quizzesConcluidos: {},
    resgates: [],
    historicoPontos: [
      { id: 't3_1', data: '2026-10-19T08:00:00.000Z', tipo: 'ganho', descricao: 'Bônus de boas-vindas', pontos: 100 },
      { id: 't3_2', data: '2026-10-20T11:15:00.000Z', tipo: 'ganho', descricao: 'Acesso antecipado à plataforma', pontos: 80 }
    ],
    ultimaAula: { cursoId: 'c2', aulaId: 'a6' }
  },
  {
    id: 'aluno-4',
    nome: 'Rodrigo Fagundes',
    email: 'rodrigo.f@solucoes.com',
    avatar: '👨‍🔬',
    pontos: 520,
    concluidasAulaIds: ['a1', 'a2', 'a3', 'a6', 'a7'],
    quizzesConcluidos: {
      'q1': { acertos: 3, total: 3, pontosGanhos: 150, respondidoEm: '2026-10-15T15:00:00.000Z' },
      'q3': { acertos: 1, total: 1, pontosGanhos: 50, respondidoEm: '2026-10-17T18:40:00.000Z' }
    },
    resgates: [
      {
        id: 'resg-3',
        alunoId: 'aluno-4',
        alunoNome: 'Rodrigo Fagundes',
        premioId: 'p5',
        premioTitulo: 'Certificado Físico Premium com Selo Holográfico',
        pontos: 100,
        data: '2026-10-21T10:00:00.000Z',
        status: 'pendente'
      }
    ],
    historicoPontos: [
      { id: 't4_1', data: '2026-10-15T09:00:00.000Z', tipo: 'ganho', descricao: 'Bônus inicial de incentivo', pontos: 200 },
      { id: 't4_2', data: '2026-10-15T15:00:00.000Z', tipo: 'ganho', descricao: 'Avaliação: Fundamentos da Liderança', pontos: 150 },
      { id: 't4_3', data: '2026-10-17T18:40:00.000Z', tipo: 'ganho', descricao: 'Avaliação: Funis de Vendas', pontos: 50 },
      { id: 't4_4', data: '2026-10-21T10:00:00.000Z', tipo: 'resgate', descricao: 'Resgate: Certificado Físico Premium', pontos: -100 }
    ],
    ultimaAula: { cursoId: 'c2', aulaId: 'a7' }
  }
];
