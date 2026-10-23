/*
 * Tour guiado da demo (Driver.js 1.3.6, em ../lib).
 * Cada tela é uma página própria: este arquivo roda em todas, mostra os passos da
 * tela atual e o último passo leva à próxima. O andamento fica em sessionStorage
 * (só estado da visita, nada de dado de negócio).
 *
 * Começa sozinho na primeira visita ao Login; "?tour=1" no endereço recomeça naquela tela.
 */
(function () {
  var CHAVE = 'vx-demo-tour';
  var VISTO = 'vx-demo-tour-visto';
  var tela = (location.pathname.split('/').pop() || '').replace('.dc.html', '');

  function ler(chave) { try { return sessionStorage.getItem(chave); } catch (e) { return null; } }
  function gravar(chave, valor) { try { valor === null ? sessionStorage.removeItem(chave) : sessionStorage.setItem(chave, valor); } catch (e) { /* sem storage: o tour só não continua */ } }

  // Elemento pelo seletor e, se vier, pelo texto visível.
  function el(seletor, texto) {
    return function () {
      var lista = document.querySelectorAll(seletor);
      for (var i = 0; i < lista.length; i++) {
        if (!texto || (lista[i].textContent || '').indexOf(texto) !== -1) return lista[i];
      }
      return undefined;
    };
  }
  function pai(seletor) {
    return function () { var e = document.querySelector(seletor); return e ? e.parentElement : undefined; };
  }

  function passo(element, titulo, texto, lado) {
    return { element: element, popover: { title: titulo, description: texto, side: lado || 'bottom', align: 'start' } };
  }

  // Último passo de cada tela: o botão "Próximo" já leva à tela seguinte.
  function ir(element, titulo, texto, destino, rotulo) {
    var p = passo(element, titulo, texto);
    p.popover.nextBtnText = rotulo + ' →';
    p.popover.onNextClick = function () { gravar(CHAVE, destino); location.href = destino + '.dc.html' + (destino === 'Aula' ? '#aula=5' : ''); };
    return p;
  }

  var ROTEIRO = {
    Login: [
      passo(null, 'Bem-vindo à demo', 'Em poucos passos você vai ver o caminho do aluno, da entrada ao resgate de um prêmio, e depois o painel da equipe. Dá para sair do tour a qualquer momento no ×.'),
      passo(el('#email'), 'Acesso individual', 'Cada aluno entra com o e-mail e a senha que a equipe cadastrou. Não há cadastro aberto.'),
      ir(el('a.btn', 'Entrar'), 'Entrar no portal', 'Vamos entrar como a aluna Mariana.', 'Catalogo', 'Entrar'),
    ],
    Catalogo: [
      passo(el('.hero'), 'Início do aluno', 'Os destaques mostram o curso em andamento e o que vale começar. Trocam sozinhos, e os pontinhos embaixo escolhem um.'),
      passo(el('section[aria-label="Continuar assistindo"]'), 'Continuar assistindo', 'As aulas começadas, com a barra de progresso de cada uma.', 'top'),
      passo(el('section[aria-label="Aulas em vídeo"]'), 'Aulas em vídeo', 'Todas as videoaulas do curso, com a duração. Rola para o lado.', 'top'),
      passo(el('section[aria-label="Todos os cursos"]'), 'Todos os cursos', 'O catálogo completo, com o progresso de cada curso.', 'top'),
      passo(el('header a[href="Recompensas.dc.html"]'), 'Pontos do aluno', 'O saldo de pontos fica sempre à vista. Cada acerto nas avaliações vira ponto.'),
      ir(el('.slide[aria-hidden="false"] .hbtn'), 'Continuar a aula', 'Vamos abrir a aula em andamento.', 'Aula', 'Abrir a aula'),
    ],
    Aula: [
      passo(el('section[aria-label="Aula"] iframe'), 'Videoaula', 'O vídeo toca dentro da plataforma, com acesso só para quem está logado.'),
      passo(el('aside[aria-label="Aulas do módulo"]'), 'Aulas do módulo', 'A lista mostra o que já foi concluído e o progresso do módulo. Clique numa aula para trocar o vídeo.', 'left'),
      passo(el('section[aria-label="Aula"] button', 'concluída'), 'Marcar como concluída', 'O aluno marca a aula ao terminar, e o progresso do curso é atualizado.', 'top'),
      ir(null, 'Avaliação do módulo', 'No fim de cada módulo há um questionário. Vamos para ele.', 'Avaliacao', 'Ir para a avaliação'),
    ],
    Avaliacao: [
      passo(pai('button.dot'), 'Questões do módulo', 'Os números mostram as questões respondidas. Dá para ir e voltar entre elas.'),
      passo(el('[role="radiogroup"]'), 'Múltipla escolha', 'O aluno escolhe uma alternativa. A correção é automática ao finalizar, e cada acerto vale pontos.', 'top'),
      ir(null, 'Loja de recompensas', 'Com os pontos, o aluno troca por prêmios. Vamos ver a loja.', 'Recompensas', 'Ver recompensas'),
    ],
    Recompensas: [
      passo(el('section[aria-label="Saldo"]'), 'Saldo de pontos', 'Quanto o aluno tem, quanto ganhou no mês e os resgates em andamento.'),
      passo(el('button', 'Resgatar'), 'Resgatar um prêmio', 'O aluno pede o resgate. Os pontos só saem do saldo quando a equipe aprova.', 'top'),
      ir(null, 'Agora, o lado da equipe', 'Esse foi o caminho do aluno. Vamos ver o painel onde a equipe acompanha tudo e aprova os resgates.', 'AdminDashboard', 'Abrir o painel'),
    ],
    AdminDashboard: [
      passo(el('section[aria-label="Indicadores"]'), 'Indicadores', 'Alunos ativos, aulas concluídas, conclusão média e resgates esperando aprovação.'),
      passo(el('section[aria-label="Conclusão por curso"]'), 'Conclusão por curso', 'Quanto da turma já concluiu cada curso.', 'top'),
      passo(el('nav[aria-label="Painel"]'), 'Menu do painel', 'Cursos, alunos e prêmios ficam aqui. Vídeos e avaliações estão dentro de Cursos e aulas.', 'right'),
      ir(null, 'Cursos e aulas', 'Vamos ver como a equipe monta um curso.', 'AdminCursos', 'Abrir cursos'),
    ],
    AdminCursos: [
      passo(el('nav[aria-label="Seções do curso"]'), 'Tudo do curso num lugar', 'Estrutura, vídeos e avaliações do curso ficam em abas, lado a lado.'),
      passo(el('section[aria-label="Módulos e aulas"]'), 'Módulos e aulas', 'A equipe ordena módulos e aulas, publica ou esconde cada aula e vê se o vídeo está pronto.', 'top'),
      passo(el('a.btn', 'Editar avaliação'), 'Avaliação do módulo', 'Cada módulo tem o seu questionário, com a resposta certa e os pontos por acerto.', 'left'),
      ir(null, 'Prêmios e resgates', 'Por fim, a aprovação dos resgates pedidos pelos alunos.', 'AdminPremios', 'Abrir prêmios'),
    ],
    AdminPremios: [
      passo(el('section[aria-label="Fila de resgates"]'), 'Fila de resgates', 'Os pedidos dos alunos chegam aqui. A equipe aprova ou recusa, e só a aprovação debita os pontos.'),
      passo(el('section[aria-label="Prêmios cadastrados"]'), 'Catálogo de prêmios', 'A equipe cadastra os prêmios, define o custo em pontos e liga ou desliga cada um.', 'top'),
      passo(null, 'Fim do tour', 'Agora é só explorar: use a barra no topo para trocar entre o Portal do aluno e o Painel administrativo. Tudo aqui é fictício.'),
    ],
  };

  function iniciar() {
    var passos = ROTEIRO[tela];
    if (!passos || !window.driver || !window.driver.js) return;
    gravar(VISTO, '1');
    var tour = window.driver.js.driver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Próximo',
      prevBtnText: 'Voltar',
      doneBtnText: 'Concluir',
      popoverClass: 'vx-tour',
      overlayColor: '#140D06',
      overlayOpacity: 0.72,
      stagePadding: 8,
      stageRadius: 14,
      smoothScroll: true,
      steps: passos.map(function (p) { return p.element ? p : { popover: p.popover }; }),
      onDestroyStarted: function () {
        // Fechar no × ou no último passo encerra o tour; os "ir" já gravaram a próxima tela.
        if (ler(CHAVE) === tela) gravar(CHAVE, null);
        tour.destroy();
      },
    });
    tour.drive();
  }

  // As telas são montadas depois do carregamento: espera o primeiro elemento do roteiro.
  function quandoPronto(feito) {
    var tentativas = 0;
    (function checar() {
      var primeiro = (ROTEIRO[tela] || []).filter(function (p) { return p.element; })[0];
      var pronto = !primeiro || (typeof primeiro.element === 'function' && primeiro.element());
      if (pronto || ++tentativas > 60) setTimeout(feito, 300);
      else setTimeout(checar, 100);
    })();
  }

  if (/[?&]tour=1/.test(location.search)) gravar(CHAVE, tela);
  else if (tela === 'Login' && !ler(VISTO)) gravar(CHAVE, 'Login');
  if (ler(CHAVE) !== tela) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { quandoPronto(iniciar); });
  else quandoPronto(iniciar);
})();
