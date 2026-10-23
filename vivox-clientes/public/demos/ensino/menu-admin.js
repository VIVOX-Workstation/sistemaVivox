/*
 * Painel no celular: barra do topo com botão de menu que abre e fecha a leftbar (aside.side).
 * A barra e o fundo escuro ficam fora do <x-dc>, para a tela poder se redesenhar sem apagá-los.
 */
(function () {
  var html = document.documentElement;

  function abrir(sim) {
    html.classList.toggle('vx-menu-aberto', sim);
    var botao = document.querySelector('.vx-menu-topo button');
    if (botao) botao.setAttribute('aria-expanded', sim ? 'true' : 'false');
  }
  window.vxMenuAdmin = abrir; // o tour abre a gaveta no passo do menu

  function montar() {
    var lado = document.querySelector('aside.side');
    if (!lado) return false;
    if (!lado.id) lado.id = 'menu-painel';
    var logo = lado.querySelector('img');

    var topo = document.createElement('div');
    topo.className = 'vx-menu-topo';
    topo.innerHTML =
      '<button type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="' + lado.id + '">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 6h16M4 12h16M4 18h16"/></svg></button>' +
      (logo ? '<img alt="Hospital Visão" src="' + logo.src + '">' : '') +
      '<span>Painel</span>';
    topo.querySelector('button').addEventListener('click', function () {
      abrir(!html.classList.contains('vx-menu-aberto'));
    });

    var fundo = document.createElement('div');
    fundo.className = 'vx-menu-fundo';
    fundo.addEventListener('click', function () { abrir(false); });

    document.body.appendChild(topo);
    document.body.appendChild(fundo);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') abrir(false); });
    // Escolher um item do menu fecha a gaveta (a navegação segue normalmente).
    lado.addEventListener('click', function (e) { if (e.target.closest('a')) abrir(false); });
    return true;
  }

  // A tela é montada depois do carregamento: espera a leftbar aparecer.
  var tentativas = 0;
  (function checar() {
    if (montar() || ++tentativas > 80) return;
    setTimeout(checar, 100);
  })();
})();
