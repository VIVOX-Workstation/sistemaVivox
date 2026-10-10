(function () {
  "use strict";
  var syncBackend = null, syncBase = null, syncBusy = false, syncBooted = false;
  var syncMoved = [], syncDeletes = { tasks: [], columns: [], boards: [] }, syncFlushTimer = null;
  document.body.style.visibility = 'hidden';

  /* ------------------------------------------------------------ ícones */
  var ICONS = {
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    layout: '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    palette: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sort: '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10"/><path d="M11 8h7"/><path d="M11 12h4"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    sliders: '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    timer: '<path d="M10 2h4"/><path d="M12 14v-4"/><circle cx="12" cy="14" r="8"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    list: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    pauseCircle: '<circle cx="12" cy="12" r="10"/><path d="M10 15V9"/><path d="M14 15V9"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    ul: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    ol: '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
    clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    dl: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    vol: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    rew10: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="12" y="15.2" text-anchor="middle" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">10</text>',
    fwd10: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="12" y="15.2" text-anchor="middle" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">10</text>',
    pkg: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
  }

  /* flags (prioridade) e categorias (tipo de conteúdo) são listas editáveis */
  var FLAGS = [
    { id: 'urgent', label: 'Urgente', color: 'red', rank: 0, builtin: true },
    { id: 'high', label: 'Alta', color: 'orange', rank: 1, builtin: true },
    { id: 'normal', label: 'Normal', color: 'green', rank: 2, builtin: true },
    { id: 'low', label: 'Baixa', color: 'gray', rank: 3, builtin: true }
  ];
  var CATS = [
    { id: 'Vídeo', label: 'Vídeo', icon: 'video', group: 'main', builtin: true },
    { id: 'Landing page', label: 'Landing page', icon: 'layout', group: 'main', builtin: true },
    { id: 'Site', label: 'Site', icon: 'globe', group: 'main', builtin: true },
    { id: 'App', label: 'App', icon: 'phone', group: 'main', builtin: true },
    { id: 'Impresso', label: 'Impresso', icon: 'printer', group: 'main', builtin: true },
    { id: 'Motion', label: 'Motion', icon: 'sparkles', group: 'main', builtin: true },
    { id: 'Materiais digitais', label: 'Materiais digitais', icon: 'layers', group: 'main', builtin: true },
    { id: 'Identidade visual', label: 'Identidade visual', icon: 'palette', group: 'other', builtin: true },
    { id: 'Redes sociais', label: 'Redes sociais', icon: 'chat', group: 'other', builtin: true },
    { id: 'Tráfego pago', label: 'Tráfego pago', icon: 'trend', group: 'other', builtin: true },
    { id: 'Fotografia', label: 'Fotografia', icon: 'camera', group: 'other', builtin: true },
    { id: 'E-mail marketing', label: 'E-mail marketing', icon: 'mail', group: 'other', builtin: true },
    { id: 'Copy e roteiro', label: 'Copy e roteiro', icon: 'pen', group: 'other', builtin: true },
    { id: 'Embalagem', label: 'Embalagem', icon: 'pkg', group: 'other', builtin: true }
  ];
  var SW_COLORS = ['gray', 'green', 'orange', 'red', 'gold', 'blue', 'violet', 'teal', 'pink'];
  var SW_NAMES = { gray: 'Cinza', green: 'Verde', orange: 'Laranja', red: 'Vermelho', gold: 'Dourado', blue: 'Azul', violet: 'Violeta', teal: 'Turquesa', pink: 'Rosa' };
  var CAT_ICONS = ['video', 'layout', 'globe', 'phone', 'printer', 'sparkles', 'layers', 'camera', 'mic', 'mega', 'mail', 'doc', 'code', 'pen', 'palette', 'chat', 'trend', 'star'];
  /* ícones disponíveis para o topo das colunas (6 por linha) */
  var COL_ICONS = ['inbox', 'list', 'zap', 'eye', 'shield', 'circleCheck', 'hourglass', 'pauseCircle', 'rocket', 'bulb', 'archive', 'bookmark', 'send', 'users', 'refresh', 'ban', 'alert', 'flag', 'star', 'clock', 'cal', 'chat', 'pen', 'pkg', 'palette', 'code', 'phone', 'layout', 'globe', 'video', 'camera', 'mega', 'mail', 'printer', 'sparkles', 'trend'];
  var BOARD_ICONS = ['users', 'zap', 'phone', 'layout', 'globe', 'video', 'camera', 'palette', 'printer', 'sparkles', 'trend', 'mega', 'mail', 'rocket', 'bulb', 'pkg', 'chat', 'star'];
  var COL_ICON_LABEL = { inbox: 'Entrada', list: 'Planejamento', zap: 'Em andamento', eye: 'Revisão', shield: 'Aprovação', circleCheck: 'Concluído', hourglass: 'Aguardando', pauseCircle: 'Pausado', rocket: 'Lançamento', bulb: 'Ideias', archive: 'Arquivo', bookmark: 'Guardado', send: 'Enviado', users: 'Equipe', refresh: 'Ajustes', ban: 'Cancelado', alert: 'Atenção', flag: 'Marco', star: 'Destaque', clock: 'Prazo', cal: 'Agenda', chat: 'Conversa', pen: 'Edição', pkg: 'Entrega', palette: 'Design', code: 'Desenvolvimento', phone: 'Aplicativo', layout: 'Página', globe: 'Site', video: 'Vídeo', camera: 'Captação', mega: 'Campanha', mail: 'E-mail', printer: 'Impressão', sparkles: 'Motion', trend: 'Resultados' };
  function flagOf(id) { for (var i = 0; i < FLAGS.length; i++) if (FLAGS[i].id === id) return FLAGS[i]; return FLAGS[2]; }
  function catOf(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return null; }

  var ACCENT = { muted: 'var(--subtle)', gold: 'var(--dot-gold)', info: 'var(--info)', warn: 'var(--warn)', ok: 'var(--ok)' };
  var TINTS = [['#CCB691', '#191612'], ['#524B40', '#F8F6F6'], ['#8DB3D6', '#10202E'], ['#9CC5A8', '#10261A'], ['#D49B7C', '#2E1A0F'], ['#B2A3C4', '#1F162B']];
  var ROLES = {
    owner: { label: 'Proprietário(a)', desc: 'Abre e acompanha' },
    lead: { label: 'Supervisor(a)', desc: 'Revisa e apoia' },
    maker: { label: 'Responsável', desc: 'Executa e entrega' }
  };
  var ROLE_ORDER = ['owner', 'lead', 'maker'];
  var ROLE_NOUN = { owner: 'proprietário(a)', lead: 'supervisor(a)', maker: 'responsável' };

  /* ------------------------------------------------------------ datas */
  var MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function fDate(d) { return p2(d.getDate()) + ' ' + MONTHS[d.getMonth()]; }
  function fTime(d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function fFull(d) { return fDate(d) + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '') + ', ' + fTime(d); }
  function fDur(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 3600) + ':' + p2(Math.floor(s % 3600 / 60)) + ':' + p2(s % 60); }
  function day(off, h, m) { var d = new Date(); d.setDate(d.getDate() + off); d.setHours(h, m || 0, 0, 0); return d; }
  function nextMonth(d, h) { var n = new Date(); return new Date(n.getFullYear(), n.getMonth() + 1, d, h, 0, 0, 0); }
  function ago(hours) { return new Date(Date.now() - hours * 36e5); }
  function fmtNum(n) { return '#' + (n < 1000 ? ('00' + n).slice(-3) : n); }

  /* ------------------------------------------------------------ dados (exemplo) */
  var PEOPLE = ['Helen Lima', 'Pamella Vitória', 'Kelson Cosme', 'Pfeihennseger Martins'];
  /* perfil de cada pessoa: nome de usuário, e-mail da conta e foto (exemplos, editáveis; ficam neste navegador) */
  var PROFILES = {};
  PEOPLE.forEach(function (n) {
    var u = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '.');
    PROFILES[n] = { user: u, email: u + '@vivox.com.br', photo: '' };
  });
  try {
    var savedProf = JSON.parse(localStorage.getItem('vivox-kanban-profiles') || 'null');
    if (savedProf) PEOPLE.forEach(function (n) {
      var o = savedProf[n];
      if (!o) return;
      if (typeof o.user === 'string' && /^[a-z0-9._-]{3,24}$/.test(o.user)) PROFILES[n].user = o.user;
      if (typeof o.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(o.email) && o.email.length <= 80) PROFILES[n].email = o.email;
      if (typeof o.photo === 'string' && o.photo.indexOf('data:image/jpeg;base64,') === 0 && o.photo.length < 90000) PROFILES[n].photo = o.photo;
    });
  } catch (err) {}
  function saveProfiles() {}
  /* retratos e logotipos fictícios (desenhos embutidos). Fotos enviadas pelo usuário têm prioridade sobre estes. */
  function svgUri(svg) { try { return 'data:image/svg+xml;base64,' + btoa(svg); } catch (err) { return ''; } }
  function portraitSVG(o) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + o.bg[0] + '"/><stop offset="1" stop-color="' + o.bg[1] + '"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/>';
    var hair = o.hair, st = o.style;
    if (st === 'long') s += '<path d="M24 46c0-20 10-30 24-30s24 10 24 30v32H24z" fill="' + hair + '"/>';
    if (st === 'wavy') s += '<path d="M23 46c0-21 10-31 25-31s25 10 25 31c0 8 3 12 2 22-3 6-8 7-10 3-2 4-6 5-9 2-3 3-7 2-8-1-2 3-7 3-9 0-3 3-8 2-9-2-3 3-7 1-8-4 0-9 3-14 2-21z" fill="' + hair + '"/>';
    if (st === 'bob') s += '<path d="M26 48c-1-20 9-32 22-32s23 12 22 32c0 8 1 14-3 17-5 2-9-1-9-7V42H38v16c0 6-4 9-9 7-4-3-3-9-3-17z" fill="' + hair + '"/>';
    s += '<path d="M8 96c2-18 16-27 40-27s38 9 40 27z" fill="' + o.shirt + '"/>';
    s += '<path d="M38 70l10 10 10-10z" fill="' + o.skin + '"/><rect x="42" y="56" width="12" height="18" rx="5" fill="' + o.shade + '"/>';
    s += '<circle cx="31" cy="47" r="3.6" fill="' + o.skin + '"/><circle cx="65" cy="47" r="3.6" fill="' + o.skin + '"/>';
    s += '<ellipse cx="48" cy="45" rx="17" ry="20" fill="' + o.skin + '"/>';
    if (st === 'short') s += '<path d="M30 44c-3-18 6-29 18-29s21 11 18 29c-2-8-6-13-18-13s-16 5-18 13z" fill="' + hair + '"/>';
    if (st === 'long' || st === 'wavy' || st === 'bob') s += '<path d="M31 44c0-14 7-21 17-21s17 7 17 21c-4-6-9-11-17-11s-13 5-17 11z" fill="' + hair + '"/>';
    if (st === 'curly') s += '<g fill="' + hair + '"><circle cx="34" cy="31" r="9"/><circle cx="44" cy="25" r="9"/><circle cx="54" cy="25" r="9"/><circle cx="63" cy="32" r="9"/><circle cx="30" cy="41" r="6"/><circle cx="66" cy="41" r="6"/></g>';
    if (o.beard) s += '<path d="M31 49c0 15 8 24 17 24s17-9 17-24c-3 7-8 11-17 11s-14-4-17-11z" fill="' + hair + '"/><path d="M40 58c3-2 13-2 16 0-3 2-13 2-16 0z" fill="' + hair + '"/>';
    s += '<g fill="#2a1d17"><ellipse cx="41" cy="45" rx="1.9" ry="2.3"/><ellipse cx="55" cy="45" rx="1.9" ry="2.3"/></g>';
    s += '<g fill="none" stroke="' + hair + '" stroke-width="1.8" stroke-linecap="round"><path d="M36.5 39.5q4.5-2.5 9 0"/><path d="M50.5 39.5q4.5-2.5 9 0"/></g>';
    s += '<path d="M48 46v6q-2 2-3.6 1.4" fill="none" stroke="' + o.shade + '" stroke-width="1.6" stroke-linecap="round"/>';
    s += '<path d="M42.5 58.5q5.5 4 11 0" fill="none" stroke="' + (o.beard ? '#f3e1d3' : '#a8544f') + '" stroke-width="1.9" stroke-linecap="round"/>';
    if (o.glasses) s += '<g fill="none" stroke="#25201d" stroke-width="1.6"><circle cx="41" cy="45" r="6.2"/><circle cx="55" cy="45" r="6.2"/><path d="M47.2 45h1.6"/></g>';
    return s + '</svg>';
  }
  var PORTRAITS = {};
  /* fotos das pessoas da equipe de exemplo (recortadas em quadrado). Quem não tem foto aqui usa o retrato ilustrado. */
  var REAL_PHOTOS = {
    "Helen Lima": "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",
    "Pamella Vitória": "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",
    "Kelson Cosme": "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",
    "Pfeihennseger Martins": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCACgAKADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5eOfQUmeOgpT0GaNuaADPt+lHT0/KlxQeOtACH2x+VB4HQflS96D9KAEB55A/Kl+gH5UdOc0YoATOT0FGfYflQaXPtmgBPy/Kj14H5UZHelGPWgBDz6D8KCT6Cgmg4PtQAmT0P8qO3al6UYoAbnjoKUn2FByRSemaAAn6UAnnHpRgenFA4JA6UAPOOBRgdKUjgdqQdaADHajFL9MUg9qADHTuKMDilAHrRmgBOKmt7eSaRVC4B7mp9JtVuJg0jAIp5rYvIZNxFqixIBzIalysaRhdXZmLYwRsftEuzH61Isenk7Gk2HqD60Wa2rPK7s8wC4+bpmopraGRwxRkUDOF61OppZJaIW7tNjK8GyeM9CKqyRKcHbsPcVZkRrTYLR96sNxU9qrxzK8uZDyeuO1UiJWZXkXB45HrSVZkh8qTaT8rDINQzxmNsHoeQaozasMIzSHilIpCMc0CA+wpBjPtSjikNACHrjtR259KMcYzRx06cUASEDjmk4zzS49PSgcnjjFABRS+xooAQeuKQgZHvTvagDJwaAN3QFRkCSL8g5J9aiaOS/v3hWVkgRqu+C4biS+WBIzNGx2kelfR3gj4QaFf2Md5fxsrvgkL3rkq1lBnpUKDqR8j590/w9q1zKbLStOe5DD723iptW8K+KNOtwl9pbRnGMhe1fammeGNM0GzRNOtY0AHXaMmsvxHDbXcZS4gjkx6iuWWLknsdsMHCa0Z8TL4a10R+ZHbNgjris68spLVFE1uySfxcV9UavY2kZZUiVV7cV5Z45srSTfH5a7u2BW1PFOT1RjWwCgrpnkLSlY/J+8COD6VYuAjaepP3wamuLBrechlIGeKZcqfshxyOtdidzzHFxTuZwPFBHHWgcCirMRPzoFKwpO9AA2MUgHHPpSnpzQefyoAf0FAoHYY7Ue9ABgUHr34oHTI60o5HSgAzigDHJoNI33fegD0n4UBUu1uJFz8wwK+v/B9wsumQkKANoxXyv8AAvT01fUbO2dcKvzMR3r6Vl1zSfD0AN3Jt2D5YlHOK8nEv95Y9/CR/c3OuuAzwkA1x2sMROYwea5/VPjj4chk+zQ6dfSMTjcq8Css+L49Yv2ayjkIC7iMdKxnF6HVQsr3GeI4nVHcnFeUa9FJJePIx4FdT408dafaRBZnLP0KL1rzfUfGK3QkaDSrnYf4iOMVtRpytcxxFaF7Emq2cdzpqSrHhx3Ari9STyklXoK9T8LXOm61pAWHKyKCJEbqK828WxG3upoW/hciu+B5FZ6NnP8AFL60mOOuaUjHWtzjE7UnTilOeppOlAB9eKQHk0YweaXHX6UAOHXHtR+lHHUelGSRmgBcUuPek4FGRQAox1rW8GaTb674ntdNvJ5IbaQ/vWj+9j2rHPI6Vo+F9Xbw/wCJdP1gLvSCYGRfVSamd+V8u5dJxU1z7X1Ppb4YfDx/A/iFJodSF9p91/x7lvvp7Guv8faNrE2JNLt423HMruM4WnR3kupzWOq2xUaaLdZIiv8AETXdaTfxTwASKDkdK8N1HKXNJ6n1DpxpLlgtD5V8Y6HrcfiRmOoxi2wBEkSclq92+GGgppPh0zX8Ae4mgJbevI4rtF0PRftRv5rKEuvIJHSqtxIs8dxIJEjQIcc44q6k3JIzowSbsfFvjWznf4hXjICYPtB49Bmn+MbfZcxtaXxjttgATHf3rqPHtrEurXF/aSIzxz/vkB52561dhtrGezR54UkBXIyK61NxSOSdFSlL1OQ+Hpu7XXDG/wA8Tn76jg1B42topfFdyzR74ISGZR/FXXWk9vFfGOGFUUdMCuQ8TyuniO5vvKZbVY9juTwzVrGTktDmcIxlaWxx+o+V/aE/2ePy4s/KnpUBOaGOWLnksSTSds9q60ea3d3FOMZpKCfWk47cUCDoKTHf2ozmj/CgB3U8+lL17Uf4UY4HegBQaQ0ufSkPUcUALSOgZCp6Gl4zxSgUAe3fAf4p2mmaHL4R8T3CxW6jFncP2/2a990O5VraN1fKEZVh0Ydq+EJUDoQeo5Hsa+q/gP4sj1rwNbwzvm6sv3Mme9eZjMOkueJ7OAxTl+7l02PZ4N93BtLlU71wfjzw1fi5u9WttbuEthDsjtl+7urT1LxINLsvOjhkuWPCxx9Wrh9T8UfELW/tAttFh06zQfIkx+Zvc1yU4t6nqxi27I8M8UeGvE+m6+/2yZnSf5ic9q3Y5mg0yOIOSVGKz/H9342tb83Gr3ttLI/CxqegrH0vUrh5U+14Uv1ArtcXKKbPOmlSm0jotOl2zFmzwCSTXC+J9YGpTtDAGS2VyxH95vWun1i6Nvot1NFyduM+lefr9zPrzXTQjpc83E1HflA+1Jj2o4xzQTz610HIIP1o68k07Pf9Kbj3oADSDpwOaU8cUgwOvFADvTPWlPXNJ/hRnuBxQAuPejoaVUduiEintEUjEjgjJwKai2JtIYuWOB1qR4pEAJXg9KljSJGByWY9PSpWxHfLDJykg3L7GtY0tNTN1NdCmUdQC6kEnAHrXsv7NpVr3WdE37bgw+fH9a8mj/0nVwG4SEcCuq+E+vDQfizBNI2IbpfIY9qxxNP9zJI6cFVtXi2fQVrezPMbdsJdxHG1u/uKqa/o3iHXE2famtFHJdWxxWl4k0xb8Ld28nlXC8pIveuQ1/xZ4i0y0MNxZtOqDG+LvXiRi27o+ldTk0Z5h430G4tb9/OvGupUPBZq5+2hlQ75+3SpPE3iG+1HUHkaN4QT0brWZPfvsAZ+cdK74QdtTy6tWMpNo2NevFh8NGMkEyy7fwrkX/dyFGPbIPtRqN3LclVdjsToKS7G+GOQdcc1104WiebWnzTuhN659fpSn6VXJ6YqUyFehye9VYzuPPPIoJxxTY3y2G6GnBstiizC4Dmk5pzrt5znNIeQfpSasMU9PbFWrG33RmaTgfwj1qK2iM06p/COWrUYDGFAAHQVvRhfVmNWdtEQrJuOxiF9PQ0t3HE0BV2II6Ux1DAjuO1RozEEPyV9a3b6GSXUhspGDGKQbsHGKNTIjuIipOQenpQpxqAfoGGTVaZjcTSydh0rFv3bGiXvXNbTlzPNKe5Aqjqbvb6qtxGcPE4ZTUwvPs2no6jMjnIqmXku1keRhvXmlUknHlHTTUuY+m/h74qTWPD8DSyZcIAeaf4jlXy2cDPFeHfDfXJtNuBEWPlE4x6V6jqGrpJabieorxpUuSWh9HTre0grnknjAzSapLI0exAeK56QkKTiuy1u2fUbxggZhmuY1SH/AEr7LEp+Qc11U3pY4cRCzuZPLMeKs5BtQppjqI4y3cnApiyHaQTkGutaHnPUj9KAT+NGakjXJ6UkgGj5eak3dPWkI+Y+1OUYH1qhE9tsBw3zZ65ps8Ricj+E8qajXJOFOPeryR+faGMfeUZU1XLzIm9mSaUm2FnPVun0qwzY4IwabGpigRMA7R1pXlBXDLmuiEeWKRzyfNK5BcNg7hwf51A0g3K6n60XTbWwM/Q1TaTk8VnKVjaMboluyVj3L34pIAI4MH7z8YokIa3UnqDk0kJ8yZWboOBUX94roRsryqoB+5xURRgxB4IqxkrJOo6jkVOwWeESLjcBzU8tx81hdJvPsV5FJIMxucPXqFrm4sU8tg6EcGvKXXNnuxnB5rpvAmsvDOthMxKH7hP8q5cRT05kd2DrWfIz03StGVbCWUxguV4OK4fxnpEWgWCpJg39+273VK9d8JGK4jVXYbANzH2HNeN/EnVk1zxleXETZtoT5UGOm0VlhIudS3RHVjpKnSv1Zw15v84o4wF6VDwOan1Bw9wcfw8ZqAc49M12S3PJWw5RyDU0a4OfSmxriTHoKkbiFjVJCbGAbgW96fg4+vekjHapDnp37CqWomRNheM1Ys5irfhUDoAQDyxpcmJumTihOzuJ6o0HuYUIzOMelR3Fx0e2ZSvcVMYLeNRsjU8daqzQJyyYU/Wtpc1jGPK2V5JJJpN0nXtUM4Ac1PsLglSNw681BKSTnjI61zyOhMEbOBnqMVLB96NR1zUMZ+ccCrEGIsyNjJPAoiDJCgOoTDPG3k1DaOUYo3QGp5B5azyE8sABzUE67HRwRgirempK1J2AEMo/hYZFFsz/AGdGTgo2QR1pgOYjyOR61HazmFCOMZpaX1BX6HpGneNGtvBd0sTYvJV8pfUe9cFdS/ZrXZnMj8k/WmWH7xnnbAQc4z3qncyNPOX7dBUQgqUXbqa1qrrSV+hEAT3yangj8zK470JHtjLcZqxZLhGYkVUY3ZDZDx574PSkkP8Ao5+tIjfO5OOaSVswjp1pXCwsWWk9OOatIAfm6KO9Q28RYAcAdSc0ru8zbIsBB1NXHREvVjJ5VMmRyRTDMWBDJmpREAcLj3OaAAMhQG45qXcenQ//2Q=="
  };
  PEOPLE.forEach(function (n) { if (!PROFILES[n].photo) PROFILES[n].photo = REAL_PHOTOS[n] ? 'data:image/jpeg;base64,' + REAL_PHOTOS[n] : (PORTRAITS[n] ? svgUri(portraitSVG(PORTRAITS[n])) : ''); });
  var LOGOS = {
    'Clínica Aurora': '<rect width="96" height="96" fill="#F7D9A8"/><rect y="52" width="96" height="44" fill="#E9A15B"/><path d="M26 52a22 22 0 0 1 44 0z" fill="#FFF4DC"/><g stroke="#FFF4DC" stroke-width="4" stroke-linecap="round"><path d="M48 18v8"/><path d="M22 28l6 5"/><path d="M74 28l-6 5"/><path d="M12 46l8 2"/><path d="M84 46l-8 2"/></g>',
    'Studio Nativa': '<rect width="96" height="96" fill="#CFE8D2"/><path d="M26 70C26 42 44 24 72 22c2 28-12 48-40 50z" fill="#3C8D5A"/><path d="M30 68c10-14 22-24 36-34" fill="none" stroke="#CFE8D2" stroke-width="3.2" stroke-linecap="round"/>',
    'Odonto Prime': '<rect width="96" height="96" fill="#CFE0F5"/><path d="M33 26c-8 0-13 6-13 15 0 8 4 12 6 22 1 6 3 12 7 12s5-9 7-15c2-5 6-5 8 0 2 6 3 15 7 15s6-6 7-12c2-10 6-14 6-22 0-9-5-15-13-15-6 0-8 3-14 3s-8-3-14-3z" fill="#FFFFFF" stroke="#3B7DD8" stroke-width="3.5" stroke-linejoin="round"/>',
    'Consultório Prado': '<rect width="96" height="96" fill="#D5ECE8"/><rect x="40" y="20" width="16" height="56" rx="4" fill="#1F8F82"/><rect x="20" y="40" width="56" height="16" rx="4" fill="#1F8F82"/><circle cx="48" cy="48" r="7" fill="#D5ECE8"/>'
  };
  function logoUri(name) { return LOGOS[name] ? svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">' + LOGOS[name] + '</svg>') : ''; }
  function T(o) {
    o.steps = Array.isArray(o.steps) ? o.steps : [];
    o.files = Array.isArray(o.files) ? o.files : [];
    o.viewers = Array.isArray(o.viewers) ? o.viewers : [];
    o.links = Array.isArray(o.links) ? o.links : [];
    o.acc = o.acc || 0;
    o.since = o.since || null;
    var chat = [{ type: 'sys', text: o.owner + ' criou a tarefa', at: o.createdAt }];
    if (o.startedAt) chat.push({ type: 'sys', text: o.maker + ' iniciou a tarefa', at: o.startedAt });
    (o.talk || []).forEach(function (m) { chat.push({ type: 'msg', who: m[0], text: m[1], at: ago(m[2]) }); });
    chat.sort(function (a, b) { return a.at - b.at; });
    o.chat = chat;
    return o;
  }
  var clientCols = [
    { id: 'recebimento', name: 'Recebimento de demanda', accent: 'muted', tasks: [
      T({ id: 't1', title: 'Roteiros de reels de outubro', note: 'Clínica Aurora · 12 vídeos', desc: 'Escrever 12 roteiros curtos para o mês, com gancho nos primeiros três segundos e chamada para agendar avaliação. A clínica quer misturar bastidores e dúvidas de pacientes.', priority: 'normal', category: 'Vídeo', owner: 'Ana Beatriz', lead: 'Marina Costa', maker: 'Júlia Ramos', createdAt: day(-2, 9, 10), dueAt: day(8, 18, 0) }),
      T({ id: 't2', title: 'Briefing do novo site', note: 'Studio Nativa · escopo e referências', desc: 'Reunir escopo, páginas, referências visuais e metas de conversão do novo site institucional antes de abrir o design.', priority: 'low', category: 'Site', owner: 'Ana Beatriz', lead: 'Rafael Souza', maker: 'Marina Costa', createdAt: day(-1, 14, 30), dueAt: day(15, 12, 0) }),
      T({ id: 't3', title: 'Revisar tom de voz do perfil', note: 'Odonto Prime · bio e destaques', desc: 'Ajustar bio, destaques e legenda fixada para o mesmo tom de voz do site, com linguagem acessível e sem termos técnicos.', priority: 'low', category: 'Redes sociais', owner: 'Ana Beatriz', lead: 'Marina Costa', maker: 'Júlia Ramos', createdAt: day(-3, 16, 0), dueAt: nextMonth(10, 17) }),
      T({ id: 't13', title: 'Cartão de visita e papelaria', note: 'Consultório Prado · arte final em CMYK', desc: 'Cartão de visita, papel timbrado e receituário com arquivo fechado em CMYK, 300 dpi e sangria de 3 mm.', priority: 'low', category: 'Impresso', owner: 'Ana Beatriz', lead: 'Carlos Mendes', maker: 'Marina Costa', createdAt: day(-1, 11, 0), dueAt: day(12, 17, 0) })
    ] },
    { id: 'estruturacao', name: 'Estruturação e a fazer', accent: 'gold', tasks: [
      T({ id: 't4', title: 'Calendário editorial do trimestre', note: 'Clínica Aurora · de novembro a janeiro', desc: 'Montar o calendário de posts, reels e stories de novembro a janeiro, com datas comemorativas da área da saúde e pauta de cada semana.', priority: 'high', category: 'Redes sociais', owner: 'Ana Beatriz', lead: 'Marina Costa', maker: 'Júlia Ramos', createdAt: day(-12, 10, 0), dueAt: ago(52),
        talk: [['Marina Costa', 'O calendário já passou do prazo. Consegue fechar até amanhã?', 30], ['Júlia Ramos', 'Consigo. Falta só validar as datas comemorativas com a clínica.', 28]] }),
      T({ id: 't5', title: 'Estrutura da campanha de captação', note: 'Odonto Prime · Google e Meta', desc: 'Definir estrutura de contas, públicos, orçamento diário e criativos iniciais para a campanha de captação de novos pacientes.', priority: 'normal', category: 'Tráfego pago', owner: 'Ana Beatriz', lead: 'Rafael Souza', maker: 'Carlos Mendes', createdAt: day(-4, 11, 20), dueAt: day(5, 18, 0) }),
      T({ id: 't14', title: 'Vinheta animada do canal', note: 'Clínica Aurora · 8 segundos', desc: 'Vinheta de abertura de 8 segundos com a logomarca animada, em 16:9 e 9:16, com trilha curta.', priority: 'normal', category: 'Motion', owner: 'Ana Beatriz', lead: 'Rafael Souza', maker: 'Júlia Ramos', createdAt: day(-3, 15, 40), dueAt: day(6, 16, 0) })
    ] },
    { id: 'execucao', name: 'Em execução', accent: 'info', tasks: [
      T({ id: 't6', title: 'Landing page de avaliação', note: 'Studio Nativa · seção de depoimentos', desc: 'Página de captação para avaliação gratuita, com depoimentos acima da dobra, formulário curto e botão fixo de WhatsApp no mobile.', priority: 'urgent', category: 'Landing page', owner: 'Ana Beatriz', lead: 'Marina Costa', maker: 'Rafael Souza', createdAt: day(-6, 9, 0), dueAt: day(1, 12, 0), startedAt: day(-5, 9, 40), acc: 11100000, since: Date.now() - 12 * 60000,
        talk: [['Ana Beatriz', 'O cliente pediu as avaliações logo acima da dobra. Pode priorizar essa seção.', 26], ['Marina Costa', 'Referência no Figma enviada. Segue o grid de 12 colunas e a paleta da marca.', 24], ['Rafael Souza', 'A seção de depoimentos já está no ambiente de teste. Falta ajustar o mobile.', 3], ['Marina Costa', 'Revisei agora: o carrossel precisa pausar ao tocar. Ajusta e me avisa?', 1.5]] }),
      T({ id: 't7', title: 'Identidade visual do consultório', note: 'Consultório Prado · manual de marca', desc: 'Criar logotipo, paleta, tipografia e aplicações básicas, entregando um manual de marca em PDF.', priority: 'high', category: 'Identidade visual', owner: 'Carlos Mendes', lead: 'Ana Beatriz', maker: 'Marina Costa', createdAt: day(-9, 10, 30), dueAt: day(2, 17, 0), startedAt: day(-4, 14, 0), acc: 25200000 }),
      T({ id: 't8', title: 'Gravação de bastidores', note: 'Clínica Aurora · diária de 4 horas', desc: 'Diária de gravação no consultório para bastidores, depoimentos curtos e imagens de apoio. Levar microfone de lapela e dois fundos.', priority: 'normal', category: 'Vídeo', owner: 'Ana Beatriz', lead: 'Rafael Souza', maker: 'Júlia Ramos', createdAt: day(-5, 15, 0), dueAt: day(4, 15, 0), startedAt: day(-1, 10, 0), acc: 5400000 }),
      T({ id: 't15', title: 'Protótipo do app de agendamento', note: 'Odonto Prime · fluxo de marcação', desc: 'Protótipo navegável do fluxo de marcação de consulta, da escolha do horário à confirmação por mensagem.', priority: 'high', category: 'App', owner: 'Carlos Mendes', lead: 'Ana Beatriz', maker: 'Rafael Souza', createdAt: day(-10, 10, 0), dueAt: day(9, 18, 0), startedAt: day(-2, 9, 0), acc: 7200000 })
    ] },
    { id: 'aprovacao', name: 'Aprovação interna', accent: 'warn', tasks: [
      T({ id: 't9', title: 'Relatório mensal de tráfego', note: 'Odonto Prime · CPL e ROAS de setembro', desc: 'Relatório de setembro com investimento, CPL, ROAS e comparação com o mês anterior, em linguagem simples para o cliente.', priority: 'high', category: 'Tráfego pago', owner: 'Ana Beatriz', lead: 'Rafael Souza', maker: 'Carlos Mendes', createdAt: day(-7, 9, 0), dueAt: ago(3), startedAt: day(-3, 9, 0), acc: 14400000,
        talk: [['Carlos Mendes', 'Relatório de setembro pronto. O CPL caiu 18% e o ROAS ficou em 4,2.', 5], ['Rafael Souza', 'Vou conferir os números de conversão e te respondo ainda hoje.', 4]] }),
      T({ id: 't10', title: 'Carrossel de lançamento', note: 'Studio Nativa · 8 lâminas', desc: 'Carrossel de 8 lâminas para o lançamento do novo serviço, com a mesma linguagem visual do site.', priority: 'low', category: 'Materiais digitais', owner: 'Carlos Mendes', lead: 'Ana Beatriz', maker: 'Marina Costa', createdAt: day(-8, 13, 0), dueAt: day(0, 22, 0), startedAt: day(-6, 11, 0), acc: 9000000 })
    ] },
    { id: 'concluidas', name: 'Concluídas', accent: 'ok', tasks: [
      T({ id: 't11', title: 'Edição dos reels de setembro', note: 'Clínica Aurora · 10 vídeos', desc: 'Edição, legendas e capas de 10 reels gravados em setembro.', priority: 'high', category: 'Vídeo', owner: 'Ana Beatriz', lead: 'Marina Costa', maker: 'Júlia Ramos', createdAt: day(-20, 10, 0), dueAt: day(-10, 17, 0), startedAt: day(-18, 9, 0), acc: 43200000, deliveredAt: day(-10, 16, 40) }),
      T({ id: 't12', title: 'Pixel e API de Conversões', note: 'Odonto Prime · eventos validados', desc: 'Instalação do Pixel e da API de Conversões, com eventos de contato, formulário e WhatsApp validados.', priority: 'normal', category: 'Tráfego pago', owner: 'Ana Beatriz', lead: 'Rafael Souza', maker: 'Carlos Mendes', createdAt: day(-25, 9, 30), dueAt: day(-14, 18, 0), startedAt: day(-22, 10, 0), acc: 18000000, deliveredAt: day(-14, 15, 10) })
    ] }
  ];

  /* ------------------------------------------------------------ quadros, colunas e funções
     Cada coluna tem uma função. É ela que diz ao quadro para onde o cartão vai quando alguém dá play,
     entrega, aprova ou pede correção. */
  var ROLE_INFO = {
    queue: { label: 'Fila', short: 'Fila', help: 'Tarefas que ainda não começaram. Ao dar play, o cartão vai para a coluna de execução do quadro.' },
    doing: { label: 'Em execução', short: 'Execução', help: 'Recebe o cartão quando alguém dá play e quando o(a) supervisor(a) pede correção. Só uma por quadro.' },
    review: { label: 'Aprovação', short: 'Aprovação', help: 'Recebe o cartão quando o responsável entrega. Só uma por quadro.' },
    done: { label: 'Concluída', short: 'Concluída', help: 'Recebe as entregas aprovadas e para o relógio de atraso.' },
    none: { label: 'Etapa comum', short: 'Comum', help: 'Etapa de trabalho sem ação automática. Você move os cartões à mão.' }
  };
  var ROLE_KEYS = ['queue', 'doing', 'review', 'done', 'none'];
  var uidN = 1;
  function uid(p) { return p + Date.now().toString(36) + (uidN++); }
  function mkCol(o) {
    var c = { id: o.id, name: o.name, color: o.color, icon: o.icon, role: o.role || 'none', mk: o.mk || 'dot', fill: !!o.fill, collapsed: !!o.collapsed, apart: o.apart === 'start' || o.apart === 'end' ? o.apart : '', dim: o.dim == null || isNaN(+o.dim) ? 1 : Math.min(1, Math.max(0, +o.dim)), tasks: o.tasks || [] };
    c.def = { name: o.defName || o.name, color: o.defColor || o.color, icon: o.defIcon || o.icon, role: o.defRole || c.role };
    /* função no calendário de publicações: "todo" (Por fazer, cinza), "sched" (Agendado, verde) ou vazio (fora do calendário) */
    c.plan = o.plan === 'todo' || o.plan === 'sched' ? o.plan : o.plan === '' ? '' : (c.role === 'queue' ? 'todo' : c.role === 'review' ? 'sched' : '');
    return c;
  }
  var CLIENT_DEF = { recebimento: ['gray', 'inbox', 'queue'], estruturacao: ['gold', 'list', 'queue'], execucao: ['blue', 'zap', 'doing'], aprovacao: ['orange', 'eye', 'review'], concluidas: ['green', 'circleCheck', 'done'] };
  clientCols = clientCols.map(function (c) { var d = CLIENT_DEF[c.id]; return mkCol({ id: c.id, name: c.name, color: d[0], icon: d[1], role: d[2], tasks: c.tasks }); });

  var TEMPLATES = [
    { id: 'blank', name: 'Em branco', desc: 'Três etapas para você montar o fluxo do seu jeito: crie, renomeie e reordene as colunas.', icon: 'plus', color: 'gray',
      cols: [['A fazer', 'gray', 'inbox', 'queue'], ['Em execução', 'blue', 'zap', 'doing'], ['Concluídas', 'green', 'circleCheck', 'done']] },
    { id: 'daily', name: 'Operação diária', desc: 'Demandas extras que surgem no dia, da entrada à entrega, sem burocracia.', icon: 'zap', color: 'orange',
      cols: [['Entrada', 'gray', 'inbox', 'queue'], ['Triagem do dia', 'gold', 'list', 'queue'], ['Em execução', 'blue', 'zap', 'doing'], ['Aguardando retorno', 'orange', 'hourglass', 'none'], ['Concluídas', 'green', 'circleCheck', 'done']] },
    { id: 'apps', name: 'Construção de aplicativos', desc: 'Do backlog à publicação nas lojas, passando por design, desenvolvimento e testes.', icon: 'phone', color: 'violet',
      cols: [['Backlog', 'gray', 'archive', 'queue'], ['Especificação', 'gold', 'list', 'none'], ['Design', 'pink', 'palette', 'none'], ['Desenvolvimento', 'blue', 'code', 'doing'], ['Testes', 'orange', 'shield', 'review'], ['Publicado', 'green', 'rocket', 'done']] },
    { id: 'landing', name: 'Landing pages', desc: 'Briefing, copy, design e desenvolvimento até a página no ar.', icon: 'layout', color: 'teal',
      cols: [['Briefing', 'gray', 'inbox', 'queue'], ['Copy', 'gold', 'pen', 'none'], ['Design', 'pink', 'palette', 'none'], ['Desenvolvimento', 'blue', 'code', 'doing'], ['Revisão do cliente', 'orange', 'eye', 'review'], ['No ar', 'green', 'rocket', 'done']] },
    { id: 'content', name: 'Produção de conteúdo', desc: 'Ideias, roteiro, gravação, edição e publicação de posts e vídeos.', icon: 'video', color: 'pink',
      cols: [['Ideias', 'gray', 'bulb', 'queue'], ['Roteiro', 'gold', 'pen', 'none'], ['Gravação', 'violet', 'camera', 'none'], ['Edição', 'blue', 'sparkles', 'doing'], ['Aprovação', 'orange', 'eye', 'review'], ['Publicado', 'green', 'send', 'done']] },
    { id: 'ads', name: 'Tráfego pago', desc: 'Planejamento, criativos, veiculação e relatório das campanhas.', icon: 'trend', color: 'blue',
      cols: [['Planejamento', 'gray', 'list', 'queue'], ['Criativos', 'pink', 'palette', 'none'], ['Veiculando', 'blue', 'trend', 'doing'], ['Otimização', 'gold', 'refresh', 'none'], ['Relatório', 'orange', 'eye', 'review'], ['Concluídas', 'green', 'circleCheck', 'done']] },
    { id: 'brand', name: 'Identidade visual', desc: 'Briefing, pesquisa, conceito e manual de marca com aprovação do cliente.', icon: 'palette', color: 'gold',
      cols: [['Briefing', 'gray', 'inbox', 'queue'], ['Pesquisa', 'teal', 'eye', 'none'], ['Conceito', 'gold', 'bulb', 'none'], ['Refinamento', 'blue', 'palette', 'doing'], ['Aprovação do cliente', 'orange', 'shield', 'review'], ['Entregue', 'green', 'pkg', 'done']] },
    { id: 'video', name: 'Audiovisual', desc: 'Roteiro, captação, edição e entrega de vídeos e reels.', icon: 'camera', color: 'red',
      cols: [['Roteiro', 'gray', 'pen', 'queue'], ['Captação', 'violet', 'camera', 'none'], ['Edição', 'blue', 'video', 'doing'], ['Aprovação', 'orange', 'eye', 'review'], ['Entregue', 'green', 'send', 'done']] },
    { id: 'print', name: 'Materiais impressos', desc: 'Arte, prova, gráfica e entrega de cartões, folders e embalagens.', icon: 'printer', color: 'orange',
      cols: [['Briefing', 'gray', 'inbox', 'queue'], ['Arte', 'blue', 'palette', 'doing'], ['Prova', 'orange', 'eye', 'review'], ['Na gráfica', 'violet', 'printer', 'none'], ['Entregue', 'green', 'pkg', 'done']] },
    { id: 'support', name: 'Suporte e chamados', desc: 'Pedidos dos clientes, do chamado aberto ao resolvido.', icon: 'chat', color: 'teal',
      cols: [['Aberto', 'red', 'alert', 'queue'], ['Em atendimento', 'blue', 'chat', 'doing'], ['Aguardando cliente', 'orange', 'hourglass', 'none'], ['Resolvido', 'green', 'circleCheck', 'done']] }
  ];
  function tplById(id) { return TEMPLATES.filter(function (t) { return t.id === id; })[0]; }
  function boardFromTemplate(tpl, id, name, tasks, fresh) {
    var b = { id: id, name: name || tpl.name, desc: tpl.desc, icon: tpl.icon, color: tpl.color,
      cols: tpl.cols.map(function (d, i) { return mkCol({ id: fresh ? uid('c') : id + '-' + i, name: d[0], color: d[1], icon: d[2], role: d[3] }); }) };
    if (syncBackend && fresh && !b.cols.some(function(c) {return c.role === 'review';})) {
      var doneIndex = b.cols.findIndex(function(c) {return c.role === 'done';});
      b.cols.splice(doneIndex < 0 ? b.cols.length : doneIndex, 0, mkCol({id:uid('c'),name:'Aprovação',color:'orange',icon:'eye',role:'review'}));
    }
    (tasks || []).forEach(function (t) { var ci = t.col; delete t.col; b.cols[ci].tasks.push(t); });
    return b;
  }

  var boards = [
    { id: 'daily', fixed: true, name: 'Operação diária', desc: 'Quadro de demandas do dia a dia, da entrada à entrega aprovada.', icon: 'zap', color: 'gold', cols: clientCols },
    boardFromTemplate(tplById('blank'), 'kanban', 'Kanban personalizado', [
      T({ id: 'k1', col: 0, title: 'Mapear o fluxo da campanha de novembro', note: 'Clínica Aurora · etapas e responsáveis', desc: 'Listar as etapas da campanha e criar uma coluna para cada uma, na ordem em que acontecem.', priority: 'normal', category: 'Redes sociais', owner: 'Ana Beatriz', lead: 'Marina Costa', maker: 'Júlia Ramos', createdAt: day(-1, 10, 0), dueAt: day(4, 18, 0) }),
      T({ id: 'k2', col: 0, title: 'Definir as etapas de aprovação do cliente', note: 'Odonto Prime · quem aprova o quê', desc: 'Combinar com o cliente quem aprova cada peça e em quanto tempo.', priority: 'low', category: 'Materiais digitais', owner: 'Ana Beatriz', lead: 'Carlos Mendes', maker: 'Marina Costa', createdAt: day(-2, 15, 30), dueAt: day(9, 17, 0) }),
      T({ id: 'k3', col: 1, title: 'Montar o quadro de lançamento', note: 'Studio Nativa · colunas por etapa', desc: 'Criar as colunas do lançamento e distribuir as tarefas entre elas.', priority: 'high', category: 'Landing page', owner: 'Ana Beatriz', lead: 'Marina Costa', maker: 'Rafael Souza', createdAt: day(-4, 9, 0), dueAt: day(2, 12, 0), startedAt: day(-1, 9, 30), acc: 5400000 }),
      T({ id: 'k4', col: 2, title: 'Modelo de relatório semanal', note: 'Odonto Prime · formato padrão', desc: 'Modelo de relatório com investimento, resultados e próximos passos.', priority: 'normal', category: 'Tráfego pago', owner: 'Ana Beatriz', lead: 'Rafael Souza', maker: 'Carlos Mendes', createdAt: day(-9, 10, 0), dueAt: day(-3, 18, 0), startedAt: day(-7, 9, 0), acc: 10800000, deliveredAt: day(-3, 16, 0) })
    ])
  ];

  boards[1].desc = 'Monte o seu fluxo: crie colunas, defina a função de cada uma e reordene como quiser.';
  boards[1].icon = 'layout';
  boards[1].color = 'teal';

  /* equipe de exemplo: os papéis variam de tarefa em tarefa (quem cria, quem supervisiona, quem executa e quem só acompanha). Pfeihennseger Martins é o usuário do quadro e acompanha várias tarefas como visualizador(a). */
  (function () {
    var H = 'Helen Lima', P = 'Pamella Vitória', K = 'Kelson Cosme', F = 'Pfeihennseger Martins';
    /* cada linha: proprietário, supervisor, responsável, visualizador */
    var PERMS = [[K, P, H, F], [H, P, K, F], [K, H, P, F], [P, K, H, F], [H, K, F, P], [K, F, H, P], [F, H, P, K], [P, H, K, F], [H, F, K, P], [K, P, F, H], [P, K, F, H], [K, H, F, P]];
    var n = 0;
    boards.forEach(function (b) { b.cols.forEach(function (c) { c.tasks.forEach(function (t) {
      var pm = PERMS[n++ % PERMS.length], map = {};
      ['owner', 'lead', 'maker'].forEach(function (k, i) { if (t[k] && !map[t[k]]) map[t[k]] = pm[i]; });
      ['owner', 'lead', 'maker'].forEach(function (k, i) { if (t[k]) t[k] = pm[i]; });
      (t.chat || []).forEach(function (m) {
        if (m.type === 'msg') { if (map[m.who]) m.who = map[m.who]; return; }
        Object.keys(map).forEach(function (o) { if (m.text.indexOf(o + ' ') === 0) m.text = map[o] + m.text.slice(o.length); });
      });
      /* visualizador(a): citado(a) com @ pelo proprietário em parte das tarefas */
      if (n % 4 !== 0) {
        t.viewers = [pm[3]];
        t.chat.push({ type: 'sys', text: pm[0] + ' citou @' + PROFILES[pm[3]].user + ' e liberou o acesso como visualizador(a)', at: new Date(t.createdAt.getTime() + 36e5) });
        t.chat.sort(function (x, y) { return x.at - y.at; });
      }
    }); }); });
  })();

  /* numeração: #001, #002... pela ordem de criação em todos os quadros; passou de #999, segue #1000 */
  var nextNum = 1;
  (function () {
    var a = [];
    boards.forEach(function (b) { b.cols.forEach(function (c) { c.tasks.forEach(function (t) { a.push(t); }); }); });
    a.sort(function (x, y) { return x.createdAt - y.createdAt; });
    a.forEach(function (t) { t.num = nextNum++; });
  })();

  /* etapas (checklist) de cada tarefa: quem cria a tarefa sugere, o responsável marca */
  var stepN = 1;
  var SUGGEST = {
    'Vídeo': ['Roteiro aprovado', 'Captação', 'Edição e cortes', 'Legendas', 'Exportar em 9:16 e 16:9', 'Enviar para aprovação'],
    'Landing page': ['Copy aprovada', 'Layout no Figma', 'Desenvolver a página', 'Formulário e WhatsApp', 'Pixel e eventos de conversão', 'Testar no celular e no computador'],
    'Site': ['Mapa de páginas', 'Layout aprovado', 'Desenvolvimento', 'SEO técnico', 'Testes de velocidade', 'Publicar'],
    'App': ['Especificação da tela', 'Protótipo navegável', 'Desenvolvimento', 'Testes no Android e no iPhone', 'Ajustes finais', 'Publicar nas lojas'],
    'Impresso': ['Medidas e sangria de 3 mm', 'Arte em CMYK', 'Prova aprovada', 'Arquivo fechado para a gráfica', 'Conferir a entrega'],
    'Motion': ['Roteiro e storyboard', 'Estilo e cores', 'Animação', 'Trilha e efeitos sonoros', 'Exportar nos formatos'],
    'Materiais digitais': ['Briefing entendido', 'Primeira versão', 'Ajustes', 'Exportar nos tamanhos', 'Enviar para aprovação'],
    'Redes sociais': ['Pauta definida', 'Texto e legenda', 'Arte ou vídeo', 'Revisão ortográfica', 'Agendar a publicação'],
    'Tráfego pago': ['Objetivo e orçamento', 'Públicos e segmentação', 'Criativos', 'Pixel conferido', 'Publicar e acompanhar'],
    'Identidade visual': ['Pesquisa e referências', 'Logotipo e variações', 'Paleta e tipografia', 'Aplicações', 'Manual de marca']
  };
  var SUGGEST_DEFAULT = ['Entender o briefing', 'Primeira versão', 'Ajustes', 'Revisar', 'Entregar'];
  (function () {
    var seed = {
      t6: [['Copy dos depoimentos aprovada', 1], ['Seção de avaliações acima da dobra', 1], ['Formulário curto com validação', 1], ['Botão fixo de WhatsApp no mobile', 0], ['Testar no celular e no computador', 0], ['Pixel e eventos de conversão', 0]],
      t4: [['Listar as datas comemorativas da saúde', 1], ['Pauta de cada semana', 0], ['Distribuir reels, posts e stories', 0], ['Validar com a clínica', 0]],
      t1: [['Definir os 12 temas', 0], ['Gancho dos 3 primeiros segundos', 0], ['Chamada para agendar avaliação', 0]],
      t7: [['Pesquisa de referências', 1], ['Logotipo e variações', 1], ['Paleta e tipografia', 0], ['Manual de marca em PDF', 0]],
      t8: [['Roteiro de bastidores', 1], ['Levar lapela e dois fundos', 0], ['Gravar os depoimentos curtos', 0], ['Imagens de apoio', 0]],
      t9: [['Exportar os dados de setembro', 1], ['Calcular CPL e ROAS', 1], ['Comparar com agosto', 1], ['Resumo em linguagem simples', 1]]
    };
    boards.forEach(function (b) { b.cols.forEach(function (c) { c.tasks.forEach(function (t) {
      t.steps = (seed[t.id] || []).map(function (x, i) { return { id: 's' + (stepN++), text: x[0], done: !!x[1], by: x[1] ? t.maker : '', at: x[1] ? new Date(Date.now() - (6 - i) * 36e5) : null }; });
    }); }); });
  })();

  /* a estrutura (quadros, colunas, nomes, cores, ícones e funções) fica salva neste navegador */
  function saveLayout() {
    if (!syncBooted || syncApplying || !syncConfig) return;
    var preferences = {};
    boards.forEach(function(b) { b.cols.forEach(function(c) { preferences[c.id] = { collapsed:!!c.collapsed, apart:c.apart || '', dim:c.dim, fill:!!c.fill }; }); });
    try { localStorage.setItem('vvox-sync-column-ui:' + syncBackend.user.id, JSON.stringify(preferences)); } catch (_) {}
  }
  function str(v, n, d) { return typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : d; }
  function loadLayout() { return null; }
  var savedCur = null;
  var cur = boards.filter(function (b) { return b.id === savedCur; })[0] || boards[0];
  var cols = cur.cols;

  /* ------------------------------------------------------------ estado */
  var GAP = 8;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var trackEl = $('track'), railEl = $('rail'), thumbEl = $('thumb'), liveEl = $('live');
  var colEls = {}, listEls = {}, footEls = {}, countEls = {}, cardEls = {};
  var drag = null, slot = null, pending = null, grabbed = null, origin = null;
  var snap = {}, autoScroll = 0, raf = 0, nextId = 100, lastCounts = {};
  var viewer = 'Pfeihennseger Martins', detailId = null, lastFocus = null, confirmDel = false, descEdit = false;
  var F = { q: '', due: '', flags: [], cats: [], who: '' };
  var ph = document.createElement('div');
  ph.className = 'ph';
  ph.setAttribute('aria-hidden', 'true');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function say(msg) { liveEl.textContent = ''; setTimeout(function () { liveEl.textContent = msg; }, 20); }
  var toastEl = $('toast'), toastTimer = 0;
  function toast(msg) {
    toastEl.innerHTML = icon('check') + '<span>' + esc(msg) + '</span>';
    toastEl.hidden = false;
    toastEl.classList.remove('in');
    void toastEl.offsetWidth;
    toastEl.classList.add('in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }
  function colById(id) { for (var i = 0; i < cols.length; i++) if (cols[i].id === id) return cols[i]; return null; }
  function locate(taskId) {
    for (var c = 0; c < cols.length; c++) {
      var i = cols[c].tasks.findIndex(function (t) { return t.id === taskId; });
      if (i > -1) return { col: cols[c].id, colIndex: c, index: i, task: cols[c].tasks[i] };
    }
    return null;
  }
  function colByRole(r) { for (var i = 0; i < cols.length; i++) if (cols[i].role === r) return cols[i]; return null; }
  function everyTask() { var a = []; boards.forEach(function (b) { b.cols.forEach(function (c) { c.tasks.forEach(function (t) { a.push(t); }); }); }); return a; }
  function countTasks(b) { var n = 0; b.cols.forEach(function (c) { n += c.tasks.length; }); return n; }
  function allTasks() { var a = []; cols.forEach(function (c) { c.tasks.forEach(function (t) { a.push(t); }); }); return a; }
  function isDone(t) { var l = locate(t.id); return !!l && colById(l.col).role === 'done'; }
  function rolesOf(t, name) { return ROLE_ORDER.filter(function (k) { return t[k] === name; }); }
  function elapsed(t) { return t.acc + (t.since ? Date.now() - t.since : 0); }
  function syncCan(t, action) { return !!(t._server && t._server.permissoes && t._server.permissoes[action]); }
  function canEdit(t) { return syncCan(t, 'editar'); }
  function canPlay(t) { return syncCan(t, t.since ? 'pausar' : 'iniciar'); }
  function canDelete(t) { return syncCan(t, 'excluir'); }

  /* prazo: calcula pelo relógio, então o atraso aparece e cresce sozinho */
  function fDay(d) { return fDate(d) + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''); }
  function dayDiff(d) { var n = new Date(); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5); }
  function dueInfo(t) {
    if (!t.dueAt) return { cls: '', base: 'Sem prazo', extra: '', none: true };
    var base = fDate(t.dueAt);
    if (isDone(t)) return { cls: '', base: base, extra: '' };
    var n = dayDiff(t.dueAt);
    if (n < 0) return { cls: 'late', base: base, extra: -n + (n === -1 ? ' dia' : ' dias') + ' de atraso' };
    if (n === 0) return { cls: 'late', base: base, extra: '' };
    if (n === 1) return { cls: 'soon', base: base, extra: '' };
    return { cls: '', base: base, extra: '' };
  }
  var STATUS_FLAGS = [{ id: 'urgent', label: 'Urgente', color: 'gold' }, { id: 'late', label: 'Em atraso', color: 'red' }];
  /* flag do cartão: só dois estados, calculados pelo prazo (por dia do calendário) */
  function statusFlag(t) {
    if (!t.dueAt || isDone(t)) return null;
    var days = dayDiff(t.dueAt);
    if (days <= 0) return STATUS_FLAGS[1];
    if (days === 1) return STATUS_FLAGS[0];
    return null;
  }
  function statusChip(t) {
    var f = statusFlag(t);
    return f ? '<span class="chip flag" style="--fc:var(--sw-' + f.color + ')">' + icon('flag') + '<span>' + f.label + '</span></span>' : '';
  }
  function shortExtra(x) { return x.replace(/ dias? de atraso/, ' d atraso'); }
  function dueHTML(t, short) { var d = dueInfo(t); return esc(d.base) + (d.extra && !short ? ' · <b>' + d.extra + '</b>' : ''); }

  /* ------------------------------------------------------------ filtros */
  function filtersActive() { return !!(F.q.trim() || F.due || F.flags.length || F.cats.length || F.who); }
  function matches(t) {
    if (F.due) {
      var now = new Date(), d = t.dueAt;
      if (F.due === 'none') { if (d) return false; }
      else if (!d) return false;
      else if (F.due === 'today') { if (d.toDateString() !== now.toDateString()) return false; }
      else if (F.due === 'week') {
        var s = new Date(now.getFullYear(), now.getMonth(), now.getDate()), e = new Date(s);
        e.setDate(e.getDate() + (7 - (s.getDay() || 7)) + 1);
        if (d < s || d >= e) return false;
      } else if (F.due === 'nextmonth') {
        var nm = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        if (d.getFullYear() !== nm.getFullYear() || d.getMonth() !== nm.getMonth()) return false;
      } else if (F.due === 'late') { if (isDone(t) || d.getTime() >= Date.now()) return false; }
    }
    if (F.flags.length && F.flags.indexOf((statusFlag(t) || {}).id) < 0) return false;
    if (F.cats.length && F.cats.indexOf(t.category) < 0) return false;
    if (F.who) { var wn = F.who === 'mine' ? viewer : F.who; if (!rolesOf(t, wn).length && (t.viewers || []).indexOf(wn) < 0) return false; }
    var q = F.q.trim().toLowerCase();
    if (q) {
      var c = t.category ? catOf(t.category) : null;
      var hay = [t.title, t.note, t.desc, c ? c.label : '', people(t).join(' ')].join(' ').toLowerCase();
      var dg = q.charAt(0) === '#' ? q.slice(1) : q;
      var numHit = /^\d*$/.test(dg) && (q.charAt(0) === '#' || dg !== '') && (dg === '' || +dg === t.num || String(t.num).indexOf(dg) === 0 || fmtNum(t.num).slice(1).indexOf(dg) === 0);
      if (hay.indexOf(q) < 0 && !numHit) return false;
    }
    return true;
  }
  var DUE_OPTS = [['today', 'Hoje'], ['week', 'Esta semana'], ['nextmonth', 'Próximo mês'], ['late', 'Atrasadas'], ['none', 'Sem prazo']];
  function renderToolbar() {
    $('gDue').innerHTML = DUE_OPTS.map(function (o) { return '<button class="pill" type="button" data-fdue="' + o[0] + '" aria-pressed="' + (F.due === o[0]) + '">' + o[1] + '</button>'; }).join('');
    $('gFlag').innerHTML = STATUS_FLAGS.map(function (f) { return '<button class="pill" type="button" data-fflag="' + f.id + '" aria-pressed="' + (F.flags.indexOf(f.id) > -1) + '" style="--fc:var(--sw-' + f.color + ')"><span class="fdot"></span>' + esc(f.label) + '</button>'; }).join('');
    var cat = $('fCat'), who = $('fWho');
    cat.querySelector('.lbl').textContent = !F.cats.length ? 'Categoria' : F.cats.length === 1 ? F.cats[0] : 'Categoria · ' + F.cats.length;
    cat.classList.toggle('on', !!F.cats.length);
    who.querySelector('.lbl').textContent = !F.who ? 'Pessoa' : F.who === 'mine' ? 'Minhas tarefas' : F.who;
    who.classList.toggle('on', !!F.who);
    $('fClear').hidden = !filtersActive();
    $('qClear').hidden = !F.q;
    $('qKbd').hidden = !!F.q;
    var tot = allTasks().length, shown = allTasks().filter(matches).length;
    $('results').textContent = filtersActive() ? 'Mostrando ' + shown + ' de ' + tot + ' tarefas' : tot + ' tarefas';
    renderPresets();
    var nf = (F.due ? 1 : 0) + (F.flags.length ? 1 : 0) + (F.cats.length ? 1 : 0) + (F.who ? 1 : 0), fb = $('fbn');
    if (fb) { fb.hidden = !nf; fb.textContent = nf; }
    if (mainView === 'cal') renderPubCal();
  }
  function applyFilters() { render(); renderToolbar(); }
  /* filtros salvos: cada pessoa guarda os seus; um deles pode abrir sempre ao entrar */
  var PRESETS = {}, presetN = 1;
  try {
    var rawP = JSON.parse(localStorage.getItem('vivox-kanban-presets') || 'null');
    if (rawP && typeof rawP === 'object') Object.keys(rawP).forEach(function (who) {
      if (!Array.isArray(rawP[who])) return;
      PRESETS[who] = rawP[who].filter(function (p) { return p && typeof p.name === 'string'; }).slice(0, 20).map(function (p) {
        return { id: 'p' + (presetN++), name: p.name.slice(0, 32), due: DUE_OPTS.some(function (o) { return o[0] === p.due; }) ? p.due : '', flags: Array.isArray(p.flags) ? p.flags.map(String).slice(0, 12) : [], cats: Array.isArray(p.cats) ? p.cats.map(String).slice(0, 20) : [], who: typeof p.who === 'string' ? p.who.slice(0, 40) : '', def: !!p.def };
      });
    });
  } catch (err) {}
  function presetsOf() { return PRESETS[viewer] || (PRESETS[viewer] = []); }
  function persistPresets() { try { localStorage.setItem('vivox-kanban-presets', JSON.stringify(PRESETS)); } catch (err) {} }
  function sameSet(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) > -1; }); }
  function matchesPreset(p) { return p.due === F.due && p.who === F.who && sameSet(p.flags, F.flags) && sameSet(p.cats, F.cats); }
  function filterParts() {
    var parts = [];
    if (F.who) parts.push(F.who === 'mine' ? 'Minhas tarefas' : F.who);
    if (F.due) parts.push(DUE_OPTS.filter(function (o) { return o[0] === F.due; })[0][1]);
    F.flags.forEach(function (id) { var sf = STATUS_FLAGS.filter(function (x) { return x.id === id; })[0]; if (sf) parts.push(sf.label); });
    F.cats.forEach(function (c) { parts.push(c); });
    return parts;
  }
  function applyPreset(p, silent) {
    F = {
      q: '', due: p.due, who: p.who,
      flags: p.flags.filter(function (id) { return FLAGS.some(function (f) { return f.id === id; }); }),
      cats: p.cats.filter(function (c) { return !!catOf(c); })
    };
    $('q').value = '';
    if (!silent) applyFilters();
  }
  function renderPresets() {
    var box = $('presets'), list = presetsOf(), active = filtersActive(), canSave = active && !list.some(matchesPreset);
    box.hidden = false;
    var h = '<span class="plab">Meus filtros</span>';
    list.forEach(function (p) {
      var on = matchesPreset(p) && active;
      h += '<span class="pchip' + (on ? ' on' : '') + '"><button class="pc-n" type="button" data-preset="' + p.id + '" aria-pressed="' + on + '" title="' + (on ? 'Clique para limpar este filtro' : 'Aplicar este filtro') + '">' + esc(p.name) + '</button>' +
        '<button class="pc-s" type="button" data-pdef="' + p.id + '" aria-pressed="' + p.def + '" aria-label="' + (p.def ? 'Este filtro abre sempre ao entrar. Clique para desligar' : 'Abrir este filtro sempre ao entrar') + '" title="' + (p.def ? 'Abre sempre ao entrar' : 'Abrir sempre ao entrar') + '">' + icon('star') + '</button>' +
        '<button class="pc-x" type="button" data-pdel="' + p.id + '" aria-label="Excluir o filtro ' + esc(p.name) + '" title="Excluir filtro">' + icon('x') + '</button></span>';
    });
    if (canSave) h += '<button class="pill save" type="button" data-pop="savef" aria-haspopup="dialog" aria-expanded="false">' + icon('bookmark') + 'Salvar filtro atual</button>';
    else if (!active) h += '<button class="pill save" type="button" disabled title="Escolha pessoa, prazo, prioridade ou categoria acima para poder salvar">' + icon('bookmark') + 'Salvar filtro atual</button>' + (list.length ? '' : '<span class="fhint">Escolha filtros acima e salve a combinação para abrir com um clique.</span>');
    box.innerHTML = h;
  }
  function savefPopHTML() {
    var d = popState.draft;
    return '<h4>Salvar filtro</h4><div class="sumf" aria-label="Filtros incluídos">' + filterParts().map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<form class="colf" data-form="savef"><div class="fld"><label for="spName">Nome do filtro</label><input id="spName" type="text" maxlength="32" autocomplete="off" value="' + esc(d.name) + '"></div>' +
      '<label class="sw-toggle"><input id="spDef" type="checkbox" role="switch"' + (d.def ? ' checked' : '') + '><span class="trk"></span><span>Abrir sempre ao entrar</span></label>' +
      '<div class="prow"><button class="btn primary sm" type="submit">Salvar filtro</button><button class="btn sm" type="button" data-pcancel>Cancelar</button></div></form>';
  }
  function commitPreset() {
    var d = popState.draft, name = d.name.trim() || 'Meu filtro', list = presetsOf();
    if (list.length >= 20) { toast('Limite de 20 filtros salvos. Exclua algum para criar outro'); return; }
    var base = name, n = 1;
    while (list.some(function (p) { return p.name.toLowerCase() === name.toLowerCase(); })) { n++; name = base.slice(0, 28) + ' ' + n; }
    if (d.def) list.forEach(function (p) { p.def = false; });
    list.push({ id: 'p' + (presetN++), name: name, due: F.due, who: F.who, flags: F.flags.slice(), cats: F.cats.slice(), def: !!d.def });
    persistPresets();
    closePop();
    renderToolbar();
    toast('Filtro "' + name + '" salvo' + (d.def ? '. Abre sempre ao entrar' : ''));
  }
  function applyDefaultPreset(silent) { var p = presetsOf().filter(function (x) { return x.def; })[0]; if (p) applyPreset(p, silent); }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }

  /* ------------------------------------------------------------ cartão */
  function tint(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return TINTS[h % TINTS.length];
  }
  function initials(name) { return name.split(' ').slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); }
  function avatar(name, tip) {
    var tn = tint(name), photo = PROFILES[name] && PROFILES[name].photo;
    photo = window.VvoxSyncTaskExtras && window.VvoxSyncTaskExtras.sanitizeImageUrl ? window.VvoxSyncTaskExtras.sanitizeImageUrl(photo) : '';
    photo = photo || '';
    return '<span class="av"' + (tip ? ' tabindex="0" aria-label="' + esc(tip) + '"' : '') + ' style="--c:' + tn[0] + ';--t:' + tn[1] + (photo ? ';background-image:url(' + photo + ')' : '') + '">' + (photo ? '' : initials(name)) + (tip ? '<span class="tip" role="tooltip">' + esc(tip) + '</span>' : '') + '</span>';
  }
  /* cliente: vem do campo "cliente" da tarefa ou do começo da frase ("Studio Nativa · seção de depoimentos"); a foto fica salva por cliente neste navegador */
  var CLIENTS = {};
  try {
    var rawC = JSON.parse(localStorage.getItem('vivox-kanban-clients') || 'null');
    if (rawC && typeof rawC === 'object') Object.keys(rawC).forEach(function (k) {
      if (typeof rawC[k] === 'string' && rawC[k].indexOf('data:image/jpeg;base64,') === 0 && rawC[k].length < 90000) CLIENTS[k] = rawC[k];
    });
  } catch (err) {}
  /* marcas fictícias geradas por IA (200 px); sem elas, usa o desenho vetorial */
  var REAL_LOGOS = {
    "Clínica Aurora": "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",
    "Studio Nativa": "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",
    "Odonto Prime": "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",
    "Consultório Prado": "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"
  };
  // Customer photos are user preferences; demonstration logos are never assigned to real tasks.
  function saveClients() { try { localStorage.setItem('vivox-kanban-clients', JSON.stringify(CLIENTS)); } catch (err) {} }
  function clientOf(t) {
    if (t.client) return t.client;
    var n = t.note || '', i = n.indexOf(' · ');
    return i > 0 ? n.slice(0, i).trim() : '';
  }
  function clientAvatar(name) {
    if (!name) return '';
    var tn = tint(name), photo = CLIENTS[name];
    return '<span class="cav" role="img" aria-label="Cliente: ' + esc(name) + '" title="' + esc(name) + '" style="--c:' + tn[0] + ';--t:' + tn[1] + (photo ? ';background-image:url(' + photo + ')' : '') + '">' + (photo ? '' : esc(initials(name))) + '</span>';
  }
  function setClientPhoto(name, file) {
    if (!name || !file) return;
    if (!/^image\//.test(file.type)) { toast('Escolha uma imagem JPG, PNG ou WebP'); return; }
    if (file.size > 8 * 1048576) { toast('A imagem passa de 8 MB'); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var sq = Math.min(img.width, img.height), c = document.createElement('canvas');
        c.width = c.height = 160;
        c.getContext('2d').drawImage(img, (img.width - sq) / 2, (img.height - sq) / 2, sq, sq, 0, 0, 160, 160);
        CLIENTS[name] = c.toDataURL('image/jpeg', 0.85);
        saveClients(); refreshAllCards(); renderDetail(); toast('Foto de ' + name + ' atualizada');
      };
      img.onerror = function () { toast('Não foi possível ler essa imagem'); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function people(t) {
    var seen = [];
    ROLE_ORDER.forEach(function (k) { if (t[k] && seen.indexOf(t[k]) < 0) seen.push(t[k]); });
    return seen;
  }
  function prioChip(t, edit) {
    var f = flagOf(t.priority), inner = icon('flag') + '<span>' + esc(f.label) + '</span>' + (edit ? icon('down', 'caret') : '');
    var st = ' style="--fc:var(--sw-' + f.color + ')"';
    return edit ? '<button class="chip flag" type="button" data-pop="flag" aria-haspopup="dialog" aria-expanded="false" aria-label="Prioridade: ' + esc(f.label) + '. Alterar"' + st + '>' + inner + '</button>' : '<span class="chip flag"' + st + '>' + inner + '</span>';
  }
  function catChip(t, edit) {
    var c = t.category ? catOf(t.category) : null;
    if (!c) return edit ? '<button class="chip empty-chip" type="button" data-pop="cat" aria-haspopup="dialog" aria-expanded="false">' + icon('plus') + '<span>Categoria</span></button>' : '';
    var inner = icon(c.icon) + '<span>' + esc(c.label) + '</span>' + (edit ? icon('down', 'caret') : '');
    return edit ? '<button class="chip cat" type="button" data-pop="cat" aria-haspopup="dialog" aria-expanded="false" aria-label="Categoria: ' + esc(c.label) + '. Alterar">' + inner + '</button>' : '<span class="chip cat">' + inner + '</span>';
  }
  function playBtn(t) {
    var on = !!t.since, ok = canPlay(t), l = locate(t.id), tg = null;
    if (l && colById(l.col).role === 'queue') tg = colByRole('doing');
    var label = !ok ? 'Só o responsável da tarefa controla o play' : on ? 'Pausar o play' : tg ? 'Iniciar o play. O cartão vai para "' + tg.name + '"' : 'Iniciar o play';
    return '<button class="play' + (on ? ' on' : '') + '" type="button" data-play="' + t.id + '" aria-disabled="' + (!ok) + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + icon(on ? 'pause' : 'play', 'fill') + '</button>';
  }

  function stepsChip(t) {
    var n = (t.steps || []).length, nf = (t.files || []).length, h = '';
    if (n) { var d = t.steps.filter(function (x) { return x.done; }).length; h += '<span class="stp' + (d === n ? ' full' : '') + '" title="Etapas concluídas">' + icon('check') + d + '/' + n + '</span>'; }
    if (nf) h += '<span class="stp" title="' + nf + (nf === 1 ? ' anexo' : ' anexos') + '">' + icon('clip') + nf + '</span>';
    var nl = (t.links || []).length;
    if (nl) h += '<span class="stp" title="' + nl + (nl === 1 ? ' link de referência' : ' links de referência') + '">' + icon('link') + nl + '</span>';
    return h;
  }
  /* o que aparece em cada cartão: cada pessoa escolhe pelo botão "Cartões" (fica salvo neste navegador) */
  var CARD_DEFAULT = { showdue: true, created: false, cat: false, id: false, note: false, photo: false, people: false, play: false };
  var CARD = {};
  Object.keys(CARD_DEFAULT).forEach(function (k) { CARD[k] = CARD_DEFAULT[k]; });
  try {
    var rawCard = JSON.parse(localStorage.getItem('vivox-kanban-cardprefs') || 'null');
    if (localStorage.getItem('vvox-sync-original-export-version') !== '3') rawCard = null;
    if (rawCard && typeof rawCard === 'object') Object.keys(CARD_DEFAULT).forEach(function (k) { if (typeof rawCard[k] === 'boolean') CARD[k] = rawCard[k]; });
  } catch (err) {}
  function saveCard() { try { localStorage.setItem('vivox-kanban-cardprefs', JSON.stringify(CARD)); } catch (err) {} }
  function cardPeople(t) { return CARD.people ? people(t) : (t.maker ? [t.maker] : []); }
  var CARD_ROWS = [['showdue', 'Prazo', 'Só a data, sem o horário'], ['created', 'Data de criação', ''], ['cat', 'Tipo de conteúdo', ''], ['id', 'Número da tarefa', 'O #009 no canto do cartão'], ['note', 'Subtítulo da tarefa', 'A linha cinza abaixo do título'], ['photo', 'Foto do cliente', ''], ['people', 'Proprietário(a) e supervisor(a)', 'Desligado: só o responsável'], ['play', 'Play e tempo sempre visíveis', 'Desligado: só aparecem com o play rodando']];
  function cardOptsHTML() {
    return '<h4>Mostrar no cartão</h4><div class="copts">' + CARD_ROWS.map(function (r) {
      return '<label class="sw-toggle copt"><input type="checkbox" role="switch" data-cardopt="' + r[0] + '"' + (CARD[r[0]] ? ' checked' : '') + '><span class="trk"></span><span class="ct"><b>' + r[1] + '</b>' + (r[2] ? '<small>' + r[2] + '</small>' : '') + '</span></label>';
    }).join('') + '</div><div class="prow"><button class="plink" type="button" data-cardall>Mostrar tudo</button><button class="plink" type="button" data-cardreset>Padrão</button></div>';
  }
  function applyCard() { saveCard(); refreshAllCards(); render(); }
  /* ao ocultar: os itens somem e o cartão encolhe; ao mostrar: o cartão cresce e os itens entram */
  var CARD_SEL = { showdue: '.dates dt:last-of-type,.dates dd:last-of-type', created: '.dates dt:first-child,.dates dt:first-child + dd', cat: '.chip.cat', id: '.num', note: '.note', photo: '.trow .cav', people: '.avs .av:not(:last-child)', play: '.play,.tm' };
  function cardEls2() { return Object.keys(cardEls).map(function (id) { return cardEls[id]; }).filter(function (el) { return el.isConnected; }); }
  function cardTargets(el, key) {
    if (key === 'play' && el.querySelector('.tm.run')) return [];
    return Array.prototype.slice.call(el.querySelectorAll(CARD_SEL[key]));
  }
  function animateHeights(cards, h0) {
    cards.forEach(function (el) {
      var a = h0[el.dataset.card], b = el.offsetHeight;
      if (a == null || Math.abs(a - b) < 1 || !el.animate) return;
      el.style.overflow = 'hidden';
      var an = el.animate([{ height: a + 'px' }, { height: b + 'px' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
      var done = function () { el.style.overflow = ''; };
      an.onfinish = done; an.oncancel = done;
    });
  }
  function cardBulk(change) {
    if (reduce) { change(); applyCard(); return; }
    var cards = cardEls2(), h0 = {};
    cards.forEach(function (el) { h0[el.dataset.card] = el.offsetHeight; });
    change(); applyCard();
    animateHeights(cards, h0);
  }
  function cardChange(key, on) {
    if (reduce) { CARD[key] = on; applyCard(); return; }
    var cards = cardEls2();
    var run = function () {
      var h0 = {};
      cards.forEach(function (el) { h0[el.dataset.card] = el.offsetHeight; });
      CARD[key] = on; applyCard();
      animateHeights(cards, h0);
      if (on) cards.forEach(function (el) { cardTargets(el, key).forEach(function (t) { if (t.animate) t.animate([{ opacity: 0, transform: 'translateY(-5px)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: 80, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); }); });
    };
    if (on) { run(); return; }
    cards.forEach(function (el) { cardTargets(el, key).forEach(function (t) { if (t.animate) t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-out', fill: 'forwards' }); }); });
    setTimeout(run, 160);
  }
  function shellHTML(t) {
    var done = isDone(t), di = dueInfo(t);
    var hasPlay = CARD.play || !!t.since, stepsH = stepsChip(t);
    var nStp = (stepsH.match(/class="stp/g) || []).length, inl = (hasPlay || !CARD.showdue) ? '' : !stepsH ? ' in-av' : ' in-all';
    var avs = cardPeople(t).map(function (n) {
      return avatar(n, n + ' · ' + rolesOf(t, n).map(function (k) { return ROLES[k].label; }).join(' e '));
    }).join('');
    var dates = !CARD.showdue && !CARD.created ? '' : '<dl class="dates">' + (CARD.created ? '<dt>Criada</dt><dd>' + esc(fDate(t.createdAt) + ', ' + fTime(t.createdAt)) + '</dd>' : '') +
      (CARD.showdue ? '<dt>' + (done ? 'Entregue' : 'Prazo') + '</dt><dd class="' + di.cls + '" data-due="' + t.id + '">' + (done && t.deliveredAt ? esc(fDate(t.deliveredAt)) : dueHTML(t, true)) + '</dd>' : '') + '</dl>';
    return '<div class="shell' + inl + '" data-skey="' + ((statusFlag(t) || {}).id || '') + '"' + (inl === ' in-all' ? ' style="--pr:' + (36 + 42 * nStp) + 'px"' : '') + '><button class="cdots" type="button" data-cdots="' + t.id + '" aria-haspopup="menu" aria-label="Ações da tarefa" title="Ações da tarefa">' + icon('more') + '</button><div class="chips">' + statusChip(t) + (CARD.cat ? catChip(t) : '') + (CARD.id ? '<span class="num" title="Número da tarefa">' + fmtNum(t.num) + '</span>' : '') + '</div><div class="trow">' + (CARD.photo ? clientAvatar(clientOf(t)) : '') + '<div class="tcol"><p class="title">' + esc(t.title) + '</p>' +
      (t.note && CARD.note ? '<p class="note">' + esc(t.note) + '</p>' : '') + '</div></div>' + dates +
      '<div class="meta"><div class="playrow">' + (CARD.play || t.since ? playBtn(t) + '<span class="tm' + (t.since ? ' run' : '') + '" data-timer="' + t.id + '">' + fDur(elapsed(t)) + '</span>' : '') + stepsChip(t) + '</div><div class="avs">' + avs + '</div></div></div>';
  }

  function cardLabel(t) { return fmtNum(t.num) + ' ' + t.title + '. Enter abre os detalhes. Espaço pega o cartão.'; }
  function getCard(t) {
    var el = cardEls[t.id];
    if (!el) {
      el = document.createElement('div');
      el.className = 'card';
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-roledescription', 'Cartão arrastável');
      el.dataset.card = t.id;
      el.innerHTML = shellHTML(t);
      el.setAttribute('aria-label', cardLabel(t));
      if (appReady) el.dataset.enter = '1';
      cardEls[t.id] = el;
    }
    return el;
  }
  function refreshCard(id) {
    var l = locate(id), el = cardEls[id];
    if (l && el) { el.innerHTML = shellHTML(l.task); el.setAttribute('aria-label', cardLabel(l.task)); }
  }
  function refreshAllCards() { Object.keys(cardEls).forEach(refreshCard); }

  /* ------------------------------------------------------------ colunas */
  function paintColHeader(col) {
    var s = colEls[col.id], h = s.querySelector('.col-h');
    h.style.setProperty('--cc', 'var(--sw-' + col.color + ')');
    h.classList.toggle('filled', !!col.fill);
    var pb = s.querySelector('.pln');
    pb.hidden = !col.plan;
    if (col.plan) { pb.style.setProperty('--pc', col.plan === 'sched' ? 'var(--sw-green)' : 'var(--sw-gray)'); pb.innerHTML = icon('cal'); pb.title = 'No calendário de publicações: ' + (col.plan === 'sched' ? 'Agendado' : 'Por fazer'); }
    s.classList.toggle('collapsed', !!col.collapsed);
    s.classList.toggle('apart', !!col.apart);
    s.classList.toggle('apart-end', col.apart === 'end');
    s.classList.toggle('apart-start', col.apart === 'start');
    s.style.setProperty('--dim', col.dim);
    s.querySelector('.mk').innerHTML = col.collapsed || col.mk === 'icon' ? icon(col.icon) : '<span class="dot"></span>';
    var fb = s.querySelector('.fold-btn'), fl = (col.collapsed ? 'Expandir a coluna ' : 'Recolher a coluna ') + col.name;
    fb.innerHTML = icon(col.collapsed ? 'chevR' : 'chevL');
    fb.setAttribute('aria-label', fl); fb.setAttribute('aria-expanded', String(!col.collapsed)); fb.title = fl;
    h.title = col.collapsed ? col.name + ' · ' + col.tasks.length + (col.tasks.length === 1 ? ' tarefa' : ' tarefas') + '. Clique para expandir' : '';
    s.querySelector('h2').textContent = col.name;
    s.querySelector('h2').title = 'Função: ' + ROLE_INFO[col.role].label;
    s.setAttribute('aria-label', col.name);
    s.querySelector('.menu-btn').setAttribute('aria-label', 'Opções de ' + col.name);
  }
  function buildColumns() {
    cols.forEach(function (col) {
      var s = document.createElement('section');
      s.className = 'col';
      s.dataset.col = col.id;
      s.setAttribute('aria-label', col.name);
      s.innerHTML =
        '<header class="col-h"><span class="mk"></span><h2></h2><span class="pln" hidden></span><span class="count">0</span>' +
        '<button class="ib fold-btn" type="button"></button><button class="ib menu-btn" type="button" aria-haspopup="menu">' + icon('more') + '</button></header>' +
        '<div class="foot"></div><div class="list"></div>';
      trackEl.appendChild(s);
      colEls[col.id] = s;
      listEls[col.id] = s.querySelector('.list');
      footEls[col.id] = s.querySelector('.foot');
      countEls[col.id] = s.querySelector('.count');
      paintColHeader(col);
      closeAdd(col.id);
    });
    if (cur.fixed) return;
    var nb = document.createElement('button');
    nb.type = 'button';
    nb.className = 'newcol';
    nb.dataset.newcol = '1';
    nb.innerHTML = icon('plus') + '<span>Nova coluna</span>';
    trackEl.appendChild(nb);
  }

  /* ------------------------------------------------------------ quadros: abas, troca e estrutura */
  function renderTabs() {
    $('tabs').innerHTML = boards.map(function (b) {
      var on = b === cur;
      return '<button class="tab" type="button" role="tab" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-board="' + esc(b.id) + '" title="' + esc(b.desc || b.name) + '" style="--bc:var(--sw-' + b.color + ')">' + icon(b.icon) + '<span>' + esc(b.name) + '</span><span class="tn">' + countTasks(b) + '</span></button>';
    }).join('');
  }
  function paintBoardHead() {
    $('bTitleH').textContent = cur.name;
    $('bdesc').textContent = cur.desc || '';
    trackEl.setAttribute('aria-label', 'Quadro ' + cur.name);
  }
  function rebuildBoard() {
    trackEl.innerHTML = '';
    colEls = {}; listEls = {}; footEls = {}; countEls = {}; lastCounts = {};
    buildColumns();
    render();
    renderTabs();
  }
  function selectBoard(id, quiet) {
    var b = boards.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    closePop(); closeMenu();
    if (detailId) closeDetail();
    cur = b; cols = b.cols; grabbed = null;
    paintBoardHead();
    rebuildBoard();
    enterView(trackEl);
    trackEl.scrollLeft = 0;
    renderToolbar();
    saveLayout();
    syncNavigate();
    if (!quiet) say('Quadro ' + b.name + ' aberto.');
  }
  function addColumn(afterId) {
    var i = afterId ? cols.findIndex(function (c) { return c.id === afterId; }) : cols.length - 1;
    while (i >= 0 && cols[i].apart === 'end') i--;
    var c = mkCol({ id: uid('c'), name: 'Nova coluna', color: 'gray', icon: 'list', role: 'none' });
    cols.splice(i + 1, 0, c);
    rebuildBoard();
    saveLayout();
    colEls[c.id].scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    openPop('col', colEls[c.id].querySelector('.menu-btn'), c.id);
  }
  function setPlan(colId, v) {
    var c = colById(colId);
    if (!c) return;
    c.plan = v === 'todo' || v === 'sched' ? v : '';
    paintColHeader(c);
    saveLayout();
    toast(c.plan === 'sched' ? '"' + c.name + '" agora aparece no calendário como Agendado' : c.plan === 'todo' ? '"' + c.name + '" agora aparece no calendário como Por fazer' : '"' + c.name + '" saiu do calendário');
  }
  function setApart(colId, side) {
    var i = cols.findIndex(function (c) { return c.id === colId; });
    if (i < 0) return;
    var c = cols[i];
    c.apart = side;
    if (side) {
      if (c.dim === 1) c.dim = 0.7;
      cols.splice(i, 1);
      if (side === 'end') cols.push(c); else cols.unshift(c);
    } else c.dim = 1;
    rebuildBoard();
    saveLayout();
    colEls[c.id].scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    toast(side ? '"' + c.name + '" separada no ' + (side === 'end' ? 'fim' : 'início') + ' do quadro' : '"' + c.name + '" voltou ao fluxo');
  }
  function moveCol(colId, dir) {
    var i = cols.findIndex(function (c) { return c.id === colId; }), j = i + dir;
    if (j < 0 || j >= cols.length || cols[i].apart || cols[j].apart) return;
    var tmp = cols[i]; cols[i] = cols[j]; cols[j] = tmp;
    rebuildBoard();
    saveLayout();
    say('Coluna movida para ' + (dir < 0 ? 'a esquerda' : 'a direita') + '.');
  }
  function deleteColumn(colId, targetId) {
    var i = cols.findIndex(function (c) { return c.id === colId; });
    if (i < 0 || cols.length < 2) return;
    var c = cols[i], tg = targetId ? colById(targetId) : null;
    if (c.tasks.length && !tg) { toast('Escolha a coluna de destino das tarefas'); return; }
    syncDeletes.columns.push(c.id);
    if (c.tasks.length && tg) c.tasks.forEach(function (t) { tg.tasks.push(t); });
    cols.splice(i, 1);
    rebuildBoard();
    renderToolbar();
    saveLayout();
    toast('Coluna "' + c.name + '" excluída');
  }

  function render() {
    var first = {}, active = filtersActive();
    Object.keys(cardEls).forEach(function (id) {
      if (cardEls[id].isConnected) first[id] = cardEls[id].getBoundingClientRect();
    });
    cols.forEach(function (col) {
      var rows = col.tasks.filter(function (t) { return (!drag || t.id !== drag.id) && matches(t); });
      var isTarget = !!drag && !!slot && slot.col === col.id;
      var nodes = [];
      rows.forEach(function (t, i) {
        if (isTarget && slot.index === i) nodes.push(ph);
        nodes.push(getCard(t));
      });
      if (isTarget && slot.index >= rows.length) nodes.push(ph);
      if (!nodes.length) {
        var e = document.createElement('div');
        e.className = 'empty';
        e.textContent = active && col.tasks.length ? 'Nenhuma tarefa com esses filtros' : 'Nenhuma tarefa nesta etapa';
        nodes.push(e);
      }
      listEls[col.id].replaceChildren.apply(listEls[col.id], nodes);
      colEls[col.id].classList.toggle('hot', isTarget);
      var adj = (drag && drag.from === col.id ? -1 : 0) + (isTarget ? 1 : 0);
      var label = active ? (col.tasks.filter(matches).length + adj) + '/' + (col.tasks.length + adj) : String(col.tasks.length + adj);
      if (lastCounts[col.id] !== label) {
        countEls[col.id].textContent = label;
        if (lastCounts[col.id] != null && !reduce) countEls[col.id].animate([{ transform: 'translateY(-6px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' });
        lastCounts[col.id] = label;
      }
    });
    enterCards();
    if (!reduce) {
      Object.keys(cardEls).forEach(function (id) {
        var f = first[id], el = cardEls[id];
        if (!f || !el.isConnected) return;
        var l = el.getBoundingClientRect(), dx = f.left - l.left, dy = f.top - l.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.23,1,.32,1)' });
      });
    }
    if (grabbed && cardEls[grabbed] && document.activeElement !== cardEls[grabbed]) cardEls[grabbed].focus({ preventScroll: true });
    syncEdges();
  }

  /* ------------------------------------------------------------ mover */
  function move(taskId, to, restore) {
    var f = locate(taskId);
    if (!f) return;
    if (!syncCan(f.task, 'mover')) { toast('Você não pode mover esta tarefa'); return; }
    if (f.col === to.col && f.index === to.index) return;
    var fromCol = colById(f.col), targetCol = colById(to.col);
    if (!restore && fromCol.role === 'review' && targetCol.role === 'doing' && !f.task._syncCorrectionReason) {
      syncAskCorrection(f.task, function(reason) {
        var current = locate(taskId);
        if (!current) return;
        current.task._syncCorrectionReason = reason;
        if (move(taskId, to)) {
          render(); refreshCard(taskId); renderDetail(); renderToolbar(); syncSchedule();
        }
      });
      return false;
    }
    if (restore) { syncMoved = syncMoved.filter(function(id) { return id !== taskId; }); delete f.task._syncCorrectionReason; }
    else if (syncMoved.indexOf(taskId) < 0) syncMoved.push(taskId);
    colById(f.col).tasks.splice(f.index, 1);
    var dest = colById(to.col);
    dest.tasks.splice(Math.min(to.index, dest.tasks.length), 0, f.task);
    return true;
  }
  function moveToCol(taskId, colId) {
    var f = locate(taskId);
    if (!f || f.col === colId) return;
    return move(taskId, { col: colId, index: colById(colId).tasks.length });
  }
  /* com filtro ativo, o índice do slot é entre os cartões visíveis; converte para o índice real */
  function realIndex(colId, visIdx, dragId) {
    var real = colById(colId).tasks.filter(function (t) { return t.id !== dragId; });
    var vis = real.filter(matches);
    if (visIdx >= vis.length) return real.length;
    return real.indexOf(vis[visIdx]);
  }

  /* ------------------------------------------------------------ hit test */
  function snapshot(taskId, fromCol) {
    snap = {};
    Object.keys(listEls).forEach(function (colId) {
      var list = listEls[colId], top = list.getBoundingClientRect().top;
      var cards = Array.prototype.slice.call(list.querySelectorAll('[data-card]'));
      var removed = -1, removedH = 0;
      var rows = cards.map(function (el, i) {
        var r = el.getBoundingClientRect();
        var isD = colId === fromCol && el.dataset.card === taskId;
        if (isD) { removed = i; removedH = r.height; }
        return { top: r.top - top, h: r.height, isD: isD };
      });
      snap[colId] = rows.filter(function (r) { return !r.isD; }).map(function (r, i) {
        var shift = removed > -1 && i >= removed ? removedH + GAP : 0;
        return r.top - shift + r.h / 2;
      });
    });
  }

  function slotAt(x, y) {
    var inside = '', nearestId = '', nearest = Infinity;
    Object.keys(colEls).forEach(function (id) {
      var r = colEls[id].getBoundingClientRect();
      if (x >= r.left && x <= r.right) inside = id;
      var dx = Math.abs(x - (r.left + r.width / 2));
      if (dx < nearest) { nearest = dx; nearestId = id; }
    });
    var colId = inside || nearestId;
    if (!colId) return null;
    var top = listEls[colId].getBoundingClientRect().top, mids = snap[colId] || [], index = mids.length;
    for (var i = 0; i < mids.length; i++) { if (y < top + mids[i]) { index = i; break; } }
    return { col: colId, index: index };
  }

  /* ------------------------------------------------------------ arraste por ponteiro */
  var floatEl = null;
  function place(x, y) { floatEl.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }

  function beginDrag(id, e) {
    var el = cardEls[id], loc = locate(id), r = el.getBoundingClientRect();
    drag = { id: id, from: loc.col, w: r.width, h: r.height, ox: e.clientX - r.left, oy: e.clientY - r.top };
    snapshot(id, loc.col);
    floatEl = document.createElement('div');
    floatEl.className = 'float';
    floatEl.style.width = r.width + 'px';
    var inner = document.createElement('div');
    inner.className = 'inner';
    inner.innerHTML = shellHTML(loc.task);
    floatEl.appendChild(inner);
    place(r.left, r.top);
    document.body.appendChild(floatEl);
    requestAnimationFrame(function () { floatEl.classList.add('lifted'); });
    ph.style.height = r.height + 'px';
    var before = colById(loc.col).tasks.slice(0, loc.index).filter(function (t) { return matches(t); }).length;
    slot = { col: loc.col, index: before };
    grabbed = null;
    document.body.classList.add('dragging');
    render();
    tick();
  }

  function tick() {
    if (autoScroll) trackEl.scrollLeft += autoScroll;
    raf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    if (pending && !drag) {
      if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < 5) return;
      var id = pending.id;
      pending = null;
      beginDrag(id, e);
    }
    if (!drag) return;
    place(e.clientX - drag.ox, e.clientY - drag.oy);
    var next = slotAt(e.clientX, e.clientY);
    if (next && (!slot || slot.col !== next.col || slot.index !== next.index)) { slot = next; render(); }
    var r = trackEl.getBoundingClientRect(), edge = 72;
    autoScroll = e.clientX < r.left + edge ? -14 : e.clientX > r.right - edge ? 14 : 0;
  }

  function endDrag(cancel) {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    var clicked = pending && !drag ? pending.id : null;
    pending = null;
    if (!drag) { if (clicked && !cancel) openDetail(clicked); return; }
    cancelAnimationFrame(raf);
    autoScroll = 0;
    var d = drag, s = slot, fl = floatEl;
    drag = null; slot = null; floatEl = null;
    document.body.classList.remove('dragging');
    var from = d.from;
    if (!cancel && s) move(d.id, { col: s.col, index: realIndex(s.col, s.index, d.id) });
    var el = cardEls[d.id];
    el.style.visibility = 'hidden';
    render();
    var t = el.getBoundingClientRect();
    var done = function () { fl.remove(); el.style.visibility = ''; settle(el); };
    fl.classList.remove('lifted');
    if (reduce) { done(); }
    else {
      var a = fl.animate([{ transform: fl.style.transform }, { transform: 'translate3d(' + t.left + 'px,' + t.top + 'px,0)' }], { duration: 240, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
      a.onfinish = done;
      a.oncancel = done;
    }
    var at = locate(d.id);
    if (!at) return;
    refreshCard(d.id);
    renderToolbar();
    if (cancel) say('Movimento cancelado.');
    else {
      say('Tarefa movida para ' + colById(at.col).name + ', posição ' + (at.index + 1) + '.');
      if (at.col !== from) sysLog(at.task, 'moveu a tarefa para ' + colById(at.col).name, viewer);
    }
  }
  function onUp() { endDrag(false); }
  function onCancel() { endDrag(true); }

  trackEl.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    if (e.target.closest('[data-play],[data-cdots]')) return;
    var card = e.target.closest('.card');
    if (!card) return;
    closeMenu();
    pending = { id: card.dataset.card, x: e.clientX, y: e.clientY };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  });

  /* ------------------------------------------------------------ arrastar o quadro para os lados
     Segure em qualquer área livre do quadro (fundo, cabeçalho ou espaço entre cartões) e arraste para a direita ou para a esquerda. */
  var panS = null, panJust = false;
  trackEl.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.pointerType === 'touch' || drag || pending) return;
    if (e.target.closest && e.target.closest('.card,button,input,textarea,select,a,label,[contenteditable]')) return;
    panS = { x: e.clientX, left: trackEl.scrollLeft, on: false };
    window.addEventListener('pointermove', panMove);
    window.addEventListener('pointerup', panEnd);
    window.addEventListener('pointercancel', panEnd);
  });
  function panMove(e) {
    if (!panS) return;
    var dx = e.clientX - panS.x;
    if (!panS.on) {
      if (Math.abs(dx) < 5) return;
      panS.on = true;
      closeMenu(); closePop();
      trackEl.classList.add('panning');
      document.body.classList.add('dragging');
    }
    trackEl.scrollLeft = panS.left - dx;
  }
  function panEnd() {
    window.removeEventListener('pointermove', panMove);
    window.removeEventListener('pointerup', panEnd);
    window.removeEventListener('pointercancel', panEnd);
    if (panS && panS.on) {
      trackEl.classList.remove('panning');
      document.body.classList.remove('dragging');
      panJust = true; setTimeout(function () { panJust = false; }, 0);
    }
    panS = null;
  }

  /* ------------------------------------------------------------ teclado do quadro */
  trackEl.addEventListener('keydown', function (e) {
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (!card || e.target !== card) return;
    var id = card.dataset.card, at = locate(id);
    if (!at) return;
    var isG = grabbed === id;
    if (e.key === 'Enter' && !isG) { e.preventDefault(); openDetail(id); return; }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isG) { grabbed = null; card.classList.remove('grabbed'); say('Solto em ' + colById(at.col).name + ', posição ' + (at.index + 1) + '.'); }
      else { origin = { col: at.col, index: at.index }; grabbed = id; card.classList.add('grabbed'); say('Cartão pego. Use as setas para mover.'); }
      return;
    }
    if (e.key === 'Escape' && isG) {
      e.preventDefault();
      move(id, origin, true); grabbed = null; card.classList.remove('grabbed'); render();
      say('Cancelado. O cartão voltou ao lugar de origem.');
      return;
    }
    if (!isG) return;
    var to = null;
    if (e.key === 'ArrowUp') to = { col: at.col, index: Math.max(0, at.index - 1) };
    if (e.key === 'ArrowDown') to = { col: at.col, index: Math.min(cols[at.colIndex].tasks.length - 1, at.index + 1) };
    if (e.key === 'ArrowLeft' && at.colIndex > 0) to = { col: cols[at.colIndex - 1].id, index: Math.min(at.index, cols[at.colIndex - 1].tasks.length) };
    if (e.key === 'ArrowRight' && at.colIndex < cols.length - 1) to = { col: cols[at.colIndex + 1].id, index: Math.min(at.index, cols[at.colIndex + 1].tasks.length) };
    if (to) {
      e.preventDefault();
      move(id, to); render();
      cardEls[id].classList.add('grabbed');
      say('Movido para ' + colById(to.col).name + ', posição ' + (to.index + 1) + '.');
    }
  });

  /* ------------------------------------------------------------ adicionar tarefa */
  function closeAdd(colId) {
    footEls[colId].innerHTML = '<button class="add" type="button" data-add="' + colId + '"' + (colById(colId).role === 'done' ? ' disabled' : '') + '>' + icon('plus') + 'Criar tarefa</button>';
  }
  function openAdd(colId) {
    if (!colById(colId) || colById(colId).role === 'done') return;
    cols.forEach(function (c) { if (c.id !== colId) closeAdd(c.id); });
    footEls[colId].innerHTML =
      '<form class="addform" data-form="' + colId + '"><input id="novo-' + colId + '" type="text" maxlength="120" autocomplete="off" placeholder="Título da tarefa" aria-label="Título da nova tarefa">' +
      '<div class="row"><button class="btn primary sm" type="submit">Adicionar</button><button class="btn sm" type="button" data-cancel="' + colId + '">Cancelar</button></div></form>';
    var input = footEls[colId].querySelector('input');
    input.focus();
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); closeAdd(colId); } });
  }
  trackEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var colId = e.target.dataset.form, input = e.target.querySelector('input'), title = input.value.trim();
    if (!title) { input.focus(); return; }
    var t = T({ id: 'n' + (nextId++), num: nextNum++, title: title, priority: 'normal', owner: viewer, lead: '', maker: '', createdAt: new Date(), dueAt: null, desc: 'Sem descrição ainda. Abra a tarefa para definir prazo, flag, categoria e pessoas.' });
    colById(colId).tasks.push(t);
    render();
    renderToolbar();
    input.value = '';
    input.focus();
    say('Tarefa ' + fmtNum(t.num) + ' adicionada em ' + colById(colId).name + '.');
    toast('Tarefa ' + fmtNum(t.num) + ' criada' + (matches(t) ? '' : '. Está oculta pelos filtros atuais'));
  });
  trackEl.addEventListener('click', function (e) {
    if (panJust) return;
    var cd = e.target.closest('[data-cdots]');
    if (cd) { var r = cd.getBoundingClientRect(); openCtx(cd.dataset.cdots, r.right - 6, r.bottom + 4); return; }
    var pl = e.target.closest('[data-play]');
    if (pl) { togglePlay(pl.dataset.play); return; }
    var add = e.target.closest('[data-add]');
    if (add) { openBulk(add.dataset.add); return; }
    var cancel = e.target.closest('[data-cancel]');
    if (cancel) { closeAdd(cancel.dataset.cancel); return; }
    if (e.target.closest('[data-newcol]')) { addColumn(cols[cols.length - 1].id); return; }
    var fold = e.target.closest('.fold-btn');
    if (fold) { toggleFold(fold.closest('.col').dataset.col); return; }
    var chd = e.target.closest('.col.collapsed .col-h');
    if (chd) { toggleFold(chd.closest('.col').dataset.col); return; }
    var mb = e.target.closest('.menu-btn');
    if (mb) { toggleMenu(mb, mb.closest('.col').dataset.col); }
  });
  /* recolher: a coluna vira uma faixa estreita só com a cor e o ícone; o estado fica salvo por quadro */
  function toggleFold(colId) {
    var c = colById(colId), el = colEls[colId];
    if (!c || !el || el.classList.contains('opening') || el.classList.contains('closing')) return;
    closeMenu();
    var after = function () { saveLayout(); syncEdges(); say('Coluna ' + c.name + (c.collapsed ? ' recolhida.' : ' expandida.')); };
    if (reduce) { c.collapsed = !c.collapsed; paintColHeader(c); after(); return; }
    if (c.collapsed) {
      /* abrir: primeiro a coluna ganha toda a largura, só então o conteúdo aparece, em sequência */
      c.collapsed = false;
      el.classList.add('opening');
      var fb = el.querySelector('.fold-btn'); if (fb) fb.setAttribute('aria-expanded', 'true');
      var finished = false;
      var fin = function () {
        if (finished) return;
        finished = true;
        el.classList.remove('opening');
        paintColHeader(c);
        el.classList.add('revealing');
        setTimeout(function () { el.classList.remove('revealing'); }, 1100);
        after();
      };
      el.addEventListener('transitionend', function te(ev) { if (ev.target === el && ev.propertyName === 'width') { el.removeEventListener('transitionend', te); fin(); } });
      setTimeout(fin, 460);
    } else {
      /* fechar: o conteúdo some primeiro, depois a coluna encolhe */
      el.classList.add('closing');
      setTimeout(function () { c.collapsed = true; el.classList.remove('closing'); paintColHeader(c); after(); }, 150);
    }
  }
  $('newBtn').innerHTML = icon('plus') + 'Nova tarefa';
  $('newBtn').addEventListener('click', function () { openBulk(cols[0].id); });

  /* criar tarefas em lista: cada linha vira uma tarefa na coluna escolhida */
  var SOURCES = ['Instagram', 'Reels', 'Stories', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'Site', 'E-mail', 'WhatsApp', 'Outro'];
  var novEl = $('nov'), ndlgEl = $('ndlg'), nrowsEl = $('nrows'), nLast = null, nRowN = 1;
  function nOpen() { return !novEl.hidden; }
  var nColId = '', nClientNames = [];
  function nPaintCol() {
    var c = colById(nColId) || cols[0];
    nColId = c.id;
    $('nColBtn').innerHTML = '<span class="sw" style="--fc:var(--sw-' + c.color + ')"></span><span class="nm">' + esc(c.name) + '</span>' + icon('down');
  }
  function nColPopHTML() {
    var h = '<h4>Coluna de destino</h4><ul class="opts" role="listbox" aria-label="Colunas do quadro">';
    cols.forEach(function (c) {
      var on = c.id === nColId;
      h += '<li class="opt"><button type="button" class="opt-b' + (on ? ' on' : '') + '" role="option" aria-selected="' + on + '" data-ncol="' + esc(c.id) + '" style="--fc:var(--sw-' + c.color + ')"><span class="sw"></span>' + esc(c.name) + (on ? icon('check', 'tick') : '') + '</button></li>';
    });
    return h + '</ul>';
  }
  /* sugestões de cliente e fonte: lista própria no lugar da lista nativa do navegador */
  var sugEl = document.createElement('div'), sugFor = null, sugSel = -1;
  sugEl.className = 'sug'; sugEl.hidden = true; sugEl.setAttribute('role', 'listbox');
  document.body.appendChild(sugEl);
  function sugHide() { sugEl.hidden = true; sugFor = null; sugSel = -1; }
  function sugItems(inp) {
    var q = inp.value.trim().toLowerCase(), list = inp.dataset.f === 'client' ? nClientNames : SOURCES;
    return list.filter(function (x) { return x.toLowerCase().indexOf(q) > -1 && x.toLowerCase() !== q; }).slice(0, 8);
  }
  function sugShow(inp) {
    var items = sugItems(inp);
    if (!items.length) { sugHide(); return; }
    sugFor = inp; if (sugSel >= items.length) sugSel = -1;
    var isC = inp.dataset.f === 'client';
    sugEl.innerHTML = items.map(function (x, i) {
      return '<button type="button" class="opt-b' + (i === sugSel ? ' on' : '') + '" role="option" aria-selected="' + (i === sugSel) + '" data-sug="' + esc(x) + '">' + (isC ? clientAvatar(x) : icon('chat')) + '<span>' + esc(x) + '</span></button>';
    }).join('');
    sugEl.hidden = false;
    var r = inp.getBoundingClientRect(), h = sugEl.offsetHeight, w = Math.max(r.width, 200);
    var top = r.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
    sugEl.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + 'px';
    sugEl.style.top = top + 'px';
    sugEl.style.width = w + 'px';
  }
  function sugPick(val) {
    var inp = sugFor;
    if (!inp) return;
    inp.value = val;
    sugHide();
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.focus();
  }
  sugEl.addEventListener('mousedown', function (e) { e.preventDefault(); });
  sugEl.addEventListener('click', function (e) { var b = e.target.closest('[data-sug]'); if (b) sugPick(b.dataset.sug); });
  function sugKey(e) {
    if (sugEl.hidden || !sugFor) return false;
    var n = sugEl.querySelectorAll('[data-sug]').length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sugSel = (sugSel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; sugShow(sugFor); return true; }
    if (e.key === 'Enter' && sugSel > -1) { e.preventDefault(); sugPick(sugEl.querySelectorAll('[data-sug]')[sugSel].dataset.sug); return true; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); sugHide(); return true; }
    return false;
  }
  window.addEventListener('resize', sugHide);
  document.addEventListener('scroll', function (e) { if (!sugEl.contains(e.target)) sugHide(); }, true);
  function nRowHTML() {
    var n = nRowN++;
    return '<div class="nrow" data-nrow>' +
      '<input id="nt' + n + '" data-f="title" type="text" maxlength="120" placeholder="Tema da tarefa" aria-label="Tema da tarefa">' +
      '<textarea id="nd' + n + '" data-f="desc" rows="1" maxlength="600" placeholder="Descrição" aria-label="Descrição"></textarea>' +
      '<div class="ncli"><button class="ncav" type="button" data-cphoto disabled aria-label="Foto do cliente">' + icon('users') + '</button><input id="nc' + n + '" data-f="client" type="text" maxlength="40" autocomplete="off" placeholder="Cliente" aria-label="Cliente"></div>' +
      '<input id="ns' + n + '" data-f="source" type="text" maxlength="30" autocomplete="off" placeholder="Fonte" aria-label="Fonte">' +
      '<button id="nu' + n + '" class="ndue" type="button" data-f="due" data-due="" aria-haspopup="dialog" aria-expanded="false" aria-label="Prazo de entrega">' + icon('cal') + '<span>Prazo</span></button>' +
      '<button class="ib" type="button" data-nrm aria-label="Tirar esta linha" title="Tirar linha">' + icon('x') + '</button></div>';
  }
  function nAddRow(focus) {
    nrowsEl.insertAdjacentHTML('beforeend', nRowHTML());
    var row = nrowsEl.lastElementChild;
    nPaintCli(row);
    if (focus) { row.scrollIntoView({ block: 'nearest' }); row.querySelector('input').focus(); }
    nSync();
  }
  /* foto do cliente na linha: aparece ao digitar um cliente; clicar nela troca a foto */
  function nPaintCli(row) {
    var name = row.querySelector('[data-f="client"]').value.trim(), b = row.querySelector('[data-cphoto]');
    b.innerHTML = name ? clientAvatar(name) : icon('users');
    b.disabled = !name;
    b.title = name ? (CLIENTS[name] ? 'Trocar a foto de ' + name : 'Adicionar a foto de ' + name) : '';
    b.setAttribute('aria-label', name ? 'Foto de ' + name + '. Alterar' : 'Foto do cliente');
  }
  function nPaintDue(btn, iso) {
    btn.dataset.due = iso || '';
    var d = iso ? new Date(iso) : null;
    btn.classList.toggle('has', !!d);
    btn.querySelector('span').textContent = d ? fDate(d) : 'Prazo';
  }
  var nPhotoIn = document.createElement('input'), nPhotoFor = '';
  nPhotoIn.type = 'file'; nPhotoIn.accept = 'image/*'; nPhotoIn.hidden = true;
  nPhotoIn.addEventListener('change', function () {
    if (nPhotoFor && nPhotoIn.files.length) {
      var nm = nPhotoFor;
      setClientPhoto(nm, nPhotoIn.files[0]);
      setTimeout(function () { Array.prototype.forEach.call(nrowsEl.children, nPaintCli); }, 400);
    }
    nPhotoIn.value = '';
  });
  document.body.appendChild(nPhotoIn);
  function nFilled() { return Array.prototype.filter.call(nrowsEl.querySelectorAll('[data-nrow]'), function (r) { return r.querySelector('[data-f="title"]').value.trim(); }); }
  function nDirty() { return Array.prototype.some.call(nrowsEl.querySelectorAll('input,textarea,.ndue'), function (x) { return (x.value || x.dataset.due || '').trim(); }); }
  function nSync() {
    var n = nFilled().length;
    $('nGo').textContent = n > 1 ? 'Criar ' + n + ' tarefas' : n === 1 ? 'Criar 1 tarefa' : 'Criar tarefas';
  }
  function openBulk(colId) {
    if (!colById(colId) || colById(colId).role === 'done') { toast('As tarefas chegam à conclusão pelo fluxo de aprovação'); return; }
    closePop(); closeMenu(); closeCtx();
    nLast = document.activeElement;
    var seen = {};
    allTasks().forEach(function (t) { var c = clientOf(t); if (c) seen[c] = 1; });
    Object.keys(CLIENTS).forEach(function (k) { seen[k] = 1; });
    nClientNames = Object.keys(seen).sort();
    nColId = colId; nPaintCol(); sugHide();
    $('nAdd').innerHTML = icon('plus') + 'Adicionar mais um';
    nrowsEl.innerHTML = '';
    for (var i = 0; i < 2; i++) nAddRow(false);
    novEl.hidden = false;
    document.body.classList.add('locked');
    nrowsEl.querySelector('input').focus();
  }
  function closeBulk() {
    sugHide();
    novEl.hidden = true;
    if (!detailId && !bovOpen()) document.body.classList.remove('locked');
    if (nLast && nLast.focus && nLast.isConnected) nLast.focus({ preventScroll: true });
  }
  $('nClose').innerHTML = icon('x');
  $('nClose').firstChild.style.cssText = 'width:16px;height:16px';
  $('nClose').addEventListener('click', closeBulk);
  $('nCancel').addEventListener('click', closeBulk);
  novEl.addEventListener('pointerdown', function (e) { if (e.target === novEl && !nDirty()) closeBulk(); });
  $('nAdd').addEventListener('click', function () { nAddRow(true); });
  nrowsEl.addEventListener('click', function (e) {
    var du = e.target.closest('.ndue');
    if (du) { openPop('bdue', du); return; }
    var cp = e.target.closest('[data-cphoto]');
    if (cp) { nPhotoFor = cp.closest('[data-nrow]').querySelector('[data-f="client"]').value.trim(); if (nPhotoFor) nPhotoIn.click(); return; }
    var rm = e.target.closest('[data-nrm]');
    if (!rm) return;
    var row = rm.closest('[data-nrow]');
    if (nrowsEl.children.length === 1) { Array.prototype.forEach.call(row.querySelectorAll('input,textarea'), function (x) { x.value = ''; }); nPaintDue(row.querySelector('.ndue'), ''); nPaintCli(row); row.querySelector('input').focus(); }
    else { var nx = row.nextElementSibling || row.previousElementSibling; row.remove(); nx.querySelector('input').focus(); }
    nSync();
  });
  $('nform').addEventListener('input', function (e) {
    if (!e.target.dataset) return;
    if (e.target.dataset.f === 'title') nSync();
    if (e.target.dataset.f === 'client') nPaintCli(e.target.closest('[data-nrow]'));
    if (e.target.dataset.f === 'client' || e.target.dataset.f === 'source') { sugSel = -1; sugShow(e.target); }
  });
  $('nform').addEventListener('focusin', function (e) {
    var f = e.target.dataset && e.target.dataset.f;
    if (f === 'client' || f === 'source') { sugSel = -1; sugShow(e.target); } else sugHide();
  });
  $('nform').addEventListener('focusout', function (e) { if (e.target === sugFor) sugHide(); });
  $('nColBtn').addEventListener('click', function () { openPop('ncol', $('nColBtn')); });
  $('nform').addEventListener('keydown', function (e) {
    if (sugKey(e)) return;
    if (e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); $('nform').requestSubmit(); return; }
    if (e.target.tagName === 'TEXTAREA' && e.shiftKey) return;
    e.preventDefault();
    var f = Array.prototype.slice.call(nrowsEl.querySelectorAll('input,textarea')), i = f.indexOf(e.target);
    if (i < 0) return;
    if (i < f.length - 1) f[i + 1].focus(); else nAddRow(true);
  });
  $('nform').addEventListener('submit', function (e) {
    e.preventDefault();
    var rows = nFilled(), col = colById(nColId);
    if (col && col.role === 'done') { toast('As tarefas chegam à conclusão pelo fluxo de aprovação'); return; }
    if (!rows.length || !col) { toast('Escreva o tema de pelo menos uma tarefa'); var f0 = nrowsEl.querySelector('input'); if (f0) f0.focus(); return; }
    var made = [];
    rows.forEach(function (r) {
      var g = function (k) { return r.querySelector('[data-f="' + k + '"]').value.trim(); };
      var dueIso = r.querySelector('.ndue').dataset.due, client = g('client'), source = g('source');
      var t = T({ id: 'n' + (nextId++), num: nextNum++, title: g('title'), note: [client, source].filter(Boolean).join(' · '), client: client, source: source,
        desc: g('desc') || 'Sem descrição ainda. Abra a tarefa para definir flag, categoria e pessoas.', priority: 'normal', owner: viewer, lead: '', maker: '', createdAt: new Date(),
        dueAt: dueIso ? new Date(dueIso) : null });
      col.tasks.push(t); made.push(t);
    });
    closeBulk();
    render(); renderToolbar();
    var hidden = made.filter(function (t) { return !matches(t); }).length;
    say(made.length + ' tarefas criadas em ' + col.name + '.');
    toast(made.length === 1 ? 'Tarefa ' + fmtNum(made[0].num) + ' criada em ' + col.name : made.length + ' tarefas criadas em ' + col.name + (hidden ? '. ' + hidden + ' oculta(s) pelos filtros' : ''));
  });

  /* ------------------------------------------------------------ menu da coluna */
  var menu = document.createElement('div');
  menu.className = 'menu';
  menu.hidden = true;
  menu.setAttribute('role', 'menu');
  document.body.appendChild(menu);
  var menuCol = null, menuAnchor = null;
  function mItem(a, ic, label, dis, dng) { return '<button type="button" role="menuitem" data-a="' + a + '"' + (dis ? ' disabled' : '') + (dng ? ' class="dng"' : '') + '>' + icon(ic) + label + '</button>'; }
  function menuHTML(colId) {
    var i = cols.findIndex(function (c) { return c.id === colId; });
    var c = cols[i], h = mItem('add', 'plus', 'Criar tarefa') + mItem('sort', 'sort', 'Ordenar por prioridade') + mItem('custom', 'pen', 'Personalizar coluna');
    /* agendados / pós-entrega: a coluna se separa do fluxo, vai para uma ponta e pode ficar mais apagada */
    h += '<div class="msep" role="separator"></div>' + (c.apart
      ? mItem('unapart', 'refresh', 'Voltar ao fluxo') + '<div class="mrange"><label for="dimR"><span>Opacidade</span><b id="dimV">' + Math.round(c.dim * 100) + '%</b></label><input id="dimR" type="range" min="0" max="100" step="5" value="' + Math.round(c.dim * 100) + '" data-dimcol="' + esc(c.id) + '" aria-label="Opacidade da coluna, de 0 a 100 por cento"></div>'
      : mItem('apartEnd', 'chevR', 'Separar no fim do quadro') + mItem('apartStart', 'chevL', 'Separar no início do quadro'));
    var planItem = function (v, label, color) { return '<button type="button" role="menuitem" data-a="plan" data-v="' + v + '" class="' + (c.plan === v ? 'on' : '') + '"><span class="sw" style="--fc:var(--sw-' + color + ')"></span>' + label + (c.plan === v ? icon('check', 'tk') : '') + '</button>'; };
    h += '<div class="msep" role="separator"></div><div class="mgrp">Calendário de publicações</div>' + planItem('todo', 'Por fazer', 'gray') + planItem('sched', 'Agendado', 'green') + planItem('', 'Fora do calendário', 'gray');
    if (cur.fixed) return h;
    var blockL = c.apart || i === 0 || cols[i - 1].apart, blockR = c.apart || i === cols.length - 1 || cols[i + 1].apart;
    return h + '<div class="msep" role="separator"></div>' +
      mItem('addcol', 'plus', 'Inserir coluna à direita') + mItem('moveL', 'chevL', 'Mover para a esquerda', blockL) + mItem('moveR', 'chevR', 'Mover para a direita', blockR) +
      '<div class="msep" role="separator"></div>' + mItem('del', 'trash', 'Excluir coluna', cols.length < 2, true);
  }
  function closeMenu() { menu.hidden = true; menuCol = null; }
  function toggleMenu(btn, colId) {
    if (!menu.hidden && menuCol === colId) { closeMenu(); return; }
    menuCol = colId;
    menuAnchor = btn;
    menu.innerHTML = menuHTML(colId);
    menu.hidden = false;
    var r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 6) + 'px';
    menu.style.left = Math.max(12, Math.min(window.innerWidth - menu.offsetWidth - 12, r.right - menu.offsetWidth)) + 'px';
  }
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    var colId = menuCol, anc = menuAnchor, a = b.dataset.a;
    closeMenu();
    if (a === 'add') openBulk(colId);
    else if (a === 'custom') openPop('col', anc, colId);
    else if (a === 'addcol') addColumn(colId);
    else if (a === 'plan') setPlan(colId, b.dataset.v || '');
    else if (a === 'apartEnd') setApart(colId, 'end');
    else if (a === 'apartStart') setApart(colId, 'start');
    else if (a === 'unapart') setApart(colId, '');
    else if (a === 'moveL') moveCol(colId, -1);
    else if (a === 'moveR') moveCol(colId, 1);
    else if (a === 'del') openPop('coldel', anc, colId);
    else if (a === 'sort') {
      colById(colId).tasks.sort(function (x, y) { return flagOf(x.priority).rank - flagOf(y.priority).rank; });
      render();
      say('Coluna ordenada por prioridade.');
      toast('Coluna ordenada por prioridade');
    }
  });
  menu.addEventListener('input', function (e) {
    if (!e.target.dataset || !e.target.dataset.dimcol) return;
    var c = colById(e.target.dataset.dimcol);
    if (!c) return;
    c.dim = Math.min(100, Math.max(0, +e.target.value)) / 100;
    var lbl = menu.querySelector('#dimV'); if (lbl) lbl.textContent = Math.round(c.dim * 100) + '%';
    paintColHeader(c);
    saveLayout();
  });
  document.addEventListener('pointerdown', function (e) { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('.menu-btn')) closeMenu(); });
  trackEl.addEventListener('scroll', closeMenu, { passive: true });

  /* ------------------------------------------------------------ menu do botão direito no cartão */
  var ctx = document.createElement('div');
  ctx.className = 'menu ctx';
  ctx.hidden = true;
  ctx.setAttribute('role', 'menu');
  document.body.appendChild(ctx);
  var ctxId = null, ctxConfirm = false;
  function closeCtx(restore) {
    if (ctx.hidden) return;
    ctx.hidden = true; ctxConfirm = false;
    if (restore && ctxId && cardEls[ctxId]) cardEls[ctxId].focus({ preventScroll: true });
    ctxId = null;
  }
  function cItem(a, v, inner, dis, dng, on) {
    return '<button type="button" role="menuitem" data-a="' + a + '"' + (v !== undefined ? ' data-v="' + esc(v) + '"' : '') + (dis ? ' disabled' : '') + ' class="' + (dng ? 'dng ' : '') + (on ? 'on' : '') + '">' + inner + '</button>';
  }
  function ctxHTML(t) {
    var l = locate(t.id), here = colById(l.col), done = here.role === 'done';
    if (ctxConfirm) return '<div class="mgrp">Excluir ' + fmtNum(t.num) + '?</div><p class="mhint">A tarefa e o bate-papo dela serão apagados. Não dá para desfazer.</p>' + cItem('del', undefined, icon('trash') + 'Excluir de vez', false, true) + cItem('cancel', undefined, 'Cancelar');
    var h = cItem('open', undefined, icon('eye') + 'Abrir tarefa');
    if (canPlay(t)) {
      var tg = here.role === 'queue' ? colByRole('doing') : null;
      h += cItem('play', undefined, icon(t.since ? 'pause' : 'play') + (t.since ? 'Pausar o play' : tg ? 'Iniciar o play e ir para ' + esc(tg.name) : 'Iniciar o play'));
    }
    var reviewCol = colByRole('review'), doneCol = colByRole('done'), doingCol = colByRole('doing');
    if (syncCan(t, 'entregar') && !done && here.role !== 'review' && (reviewCol || doneCol)) h += cItem('deliver', undefined, icon('pkg') + (reviewCol ? 'Entregar para aprovação' : 'Marcar como entregue'));
    if ((syncCan(t, 'aprovar') || syncCan(t, 'corrigir')) && here.role === 'review') {
      if (doneCol) h += cItem('approve', undefined, icon('check') + 'Aprovar entrega');
      if (doingCol) h += cItem('fix', undefined, icon('undo') + 'Pedir correção');
    }
    h += '<div class="msep" role="separator"></div><div class="mgrp">Mover para</div>';
    cols.forEach(function (c) { h += cItem('mv', c.id, '<span class="sw" style="--fc:var(--sw-' + c.color + ')"></span>' + esc(c.name) + (c.id === l.col ? icon('check', 'tk') : ''), c.id === l.col, false, c.id === l.col); });
    h += '<div class="msep" role="separator"></div><div class="mgrp">Prioridade</div>';
    FLAGS.forEach(function (f) { h += cItem('pr', f.id, '<span class="sw" style="--fc:var(--sw-' + f.color + ')"></span>' + esc(f.label) + (t.priority === f.id ? icon('check', 'tk') : ''), !canEdit(t) || t.priority === f.id, false, t.priority === f.id); });
    h += '<div class="msep" role="separator"></div>' + cItem('copy', undefined, icon('doc') + 'Copiar número ' + fmtNum(t.num)) + cItem('dup', undefined, icon('layers') + 'Duplicar tarefa');
    h += '<div class="msep" role="separator"></div>' + cItem('askdel', undefined, icon('trash') + 'Excluir tarefa', !canDelete(t), true);
    return h;
  }
  function openCtx(id, x, y) {
    var l = locate(id);
    if (!l) return;
    closeMenu(); closePop();
    ctxId = id; ctxConfirm = false;
    ctx.innerHTML = ctxHTML(l.task);
    ctx.hidden = false;
    var w = ctx.offsetWidth, h = ctx.offsetHeight;
    ctx.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x)) + 'px';
    ctx.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, y)) + 'px';
    var f = ctx.querySelector('button:not([disabled])');
    if (f) f.focus();
  }
  trackEl.addEventListener('contextmenu', function (e) {
    var card = e.target.closest('.card');
    if (!card || drag) return;
    e.preventDefault();
    var r = card.getBoundingClientRect(), kb = e.clientX === 0 && e.clientY === 0;
    openCtx(card.dataset.card, kb ? r.left + 24 : e.clientX, kb ? r.top + 24 : e.clientY);
  });
  ctx.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  ctx.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    var bs = Array.prototype.slice.call(ctx.querySelectorAll('button:not([disabled])')), i = bs.indexOf(document.activeElement);
    bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus();
  });
  ctx.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    var id = ctxId, a = b.dataset.a, v = b.dataset.v, l = locate(id);
    if (!l) { closeCtx(); return; }
    var t = l.task;
    if (a === 'askdel') { ctxConfirm = true; ctx.innerHTML = ctxHTML(t); var f = ctx.querySelector('button:not([disabled])'); if (f) f.focus(); return; }
    if (a === 'cancel') { closeCtx(true); return; }
    closeCtx();
    if (a === 'open') openDetail(id);
    else if (a === 'play') togglePlay(id);
    else if (a === 'deliver' || a === 'approve' || a === 'fix') doAction(id, a);
    else if (a === 'mv') {
      moveToCol(id, v);
      sysLog(t, 'moveu a tarefa para ' + colById(v).name, viewer);
      render(); refreshCard(id); renderToolbar();
      toast('Movida para ' + colById(v).name);
    } else if (a === 'pr') {
      t.priority = v;
      sysLog(t, 'alterou a prioridade para ' + flagOf(v).label, viewer);
      refreshCard(id); renderToolbar();
      toast('Prioridade: ' + flagOf(v).label);
    } else if (a === 'copy') {
      var txt = fmtNum(t.num), ok = function () { toast('Número ' + txt + ' copiado'); }, fail = function () { toast('Número da tarefa: ' + txt); };
      try { navigator.clipboard.writeText(txt).then(ok, fail); } catch (err) { fail(); }
    } else if (a === 'dup') {
      var c = T({ id: 'n' + (nextId++), num: nextNum++, title: t.title + ' (cópia)', note: t.note, client: t.client, source: t.source, links: (t.links || []).map(function(x) { return {id:uid('l'),url:x.url,title:x.title,by:viewer,at:new Date()}; }), desc: t.desc, descHtml:t.descHtml, priority: t.priority, category: t.category, owner: viewer, lead: t.lead, maker: t.maker, createdAt: new Date(), dueAt: t.dueAt ? new Date(t.dueAt) : null });
      colById(l.col).tasks.splice(l.index + 1, 0, c);
      render(); renderToolbar();
      toast('Tarefa ' + fmtNum(c.num) + ' criada a partir da ' + fmtNum(t.num));
    } else if (a === 'del') deleteTask(id);
  });
  document.addEventListener('pointerdown', function (e) { if (!ctx.hidden && !ctx.contains(e.target)) closeCtx(); });
  window.addEventListener('blur', function () { closeCtx(); });
  window.addEventListener('resize', function () { closeCtx(); });
  trackEl.addEventListener('scroll', function () { closeCtx(); }, { passive: true });

  /* ------------------------------------------------------------ play, entrega e aprovação */
  function sysLog(t, text, who) {
    if (mainView === 'act') setTimeout(renderAct, 0);
    t.chat.push({ type: 'sys', text: (who ? who + ' ' : '') + text, at: new Date() });
    if (detailId === t.id) renderChat(true);
    if (who) everyone(t).forEach(function (n) { if (n !== who) notify(n, t, kindOf(text), who + ' ' + text); });
  }
  function pauseTask(t, auto) {
    if (!t.since) return;
    t.acc += Date.now() - t.since;
    t.since = null;
    sysLog(t, auto ? 'play pausado automaticamente' : 'pausou o play', auto ? '' : viewer);
    refreshCard(t.id);
  }
  function togglePlay(id) { var task = locate(id); if (task) syncCommand(task.task, task.task.since ? 'pausar' : 'iniciar'); }
  function deleteTask(id) {
    var l = locate(id);
    if (!l || !canDelete(l.task)) return;
    var t = l.task;
    syncDeletes.tasks.push(t.id);
    colById(l.col).tasks.splice(l.index, 1);
    if (cardEls[id]) { cardEls[id].remove(); delete cardEls[id]; }
    lastFocus = null;
    closeDetail();
    render();
    renderToolbar();
    say('Tarefa excluída: ' + t.title + '.');
    toast('Tarefa ' + fmtNum(t.num) + ' excluída');
  }
  function doAction(id, act) {
    var l = locate(id);
    if (!l) return;
    var t = l.task, here = colById(l.col);
    if (['deliver','approve','fix'].indexOf(act) >= 0) { syncCommand(t, {deliver:'entregar',approve:'aprovar',fix:'corrigir'}[act]); return; }
    if (act === 'descedit') { if (canManageT(t)) { descEdit = true; renderDetail(); var ta = infoEl.querySelector('#descTa'); if (ta) { ta.focus(); var rg = document.createRange(); rg.selectNodeContents(ta); rg.collapse(false); var sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(rg); } } return; }
    if (act === 'desccancel') { descEdit = false; renderDetail(); return; }
    if (act === 'descsave') {
      if (!canManageT(t)) return;
      var dh = sanitizeHTML($('descTa').innerHTML), dp = plainOf(dh);
      t.desc = dp; t.descHtml = dp ? dh : '';
      descEdit = false;
      sysLog(t, 'atualizou a descrição', viewer);
      refreshCard(id); renderDetail();
      toast('Descrição salva');
      return;
    }
    if (act === 'ask-del') { confirmDel = canDelete(t); renderDetail(); return; }
    if (act === 'cancel-del') { confirmDel = false; renderDetail(); return; }
    if (act === 'del') { deleteTask(id); return; }
    if (act === 'deliver' && t.maker === viewer && here.role !== 'review' && here.role !== 'done') {
      var tg = colByRole('review') || colByRole('done');
      if (t.since) pauseTask(t, false);
      if (tg) moveToCol(id, tg.id);
      if (tg && tg.role === 'done') { t.deliveredAt = new Date(); sysLog(t, 'marcou a tarefa como entregue', viewer); toast('Tarefa entregue'); }
      else { sysLog(t, 'entregou a tarefa para aprovação', viewer); toast('Tarefa entregue para aprovação'); }
    } else if (act === 'approve' && t.lead === viewer && here.role === 'review' && colByRole('done')) {
      moveToCol(id, colByRole('done').id);
      t.deliveredAt = new Date();
      sysLog(t, 'aprovou a entrega', viewer);
      toast('Entrega aprovada');
    } else if (act === 'fix' && t.lead === viewer && here.role === 'review' && colByRole('doing')) {
      moveToCol(id, colByRole('doing').id);
      sysLog(t, 'pediu uma correção', viewer);
      toast('Correção solicitada ao responsável');
    } else return;
    render();
    refreshCard(id);
    renderDetail();
    renderToolbar();
  }

  /* ------------------------------------------------------------ painel da tarefa */
  var ovEl = $('ov'), dlgEl = $('dlg'), infoEl = $('info'), msgsEl = $('msgs'), inputEl = $('msgInput');
  $('closeBtn').innerHTML = icon('x');
  $('closeBtn').firstChild.style.cssText = 'width:16px;height:16px';
  $('sendBtn').innerHTML = icon('send');
  $('searchIc').innerHTML = icon('search');
  $('qClear').innerHTML = icon('x');

  function prow(ic, label, value, action, cls, sub) {
    return '<div class="pr ' + (cls || '') + '"><div class="pk">' + (ic ? icon(ic) : '') + '<span class="t"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></div><div class="pv">' + value + '</div><div>' + (action || '') + '</div></div>';
  }
  function ttile(ic, label, value, action, cls) {
    return '<div class="tt ' + (cls || '') + '"><div class="ttk">' + icon(ic) + '<span>' + label + '</span>' + (action ? '<span class="tta">' + action + '</span>' : '') + '</div><div class="ttv">' + value + '</div></div>';
  }
  function editBtn(type, label, role) {
    return '<button class="edit" type="button" data-pop="' + type + '"' + (role ? ' data-role="' + role + '"' : '') + ' aria-haspopup="dialog" aria-expanded="false">' + icon('pen') + label + '</button>';
  }
  function personRow(t, k) {
    var n = t[k], editable = canEdit(t) && k !== 'owner', lower = ROLES[k].label.toLowerCase();
    var val = n ? avatar(n) + '<span>' + esc(n) + '</span>' + (n === viewer ? '<span class="me">Você</span>' : '') : '<span class="none">Ninguém atribuído</span>';
    var act = !editable ? '' : editBtn('who', n ? 'Trocar' : 'Atribuir ' + lower, k);
    return prow('', ROLES[k].label, val, act, '', ROLES[k].desc);
  }

  var MAX_FILE = 350 * 1024 * 1024;
  function fSize(b) {
    if (b == null) return 'Tamanho não disponível';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(b < 10240 ? 1 : 0).replace('.', ',') + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',') + ' MB';
    return (b / 1073741824).toFixed(2).replace('.', ',') + ' GB';
  }
  /* só estas marcações passam: negrito, itálico, sublinhado, riscado, listas, quebras e links http(s) ou e-mail */
  function sanitizeHTML(html) {
    var tpl = document.createElement('template'), out = document.createElement('div');
    tpl.innerHTML = html;
    var MAP = { b: 'strong', strong: 'strong', i: 'em', em: 'em', u: 'u', s: 's', strike: 's', del: 's', br: 'br', ul: 'ul', ol: 'ol', li: 'li', p: 'p', div: 'p', a: 'a' };
    function walk(src, dst) {
      Array.prototype.forEach.call(src.childNodes, function (n) {
        if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.nodeValue)); return; }
        if (n.nodeType !== 1) return;
        var nt = MAP[n.tagName.toLowerCase()];
        if (!nt) { if (!/^(script|style)$/i.test(n.tagName)) walk(n, dst); return; }
        var el = document.createElement(nt);
        if (nt === 'a') {
          var h = n.getAttribute('href') || '';
          if (!/^(https?:\/\/|mailto:)/i.test(h)) { walk(n, dst); return; }
          el.setAttribute('href', h); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer');
        }
        if (nt !== 'br') walk(n, el);
        dst.appendChild(el);
      });
    }
    walk(tpl.content, out);
    return out.innerHTML;
  }
  function plainOf(html) { var d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').replace(/\u00a0/g, ' ').trim(); }
  function ftype(f) {
    var t = f.type || '', n = f.name.toLowerCase();
    if (/^image\//.test(t) || /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/.test(n)) return 'image';
    if (/^video\//.test(t) || /\.(mp4|webm|mov|m4v)$/.test(n)) return 'video';
    if (/^audio\//.test(t) || /\.(mp3|wav|m4a|ogg|aac)$/.test(n)) return 'audio';
    if (t === 'application/pdf' || /\.pdf$/.test(n)) return 'pdf';
    if (/\.(zip|rar|7z|tar|gz)$/.test(n)) return 'archive';
    return 'file';
  }
  var FICON = { image: 'image', video: 'video', audio: 'mic', pdf: 'doc', archive: 'archive', file: 'doc' };
  function fext(f) { var m = /\.([a-z0-9]{1,5})$/i.exec(f.name); return m ? m[1].toUpperCase() : 'ARQ'; }
  function thumbInner(f) {
    var k = ftype(f);
    if (k === 'image' && f.url) return '<img src="' + f.url + '" alt="">';
    if (k === 'video' && f.url) return '<video src="' + f.url + '#t=0.1" muted playsinline preload="metadata" tabindex="-1"></video><span class="fplay">' + icon('play', 'fill') + '</span>';
    if (k === 'pdf' && f.thumb) return '<img src="' + f.thumb + '" alt=""><span class="fext">PDF' + (f.pages ? ' · ' + f.pages + ' pág.' : '') + '</span>';
    return icon(FICON[k]) + '<span class="fext">' + esc(fext(f)) + '</span>';
  }
  function everyone(t) { var a = people(t); (t.viewers || []).forEach(function (n) { if (a.indexOf(n) < 0) a.push(n); }); return a; }
  function personByUser(u) { u = (u || '').toLowerCase(); for (var i = 0; i < PEOPLE.length; i++) if (PROFILES[PEOPLE[i]].user === u) return PEOPLE[i]; return null; }
  function mentionsIn(text) {
    var out = [], re = /(^|[^a-z0-9._-])@([a-z0-9._-]{3,24})/gi, m;
    while ((m = re.exec(text))) { var p = personByUser(m[2].replace(/[._-]+$/, '')); if (p && out.indexOf(p) < 0) out.push(p); }
    return out;
  }
  function mentionHTML(escaped) {
    return escaped.replace(/(^|[^a-z0-9._-])@([a-z0-9._-]{3,24})/gi, function (m, pre, u) {
      var key = u.replace(/[._-]+$/, ''), p = personByUser(key);
      return p ? pre + '<span class="mention" title="' + esc(p) + '">@' + key + '</span>' + u.slice(key.length) : m;
    });
  }
  function canAttach(t) { return syncCan(t, 'comentar'); }
  function canManageT(t) { return syncCan(t, 'editar'); }
  function descHTML(t) {
    var can = canManageT(t);
    var rich = t.descHtml ? t.descHtml : esc(t.desc || '').replace(/\n/g, '<br>');
    if (descEdit && can) {
      var fm = function (cmd, label, inner) { return '<button type="button" class="rb2" data-fmt="' + cmd + '" aria-pressed="false" aria-label="' + label + '" title="' + label + '">' + inner + '</button>'; };
      return '<div class="descedit"><div class="rtb" role="toolbar" aria-label="Formatação do texto">' +
        fm('bold', 'Negrito (Ctrl+B)', '<b>B</b>') + fm('italic', 'Itálico (Ctrl+I)', '<i>I</i>') + fm('underline', 'Sublinhado (Ctrl+U)', '<u>U</u>') + fm('strikeThrough', 'Riscado', '<s>S</s>') +
        '<span class="rtsep" aria-hidden="true"></span>' +
        '<button type="button" class="rb2" data-fmt-link="open" aria-label="Inserir link (Ctrl+K)" title="Inserir link (Ctrl+K)">' + icon('link') + '</button>' +
        '<span class="rtsep" aria-hidden="true"></span>' +
        fm('insertUnorderedList', 'Lista com marcadores', icon('ul')) + fm('insertOrderedList', 'Lista numerada', icon('ol')) +
        '<span class="rtsep" aria-hidden="true"></span>' +
        '<button type="button" class="rb2" data-fmt-clear aria-label="Limpar formatação" title="Limpar formatação">' + icon('eraser') + '</button></div>' +
        '<div class="lkbar" id="lkbar" hidden><label class="sr-only" for="lkUrl">Endereço do link</label><input id="lkUrl" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://exemplo.com.br"><button class="btn primary sm" type="button" data-lk="apply">Aplicar</button><button class="btn sm" type="button" data-lk="remove">Remover link</button><button class="btn sm" type="button" data-lk="cancel">Cancelar</button></div>' +
        '<div class="rte" id="descTa" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Descrição da tarefa" data-ph="Explique o que precisa ser feito, o contexto e o que o cliente espera.">' + rich + '</div>' +
        '<div class="btns"><button class="btn primary sm" type="button" data-act="descsave">Salvar descrição</button><button class="btn sm" type="button" data-act="desccancel">Cancelar</button></div></div>';
    }
    var txt = t.desc || t.note;
    return '<div class="descwrap"><div class="dch"><span class="kick">Descrição</span>' +
      (can ? '<button class="edit" type="button" data-act="descedit">' + icon('pen') + (txt ? 'Editar' : 'Adicionar') + '</button>' : '') + '</div>' +
      (txt ? '<div class="desc rich">' + (t.descHtml ? t.descHtml : esc(txt).replace(/\n/g, '<br>')) + '</div>' : '<p class="desc none">Ainda sem descrição.</p>') + '</div>';
  }
  function canRemoveFile(t, file) {
    return file.canRemove === true || (file.canRemove == null && (canManageT(t) || t.maker === viewer || file.by === viewer));
  }
  function filesHTML(t) {
    var fs = t.files || [], h = '<section class="sec"><h3 class="kick rule">Anexos' + (fs.length ? '<span class="stcount">' + fs.length + '</span>' : '') + '</h3>';
    if (fs.length) {
      h += '<ul class="files">' + fs.map(function (f) {
        var can = canRemoveFile(t, f);
        return '<li class="ft"><button class="fthm" type="button" data-fopen="' + f.id + '" aria-label="Ver a prévia de ' + esc(f.name) + '" title="Clique ou use o botão direito para ver a prévia">' + thumbInner(f) + '</button><span class="fnm"><b title="' + esc(f.name) + '">' + esc(f.name) + '</b><small>' + fSize(f.size) + ' · ' + esc(f.by.split(' ')[0]) + ', ' + fDate(f.at) + '</small></span>' +
          (can ? '<button class="fx" type="button" data-fdel="' + f.id + '" aria-label="Remover o anexo ' + esc(f.name) + '" title="Remover anexo">' + icon('x') + '</button>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    if (canAttach(t)) h += '<label class="drop" id="dropz" for="fileIn"><input id="fileIn" type="file" multiple><span class="dic">' + icon('upload') + '</span><span class="dtx"><b>Anexar arquivos</b><small>Arraste para cá ou clique para escolher. Até 350 MB por arquivo.</small></span></label>';
    else if (!fs.length) h += '<p class="hint">Nenhum arquivo anexado.</p>';
    return h + '</section>';
  }
  /* links de referência: endereço obrigatório, título opcional; só http(s) */
  function normUrl(raw) {
    var u = (raw || '').trim();
    if (!u || /\s/.test(u)) return null;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { var o = new URL(u); return /^https?:$/.test(o.protocol) && o.hostname.indexOf('.') > 0 ? o.href : null; } catch (err) { return null; }
  }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (err) { return u; } }
  function linksHTML(t) {
    var ls = t.links || [], h = '<section class="sec"><h3 class="kick rule">Links de referência' + (ls.length ? '<span class="stcount">' + ls.length + '</span>' : '') + '</h3>';
    if (ls.length) {
      h += '<ul class="lks">' + ls.map(function (x) {
        var can = canManageT(t) || x.by === viewer;
        return '<li class="lk"><span class="lk-ic">' + icon('link') + '</span><a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(x.url) + '"><b>' + esc(x.title || hostOf(x.url)) + '</b><small>' + esc(hostOf(x.url)) + ' · ' + esc(x.by.split(' ')[0]) + ', ' + fDate(x.at) + '</small></a>' +
          (can ? '<button class="ib" type="button" data-lkdel="' + x.id + '" aria-label="Remover o link ' + esc(x.title || hostOf(x.url)) + '" title="Remover link">' + icon('x') + '</button>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    if (canAttach(t)) h += '<form class="lkadd" data-lkform><label class="sr-only" for="refUrl">Endereço do link</label><input id="refUrl" type="text" inputmode="url" maxlength="500" autocomplete="off" spellcheck="false" placeholder="Cole o link. Ex.: figma.com/file/..."><label class="sr-only" for="refTitle">Título do link</label><input id="refTitle" type="text" maxlength="60" autocomplete="off" placeholder="Título (opcional)"><button class="btn primary sm" type="submit">Adicionar</button></form>';
    else if (!ls.length) h += '<p class="hint">Nenhum link de referência.</p>';
    return h + '</section>';
  }
  /* PDF: pdf.js carregado só quando o primeiro PDF é anexado */
  var pdfLoad = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfLoad) return pdfLoad;
    pdfLoad = new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      sc.onload = function () { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; res(window.pdfjsLib); } catch (err) { rej(err); } };
      sc.onerror = function () { pdfLoad = null; rej(new Error('pdfjs')); };
      document.head.appendChild(sc);
      setTimeout(function () { if (!window.pdfjsLib) { pdfLoad = null; rej(new Error('pdfjs-timeout')); } }, 15000);
    });
    return pdfLoad;
  }
  function pdfDoc(f) {
    if (!f.docP) f.docP = loadPdfJs().then(function (lib) { return window.VvoxSyncTaskExtras.getFileArrayBuffer(f).then(function (buf) { return lib.getDocument({ data: buf }).promise; }); });
    return f.docP;
  }
  function pdfPage(f, n, canvas, maxW) {
    return pdfDoc(f).then(function (doc) { f.pages = doc.numPages; return doc.getPage(n); }).then(function (pg) {
      var v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: (maxW / v0.width) * (window.devicePixelRatio > 1 ? 1.5 : 1) });
      canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
      return pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    });
  }
  function pdfThumb(f, taskId) {
    var cv = document.createElement('canvas');
    pdfPage(f, 1, cv, 260).then(function () {
      f.thumb = cv.toDataURL('image/jpeg', 0.8);
      if (detailId === taskId) renderDetail();
    }).catch(function () {});
  }
  function addFiles(t, list) {
    if (syncBackend) { syncUpload(t, Array.from(list)); return; }

    var ok = [], rej = [], MAXN = 30;
    Array.prototype.forEach.call(list, function (file) {
      if (file.size > MAX_FILE) { rej.push('"' + file.name + '" tem ' + fSize(file.size)); return; }
      if ((t.files || []).length + ok.length >= MAXN) { toast('Limite de ' + MAXN + ' anexos por tarefa'); return; }
      ok.push({ id: 'f' + (stepN++), name: file.name, size: file.size, type: file.type || '', file: file, url: URL.createObjectURL(file), by: viewer, at: new Date() });
    });
    var rm = rej.length ? rej.join('; ') + '. Acima de 350 MB não é compatível' : '';
    if (!ok.length) { if (rm) toast(rm); return; }
    t.files = (t.files || []).concat(ok);
    ok.forEach(function (f) { if (ftype(f) === 'pdf') pdfThumb(f, t.id); });
    sysLog(t, ok.length === 1 ? 'anexou "' + ok[0].name + '"' : 'anexou ' + ok.length + ' arquivos', viewer);
    refreshCard(t.id); renderDetail();
    toast((ok.length === 1 ? 'Arquivo anexado' : ok.length + ' arquivos anexados') + (rm ? '. ' + rm : ''));
  }
  function stepsHTML(t) {
    var steps = t.steps || [], n = steps.length, done = steps.filter(function (x) { return x.done; }).length;
    var manage = syncCan(t, 'editarChecklist'), check = syncCan(t, 'marcarChecklist') && !isDone(t);
    var h = '<section class="sec"><h3 class="kick rule">Etapas da tarefa' + (n ? '<span class="stcount">' + done + '/' + n + '</span>' : '') + '</h3>';
    if (n) {
      h += '<div class="stbar' + (done === n ? ' full' : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '" aria-label="Etapas concluídas"><i style="width:' + Math.round(done / n * 100) + '%"></i></div><ul class="steps">';
      steps.forEach(function (x) {
        h += '<li class="st' + (x.done ? ' done' : '') + (check ? '' : ' ro') + '"><label class="stl"><input type="checkbox" data-step="' + x.id + '"' + (x.done ? ' checked' : '') + (check ? '' : ' disabled') + '><span class="box">' + icon('check') + '</span><span class="stt">' + esc(x.text) + '</span></label>' +
          (x.done && x.by ? '<span class="stby">' + esc(x.by.split(' ')[0]) + ', ' + fTime(x.at) + '</span>' : '') +
          (manage ? '<button class="ib" type="button" data-stdel="' + x.id + '" aria-label="Remover a etapa ' + esc(x.text) + '" title="Remover etapa">' + icon('x') + '</button>' : '') + '</li>';
      });
      h += '</ul>';
    }
    if (manage) {
      var cat = t.category ? t.category : '';
      h += '<form class="stadd" data-stform><label class="sr-only" for="stNew">Nova etapa</label><input id="stNew" type="text" maxlength="100" autocomplete="off" placeholder="Sugira uma etapa. Ex.: Revisar as legendas"><button class="btn primary sm" type="submit">Adicionar</button></form>' +
        '<div class="stsug"><button class="plink" type="button" data-stsug>Usar etapas sugeridas' + (cat ? ' para ' + esc(cat) : '') + '</button><span class="fhint">O responsável marca cada etapa ao executar.</span></div>';
    } else if (!n) h += '<p class="hint">Sem etapas ainda. Proprietário(a) e supervisor(a) sugerem o passo a passo.</p>';
    else if (!check) h += '<p class="hint">' + (t.maker ? 'Só o responsável, ' + esc(t.maker) + ', marca as etapas.' : 'Atribua um responsável para as etapas serem marcadas.') + '</p>';
    return h + '</section>';
  }
  function viewersRow(t) {
    var vs = t.viewers || [], mg = canManageT(t);
    var val = vs.length ? vs.map(function (n) { return '<span class="vchip' + (mg ? ' mg' : '') + '">' + avatar(n) + esc(n) + (mg ? '<button class="ib" type="button" data-vdel="' + esc(n) + '" aria-label="Remover ' + esc(n) + ' dos visualizadores" title="Remover visualizador">' + icon('x') + '</button>' : '') + '</span>'; }).join('') : '<span class="none">Ninguém ainda. Cite alguém com @ no bate-papo</span>';
    return prow('', 'Visualizador(a)', val, '', '', 'Citados com @ no bate-papo');
  }
  function infoHTML(t, loc) {
    var col = colById(loc.col), di = dueInfo(t), done = col.role === 'done', mine = rolesOf(t, viewer), editable = canEdit(t);
    var reviewCol = colByRole('review'), doneCol = colByRole('done'), doingCol = colByRole('doing');
    var h = '<div class="i-top"><span class="num">' + fmtNum(t.num) + '</span>' + prioChip(t, editable) + catChip(t, editable) + '<span class="stage"><span class="dot" style="background:var(--sw-' + col.color + ')"></span>' + esc(col.name) + '</span></div>';
    var cli = clientOf(t);
    if (cli) h += '<div class="crow">' + clientAvatar(cli) + '<span class="cn2"><small>Cliente</small><b>' + esc(cli) + '</b></span>' +
      (editable ? '<label class="edit" for="cliPhoto">' + icon('camera') + (CLIENTS[cli] ? 'Trocar foto' : 'Adicionar foto') + '</label><input id="cliPhoto" type="file" accept="image/*" hidden>' + (CLIENTS[cli] ? '<button class="edit" type="button" data-clirm="' + esc(cli) + '">Remover foto</button>' : '') : '') + '</div>';
    h += '<h2 id="dTitle">' + esc(t.title) + '</h2>' + descHTML(t) + filesHTML(t) + linksHTML(t) + stepsHTML(t);

    var dueVal = di.none ? '<span class="none">Sem prazo definido</span>' : '<span class="main">' + esc(fDay(t.dueAt)) + '</span>' + (di.extra ? '<span class="badge ' + di.cls + '">' + di.extra + '</span>' : '');
    var rows = ttile('cal', 'Criada em', esc(fFull(t.createdAt))) +
      ttile('clock', 'Prazo de entrega', dueVal, editable && !done ? editBtn('due', di.none ? 'Adicionar' : 'Editar') : '', di.cls === 'late' ? 'late' : '') +
      ttile('play', 'Início do play', t.startedAt ? esc(fFull(t.startedAt)) : '<span class="none">Ainda não iniciada</span>') +
      ttile('timer', 'Tempo registrado', playBtn(t) + '<span class="tm' + (t.since ? ' run' : '') + '" data-timer="' + t.id + '">' + fDur(elapsed(t)) + '</span>' + (canPlay(t) ? '' : '<span class="sub">Só o responsável controla o play</span>')) +
      (done && t.deliveredAt ? ttile('check', 'Entregue em', esc(fFull(t.deliveredAt))) : '');
    h += '<section class="sec"><h3 class="kick rule">Prazos e tempo</h3><div class="ttiles">' + rows + '</div></section>';

    h += '<section class="sec"><h3 class="kick rule">Quem participa</h3><div class="ptable">' + ['owner', 'lead', 'maker'].map(function (k) { return personRow(t, k); }).join('') + viewersRow(t) + '</div></section>';

    h += '<section class="sec"><h3 class="kick rule">O que você pode fazer</h3>';
    h += '<p class="mine">' + (mine.length ? 'Você é <b>' + mine.map(function (k) { return ROLE_NOUN[k]; }).join(' e ') + '</b> desta tarefa.' : ((t.viewers || []).indexOf(viewer) > -1 ? 'Você é <b>visualizador(a)</b> desta tarefa. Você acompanha, mas não edita.' : 'Você não participa desta tarefa.')) + '</p><div class="btns">';
    var any = false;
    if (syncCan(t, 'entregar') && !done && col.role !== 'review' && (reviewCol || doneCol)) {
      h += '<button class="btn go" type="button" data-act="deliver">' + icon('pkg') + (reviewCol ? 'Entregar para aprovação' : 'Marcar como entregue') + '</button>'; any = true;
    }
    if ((syncCan(t, 'aprovar') || syncCan(t, 'corrigir')) && col.role === 'review') {
      if (doneCol) { h += '<button class="btn go" type="button" data-act="approve">' + icon('check') + 'Aprovar entrega</button>'; any = true; }
      if (doingCol) { h += '<button class="btn" type="button" data-act="fix">' + icon('undo') + 'Pedir correção</button>'; any = true; }
    }
    h += '</div>';
    if (!any) {
      var msg = !mine.length ? 'Troque de usuário no seu perfil para ver as ações de cada papel. Só quem participa edita a tarefa.'
        : done ? 'Esta tarefa está concluída.'
        : t.maker === viewer ? (col.role === 'review' ? 'Entrega enviada. Falta a aprovação do(a) supervisor(a).' : 'Este quadro não tem coluna de aprovação nem de conclusão. Crie uma para poder entregar.')
        : t.lead === viewer ? 'Você revisa e apoia. A aprovação aparece quando o responsável entregar.'
        : 'Você abriu esta tarefa. A execução fica com o responsável e a revisão com o(a) supervisor(a).';
      h += '<p class="hint">' + msg + '</p>';
    }
    h += '</section>';

    h += '<div class="danger-zone">';
    if (!canDelete(t)) h += '<button class="btn danger" type="button" disabled>' + icon('trash') + 'Excluir tarefa</button><p>Só o(a) proprietário(a), ' + esc(t.owner) + ', pode excluir esta tarefa.</p>';
    else if (confirmDel) h += '<p>Excluir ' + fmtNum(t.num) + ' e o bate-papo dela? Não dá para desfazer.</p><button class="btn danger sure" type="button" data-act="del">' + icon('trash') + 'Excluir de vez</button><button class="btn" type="button" data-act="cancel-del">Manter tarefa</button>';
    else h += '<button class="btn danger" type="button" data-act="ask-del">' + icon('trash') + 'Excluir tarefa</button>';
    h += '</div>';
    return h;
  }

  function footHTML(t, loc) {
    var col = colById(loc.col), done = col.role === 'done', can = syncCan(t, 'mover');
    var reviewCol = colByRole('review'), doneCol = colByRole('done'), doingCol = colByRole('doing');
    var running = !!t.since;
    var h = '<div class="ifg"><div class="fclock">' + playBtn(t) + '<span class="fct"><b class="' + (running ? 'run' : '') + '" data-timer="' + t.id + '">' + fDur(elapsed(t)) + '</b><small>' + (t.startedAt ? 'Início do play: ' + esc(fDate(t.startedAt)) + ', ' + fTime(t.startedAt) : 'Play ainda não iniciado') + '</small></span></div>';
    h += '<button class="stagebtn" type="button" data-pop="stage" aria-haspopup="dialog" aria-expanded="false"' + (can ? '' : ' disabled') + ' aria-label="Etapa da tarefa: ' + esc(col.name) + (can ? '. Mudar de etapa' : '') + '"><span class="stagelab">Etapa</span><span class="dot" style="background:var(--sw-' + col.color + ')"></span><span class="nm">' + esc(col.name) + '</span>' + (can ? icon('down') : '') + '</button>';
    var two = function (cls, ic, shortT, longT, act) { return '<button class="btn sm ' + cls + '" type="button" data-act="' + act + '" title="' + longT + '" aria-label="' + longT + '">' + icon(ic) + '<span class="sh">' + shortT + '</span><span class="lg">' + longT + '</span></button>'; };
    var act = '';
    if (syncCan(t, 'entregar') && !done && col.role !== 'review' && (reviewCol || doneCol)) act += reviewCol ? two('go', 'pkg', 'Entregar', 'Entregar para aprovação', 'deliver') : two('go', 'pkg', 'Entregar', 'Marcar como entregue', 'deliver');
    if ((syncCan(t, 'aprovar') || syncCan(t, 'corrigir')) && col.role === 'review') {
      if (doingCol) act += two('', 'undo', 'Correção', 'Pedir correção', 'fix');
      if (doneCol) act += two('go', 'check', 'Aprovar', 'Aprovar entrega', 'approve');
    }
    return h + (act ? '<div class="fact">' + act + '</div>' : '') + '</div>';
  }
  function stagePopHTML(t) {
    var l = locate(t.id), h = '<h4>Etapa da tarefa</h4><ul class="opts" role="listbox" aria-label="Etapas do quadro">';
    cols.forEach(function (c) {
      var on = c.id === l.col;
      h += '<li class="opt"><button type="button" class="opt-b' + (on ? ' on' : '') + '" role="option" aria-selected="' + on + '" data-stage="' + esc(c.id) + '" style="--fc:var(--sw-' + c.color + ')"><span class="sw"></span>' + esc(c.name) + '<em class="why">' + ROLE_INFO[c.role].label + '</em>' + (on ? icon('check', 'tick') : '') + '</button></li>';
    });
    return h + '</ul>';
  }
  function changeStage(t, colId) {
    var l = locate(t.id), to = colById(colId);
    if (!l || !to || to.id === l.col || !syncCan(t, 'mover')) return;
    var from = colById(l.col);
    // O servidor confirma a transição e o cronômetro juntos.
    if (!moveToCol(t.id, colId)) return;
    if (to.role === 'done') { if (!t.deliveredAt) t.deliveredAt = new Date(); } else if (from.role === 'done') t.deliveredAt = null;
    sysLog(t, 'moveu a tarefa para ' + to.name, viewer);
    closePop();
    render(); refreshCard(t.id); renderToolbar(); renderDetail();
    toast('Etapa: ' + to.name);
  }
  function renderDetail() {
    if (!detailId) return;
    var l = locate(detailId);
    if (!l) { closeDetail(); return; }
    var scroll = infoEl.scrollTop;
    infoEl.innerHTML = infoHTML(l.task, l);
    infoEl.scrollTop = scroll;
    $('infof').innerHTML = footHTML(l.task, l);
    $('chatAvs').innerHTML = everyone(l.task).map(function (n) { return avatar(n, n); }).join('');
    var n = everyone(l.task).length;
    $('chatSub').textContent = fmtNum(l.task.num) + ' · ' + n + (n === 1 ? ' pessoa na tarefa' : ' pessoas na tarefa');
  }

  /* áudios do bate-papo: o arquivo é enviado pelo microfone do botão (no celular abre o gravador) e toca dentro da conversa */
  var AUDIOS = {}, audioN = 1, SPEEDS = [1, 1.5, 2];
  function audioHTML(a) {
    return '<div class="aud" data-aid="' + a.id + '"><div class="arow"><button class="aplay" type="button" data-aplay="' + a.id + '" aria-label="Reproduzir o áudio" title="Reproduzir"></button>' +
      '<button class="askip" type="button" data-askip="-10" data-aid2="' + a.id + '" aria-label="Voltar 10 segundos" title="Voltar 10 s">' + icon('rew10') + '</button>' +
      '<div class="awrap"><input class="aseek" type="range" min="0" max="1000" step="1" value="0" data-aseek="' + a.id + '" aria-label="Posição do áudio"><div class="ameta"><span data-acur>0:00</span><span data-adur>0:00</span></div></div>' +
      '<button class="askip" type="button" data-askip="10" data-aid2="' + a.id + '" aria-label="Avançar 10 segundos" title="Avançar 10 s">' + icon('fwd10') + '</button></div>' +
      '<div class="aspds" role="group" aria-label="Velocidade de reprodução">' + SPEEDS.map(function (s) { return '<button class="aspd" type="button" data-aspd="' + a.id + '" data-rate="' + s + '" aria-pressed="false">' + String(s).replace('.', ',') + 'x</button>'; }).join('') + '</div></div>';
  }
  function updateAudioUI(id) {
    var au = AUDIOS[id];
    if (!au) return;
    var els = msgsEl.querySelectorAll('[data-aid="' + id + '"]');
    for (var i = 0; i < els.length; i++) {
      var box = els[i], on = !au.el.paused && !au.el.ended, d = audDur(au), c = au.el.currentTime || 0;
      var pb = box.querySelector('.aplay');
      pb.innerHTML = icon(on ? 'pause' : 'play', 'fill');
      pb.setAttribute('aria-label', on ? 'Pausar o áudio' : 'Reproduzir o áudio'); pb.title = on ? 'Pausar' : 'Reproduzir';
      var sk = box.querySelector('.aseek'), pct = isFinite(d) && d ? Math.min(100, c / d * 100) : 0;
      if (document.activeElement !== sk) sk.value = isFinite(d) && d ? Math.round(c / d * 1000) : 0;
      sk.style.setProperty('--p', pct + '%');
      box.querySelector('[data-acur]').textContent = fClock(c);
      box.querySelector('[data-adur]').textContent = isFinite(d) && d ? fClock(d) : '0:00';
      Array.prototype.forEach.call(box.querySelectorAll('.aspd'), function (b) { b.setAttribute('aria-pressed', String(+b.dataset.rate === au.el.playbackRate)); });
    }
  }
  /* gravações do navegador chegam sem duração; usa a medida da própria gravação até o navegador calcular */
  function audDur(au) { var d = au.el.duration; return isFinite(d) && d ? d : (au.dur || 0); }
  function mkAudio(a) {
    var el = new Audio(a.url);
    el.preload = 'metadata';
    AUDIOS[a.id] = { el: el, dur: a.dur || 0 };
    el.addEventListener('loadedmetadata', function () {
      if (el.duration === Infinity) {
        el.currentTime = 1e101;
        var fix = function () { el.removeEventListener('timeupdate', fix); el.currentTime = 0; updateAudioUI(a.id); };
        el.addEventListener('timeupdate', fix);
      }
    });
    ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'seeked'].forEach(function (ev) { el.addEventListener(ev, function () { updateAudioUI(a.id); }); });
    el.addEventListener('error', function () { toast('Este navegador não consegue tocar esse áudio'); });
  }
  function pauseAllAudio(except) { Object.keys(AUDIOS).forEach(function (k) { if (k !== except) AUDIOS[k].el.pause(); }); }
  async function sendAudio(file, dur) {
    var l = locate(detailId);
    if (!l || !file || syncBusy || !canAttach(l.task)) return;
    var okType = /^audio\//.test(file.type) || /\.(mp3|wav|m4a|ogg|oga|aac|webm|opus|amr|3gp)$/i.test(file.name);
    if (!okType) { toast('Escolha um arquivo de áudio, como MP3, M4A, WAV ou OGG'); return; }
    if (file.size > 25 * 1048576) { toast('O áudio passa de 25 MB'); return; }
    syncSetBusy(true);
    try { await syncBackend.uploadAudio(l.task,file,dur || 0); syncHydrate(await syncBackend.load(),false); renderChat(true); }
    catch(error) { await syncRecover(error); }
    finally { syncSetBusy(false); }
  }
  msgsEl.addEventListener('click', function (e) {
    var pb = e.target.closest('[data-aplay]'), sp = e.target.closest('[data-aspd]'), sk2 = e.target.closest('[data-askip]');
    if (sk2) {
      var a3 = AUDIOS[sk2.dataset.aid2];
      if (a3) { var dd = audDur(a3), nt = (a3.el.currentTime || 0) + (+sk2.dataset.askip); a3.el.currentTime = Math.max(0, dd ? Math.min(dd, nt) : nt); updateAudioUI(sk2.dataset.aid2); }
      return;
    }
    if (pb) {
      var au = AUDIOS[pb.dataset.aplay];
      if (!au) return;
      if (au.el.paused) { pauseAllAudio(pb.dataset.aplay); var p = au.el.play(); if (p && p.catch) p.catch(function () { toast('Não foi possível tocar o áudio'); }); }
      else au.el.pause();
    } else if (sp) {
      var a2 = AUDIOS[sp.dataset.aspd];
      if (!a2) return;
      a2.el.playbackRate = +sp.dataset.rate;
      updateAudioUI(sp.dataset.aspd);
    }
  });
  msgsEl.addEventListener('input', function (e) {
    var sk = e.target.closest('[data-aseek]');
    if (!sk) return;
    var au = AUDIOS[sk.dataset.aseek];
    var sd2 = au ? audDur(au) : 0;
    if (au && sd2) { au.el.currentTime = sk.value / 1000 * sd2; updateAudioUI(sk.dataset.aseek); }
  });
  var audIn = $('audIn'), micBtn = $('micBtn');
  micBtn.innerHTML = icon('mic');
  /* gravação pelo microfone do computador; se o navegador bloquear o microfone aqui, abre a escolha de arquivo */
  var rec = null;
  function paintRec(on) {
    $('recBar').hidden = !on;
    document.querySelector('#compose .cbox').hidden = on;
    document.querySelector('#compose .chint').hidden = on;
  }
  function micFallback(msg) { toast(msg + ' Escolha um arquivo de áudio.'); audIn.click(); }
  function recTick() {
    if (!rec) return;
    var s = Math.floor((Date.now() - rec.t0) / 1000);
    $('recTime').textContent = fClock(s);
    if (s >= 600) stopRec(true);
  }
  function startRec() {
    if (rec || !locate(detailId) || !canAttach(locate(detailId).task)) return;
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) { micFallback('Este navegador não grava áudio aqui.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mr;
      try { mr = new MediaRecorder(stream); } catch (err) { stream.getTracks().forEach(function (t) { t.stop(); }); micFallback('Não foi possível iniciar a gravação.'); return; }
      var r = { mr: mr, stream: stream, chunks: [], t0: Date.now(), send: false, timer: 0 };
      rec = r;
      mr.ondataavailable = function (e) { if (e.data && e.data.size) r.chunks.push(e.data); };
      mr.onstop = function () {
        clearInterval(r.timer);
        r.stream.getTracks().forEach(function (t) { t.stop(); });
        if (rec === r) rec = null;
        paintRec(false);
        if (r.send && r.chunks.length) {
          var type = mr.mimeType || 'audio/webm', ext = /mp4/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : 'webm', n = new Date();
          sendAudio(new File(r.chunks, 'audio-' + p2(n.getHours()) + p2(n.getMinutes()) + '.' + ext, { type: type }), Math.max(1, Math.round((Date.now() - r.t0) / 1000)));
        }
      };
      mr.start();
      pauseAllAudio();
      $('recTime').textContent = '0:00';
      paintRec(true);
      r.timer = setInterval(recTick, 250);
      $('recSend').focus();
    }).catch(function () { micFallback('O microfone está bloqueado neste navegador.'); });
  }
  function stopRec(send) {
    if (!rec) return;
    rec.send = !!send;
    if (rec.mr.state !== 'inactive') rec.mr.stop();
  }
  $('recSend').innerHTML = icon('send');
  $('recCancel').innerHTML = icon('x');
  $('recSend').addEventListener('click', function () { stopRec(true); });
  $('recCancel').addEventListener('click', function () { stopRec(false); inputEl.focus(); });
  micBtn.addEventListener('click', startRec);
  $('mic2Btn').innerHTML = icon('clip');
  $('mic2Btn').addEventListener('click', function () { audIn.click(); });
  audIn.addEventListener('change', function () { if (audIn.files.length) sendAudio(audIn.files[0]); audIn.value = ''; });
  function dayLabel(d) {
    var n = new Date(), y = new Date(); y.setDate(n.getDate() - 1);
    return d.toDateString() === n.toDateString() ? 'Hoje' : d.toDateString() === y.toDateString() ? 'Ontem' : fDate(d);
  }
  function renderChat(toEnd) {
    var l = locate(detailId);
    if (!l) return;
    var t = l.task, nearEnd = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 80;
    var h = '', prevDay = '', prev = null;
    t.chat.forEach(function (m, i) {
      var dk = m.at.toDateString();
      if (dk !== prevDay) { h += '<div class="day">' + esc(dayLabel(m.at)) + '</div>'; prevDay = dk; prev = null; }
      if (m.type === 'sys') { h += '<div class="sysmsg"><span>' + esc(m.text) + '</span><time>' + fTime(m.at) + '</time></div>'; prev = null; return; }
      var me = m.who === viewer;
      var cont = prev && prev.who === m.who && m.at - prev.at < 3e5;
      var nx = t.chat[i + 1];
      var last = !(nx && nx.type === 'msg' && nx.who === m.who && nx.at.toDateString() === dk && nx.at - m.at < 3e5);
      var rl = rolesOf(t, m.who).map(function (k) { return ROLES[k].label; }).concat((t.viewers || []).indexOf(m.who) > -1 ? ['Visualizador(a)'] : []).join(' e ');
      h += '<div class="msg' + (me ? ' me' : '') + (cont ? ' cont' : '') + (last ? ' tail' : '') + '">' +
        (me ? '' : (last ? avatar(m.who) : '<span class="av-sp"></span>')) +
        '<div class="bub' + (m.audio ? ' hasaud' : '') + '">' + (!cont && !me ? '<div class="who"><b>' + esc(m.who) + '</b>' + (rl ? '<span class="r">' + rl + '</span>' : '') + '</div>' : '') +
        (m.audio ? audioHTML(m.audio) : '<p>' + mentionHTML(esc(m.text)).replace(/\n/g, '<br>') + '</p>') + '<time>' + fTime(m.at) + '</time></div></div>';
      prev = m;
    });
    if (!t.chat.some(function (m) { return m.type === 'msg'; })) h += '<div class="nomsg"><span class="circ">' + icon('chat') + '</span><span>Comece a conversa. Alinhe o briefing, peça ajustes e combine a entrega por aqui.</span></div>';
    msgsEl.innerHTML = h;
    t.chat.forEach(function (m) { if (m.audio) { if (!AUDIOS[m.audio.id]) mkAudio(m.audio); updateAudioUI(m.audio.id); } });
    if (toEnd || nearEnd) msgsEl.scrollTop = msgsEl.scrollHeight;
    if (mainView === 'act') renderAct();
  }

  function openDetail(id) {
    var l = locate(id);
    if (!l) return;
    detailId = id;
    syncNavigate();
    confirmDel = false;
    descEdit = false;
    lastFocus = cardEls[id] || document.activeElement;
    ovEl.hidden = false;
    document.body.classList.add('locked');
    renderDetail();
    renderChat(true);
    $('closeBtn').focus();
    say('Tarefa ' + fmtNum(l.task.num) + ' aberta: ' + l.task.title + '.');
  }
  function closeDetail() {
    pauseAllAudio();
    stopRec(false);
    closePop();
    detailId = null;
    syncNavigate();
    confirmDel = false;
    descEdit = false;
    ovEl.hidden = true;
    document.body.classList.remove('locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('closeBtn').addEventListener('click', closeDetail);
  ovEl.addEventListener('pointerdown', function (e) { if (e.target === ovEl) closeDetail(); });
  $('infocol').addEventListener('click', function (e) {
    var pl = e.target.closest('[data-play]');
    if (pl) { togglePlay(pl.dataset.play); return; }
    var pp = e.target.closest('[data-pop]');
    if (pp) { openPop(pp.dataset.pop, pp, pp.dataset.role); return; }
    var fb = e.target.closest('[data-fmt]');
    if (fb) { var ed = $('descTa'); if (ed) { ed.focus(); document.execCommand(fb.dataset.fmt, false, null); updateFmt(); } return; }
    if (e.target.closest('[data-fmt-clear]')) { var ed2 = $('descTa'); if (ed2) { ed2.focus(); document.execCommand('removeFormat', false, null); document.execCommand('unlink', false, null); updateFmt(); } return; }
    if (e.target.closest('[data-fmt-link]')) { openLinkBar(); return; }
    var lk = e.target.closest('[data-lk]');
    if (lk) { linkAction(lk.dataset.lk); return; }
    var vd = e.target.closest('[data-vdel]');
    if (vd) {
      var lv = locate(detailId);
      if (lv && canManageT(lv.task)) { lv.task.viewers = (lv.task.viewers || []).filter(function (n) { return n !== vd.dataset.vdel; }); renderDetail(); toast(vd.dataset.vdel + ' saiu dos visualizadores'); }
      return;
    }
    var fo = e.target.closest('[data-fopen]');
    if (fo) { var lo = locate(detailId); if (lo) openLb(lo.task, fo.dataset.fopen); return; }
    var fd = e.target.closest('[data-fdel]');
    if (fd) {
      var lf = locate(detailId);
      if (lf) {
        var gone = (lf.task.files || []).filter(function (x) { return x.id === fd.dataset.fdel; })[0];
        if (gone && canRemoveFile(lf.task, gone)) {
          if (gone.url) URL.revokeObjectURL(gone.url);
          if (lbOpen()) closeLb();
          lf.task.files = lf.task.files.filter(function (x) { return x !== gone; });
          sysLog(lf.task, 'removeu o anexo "' + gone.name + '"', viewer);
          refreshCard(lf.task.id); renderDetail();
        }
      }
      return;
    }
    var cr = e.target.closest('[data-clirm]');
    if (cr) { delete CLIENTS[cr.dataset.clirm]; saveClients(); refreshAllCards(); renderDetail(); toast('Foto removida'); return; }
    var ld = e.target.closest('[data-lkdel]');
    if (ld) {
      var ll = locate(detailId);
      if (ll) {
        var lgone = (ll.task.links || []).filter(function (x) { return x.id === ld.dataset.lkdel; })[0];
        if (lgone && (canManageT(ll.task) || lgone.by === viewer)) {
          ll.task.links = ll.task.links.filter(function (x) { return x !== lgone; });
          sysLog(ll.task, 'removeu o link "' + (lgone.title || hostOf(lgone.url)) + '"', viewer);
          refreshCard(ll.task.id); renderDetail();
        }
      }
      return;
    }
    var sd = e.target.closest('[data-stdel]');
    if (sd) {
      var l0 = locate(detailId);
      if (l0 && syncCan(l0.task, 'editarChecklist')) { l0.task.steps = l0.task.steps.filter(function (x) { return x.id !== sd.dataset.stdel; }); refreshCard(l0.task.id); renderDetail(); }
      return;
    }
    if (e.target.closest('[data-stsug]')) {
      var l1 = locate(detailId);
      if (!l1 || !syncCan(l1.task, 'editarChecklist')) return;
      var list = SUGGEST[l1.task.category] || SUGGEST_DEFAULT, added = 0;
      list.forEach(function (x) { if (addStep(l1.task, x)) added++; });
      if (added) { sysLog(l1.task, 'sugeriu ' + added + (added === 1 ? ' etapa' : ' etapas') + ' para a tarefa', viewer); refreshCard(l1.task.id); renderDetail(); toast(added + (added === 1 ? ' etapa adicionada' : ' etapas adicionadas')); }
      else toast('Todas as etapas sugeridas já estão na lista');
      return;
    }
    var a = e.target.closest('[data-act]');
    if (a && !a.disabled) doAction(detailId, a.dataset.act);
  });

  /* etapas: proprietário e supervisor sugerem; o responsável marca */
  function addStep(t, text) {
    text = text.trim();
    if (!text) return false;
    if ((t.steps || []).some(function (x) { return x.text.toLowerCase() === text.toLowerCase(); })) return false;
    (t.steps = t.steps || []).push({ id: 's' + (stepN++), text: text, done: false, by: '', at: null });
    return true;
  }
  infoEl.addEventListener('submit', function (e) {
    var lf = e.target.closest('[data-lkform]');
    if (lf) {
      e.preventDefault();
      var lt = locate(detailId);
      if (!lt || !canAttach(lt.task)) return;
      var uIn = lf.querySelector('#refUrl'), tIn = lf.querySelector('#refTitle'), url = normUrl(uIn.value);
      if (!url) { toast('Digite um endereço válido, como figma.com/file/abc'); uIn.focus(); return; }
      var tk = lt.task;
      if ((tk.links || []).length >= 30) { toast('Limite de 30 links por tarefa'); return; }
      if ((tk.links || []).some(function (x) { return x.url === url; })) { toast('Esse link já está na lista'); uIn.focus(); return; }
      var ttl = tIn.value.trim();
      (tk.links = tk.links || []).push({ id: uid('l'), url: url, title: ttl, by: viewer, at: new Date() });
      sysLog(tk, 'adicionou o link "' + (ttl || hostOf(url)) + '"', viewer);
      refreshCard(tk.id); renderDetail();
      var again0 = infoEl.querySelector('#refUrl'); if (again0) again0.focus();
      toast('Link adicionado');
      return;
    }
    var f = e.target.closest('[data-stform]');
    if (!f) return;
    e.preventDefault();
    var l = locate(detailId);
    if (!l || !syncCan(l.task, 'editarChecklist')) return;
    var inp = f.querySelector('input'), txt = inp.value;
    if (!txt.trim()) { inp.focus(); return; }
    if (!addStep(l.task, txt)) { toast('Essa etapa já está na lista'); inp.focus(); return; }
    sysLog(l.task, 'sugeriu a etapa "' + txt.trim() + '"', viewer);
    refreshCard(l.task.id); renderDetail();
    var again = infoEl.querySelector('#stNew'); if (again) again.focus();
  });
  /* prévia dos anexos: clique ou botão direito na miniatura; setas navegam; baixar um ou todos */
  var lbxEl = $('lbx'), lbTask = null, lbIdx = 0, lbTok = 0, lbPage = 1, lbBusy = false, lbLast = null;
  function lbOpen() { return !lbxEl.hidden; }
  function lbFiles() { var l = lbTask && locate(lbTask); return l ? (l.task.files || []) : []; }
  function openLb(t, fid) {
    var i = (t.files || []).findIndex(function (f) { return f.id === fid; });
    if (i < 0) return;
    lbTask = t.id; lbIdx = i; lbPage = 1; lbLast = document.activeElement;
    lbxEl.hidden = false;
    renderLb();
    if (!$('vpPlay')) $('lbX').focus();
  }
  function closeLb() { lbxEl.hidden = true; lbTok++; $('lbMedia').innerHTML = ''; lbTask = null; if (lbLast && lbLast.focus && lbLast.isConnected) lbLast.focus({ preventScroll: true }); }
  function lbGo(i) { var n = lbFiles().length; if (i < 0 || i >= n || i === lbIdx) return; lbIdx = i; lbPage = 1; renderLb(); }
  function renderLb() {
    var fs = lbFiles(), f = fs[lbIdx];
    if (!f) { closeLb(); return; }
    var tok = ++lbTok, k = ftype(f), media = $('lbMedia');
    $('lbName').textContent = f.name;
    $('lbMeta').textContent = (lbIdx + 1) + ' de ' + fs.length + ' · ' + fSize(f.size) + ' · ' + f.by.split(' ')[0] + ', ' + fDate(f.at) + ' ' + fTime(f.at);
    $('lbPrev').disabled = lbIdx === 0; $('lbNext').disabled = lbIdx === fs.length - 1;
    $('lbAll').innerHTML = icon('dl') + '<span>Baixar todos (' + fs.length + ')</span>';
    $('lbAll').disabled = lbBusy;
    $('lbDl').innerHTML = icon('dl') + '<span>Baixar este</span>';
    if (k === 'image') media.innerHTML = '<img src="' + f.url + '" alt="' + esc(f.name) + '">';
    else if (k === 'video') media.innerHTML = playerHTML('video', f);
    else if (k === 'audio') media.innerHTML = playerHTML('audio', f);
    else if (k === 'pdf') {
      media.innerHTML = '<div class="lbpdf"><div class="pgw"><canvas id="lbCv" aria-label="Página do PDF"></canvas></div><div class="lbpg"><button type="button" id="pgPrev" aria-label="Página anterior">' + icon('chevL') + '</button><span id="pgInfo">Carregando…</span><button type="button" id="pgNext" aria-label="Próxima página">' + icon('chevR') + '</button></div></div>';
      pdfPage(f, lbPage, $('lbCv'), 900).then(function () {
        if (tok !== lbTok) return;
        $('pgInfo').textContent = 'Página ' + lbPage + ' de ' + f.pages;
        $('pgPrev').disabled = lbPage <= 1; $('pgNext').disabled = lbPage >= f.pages;
      }).catch(function () {
        if (tok !== lbTok) return;
        media.innerHTML = '<div class="lbno">' + icon('doc') + '<span>Não foi possível montar a prévia deste PDF aqui. Use "Baixar este" para abrir o arquivo.</span></div>';
      });
    } else media.innerHTML = '<div class="lbno">' + icon(FICON[k]) + '<span>Este tipo de arquivo (' + esc(fext(f)) + ') não tem prévia. Use "Baixar este" para abrir.</span></div>';
    wirePlayer();
    $('lbFilm').innerHTML = fs.map(function (x, i) { return '<button type="button" class="lbth" role="option" aria-selected="' + (i === lbIdx) + '" data-lbi="' + i + '" aria-label="' + esc(x.name) + '" title="' + esc(x.name) + '">' + (ftype(x) === 'image' ? '<img src="' + x.url + '" alt="">' : ftype(x) === 'pdf' && x.thumb ? '<img src="' + x.thumb + '" alt="">' : ftype(x) === 'video' ? '<video src="' + x.url + '#t=0.1" muted preload="metadata" tabindex="-1"></video>' : icon(FICON[ftype(x)])) + '</button>'; }).join('');
    var cur = $('lbFilm').querySelector('[aria-selected="true"]'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  /* player: reproduzir/pausar, linha do tempo, tempo e silenciar */
  function fClock(sec) { sec = isFinite(sec) ? Math.max(0, Math.floor(sec)) : 0; var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60; return (h ? h + ':' + p2(m) : m) + ':' + p2(x); }
  function playerHTML(kind, f) {
    var media = kind === 'video' ? '<video id="vpm" src="' + f.url + '" playsinline preload="metadata"></video>' : '<audio id="vpm" src="' + f.url + '" preload="metadata"></audio><span class="lbau">' + icon('mic') + '</span>';
    return '<div class="vp" id="vp"><div class="vstage" id="vstage">' + media + (kind === 'video' ? '<span class="vbig" aria-hidden="true">' + icon('play', 'fill') + '</span>' : '') + '</div>' +
      '<div class="vpc" role="group" aria-label="Controles de reprodução"><button type="button" id="vpPlay" aria-label="Reproduzir">' + icon('play', 'fill') + '</button><time id="vpCur">0:00</time>' +
      '<input id="vpSeek" type="range" min="0" max="1000" step="1" value="0" aria-label="Linha do tempo" aria-valuetext="0:00 de 0:00"><time id="vpDur">0:00</time>' +
      '<button type="button" id="vpMute" aria-label="Silenciar">' + icon('vol') + '</button></div></div>';
  }
  function playerEl() { return $('vpm'); }
  function togglePlayer() { var v = playerEl(); if (!v) return; if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }
  function toggleMute() { var v = playerEl(); if (v) v.muted = !v.muted; }
  function wirePlayer() {
    var v = playerEl(), vp = $('vp');
    if (!v || !vp) return;
    var seek = $('vpSeek');
    function paint() {
      var d = v.duration, c = v.currentTime || 0, pct = d ? Math.min(100, c / d * 100) : 0;
      seek.value = d ? Math.round(c / d * 1000) : 0;
      seek.style.setProperty('--p', pct + '%');
      $('vpCur').textContent = fClock(c);
      $('vpDur').textContent = fClock(d);
      seek.setAttribute('aria-valuetext', fClock(c) + ' de ' + fClock(d));
    }
    function state() {
      var on = !v.paused && !v.ended;
      vp.classList.toggle('playing', on);
      $('vpPlay').innerHTML = icon(on ? 'pause' : 'play', 'fill');
      $('vpPlay').setAttribute('aria-label', on ? 'Pausar' : 'Reproduzir');
    }
    function vol() { $('vpMute').innerHTML = icon(v.muted || v.volume === 0 ? 'mute' : 'vol'); $('vpMute').setAttribute('aria-label', v.muted ? 'Ativar o som' : 'Silenciar'); $('vpMute').setAttribute('aria-pressed', v.muted ? 'true' : 'false'); }
    ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked'].forEach(function (ev) { v.addEventListener(ev, paint); });
    ['play', 'pause', 'ended'].forEach(function (ev) { v.addEventListener(ev, state); });
    v.addEventListener('volumechange', vol);
    v.addEventListener('error', function () { var m = $('lbMedia'); if (m && playerEl() === v) m.innerHTML = '<div class="lbno">' + icon('video') + '<span>Este navegador não consegue reproduzir esse formato. Use "Baixar este" para abrir o arquivo.</span></div>'; });
    $('vpPlay').addEventListener('click', togglePlayer);
    $('vpMute').addEventListener('click', toggleMute);
    $('vstage').addEventListener('click', togglePlayer);
    seek.addEventListener('input', function () { if (v.duration) { v.currentTime = seek.value / 1000 * v.duration; paint(); } });
    paint(); state(); vol();
    $('vpPlay').focus({ preventScroll: true });
  }
  function lbPdfPage(d) {
    var f = lbFiles()[lbIdx];
    if (!f || ftype(f) !== 'pdf' || !f.pages) return;
    var n = lbPage + d;
    if (n < 1 || n > f.pages) return;
    lbPage = n;
    pdfPage(f, lbPage, $('lbCv'), 900).then(function () { var pi = $('pgInfo'); if (pi) { pi.textContent = 'Página ' + lbPage + ' de ' + f.pages; $('pgPrev').disabled = lbPage <= 1; $('pgNext').disabled = lbPage >= f.pages; } });
  }
  function browserDl() {
    return {
      save: function (o) {
        return new Promise(function (ok, fail) {
          try {
            var url = URL.createObjectURL(o.data), a = document.createElement('a');
            a.href = url; a.download = o.filename; a.style.display = 'none';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
            ok();
          } catch (err) { fail(err); }
        });
      }
    };
  }
  function getDl() {
    try {
      if (window.claude && window.claude.use) return window.claude.use('downloads').catch(function () { return browserDl(); });
    } catch (err) {}
    return Promise.resolve(browserDl());
  }
  function dlError(err, name) {
    var c = err && err.code;
    if (c === 'declined') return;
    if (c === 'rejected_extension') toast('O formato de "' + name + '" não pode ser baixado por aqui. Peça o arquivo original a quem anexou');
    else toast('Não foi possível baixar agora');
  }
  function saveOne(f) {
    getDl().then(function (dl) {
      if (!dl) { toast('Download indisponível nesta visualização'); return; }
      window.VvoxSyncTaskExtras.getFileBlob(f).then(function(blob) { return dl.save({ filename: f.name, data: blob }); }).then(function () { toast('Arquivo salvo'); }, function (err) { dlError(err, f.name); });
    });
  }
  var zipLoad = null;
  function loadZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (zipLoad) return zipLoad;
    zipLoad = new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      sc.onload = function () { res(window.JSZip); };
      sc.onerror = function () { zipLoad = null; rej(new Error('jszip')); };
      document.head.appendChild(sc);
      setTimeout(function () { if (!window.JSZip) { zipLoad = null; rej(new Error('jszip-timeout')); } }, 15000);
    });
    return zipLoad;
  }
  function saveAll() {
    var l = lbTask && locate(lbTask);
    if (!l || lbBusy) return;
    var t = l.task, fs = t.files || [];
    if (fs.length === 1) { saveOne(fs[0]); return; }
    getDl().then(function (dl) {
      if (!dl) { toast('Download indisponível nesta visualização'); return; }
      lbBusy = true; $('lbAll').disabled = true; $('lbAll').lastChild.textContent = 'Preparando o zip…';
      loadZip().then(function (Z) {
        var z = new Z(), used = {};
        fs.forEach(function (f) {
          var nm = f.name, i = 1;
          while (used[nm]) { i++; nm = f.name.replace(/(\.[^.]*)?$/, ' (' + i + ')$1'); }
          used[nm] = 1; z.file(nm, window.VvoxSyncTaskExtras.getFileBlob(f));
        });
        return z.generateAsync({ type: 'blob', compression: 'STORE' });
      }).then(function (blob) {
        return dl.save({ filename: 'anexos-' + fmtNum(t.num).replace('#', '') + '.zip', data: blob }).then(function () { toast('Anexos salvos em um zip'); }, function (err) { dlError(err, 'anexos.zip'); });
      }).catch(function () { toast('Não foi possível preparar o zip'); }).then(function () { lbBusy = false; if (lbOpen()) renderLb(); });
    });
  }
  $('lbX').innerHTML = icon('x');
  $('lbX').firstChild.style.cssText = 'width:16px;height:16px';
  $('lbPrev').innerHTML = icon('chevL'); $('lbNext').innerHTML = icon('chevR');
  $('lbX').addEventListener('click', closeLb);
  $('lbPrev').addEventListener('click', function () { lbGo(lbIdx - 1); });
  $('lbNext').addEventListener('click', function () { lbGo(lbIdx + 1); });
  $('lbDl').addEventListener('click', function () { var f = lbFiles()[lbIdx]; if (f) saveOne(f); });
  $('lbAll').addEventListener('click', saveAll);
  $('lbFilm').addEventListener('click', function (e) { var b = e.target.closest('[data-lbi]'); if (b) lbGo(+b.dataset.lbi); });
  $('lbMedia').addEventListener('click', function (e) { var b = e.target.closest('#pgPrev,#pgNext'); if (b) lbPdfPage(b.id === 'pgPrev' ? -1 : 1); });
  lbxEl.addEventListener('pointerdown', function (e) { if (e.target === lbxEl || e.target.classList.contains('lbs') || e.target.classList.contains('lbm')) closeLb(); });
  infoEl.addEventListener('contextmenu', function (e) {
    var b = e.target.closest('[data-fopen]');
    if (!b) return;
    e.preventDefault();
    var l = locate(detailId);
    if (l) openLb(l.task, b.dataset.fopen);
  });

  /* editor de texto: seleção preservada, link, colagem em texto simples e atalhos */
  var rteRange = null;
  function inEditor(n) { var ed = $('descTa'); return !!ed && !!n && ed.contains(n.nodeType === 3 ? n.parentNode : n); }
  function updateFmt() {
    if (!descEdit) return;
    Array.prototype.forEach.call(infoEl.querySelectorAll('[data-fmt]'), function (b) {
      var on = false; try { on = document.queryCommandState(b.dataset.fmt); } catch (err) {}
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  document.addEventListener('selectionchange', function () { if (descEdit) { var sl = window.getSelection(); if (sl && sl.rangeCount && inEditor(sl.anchorNode)) { rteRange = sl.getRangeAt(0).cloneRange(); updateFmt(); } } });
  function openLinkBar() {
    var bar = $('lkbar'), inp = $('lkUrl');
    if (!bar) return;
    bar.hidden = false;
    var cur2 = rteRange && inEditor(rteRange.startContainer) ? rteRange.startContainer : null, a = cur2 && (cur2.nodeType === 3 ? cur2.parentNode : cur2).closest ? (cur2.nodeType === 3 ? cur2.parentNode : cur2).closest('a') : null;
    inp.value = a ? a.getAttribute('href') : '';
    inp.focus();
  }
  function linkAction(a) {
    var bar = $('lkbar'), inp = $('lkUrl'), ed = $('descTa');
    if (!bar || !ed) return;
    function restore() { ed.focus(); if (rteRange) { var sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(rteRange); } }
    if (a === 'cancel') { bar.hidden = true; restore(); return; }
    if (a === 'remove') { restore(); document.execCommand('unlink', false, null); bar.hidden = true; return; }
    var url = inp.value.trim();
    if (!url) { inp.focus(); return; }
    if (!/^(https?:\/\/|mailto:)/i.test(url)) url = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url) ? 'mailto:' + url : 'https://' + url;
    restore();
    var sl2 = window.getSelection();
    if (sl2 && sl2.isCollapsed) document.execCommand('insertHTML', false, '<a href="' + url.replace(/"/g, '&quot;') + '">' + esc(url.replace(/^mailto:/, '')) + '</a>');
    else document.execCommand('createLink', false, url);
    bar.hidden = true;
  }
  infoEl.addEventListener('mousedown', function (e) { if (e.target.closest('.rtb button')) e.preventDefault(); });
  infoEl.addEventListener('keydown', function (e) {
    if (e.target.id === 'descTa') {
      if (e.key === 'Escape') { e.stopPropagation(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openLinkBar(); }
    } else if (e.target.id === 'lkUrl') {
      if (e.key === 'Enter') { e.preventDefault(); linkAction('apply'); }
      else if (e.key === 'Escape') { e.stopPropagation(); linkAction('cancel'); }
    } else if ((e.target.id === 'stNew' || e.target.id === 'refUrl' || e.target.id === 'refTitle') && e.key === 'Escape') e.stopPropagation();
  });
  infoEl.addEventListener('paste', function (e) {
    if (e.target.id !== 'descTa') return;
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, txt);
  });
  infoEl.addEventListener('dragover', function (e) { var d = e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
  infoEl.addEventListener('dragleave', function (e) { var d = e.target.closest('.drop'); if (d) d.classList.remove('over'); });
  infoEl.addEventListener('drop', function (e) {
    var d = e.target.closest('.drop');
    if (!d) return;
    e.preventDefault(); d.classList.remove('over');
    var l = locate(detailId);
    if (l && canAttach(l.task) && e.dataTransfer && e.dataTransfer.files.length) addFiles(l.task, e.dataTransfer.files);
  });
  infoEl.addEventListener('change', function (e) {
    if (e.target.id === 'fileIn') {
      var lf2 = locate(detailId);
      if (lf2 && canAttach(lf2.task) && e.target.files.length) addFiles(lf2.task, e.target.files);
      e.target.value = '';
      return;
    }
    if (e.target.id === 'cliPhoto') {
      var lc = locate(detailId);
      if (lc && canEdit(lc.task) && e.target.files.length) setClientPhoto(clientOf(lc.task), e.target.files[0]);
      e.target.value = '';
      return;
    }
    var cb = e.target.closest('[data-step]');
    if (!cb) return;
    var l = locate(detailId);
    if (!l) return;
    var t = l.task, st = (t.steps || []).filter(function (x) { return x.id === cb.dataset.step; })[0];
    if (!st || !syncCan(t, 'marcarChecklist')) { renderDetail(); return; }
    st.done = cb.checked; st.by = cb.checked ? viewer : ''; st.at = cb.checked ? new Date() : null;
    var all = t.steps.every(function (x) { return x.done; });
    if (all && cb.checked) { sysLog(t, 'concluiu todas as etapas', viewer); toast('Todas as etapas concluídas. Já dá para entregar'); }
    refreshCard(t.id); renderDetail();
  });
  $('compose').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = inputEl.value.trim();
    var l = locate(detailId);
    if (!text || !l || !syncCan(l.task, 'comentar')) return;
    l.task.chat.push({ type: 'msg', who: viewer, text: text, at: new Date() });
    var tk = l.task, short = text.length > 90 ? text.slice(0, 90) + '…' : text, ments = mentionsIn(text), addedV = false;
    tk.viewers = tk.viewers || [];
    ments.forEach(function (nm) {
      if (nm === viewer) return;
      var isNew = !rolesOf(tk, nm).length && tk.viewers.indexOf(nm) < 0;
      if (isNew && syncCan(tk, 'editar')) { tk.viewers.push(nm); addedV = true; tk.chat.push({ type: 'sys', text: viewer + ' citou @' + PROFILES[nm].user + ' e liberou o acesso como visualizador(a)', at: new Date() }); }
      notify(nm, tk, 'mention', viewer + ' citou você: "' + short + '"' + (isNew ? ' Você agora é visualizador(a) e pode ajudar nesta tarefa.' : ' Talvez precisem da sua ajuda.'));
    });
    everyone(tk).forEach(function (n) { if (n !== viewer && ments.indexOf(n) < 0) notify(n, tk, 'msg', viewer + ': ' + short); });
    if (addedV && !descEdit) renderDetail();
    inputEl.value = '';
    inputEl.style.height = '';
    flySend();
    renderChat(true);
    inputEl.focus();
  });
  var mlistEl = $('mlist'), mSel = 0, mCands = [];
  function mOpen() { return !mlistEl.hidden; }
  function mClose() { mlistEl.hidden = true; mCands = []; }
  function mUpdate() {
    var l = locate(detailId);
    if (!l) { mClose(); return; }
    var before = inputEl.value.slice(0, inputEl.selectionStart || 0), m = /(^|\s)@([a-z0-9._-]*)$/i.exec(before);
    if (!m) { mClose(); return; }
    var q = m[2].toLowerCase(), t = l.task, part = everyone(t);
    mCands = PEOPLE.filter(function (n) { return n !== viewer && (PROFILES[n].user.indexOf(q) === 0 || n.toLowerCase().indexOf(q) > -1); })
      .sort(function (a, b) { return (part.indexOf(b) > -1) - (part.indexOf(a) > -1); });
    if (!mCands.length) { mClose(); return; }
    mSel = Math.min(mSel, mCands.length - 1);
    mlistEl.innerHTML = mCands.map(function (n, i) {
      var r = rolesOf(t, n).map(function (k) { return ROLES[k].label; }).concat((t.viewers || []).indexOf(n) > -1 ? ['Visualizador(a)'] : []).join(' e ');
      return '<button type="button" class="mit' + (i === mSel ? ' on' : '') + '" role="option" aria-selected="' + (i === mSel) + '" data-mn="' + esc(n) + '">' + avatar(n) + '<b>@' + esc(PROFILES[n].user) + '</b><span>' + esc(n) + '</span><em>' + (r || 'Será visualizador(a)') + '</em></button>';
    }).join('');
    mlistEl.hidden = false;
  }
  function mPick(name) {
    var pos = inputEl.selectionStart || 0, before = inputEl.value.slice(0, pos), after = inputEl.value.slice(pos);
    var nb = before.replace(/@([a-z0-9._-]*)$/i, '@' + PROFILES[name].user + ' ');
    inputEl.value = nb + after;
    inputEl.setSelectionRange(nb.length, nb.length);
    mClose(); inputEl.focus();
  }
  mlistEl.addEventListener('mousedown', function (e) { e.preventDefault(); });
  mlistEl.addEventListener('click', function (e) { var b = e.target.closest('[data-mn]'); if (b) mPick(b.dataset.mn); });
  inputEl.addEventListener('input', mUpdate);
  inputEl.addEventListener('click', mUpdate);
  inputEl.addEventListener('blur', function () { setTimeout(mClose, 120); });
  inputEl.addEventListener('keydown', function (e) {
    if (mOpen()) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); mSel = (mSel + (e.key === 'ArrowDown' ? 1 : -1) + mCands.length) % mCands.length; mUpdate(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); mPick(mCands[mSel]); return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); mClose(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('compose').requestSubmit(); }
  });
  inputEl.addEventListener('input', function () {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(120, inputEl.scrollHeight) + 'px';
  });

  document.addEventListener('keydown', function (e) {
    if (lbOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); closeLb(); return; }
      var onSeek = document.activeElement && document.activeElement.id === 'vpSeek', tag = document.activeElement ? document.activeElement.tagName : '';
      if (e.key === ' ' && playerEl() && tag !== 'BUTTON' && tag !== 'INPUT') { e.preventDefault(); togglePlayer(); return; }
      if ((e.key === 'm' || e.key === 'M') && playerEl()) { e.preventDefault(); toggleMute(); return; }
      if (e.key === 'ArrowLeft' && !onSeek) { e.preventDefault(); lbGo(lbIdx - 1); return; }
      if (e.key === 'ArrowRight' && !onSeek) { e.preventDefault(); lbGo(lbIdx + 1); return; }
      if (e.key === 'Home') { e.preventDefault(); lbGo(0); return; }
      if (e.key === 'End') { e.preventDefault(); lbGo(lbFiles().length - 1); return; }
      if (e.key === 'PageUp') { e.preventDefault(); lbPdfPage(-1); return; }
      if (e.key === 'PageDown') { e.preventDefault(); lbPdfPage(1); return; }
      if (e.key === 'Tab') {
        var lf = Array.prototype.slice.call(lbxEl.querySelectorAll('button:not([disabled])')).filter(function (x) { return x.offsetParent !== null; });
        if (lf.length) { var fi = lf[0], la = lf[lf.length - 1]; if (e.shiftKey && document.activeElement === fi) { e.preventDefault(); la.focus(); } else if (!e.shiftKey && document.activeElement === la) { e.preventDefault(); fi.focus(); } }
      }
      return;
    }
    if (e.key === 'Escape') {
      if (drag) { e.preventDefault(); endDrag(true); return; }
      if (popState) { e.preventDefault(); closePop(true); return; }
      if (nOpen()) { e.preventDefault(); closeBulk(); return; }
      if (bovOpen()) { e.preventDefault(); closeBoardModal(); return; }
      if (!ctx.hidden) { e.preventDefault(); closeCtx(true); return; }
      if (!menu.hidden) { closeMenu(); return; }
      if (detailId) { e.preventDefault(); closeDetail(); return; }
      if (document.activeElement === $('q') && F.q) { F.q = ''; $('q').value = ''; applyFilters(); return; }
    }
    if (e.key === '/' && !detailId && !bovOpen() && !nOpen() && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); $('q').focus(); return; }
    if (e.key === 'Tab' && (detailId || popState || bovOpen() || nOpen())) {
      var f = Array.prototype.slice.call((popState ? popEl : nOpen() ? ndlgEl : bovOpen() ? bdlgEl : dlgEl).querySelectorAll('button:not([disabled]),textarea,input,select,[tabindex="0"]')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ------------------------------------------------------------ popovers (edição e filtros) */
  var popEl = document.createElement('div');
  popEl.className = 'pop';
  popEl.hidden = true;
  popEl.setAttribute('role', 'dialog');
  document.body.appendChild(popEl);
  var popState = null;

  function ymd(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function hm(d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function popTask() { var l = detailId ? locate(detailId) : null; return l ? l.task : null; }

  function swatches(sel) {
    return SW_COLORS.map(function (c) {
      return '<button type="button" class="swb" data-sw="' + c + '" aria-pressed="' + (c === sel) + '" aria-label="' + SW_NAMES[c] + '" title="' + SW_NAMES[c] + '" style="--fc:var(--sw-' + c + ')"></button>';
    }).join('');
  }
  function catRows(t, mode) {
    /* mode: 'pick' (tarefa) ou 'filter' (filtro múltiplo) */
    var h = '';
    [['main', 'Principais'], ['other', 'Outros']].forEach(function (g) {
      h += '<div class="grp">' + g[1] + '</div><ul class="opts">';
      CATS.filter(function (c) { return c.group === g[0]; }).forEach(function (c) {
        var on = mode === 'pick' ? t.category === c.id : F.cats.indexOf(c.id) > -1;
        var used = everyTask().some(function (o) { return o.category === c.id; });
        h += '<li class="opt"><button type="button" class="opt-b' + (on ? ' on' : '') + '" role="' + (mode === 'pick' ? 'option' : 'menuitemcheckbox') + '" ' + (mode === 'pick' ? 'aria-selected' : 'aria-checked') + '="' + on + '" ' + (mode === 'pick' ? 'data-pick="' : 'data-fcat="') + esc(c.id) + '">' + icon(c.icon) + esc(c.label) + (on ? icon('check', 'tick') : '') + '</button>' +
          (c.builtin || mode !== 'pick' ? '' : '<button type="button" class="opt-x" data-delcat="' + esc(c.id) + '" aria-disabled="' + used + '" aria-label="Excluir o tipo ' + esc(c.label) + '" title="' + (used ? 'Em uso por alguma tarefa' : 'Excluir tipo') + '">' + icon('x') + '</button>') + '</li>';
      });
      h += '</ul>';
    });
    return h;
  }
  function flagPopHTML(t) {
    var h = '<h4>Prioridade</h4><ul class="opts" role="listbox" aria-label="Prioridade">';
    FLAGS.forEach(function (f) {
      var on = t.priority === f.id, used = everyTask().some(function (o) { return o.priority === f.id; });
      h += '<li class="opt"><button type="button" class="opt-b' + (on ? ' on' : '') + '" role="option" aria-selected="' + on + '" data-pick="' + f.id + '" style="--fc:var(--sw-' + f.color + ')"><span class="sw"></span>' + esc(f.label) + (on ? icon('check', 'tick') : '') + '</button>' +
        (f.builtin ? '' : '<button type="button" class="opt-x" data-delflag="' + f.id + '" aria-disabled="' + used + '" aria-label="Excluir a flag ' + esc(f.label) + '" title="' + (used ? 'Em uso por alguma tarefa' : 'Excluir flag') + '">' + icon('x') + '</button>') + '</li>';
    });
    return h + '</ul><form class="newf" data-form="newflag"><label for="flagName">Criar nova flag</label><input id="flagName" type="text" maxlength="18" autocomplete="off" placeholder="Ex.: Aguardando cliente"><div class="swb-row" role="group" aria-label="Cor da flag">' + swatches(popState.sw) + '</div><button class="btn primary sm" type="submit">Criar e usar</button></form>';
  }
  function catPopHTML(t) {
    var h = '<h4>Tipo de conteúdo</h4>' + catRows(t, 'pick');
    if (t.category) h += '<button type="button" class="plink" data-pick="">Remover categoria</button>';
    return h + '<form class="newf" data-form="newcat"><label for="catName">Criar novo tipo (entra em Outros)</label><input id="catName" type="text" maxlength="22" autocomplete="off" placeholder="Ex.: Podcast"><div class="icgrid" role="group" aria-label="Ícone">' +
      CAT_ICONS.map(function (n) { return '<button type="button" class="icb" data-ic="' + n + '" aria-pressed="' + (n === popState.ic) + '" aria-label="Ícone ' + n + '">' + icon(n) + '</button>'; }).join('') + '</div><button class="btn primary sm" type="submit">Criar e usar</button></form>';
  }
  var MONTH_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var WD_INI = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function addMonths(d, n) {
    var t = new Date(d.getFullYear(), d.getMonth() + n, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last));
  }
  function duePopHTML(t) {
    var st = popState;
    return '<h4>Prazo de entrega</h4><div class="quick4"><button type="button" data-q="0">Hoje</button><button type="button" data-q="1">Amanhã</button><button type="button" data-q="3">3 dias</button><button type="button" data-q="7">1 semana</button></div>' +
      '<form class="duef" data-form="due"><div class="cal" id="cal"></div>' +
      '<p class="prev" id="duePrev" aria-live="polite"></p><div class="prow"><button class="btn primary sm" type="submit">Salvar prazo</button><button class="btn sm" type="button" data-pcancel>Cancelar</button>' + (t.dueAt ? '<button class="link" type="button" data-rmdue>Remover prazo</button>' : '') + '</div></form>';
  }
  var MONTH_ABR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
  function setView(y, m) {
    var st = popState, last = new Date(y, m + 1, 0).getDate();
    st.view = { y: y, m: m };
    st.cf = new Date(y, m, Math.min(st.cf.getDate(), last));
  }
  function renderCal(focus) {
    var st = popState, el = popEl.querySelector('#cal');
    if (!st || !el) return;
    var y = st.view.y, m = st.view.m, mode = st.cmode, today = new Date();
    var navLabel = mode === 'days' ? ['Mês anterior', 'Próximo mês'] : mode === 'months' ? ['Ano anterior', 'Próximo ano'] : ['Anos anteriores', 'Próximos anos'];
    var h = '<div class="cal-h"><div class="cal-sel"><button type="button" class="cal-b" data-cmode="months" aria-expanded="' + (mode === 'months') + '" aria-label="Escolher o mês. Mês atual: ' + MONTH_FULL[m] + '">' + cap(MONTH_FULL[m]) + icon('down') + '</button>' +
      '<button type="button" class="cal-b" data-cmode="years" aria-expanded="' + (mode === 'years') + '" aria-label="Escolher o ano. Ano atual: ' + y + '">' + y + icon('down') + '</button></div>' +
      '<div class="cal-n"><button type="button" class="cn" data-cnav="-1" aria-label="' + navLabel[0] + '">' + icon('chevL') + '</button><button type="button" class="cn" data-cnav="1" aria-label="' + navLabel[1] + '">' + icon('chevR') + '</button></div></div>';
    if (mode === 'days') {
      var start = new Date(y, m, 1 - new Date(y, m, 1).getDay());
      h += '<div class="cal-w" aria-hidden="true">' + WD_INI.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div><div class="cal-g" role="group" aria-label="Dias de ' + MONTH_FULL[m] + ' de ' + y + '">';
      for (var i = 0; i < 42; i++) {
        var d = addDays(start, i), out = d.getMonth() !== m, sel = st.sel && d.toDateString() === st.sel.toDateString(), tod = d.toDateString() === today.toDateString(), cf = d.toDateString() === st.cf.toDateString();
        h += '<button type="button" class="cd' + (out ? ' out' : '') + (sel ? ' sel' : '') + (tod ? ' tod' : '') + '" data-day="' + ymd(d) + '" tabindex="' + (cf ? 0 : -1) + '" aria-pressed="' + !!sel + '" aria-label="' + d.getDate() + ' de ' + MONTH_FULL[d.getMonth()] + ' de ' + d.getFullYear() + (tod ? ', hoje' : '') + '">' + d.getDate() + '</button>';
      }
      h += '</div>';
    } else if (mode === 'months') {
      h += '<div class="cal-m" role="group" aria-label="Meses de ' + y + '">';
      for (var k = 0; k < 12; k++) {
        h += '<button type="button" class="cm' + (k === m ? ' sel' : '') + (k === today.getMonth() && y === today.getFullYear() ? ' tod' : '') + '" data-month="' + k + '" aria-pressed="' + (k === m) + '" aria-label="' + MONTH_FULL[k] + ' de ' + y + '">' + MONTH_ABR[k] + '</button>';
      }
      h += '</div>';
    } else {
      h += '<div class="cal-m" role="group" aria-label="Anos">';
      for (var j = 0; j < 12; j++) {
        var yy = st.yb + j;
        h += '<button type="button" class="cm' + (yy === y ? ' sel' : '') + (yy === today.getFullYear() ? ' tod' : '') + '" data-year="' + yy + '" aria-pressed="' + (yy === y) + '">' + yy + '</button>';
      }
      h += '</div>';
    }
    el.innerHTML = h;
    if (focus) { var f = el.querySelector('.cd[tabindex="0"]'); if (f) f.focus(); }
  }
  function pickDay(d, focus) {
    var st = popState;
    st.sel = startOfDay(d); st.cf = st.sel; st.view = { y: d.getFullYear(), m: d.getMonth() }; st.cmode = 'days';
    renderCal(focus);
    updatePrev();
  }
  function setTime(h, m) {
    var st = popState;
    st.hh = h; st.mm = m;
    popEl.querySelector('#dueH').value = p2(h);
    popEl.querySelector('#dueM').value = p2(m);
    updatePrev();
  }
  function whoPopHTML(t, role) {
    var other = role === 'lead' ? 'maker' : 'lead', h = '<h4>Atribuir ' + ROLES[role].label.toLowerCase() + '</h4><ul class="opts">';
    PEOPLE.forEach(function (n) {
      var blocked = t[other] === n, on = t[role] === n;
      h += '<li class="opt"><button type="button" class="opt-b' + (on ? ' on' : '') + '" data-who="' + esc(n) + '"' + (blocked ? ' disabled' : '') + '>' + avatar(n) + '<span>' + esc(n) + '</span>' + (blocked ? '<em class="why">já é ' + ROLE_NOUN[other] + '</em>' : on ? icon('check', 'tick') : '') + '</button></li>';
    });
    return h + '</ul>' + (t[role] ? '<button class="btn sm" type="button" data-who="">Remover atribuição</button>' : '');
  }
  function viewerPopHTML() {
    var h = '<h4>Visualizando como</h4><ul class="opts">';
    PEOPLE.forEach(function (n) { h += '<li class="opt"><button type="button" class="opt-b' + (n === viewer ? ' on' : '') + '" data-viewer="' + esc(n) + '">' + avatar(n) + '<span>' + esc(n) + '</span>' + (n === viewer ? icon('check', 'tick') : '') + '</button></li>'; });
    return h + '</ul><p class="hint" style="margin:0">Muda o que você pode editar, entregar e aprovar em cada tarefa.</p>';
  }
  function fCatPopHTML() { return '<h4>Filtrar por categoria</h4>' + catRows(null, 'filter') + (F.cats.length ? '<button type="button" class="plink" data-fcatclear>Limpar categorias</button>' : ''); }
  function fWhoPopHTML() {
    var h = '<h4>Filtrar por pessoa</h4><ul class="opts">';
    h += '<li class="opt"><button type="button" class="opt-b' + (!F.who ? ' on' : '') + '" data-fwho="">Todas as pessoas' + (!F.who ? icon('check', 'tick') : '') + '</button></li>';
    h += '<li class="opt"><button type="button" class="opt-b' + (F.who === 'mine' ? ' on' : '') + '" data-fwho="mine">Minhas tarefas <em class="why">' + esc(viewer) + '</em></button></li>';
    PEOPLE.forEach(function (n) { h += '<li class="opt"><button type="button" class="opt-b' + (F.who === n ? ' on' : '') + '" data-fwho="' + esc(n) + '">' + avatar(n) + '<span>' + esc(n) + '</span>' + (F.who === n ? icon('check', 'tick') : '') + '</button></li>'; });
    return h + '</ul>';
  }
  function swatchesAttr(sel, attr) {
    return SW_COLORS.map(function (c) {
      return '<button type="button" class="swb" ' + attr + '="' + c + '" aria-pressed="' + (c === sel) + '" aria-label="' + SW_NAMES[c] + '" title="' + SW_NAMES[c] + '" style="--fc:var(--sw-' + c + ')"></button>';
    }).join('');
  }
  function roleBlock(d) {
    return '<div class="fld"><span class="lab">Função da coluna</span><div class="rolegrid" role="group" aria-label="Função da coluna">' +
      ROLE_KEYS.map(function (r) { return '<button type="button" data-crole="' + r + '" aria-pressed="' + (d.role === r) + '">' + ROLE_INFO[r].short + '</button>'; }).join('') +
      '</div><p class="rolehelp" id="roleHelp">' + esc(ROLE_INFO[d.role].help) + '</p></div>';
  }
  function colPopHTML(c) {
    var d = popState.draft;
    return '<h4>Personalizar coluna</h4><form class="colf" data-form="col">' +
      '<div class="colprev" id="colPrev" aria-hidden="true"></div>' +
      '<div class="fld"><label for="colName">Nome</label><input id="colName" type="text" maxlength="32" autocomplete="off" value="' + esc(d.name) + '"></div>' +
      (cur.fixed ? '' : roleBlock(d)) +
      '<div class="fld"><span class="lab">Cor</span><div class="swb-row" role="group" aria-label="Cor da coluna">' + swatches(d.color) + '</div></div>' +
      '<div class="fld"><span class="lab">Marcador</span><div class="seg" role="group" aria-label="Marcador do topo"><button type="button" data-mk="dot" aria-pressed="' + (d.mk === 'dot') + '">Bolinha</button><button type="button" data-mk="icon" aria-pressed="' + (d.mk === 'icon') + '">Ícone</button></div></div>' +
      '<div class="icgrid' + (d.mk === 'icon' ? '' : ' off') + '" id="colIcons" role="group" aria-label="Ícone da coluna">' +
      COL_ICONS.map(function (n) { return '<button type="button" class="icb" data-cic="' + n + '" aria-pressed="' + (n === d.icon && d.mk === 'icon') + '" aria-label="' + COL_ICON_LABEL[n] + '" title="' + COL_ICON_LABEL[n] + '">' + icon(n) + '</button>'; }).join('') + '</div>' +
      '<label class="sw-toggle"><input id="colFill" type="checkbox" role="switch"' + (d.fill ? ' checked' : '') + '><span class="trk"></span><span>Preencher o topo com a cor</span></label>' +
      '<div class="prow"><button class="btn primary sm" type="submit">Salvar</button><button class="btn sm" type="button" data-pcancel>Cancelar</button><button class="link" type="button" data-colreset style="color:var(--muted)">Restaurar padrão</button></div></form>';
  }
  function updColPrev() {
    var el = popEl.querySelector('#colPrev');
    if (!el || !popState || !popState.draft) return;
    var d = popState.draft, c = colById(popState.role);
    el.innerHTML = '<div class="col-h' + (d.fill ? ' filled' : '') + '" style="--cc:var(--sw-' + d.color + ')"><span class="mk">' + (d.mk === 'icon' ? icon(d.icon) : '<span class="dot"></span>') + '</span><h2>' + esc(d.name.trim() || c.name) + '</h2><span class="count">3</span></div>';
    var grid = popEl.querySelector('#colIcons');
    if (grid) grid.classList.toggle('off', d.mk !== 'icon');
  }
  function commitCol() {
    var d = popState.draft, c = colById(popState.role), msg = 'Coluna atualizada';
    c.name = d.name.trim() || c.def.name;
    c.color = d.color; c.mk = d.mk; c.icon = d.icon; c.fill = d.fill;
    if (c.role !== d.role) {
      c.role = d.role;
      if (d.role === 'doing' || d.role === 'review') cols.forEach(function (o) { if (o !== c && o.role === d.role) { o.role = 'none'; paintColHeader(o); } });
      if (d.role === 'doing') msg = 'O play agora leva os cartões para "' + c.name + '"';
      else if (d.role === 'review') msg = 'As entregas agora vão para "' + c.name + '"';
      else if (d.role === 'done') msg = 'As aprovações agora vão para "' + c.name + '"';
    }
    paintColHeader(c);
    saveLayout();
    if (detailId) renderDetail();
    refreshAllCards();
    closePop(true);
    toast(msg);
  }
  function colDelPopHTML(c) {
    var others = cols.filter(function (x) { return x.id !== c.id; }), n = c.tasks.length;
    if (!n) return '<h4>Excluir coluna</h4><p class="hint" style="margin:0 0 12px">Excluir a coluna "' + esc(c.name) + '"? Ela não tem tarefas.</p><div class="prow"><button class="btn danger sm sure" type="button" data-coldel="">Excluir</button><button class="btn sm" type="button" data-pcancel>Cancelar</button></div>';
    return '<h4>Excluir coluna</h4><p class="hint" style="margin:0 0 8px">"' + esc(c.name) + '" tem ' + n + (n === 1 ? ' tarefa' : ' tarefas') + '. Para onde elas devem ir?</p><ul class="opts">' +
      others.map(function (o) { return '<li class="opt"><button type="button" class="opt-b" data-coldel="' + esc(o.id) + '" style="--fc:var(--sw-' + o.color + ')"><span class="sw"></span>' + esc(o.name) + '</button></li>'; }).join('') +
      '</ul><button class="btn sm" type="button" data-pcancel>Cancelar</button>';
  }
  function boardPopHTML() {
    var d = popState.draft;
    if (popState.confirm) return '<h4>Excluir quadro</h4><p class="hint" style="margin:0 0 12px">Excluir "' + esc(cur.name) + '" com ' + countTasks(cur) + ' tarefa(s) e todas as colunas? Não dá para desfazer.</p><div class="prow"><button class="btn danger sm sure" type="button" data-bdelok>Excluir de vez</button><button class="btn sm" type="button" data-bkeep>Manter quadro</button></div>';
    return '<h4>Configurar quadro</h4><form class="colf" data-form="board">' +
      '<div class="fld"><label for="bdName">Nome</label><input id="bdName" type="text" maxlength="40" autocomplete="off" value="' + esc(d.name) + '"></div>' +
      '<div class="fld"><label for="bdDesc">Descrição</label><input id="bdDesc" type="text" maxlength="140" autocomplete="off" value="' + esc(d.desc) + '" placeholder="Para que serve este quadro"></div>' +
      '<div class="fld"><span class="lab">Cor</span><div class="swb-row" role="group" aria-label="Cor do quadro">' + swatchesAttr(d.color, 'data-bsw') + '</div></div>' +
      '<div class="fld"><span class="lab">Ícone</span><div class="icgrid" role="group" aria-label="Ícone do quadro">' + BOARD_ICONS.map(function (n) { return '<button type="button" class="icb" data-bic="' + n + '" aria-pressed="' + (n === d.icon) + '" aria-label="Ícone ' + n + '">' + icon(n) + '</button>'; }).join('') + '</div></div>' +
      '<div class="prow"><button class="btn primary sm" type="submit">Salvar</button><button class="btn sm" type="button" data-pcancel>Cancelar</button>' +
      (!cur.fixed && boards.length > 1 ? '<button class="link" type="button" data-bdel>Excluir quadro</button>' : '') + '</div></form>';
  }
  function commitBoard() {
    var d = popState.draft;
    cur.name = d.name.trim() || cur.name; cur.desc = d.desc.trim(); cur.color = d.color; cur.icon = d.icon;
    renderTabs(); paintBoardHead(); saveLayout();
    closePop(true);
    toast('Quadro atualizado');
  }
  function deleteBoard() {
    if (boards.length < 2 || cur.fixed) return;
    if (countTasks(cur)) { toast('Mova ou exclua as tarefas antes de excluir o quadro'); return; }
    syncDeletes.boards.push(cur.id);
    var i = boards.indexOf(cur), name = cur.name;
    boards.splice(i, 1);
    closePop();
    selectBoard(boards[Math.max(0, i - 1)].id, true);
    toast('Quadro "' + name + '" excluído');
  }
  function readDue() {
    var st = popState;
    if (!st || !st.sel) return null;
    return new Date(st.sel.getFullYear(), st.sel.getMonth(), st.sel.getDate(), 23, 59, 0, 0);
  }
  function updatePrev() {
    var el = popEl.querySelector('#duePrev'), d = readDue();
    if (!el) return;
    if (!d) { el.textContent = 'Escolha uma data.'; return; }
    var n = dayDiff(d);
    if (n < 0) { el.innerHTML = '<span class="late">Essa data já passou: ' + (-n) + (n === -1 ? ' dia' : ' dias') + ' de atraso.</span>'; return; }
    el.innerHTML = n === 0 ? 'Vence <b>hoje</b>.' : n === 1 ? 'Vence <b>amanhã</b>.' : 'Vence em <b>' + n + ' dias</b>.';
  }
  var POP_LABEL = { savef: 'Salvar filtro', stage: 'Etapa da tarefa', profile: 'Meu perfil', notif: 'Notificações', board: 'Configurar quadro', coldel: 'Excluir coluna', viewer: 'Visualizando como', col: 'Personalizar coluna', flag: 'Prioridade', cat: 'Tipo de conteúdo', due: 'Prazo de entrega', bdue: 'Prazo de entrega', ncol: 'Coluna de destino', cdays: 'Dias de postagem', cardopts: 'Mostrar no cartão', who: 'Atribuir pessoa', 'f-cat': 'Filtrar por categoria', 'f-who': 'Filtrar por pessoa' };
  function buildPop() {
    var ty = popState.type, t = popTask();
    if (['flag', 'cat', 'due', 'who', 'stage'].indexOf(ty) > -1 && !t) { closePop(); return; }
    var keep = popEl.scrollTop;
    popEl.innerHTML = ty === 'correction' ? syncCorrectionHTML() : ty === 'flag' ? flagPopHTML(t) : ty === 'cat' ? catPopHTML(t) : ty === 'due' ? duePopHTML(t) : ty === 'bdue' ? duePopHTML({ dueAt: popState.cur }) : ty === 'ncol' ? nColPopHTML() : ty === 'cdays' ? cdaysPopHTML() : ty === 'cardopts' ? cardOptsHTML() : ty === 'who' ? whoPopHTML(t, popState.role) : ty === 'f-cat' ? fCatPopHTML() : ty === 'col' ? colPopHTML(colById(popState.role)) : ty === 'viewer' ? viewerPopHTML() : ty === 'board' ? boardPopHTML() : ty === 'coldel' ? colDelPopHTML(colById(popState.role)) : ty === 'savef' ? savefPopHTML() : ty === 'stage' ? stagePopHTML(t) : ty === 'profile' ? profPopHTML() : ty === 'notif' ? notifPopHTML() : fWhoPopHTML();
    popEl.setAttribute('aria-label', POP_LABEL[ty]);
    popEl.classList.toggle('wide', ty === 'cardopts' || ty === 'col' || ty === 'due' || ty === 'bdue' || ty === 'board' || ty === 'profile' || ty === 'notif');
    popEl.scrollTop = keep;
    if (ty === 'due' || ty === 'bdue') { renderCal(); updatePrev(); }
    if (ty === 'col') updColPrev();
  }
  function placePop() {
    var r = popState.anchor.getBoundingClientRect();
    popEl.style.visibility = 'hidden';
    popEl.hidden = false;
    var w = popEl.offsetWidth, h = popEl.offsetHeight;
    var left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left)), top = r.bottom + 8;
    if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 8);
    popEl.style.left = left + 'px';
    popEl.style.top = top + 'px';
    popEl.style.visibility = '';
  }
  function openPop(type, anchor, role) {
    if (popState && popState.anchor === anchor) { closePop(); return; }
    closePop();
    popState = { type: type, anchor: anchor, role: role, sw: 'blue', ic: 'star' };
    if (type === 'bdue') popState.cur = anchor.dataset.due ? new Date(anchor.dataset.due) : null;
    if (type === 'due' || type === 'bdue') {
      var b0 = (type === 'bdue' ? popState.cur : (popTask() || {}).dueAt) || day(1, 18, 0);
      popState.sel = startOfDay(b0); popState.cf = popState.sel; popState.view = { y: b0.getFullYear(), m: b0.getMonth() };
      popState.hh = b0.getHours(); popState.mm = b0.getMinutes(); popState.cmode = 'days'; popState.yb = b0.getFullYear() - 5;
    }
    if (type === 'col') { var cc = colById(role); popState.draft = { name: cc.name, color: cc.color, mk: cc.mk, icon: cc.icon, fill: cc.fill, role: cc.role }; }
    if (type === 'savef') popState.draft = { name: filterParts().join(' · ').slice(0, 32) || 'Meu filtro', def: true };
    if (type === 'profile') popState.draft = { user: PROFILES[viewer].user, email: PROFILES[viewer].email };
    if (type === 'board') popState.draft = { name: cur.name, desc: cur.desc || '', color: cur.color, icon: cur.icon };
    anchor.setAttribute('aria-expanded', 'true');
    buildPop();
    if (!popState) return;
    placePop();
    var f = popEl.querySelector(type === 'due' || type === 'bdue' ? '.cd[tabindex="0"]' : 'input, button:not([disabled])');
    if (type === 'flag' || type === 'cat' || type === 'f-cat' || type === 'f-who' || type === 'ncol') f = popEl.querySelector('.opt-b.on') || f;
    if (f) f.focus();
  }
  function closePop(restore) {
    if (!popState) return;
    if (popState.type === 'correction') syncCorrectionRequest = null;
    var a = popState.anchor;
    a.setAttribute('aria-expanded', 'false');
    popEl.hidden = true;
    popState = null;
    if (restore && a.isConnected) a.focus();
  }
  function afterEdit(t) {
    var ty = popState ? popState.type : '', role = popState ? popState.role : '';
    closePop();
    refreshCard(t.id);
    renderDetail();
    renderToolbar();
    var again = $('infocol').querySelector('[data-pop="' + ty + '"]' + (role ? '[data-role="' + role + '"]' : ''));
    if (again) again.focus();
  }
  function setDue(t, d) {
    var had = !!t.dueAt;
    t.dueAt = d;
    sysLog(t, d ? (had ? 'alterou o prazo para ' : 'definiu o prazo para ') + fDay(d) : 'removeu o prazo', viewer);
    afterEdit(t);
    toast(d ? 'Prazo salvo: ' + fDay(d) : 'Prazo removido');
  }
  function assign(t, role, name) {
    var prev = t[role], label = ROLES[role].label.toLowerCase();
    t[role] = name || '';
    sysLog(t, name ? 'atribuiu ' + name + ' como ' + label : 'removeu ' + prev + ' como ' + label, viewer);
    afterEdit(t);
    toast(name ? name + ' agora é ' + ROLE_NOUN[role] : 'Atribuição removida');
  }

  popEl.addEventListener('click', function (e) {
    var b;
    if (!popState) return;
    if (popState.type === 'cardopts') {
      if (e.target.closest('[data-cardall]')) { cardBulk(function () { Object.keys(CARD).forEach(function (k) { CARD[k] = true; }); }); buildPop(); placePop(); }
      else if (e.target.closest('[data-cardreset]')) { cardBulk(function () { Object.keys(CARD_DEFAULT).forEach(function (k) { CARD[k] = CARD_DEFAULT[k]; }); }); buildPop(); placePop(); }
      return;
    }
    if (popState.type === 'cdays') {
      var cn = popState.role;
      if ((b = e.target.closest('[data-wd]'))) {
        var w = +b.dataset.wd, cur2 = daysOf(cn).slice(), ix = cur2.indexOf(w);
        if (ix > -1) { if (cur2.length > 1) cur2.splice(ix, 1); else toast('Deixe pelo menos um dia de postagem'); } else cur2.push(w);
        CLIENT_DAYS[cn] = cur2.sort(function (x, y) { return x - y; }); saveDays(); buildPop(); placePop(); renderPubCal();
      } else if (e.target.closest('[data-wdreset]')) { delete CLIENT_DAYS[cn]; saveDays(); buildPop(); placePop(); renderPubCal(); }
      else if (e.target.closest('[data-pcancel]')) closePop(true);
      return;
    }
    if ((b = e.target.closest('[data-ncol]'))) { nColId = b.dataset.ncol; nPaintCol(); closePop(true); return; }
    if ((b = e.target.closest('[data-viewer]'))) { var nv = b.dataset.viewer; closePop(true); setViewer(nv); return; }
    if (popState.type === 'savef') { if (e.target.closest('[data-pcancel]')) closePop(true); return; }
    if (popState.type === 'notif') {
      if ((b = e.target.closest('[data-nid]'))) gotoNotif(b.dataset.nid);
      else if (e.target.closest('[data-nall]')) { NOTIFS.forEach(function (n) { if (n.to === viewer) n.read = true; }); paintBell(); buildPop(); placePop(); }
      else if (e.target.closest('[data-nsim]')) simulate();
      return;
    }
    if (popState.type === 'profile') {
      if ((b = e.target.closest('[data-fam]')) || (b = e.target.closest('[data-mode]'))) {
        if (b.dataset.fam) themeFam = b.dataset.fam; else themeMode = b.dataset.mode;
        applyTheme();
        buildPop(); placePop();
        toast('Tema: ' + themeLabel());
        return;
      }
      if ((b = e.target.closest('[data-ph]'))) {
        if (b.dataset.ph === 'pick') popEl.querySelector('#phFile').click();
        else { if (syncBackend) { toast('A foto é gerenciada nas configurações da sua conta'); return; } PROFILES[viewer].photo = ''; saveProfiles(); afterProfile(); toast('Foto removida'); }
      } else if (e.target.closest('[data-pcancel]')) closePop(true);
      return;
    }
    if (popState.type === 'coldel') {
      if ((b = e.target.closest('[data-coldel]'))) { var cid = popState.role, tid = b.dataset.coldel; closePop(); deleteColumn(cid, tid); }
      else if (e.target.closest('[data-pcancel]')) closePop(true);
      return;
    }
    if (popState.type === 'board') {
      var bd = popState.draft;
      if ((b = e.target.closest('[data-bsw]'))) {
        bd.color = b.dataset.bsw;
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-bsw]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      } else if ((b = e.target.closest('[data-bic]'))) {
        bd.icon = b.dataset.bic;
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-bic]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      } else if (e.target.closest('[data-bdel]')) { popState.confirm = true; buildPop(); placePop(); }
      else if (e.target.closest('[data-bkeep]')) { popState.confirm = false; buildPop(); placePop(); }
      else if (e.target.closest('[data-bdelok]')) deleteBoard();
      else if (e.target.closest('[data-pcancel]')) closePop(true);
      return;
    }
    if (popState.type === 'col') {
      var dr = popState.draft;
      if ((b = e.target.closest('[data-sw]'))) {
        dr.color = b.dataset.sw;
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-sw]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      } else if ((b = e.target.closest('[data-mk]'))) {
        dr.mk = b.dataset.mk;
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-mk]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-cic]'), function (x) { x.setAttribute('aria-pressed', dr.mk === 'icon' && x.dataset.cic === dr.icon ? 'true' : 'false'); });
      } else if ((b = e.target.closest('[data-cic]'))) {
        dr.icon = b.dataset.cic; dr.mk = 'icon';
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-cic]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-mk]'), function (x) { x.setAttribute('aria-pressed', x.dataset.mk === 'icon' ? 'true' : 'false'); });
      } else if ((b = e.target.closest('[data-crole]'))) {
        dr.role = b.dataset.crole;
        Array.prototype.forEach.call(popEl.querySelectorAll('[data-crole]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var rh = popEl.querySelector('#roleHelp'); if (rh) rh.textContent = ROLE_INFO[dr.role].help;
      } else if (e.target.closest('[data-colreset]')) {
        var cr = colById(popState.role);
        popState.draft = { name: cr.def.name, color: cr.def.color, mk: 'dot', icon: cr.def.icon, fill: false, role: cr.def.role };
        buildPop();
        return;
      } else if (e.target.closest('[data-pcancel]')) { closePop(true); return; }
      updColPrev();
      return;
    }
    if ((b = e.target.closest('[data-fcat]'))) { toggleIn(F.cats, b.dataset.fcat); applyFilters(); buildPop(); placePop(); return; }
    if (e.target.closest('[data-fcatclear]')) { F.cats = []; applyFilters(); buildPop(); placePop(); return; }
    if ((b = e.target.closest('[data-fwho]'))) { F.who = b.dataset.fwho; applyFilters(); closePop(true); return; }
    var t = popTask();
    if (!t && popState.type !== 'bdue') return;
    if ((b = e.target.closest('[data-stage]'))) { changeStage(t, b.dataset.stage); return; }
    if ((b = e.target.closest('[data-pick]'))) {
      var v = b.dataset.pick;
      if (popState.type === 'flag') { t.priority = v; sysLog(t, 'alterou a prioridade para ' + flagOf(v).label, viewer); }
      else { t.category = v || null; t.categoryIcon = catOf(v) ? catOf(v).icon : 'star'; sysLog(t, v ? 'alterou a categoria para ' + v : 'removeu a categoria', viewer); }
      afterEdit(t);
      toast('Alteração salva');
      return;
    }
    if ((b = e.target.closest('[data-who]'))) { if (!b.disabled) assign(t, popState.role, b.dataset.who); return; }
    if ((b = e.target.closest('[data-delflag]'))) {
      if (b.getAttribute('aria-disabled') === 'true') { say('Essa flag está em uso por alguma tarefa.'); return; }
      FLAGS = FLAGS.filter(function (f) { return f.id !== b.dataset.delflag; });
      buildPop(); placePop(); renderToolbar(); toast('Flag excluída');
      return;
    }
    if ((b = e.target.closest('[data-delcat]'))) {
      if (b.getAttribute('aria-disabled') === 'true') { say('Esse tipo está em uso por alguma tarefa.'); return; }
      CATS = CATS.filter(function (c) { return c.id !== b.dataset.delcat; });
      buildPop(); placePop(); toast('Tipo excluído');
      return;
    }
    if ((b = e.target.closest('[data-sw]'))) {
      popState.sw = b.dataset.sw;
      Array.prototype.forEach.call(popEl.querySelectorAll('[data-sw]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      return;
    }
    if ((b = e.target.closest('[data-ic]'))) {
      popState.ic = b.dataset.ic;
      Array.prototype.forEach.call(popEl.querySelectorAll('[data-ic]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      return;
    }
    if ((b = e.target.closest('[data-q]'))) { pickDay(day(+b.dataset.q, 0, 0), false); return; }
    if ((b = e.target.closest('[data-day]'))) { var pp = b.dataset.day.split('-'); pickDay(new Date(+pp[0], +pp[1] - 1, +pp[2]), true); return; }
    if ((b = e.target.closest('[data-cmode]'))) {
      var want = b.dataset.cmode, cs = popState;
      cs.cmode = cs.cmode === want ? 'days' : want;
      if (cs.cmode === 'years') cs.yb = cs.view.y - 5;
      renderCal(false);
      return;
    }
    if ((b = e.target.closest('[data-month]'))) { setView(popState.view.y, +b.dataset.month); popState.cmode = 'days'; renderCal(false); return; }
    if ((b = e.target.closest('[data-year]'))) { setView(+b.dataset.year, popState.view.m); popState.cmode = 'months'; renderCal(false); return; }
    if ((b = e.target.closest('[data-cnav]'))) {
      var dir = +b.dataset.cnav, cn = popState;
      if (cn.cmode === 'days') { var nd0 = addMonths(cn.cf, dir); cn.cf = nd0; cn.view = { y: nd0.getFullYear(), m: nd0.getMonth() }; }
      else if (cn.cmode === 'months') setView(cn.view.y + dir, cn.view.m);
      else cn.yb += dir * 12;
      renderCal(false);
      return;
    }
    if ((b = e.target.closest('[data-tq]'))) { var tq = b.dataset.tq.split(':'); setTime(+tq[0], +tq[1]); return; }
    if (e.target.closest('[data-pcancel]')) { closePop(true); return; }
    if (e.target.closest('[data-rmdue]')) { if (popState.type === 'bdue') commitBulkDue(null); else setDue(t, null); }
  });
  /* prazo das linhas da criação em lista: usa o mesmo calendário do prazo da tarefa */
  function commitBulkDue(d) {
    var btn = popState.anchor;
    closePop(true);
    nPaintDue(btn, d ? d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + 'T' + p2(d.getHours()) + ':' + p2(d.getMinutes()) : '');
  }
  popEl.addEventListener('input', function (e) {
    if (popState && (popState.type === 'due' || popState.type === 'bdue') && (e.target.id === 'dueH' || e.target.id === 'dueM')) {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
      var v = parseInt(e.target.value, 10);
      if (!isNaN(v)) { if (e.target.id === 'dueH') popState.hh = Math.min(23, v); else popState.mm = Math.min(59, v); updatePrev(); }
    }
    if (popState && popState.type === 'col' && e.target.id === 'colName') { popState.draft.name = e.target.value; updColPrev(); }
    if (popState && popState.type === 'savef' && e.target.id === 'spName') popState.draft.name = e.target.value;
    if (popState && popState.type === 'profile') { if (e.target.id === 'pfUser') popState.draft.user = e.target.value; if (e.target.id === 'pfMail') popState.draft.email = e.target.value; }
    if (popState && popState.type === 'board') { if (e.target.id === 'bdName') popState.draft.name = e.target.value; if (e.target.id === 'bdDesc') popState.draft.desc = e.target.value; }
  });
  popEl.addEventListener('focusout', function (e) {
    if (popState && (popState.type === 'due' || popState.type === 'bdue') && (e.target.id === 'dueH' || e.target.id === 'dueM')) { e.target.value = p2(e.target.id === 'dueH' ? popState.hh : popState.mm); }
  });
  popEl.addEventListener('keydown', function (e) {
    if (!popState || (popState.type !== 'due' && popState.type !== 'bdue')) return;
    var st = popState;
    if (e.target.classList && e.target.classList.contains('tin')) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        var dir = e.key === 'ArrowUp' ? 1 : -1;
        if (e.target.id === 'dueH') setTime((st.hh + dir + 24) % 24, st.mm); else setTime(st.hh, (st.mm + dir * 5 + 60) % 60);
      }
      return;
    }
    if (!e.target.closest || !e.target.closest('.cal-g')) return;
    var d = st.cf, nd = null;
    if (e.key === 'ArrowLeft') nd = addDays(d, -1);
    else if (e.key === 'ArrowRight') nd = addDays(d, 1);
    else if (e.key === 'ArrowUp') nd = addDays(d, -7);
    else if (e.key === 'ArrowDown') nd = addDays(d, 7);
    else if (e.key === 'PageUp') nd = addMonths(d, -1);
    else if (e.key === 'PageDown') nd = addMonths(d, 1);
    else if (e.key === 'Home') nd = addDays(d, -d.getDay());
    else if (e.key === 'End') nd = addDays(d, 6 - d.getDay());
    if (nd) { e.preventDefault(); st.cf = nd; st.view = { y: nd.getFullYear(), m: nd.getMonth() }; renderCal(true); }
  });
  popEl.addEventListener('change', function (e) {
    if (e.target.dataset && e.target.dataset.cardopt) { cardChange(e.target.dataset.cardopt, e.target.checked); return; }
    if (e.target.id === 'phFile') { setPhoto(e.target.files && e.target.files[0]); e.target.value = ''; return; }
    if (popState && popState.type === 'savef' && e.target.id === 'spDef') { popState.draft.def = e.target.checked; return; }
    if (popState && popState.type === 'col' && e.target.id === 'colFill') { popState.draft.fill = e.target.checked; updColPrev(); }
  });
  popEl.addEventListener('submit', function (e) {
    e.preventDefault();
    if (popState && popState.type === 'correction') { syncSubmitCorrection(); return; }
    if (popState && popState.type === 'col') { commitCol(); return; }
    if (popState && popState.type === 'board') { commitBoard(); return; }
    if (popState && popState.type === 'profile') { commitProfile(); return; }
    if (popState && popState.type === 'savef') { commitPreset(); return; }
    if (popState && popState.type === 'bdue') { var bd2 = readDue(); if (bd2) commitBulkDue(bd2); return; }
    var t = popTask();
    if (!t || !popState) return;
    var f = e.target.dataset.form;
    if (f === 'due') {
      var d = readDue();
      if (!d) return;
      setDue(t, d);
    } else if (f === 'newflag') {
      if (syncBackend) { toast('O sistema usa as prioridades Urgente, Alta, Normal e Baixa'); return; }
      var nm = popEl.querySelector('#flagName').value.trim();
      if (!nm) { popEl.querySelector('#flagName').focus(); return; }
      var ex = FLAGS.filter(function (x) { return x.label.toLowerCase() === nm.toLowerCase(); })[0];
      if (!ex) { ex = { id: 'f' + (nextId++), label: nm, color: popState.sw, rank: 2.5 }; FLAGS.push(ex); }
      t.priority = ex.id;
      sysLog(t, 'alterou a prioridade para ' + ex.label, viewer);
      afterEdit(t);
      toast('Flag ' + ex.label + ' criada e aplicada');
    } else if (f === 'newcat') {
      var cn = popEl.querySelector('#catName').value.trim();
      if (!cn) { popEl.querySelector('#catName').focus(); return; }
      var ec = CATS.filter(function (x) { return x.label.toLowerCase() === cn.toLowerCase(); })[0];
      if (!ec) { ec = { id: cn, label: cn, icon: popState.ic, group: 'other' }; CATS.push(ec); }
      t.category = ec.id; t.categoryIcon = ec.icon;
      sysLog(t, 'alterou a categoria para ' + ec.label, viewer);
      afterEdit(t);
      toast('Tipo ' + ec.label + ' criado e aplicado');
    }
  });
  document.addEventListener('pointerdown', function (e) {
    if (popState && !popEl.contains(e.target) && !popState.anchor.contains(e.target)) closePop();
  });
  window.addEventListener('resize', function () { closePop(); });
  infoEl.addEventListener('scroll', function () { closePop(); }, { passive: true });

  /* ------------------------------------------------------------ novo quadro (modelos) */
  var bovEl = $('bov'), bdlgEl = $('bdlg'), tplSel = 'blank', nameDirty = false, bLast = null;
  function bovOpen() { return !bovEl.hidden; }
  function renderTemplates() {
    $('tgrid').innerHTML = TEMPLATES.map(function (t) {
      var on = t.id === tplSel;
      return '<button type="button" class="tcard' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-tpl="' + t.id + '" style="--bc:var(--sw-' + t.color + ')">' +
        '<span class="tic">' + icon(t.icon) + '</span><span class="tn2">' + esc(t.name) + '</span><span class="td">' + esc(t.desc) + '</span>' +
        '<span class="tf">' + t.cols.map(function (c) { return '<span class="tfc"><i style="background:var(--sw-' + c[1] + ')"></i>' + esc(c[0]) + '</span>'; }).join('') + '</span></button>';
    }).join('');
  }
  function openBoardModal() {
    closePop(); closeMenu();
    tplSel = 'blank'; nameDirty = false;
    bLast = document.activeElement;
    $('bName').value = 'Novo quadro';
    renderTemplates();
    bovEl.hidden = false;
    document.body.classList.add('locked');
    var on = $('tgrid').querySelector('.tcard.on');
    if (on) on.focus();
  }
  function closeBoardModal() {
    bovEl.hidden = true;
    if (!detailId) document.body.classList.remove('locked');
    if (bLast && bLast.focus) bLast.focus({ preventScroll: true });
  }
  $('bClose').innerHTML = icon('x');
  $('bClose').firstChild.style.cssText = 'width:16px;height:16px';
  $('newBoardBtn').innerHTML = icon('plus') + '<span>Novo quadro</span>';
  $('boardMenuBtn').innerHTML = icon('more');
  $('newBoardBtn').addEventListener('click', openBoardModal);
  $('tabAdd').innerHTML = icon('plus');
  $('tabAdd').addEventListener('click', function () {
    var n = boards.filter(function (b) { return /^Novo Kanban/.test(b.name); }).length;
    var name = 'Novo Kanban' + (n ? ' ' + (n + 1) : '');
    var b = boardFromTemplate(tplById('blank'), uid('b'), name, [], true);
    b.desc = 'Monte o seu fluxo: crie colunas, defina a função de cada uma e reordene como quiser.';
    b.icon = 'layout'; b.color = 'teal';
    boards.push(b);
    selectBoard(b.id, true);
    toast('Kanban criado. Dê um nome e crie as colunas do seu fluxo');
    openPop('board', $('boardMenuBtn'));
  });
  $('boardMenuBtn').addEventListener('click', function () { openPop('board', $('boardMenuBtn')); });
  $('bClose').addEventListener('click', closeBoardModal);
  $('bCancel').addEventListener('click', closeBoardModal);
  bovEl.addEventListener('pointerdown', function (e) { if (e.target === bovEl) closeBoardModal(); });
  $('tgrid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tpl]');
    if (!b) return;
    tplSel = b.dataset.tpl;
    if (!nameDirty) $('bName').value = tplById(tplSel).name === 'Em branco' ? 'Novo quadro' : tplById(tplSel).name;
    renderTemplates();
    var again = $('tgrid').querySelector('.tcard.on');
    if (again) again.focus();
  });
  $('bName').addEventListener('input', function () { nameDirty = true; });
  $('bform').addEventListener('submit', function (e) {
    e.preventDefault();
    var tpl = tplById(tplSel), name = $('bName').value.trim();
    if (!name) { $('bName').focus(); return; }
    var b = boardFromTemplate(tpl, uid('b'), name, [], true);
    boards.push(b);
    closeBoardModal();
    selectBoard(b.id, true);
    toast(tpl.id === 'blank' ? 'Quadro "' + name + '" criado. Use "Nova coluna" para montar o fluxo' : 'Quadro "' + name + '" criado');
    say('Quadro ' + name + ' criado.');
  });
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-board]');
    if (b && b.dataset.board !== cur.id) selectBoard(b.dataset.board);
  });
  $('tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var i = boards.indexOf(cur), j = (i + (e.key === 'ArrowRight' ? 1 : -1) + boards.length) % boards.length;
    e.preventDefault();
    selectBoard(boards[j].id);
    var f = $('tabs').querySelector('[aria-selected="true"]');
    if (f) f.focus();
  });

  /* ------------------------------------------------------------ barra de filtros: eventos */
  $('toolbar').addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-fdue]'))) { F.due = F.due === b.dataset.fdue ? '' : b.dataset.fdue; applyFilters(); return; }
    if ((b = e.target.closest('[data-fflag]'))) { toggleIn(F.flags, b.dataset.fflag); applyFilters(); return; }
    if ((b = e.target.closest('[data-pop]'))) { openPop(b.dataset.pop, b); return; }
    if ((b = e.target.closest('[data-preset]'))) {
      var pr = presetsOf().filter(function (p) { return p.id === b.dataset.preset; })[0];
      if (!pr) return;
      if (matchesPreset(pr) && filtersActive()) { F = { q: '', due: '', flags: [], cats: [], who: '' }; $('q').value = ''; applyFilters(); say('Filtro limpo.'); }
      else { applyPreset(pr); say('Filtro ' + pr.name + ' aplicado.'); }
      return;
    }
    if ((b = e.target.closest('[data-pdef]'))) {
      var pd = presetsOf().filter(function (p) { return p.id === b.dataset.pdef; })[0];
      if (!pd) return;
      var was = pd.def;
      presetsOf().forEach(function (p) { p.def = false; });
      pd.def = !was;
      persistPresets(); renderToolbar();
      toast(pd.def ? '"' + pd.name + '" abre sempre ao entrar' : 'Não abre mais sozinho ao entrar');
      return;
    }
    if ((b = e.target.closest('[data-pdel]'))) {
      var li = presetsOf(), pi = li.findIndex(function (p) { return p.id === b.dataset.pdel; });
      if (pi < 0) return;
      var gone = li.splice(pi, 1)[0];
      persistPresets(); renderToolbar();
      toast('Filtro "' + gone.name + '" excluído');
      return;
    }
    if (e.target.closest('#fClear')) { F = { q: '', due: '', flags: [], cats: [], who: '' }; $('q').value = ''; closePop(); applyFilters(); say('Filtros limpos.'); return; }
    if (e.target.closest('#qClear')) { F.q = ''; $('q').value = ''; applyFilters(); $('q').focus(); }
  });
  $('q').addEventListener('input', function () { F.q = this.value; applyFilters(); });
  var fOpen = false;
  $('fToggle').innerHTML = icon('filter') + '<span>Filtros</span><span class="fbn" id="fbn" hidden></span>';
  $('fToggle').addEventListener('click', function () {
    fOpen = !fOpen;
    $('toolbar').hidden = !fOpen || mainView !== 'board';
    this.setAttribute('aria-expanded', String(fOpen));
    if (!fOpen) closePop();
  });
  $('cardOptsBtn').innerHTML = icon('sliders');
  $('cardOptsBtn').setAttribute('title', 'Escolher o que aparece em cada cartão');
  $('cardOptsBtn').setAttribute('aria-label', 'Cartões: escolher o que aparece em cada cartão');
  $('cardOptsBtn').addEventListener('click', function () { openPop('cardopts', $('cardOptsBtn')); });
  $('qClear').addEventListener('click', function () { F.q = ''; $('q').value = ''; applyFilters(); $('q').focus(); });

  /* ------------------------------------------------------------ notificações e pop-ups */
  var NOTIFS = [], notifN = 1;
  var KIND_ICON = { mention: 'at', msg: 'chat', assign: 'users', due: 'clock', play: 'play', deliver: 'pkg', approve: 'check', fix: 'undo', move: 'send', flag: 'flag', gen: 'bell' };
  function kindOf(text) {
    if (/atribuiu/.test(text)) return 'assign';
    if (/entregou|marcou a tarefa como entregue/.test(text)) return 'deliver';
    if (/aprovou/.test(text)) return 'approve';
    if (/correção/.test(text)) return 'fix';
    if (/iniciou|retomou|pausou/.test(text)) return 'play';
    if (/prazo/.test(text)) return 'due';
    if (/moveu/.test(text)) return 'move';
    if (/prioridade|categoria/.test(text)) return 'flag';
    return 'gen';
  }
  function findTask(id) {
    for (var b = 0; b < boards.length; b++) for (var c = 0; c < boards[b].cols.length; c++) {
      var i = boards[b].cols[c].tasks.findIndex(function (t) { return t.id === id; });
      if (i > -1) return { board: boards[b], col: boards[b].cols[c], task: boards[b].cols[c].tasks[i] };
    }
    return null;
  }
  function relTime(d) {
    var m = Math.floor((Date.now() - d.getTime()) / 6e4);
    return m < 1 ? 'agora' : m < 60 ? 'há ' + m + ' min' : m < 1440 ? 'há ' + Math.floor(m / 60) + ' h' : fDate(d) + ', ' + fTime(d);
  }
  function pushNotif(to, t, kind, text, at) {
    if (syncBackend) return null;
    var f = findTask(t.id), n = { id: 'n' + (notifN++), to: to, taskId: t.id, boardId: f ? f.board.id : cur.id, num: t.num, title: t.title, kind: kind, text: text, at: at || new Date(), read: false };
    NOTIFS.unshift(n);
    return n;
  }
  function notify() { return null; }
  function unreadCount() { return NOTIFS.filter(function (n) { return n.to === viewer && !n.read; }).length; }
  function paintBell() {
    var u = unreadCount(), b = $('bellBtn');
    b.innerHTML = icon('bell') + (u ? '<span class="bdg">' + (u > 9 ? '9+' : u) + '</span>' : '');
    var bdg = b.querySelector('.bdg');
    if (bdg && appReady && u > (paintBell.last || 0)) popIn(bdg);
    paintBell.last = u;
    var lbl = u ? 'Notificações, ' + u + (u === 1 ? ' não lida' : ' não lidas') : 'Notificações';
    b.setAttribute('aria-label', lbl); b.title = lbl;
  }
  function showPopup(n) {
    var box = $('pops'), el = document.createElement('div');
    el.className = 'npop';
    el.innerHTML = '<span class="nic k-' + n.kind + '">' + icon(KIND_ICON[n.kind] || 'bell') + '</span><span class="ntx"><b>' + esc(fmtNum(n.num) + ' · ' + n.title) + '</b><span>' + esc(n.text) + '</span><time>agora</time></span><button class="nx" type="button" aria-label="Dispensar">' + icon('x') + '</button>';
    function dismiss() { if (!el.isConnected) return; el.classList.add('out'); setTimeout(function () { el.remove(); }, reduce ? 0 : 220); }
    el.addEventListener('click', function (e) { if (e.target.closest('.nx')) { dismiss(); return; } dismiss(); gotoNotif(n.id); });
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(dismiss, 7000);
  }
  function gotoNotif(id) {
    var n = NOTIFS.filter(function (x) { return x.id === id; })[0];
    if (!n) return;
    n.read = true; paintBell(); closePop();
    var f = findTask(n.taskId);
    if (!f) { toast('Essa tarefa não existe mais'); return; }
    if (f.board !== cur) selectBoard(f.board.id, true);
    openDetail(n.taskId);
  }
  function notifPopHTML() {
    var list = NOTIFS.filter(function (n) { return n.to === viewer; }).slice(0, 30), unread = list.filter(function (n) { return !n.read; }).length;
    var h = '<div class="nh"><h4 style="margin:0">Notificações</h4>' + (unread ? '<button class="plink" type="button" data-nall>Marcar todas como lidas</button>' : '') + '</div>';
    h += list.length ? '<div class="nlist">' + list.map(function (n) {
      return '<button type="button" class="nit' + (n.read ? '' : ' un') + '" data-nid="' + n.id + '"><span class="nic k-' + n.kind + '">' + icon(KIND_ICON[n.kind] || 'bell') + '</span><span class="ntx"><b>' + esc(fmtNum(n.num) + ' · ' + n.title) + '</b><span>' + esc(n.text) + '</span><time>' + relTime(n.at) + '</time></span></button>';
    }).join('') + '</div>' : '<p class="nempty">Nenhum aviso por enquanto. Quando alguém mexer numa tarefa sua, ele aparece aqui e num pop-up.</p>';
    return h + '<div class="nf"><span>Atualizações da equipe</span><button class="plink" type="button" data-nsim>Ver atividade</button></div>';
  }
  /* avisos de prazo gerados a partir das tarefas de cada pessoa */
  function seedNotifs() {
    PEOPLE.forEach(function (p) {
      var items = [];
      boards.forEach(function (b) { b.cols.forEach(function (c) { if (c.role === 'done') return; c.tasks.forEach(function (t) { if (t.dueAt && rolesOf(t, p).length) items.push(t); }); }); });
      items.sort(function (a, b) { return a.dueAt - b.dueAt; });
      items.filter(function (t) { return dayDiff(t.dueAt) <= 1; }).slice(0, 4).forEach(function (t, i) {
        var n = dayDiff(t.dueAt), txt = n < 0 ? 'O prazo venceu há ' + (-n) + (n === -1 ? ' dia' : ' dias') + '.' : n === 0 ? 'O prazo vence hoje.' : 'O prazo vence amanhã.';
        pushNotif(p, t, 'due', txt, ago(1 + i * 2.5));
      });
    });
  }
  var SIM_MSGS = ['Consegue me dar um retorno até o fim do dia?', 'Subi a versão nova. Dá uma olhada quando puder.', 'O cliente acabou de responder. Vamos ajustar o prazo?', 'Deixei um comentário no briefing. Pode conferir?'];
  function simulate() { closePop(); setMain('act'); }
  function firstPopup() {
    var n = NOTIFS.filter(function (x) { return x.to === viewer && !x.read; })[0];
    if (n) showPopup(n);
  }

  /* ------------------------------------------------------------ perfil */
  function profPopHTML() {
    var pr = PROFILES[viewer], d = popState.draft;
    return '<h4>Meu perfil</h4><div class="pfh"><span class="pfp">' + avatar(viewer) + '</span><div class="pfa"><button class="btn sm" type="button" data-ph="pick">' + icon('camera') + 'Alterar foto</button>' + (pr.photo ? '<button class="btn sm" type="button" data-ph="rm">Remover</button>' : '') + '<input id="phFile" type="file" accept="image/*" hidden></div></div>' +
      '<form class="colf" data-form="profile">' +
      '<div class="fld"><label for="pfName">Nome</label><input id="pfName" type="text" value="' + esc(viewer) + '" readonly><span class="fhint">Definido pelo administrador da equipe</span></div>' +
      '<div class="fld"><label for="pfUser">Nome de usuário</label><div class="atw"><span aria-hidden="true">@</span><input id="pfUser" type="text" maxlength="24" autocomplete="off" autocapitalize="none" spellcheck="false" value="' + esc(d.user) + '"></div></div>' +
      '<div class="fld"><label for="pfMail">E-mail associado à conta</label><input id="pfMail" type="text" inputmode="email" maxlength="80" autocomplete="off" spellcheck="false" value="' + esc(d.email) + '"></div>' +
      '<p class="perr" id="pfErr" role="alert" hidden></p>' +
      '<div class="prow"><button class="btn primary sm" type="submit">Salvar</button><button class="btn sm" type="button" data-pcancel>Cancelar</button></div></form>' +
      themesHTML() +
      '<div class="grp" style="margin-top:14px">Alternar usuário (demonstração)</div><ul class="opts" style="margin:0">' +
      PEOPLE.map(function (n) { return '<li class="opt"><button type="button" class="opt-b' + (n === viewer ? ' on' : '') + '" data-viewer="' + esc(n) + '">' + avatar(n) + '<span>' + esc(n) + '</span>' + (n === viewer ? icon('check', 'tick') : '') + '</button></li>'; }).join('') + '</ul>';
  }
  function afterProfile() {
    paintViewer(); refreshAllCards(); renderDetail();
    if (detailId) renderChat(false);
    if (popState && popState.type === 'profile') { buildPop(); placePop(); }
  }
  function setPhoto(file) {
    if (syncBackend) { toast('A foto é gerenciada nas configurações da sua conta'); return; }
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Escolha uma imagem JPG, PNG ou WebP'); return; }
    if (file.size > 8 * 1048576) { toast('A imagem passa de 8 MB'); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var sq = Math.min(img.width, img.height), c = document.createElement('canvas');
        c.width = c.height = 192;
        c.getContext('2d').drawImage(img, (img.width - sq) / 2, (img.height - sq) / 2, sq, sq, 0, 0, 192, 192);
        PROFILES[viewer].photo = c.toDataURL('image/jpeg', 0.85);
        saveProfiles(); afterProfile(); toast('Foto atualizada');
      };
      img.onerror = function () { toast('Não foi possível ler essa imagem'); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function commitProfile() {
    if (syncBackend) { toast('Os dados do perfil são gerenciados nas configurações da sua conta'); return; }
    if (syncBackend && popState.draft.email.trim() !== PROFILES[viewer].email) { toast('Altere o e-mail nas configurações da sua conta'); return; }
    var d = popState.draft, user = d.user.trim().toLowerCase().replace(/^@/, ''), mail = d.email.trim(), err = popEl.querySelector('#pfErr');
    function fail(msg, id) { err.textContent = msg; err.hidden = false; popEl.querySelector(id).focus(); }
    if (!/^[a-z0-9._-]{3,24}$/.test(user)) { fail('O nome de usuário precisa ter de 3 a 24 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.', '#pfUser'); return; }
    if (PEOPLE.some(function (n) { return n !== viewer && PROFILES[n].user === user; })) { fail('Esse nome de usuário já está em uso.', '#pfUser'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { fail('Digite um e-mail válido, como nome@empresa.com.br.', '#pfMail'); return; }
    PROFILES[viewer].user = user; PROFILES[viewer].email = mail;
    saveProfiles();
    closePop(true);
    toast('Preferências de perfil salvas neste navegador');
  }

  /* ------------------------------------------------------------ usuário */
  var viewerBtn = $('viewerBtn');
  function paintViewer() { viewerBtn.innerHTML = avatar(viewer); viewerBtn.setAttribute('aria-label', 'Meu perfil: ' + viewer); }
  function setViewer(name) {
    if (syncBackend) { toast('A identidade é a conta conectada ao sistemaVIVOX'); return; }
    viewer = name;
    paintViewer();
    paintBell();
    applyDefaultPreset();
    renderToolbar();
    refreshAllCards();
    if (F.who === 'mine') applyFilters();
    renderDetail();
    if (detailId) renderChat(false);
    say('Agora você está visualizando como ' + viewer + '.');
  }
  viewerBtn.addEventListener('click', function () { openPop('profile', viewerBtn); });
  $('bellBtn').innerHTML = icon('bell');
  $('bellBtn').addEventListener('click', function () { openPop('notif', $('bellBtn')); });
  viewerBtn.innerHTML = icon('users');

  /* ------------------------------------------------------------ relógio: cronômetro e prazos */
  var ticks = 0;
  setInterval(function () {
    ticks++;
    var timers = document.querySelectorAll('[data-timer]');
    for (var i = 0; i < timers.length; i++) {
      var l = locate(timers[i].dataset.timer);
      if (l) timers[i].textContent = fDur(elapsed(l.task));
    }
    if (syncBooted && ticks % 30 === 0) {
      allTasks().forEach(function (t) {
        var d = dueInfo(t);
        var els = document.querySelectorAll('[data-due="' + t.id + '"]');
        var ce = cardEls[t.id], sk = (statusFlag(t) || {}).id || '';
        if (ce && ce.isConnected) { var sh = ce.querySelector('.shell'); if (sh && sh.dataset.skey !== sk) { refreshCard(t.id); return; } }
        for (var j = 0; j < els.length; j++) {
          if (isDone(t)) continue;
          els[j].className = d.cls;
          els[j].innerHTML = dueHTML(t, !!els[j].closest('.shell'));
        }
      });
      if (detailId && !popState && !descEdit && !(document.activeElement && /^(stNew|refUrl|refTitle)$/.test(document.activeElement.id))) renderDetail();
    }
  }, 1000);

  /* ------------------------------------------------------------ bordas e barra */
  var fade = 24;
  function syncEdges() {
    var el = trackEl, atStart = el.scrollLeft < 8, atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    var mask = atStart && atEnd ? '' : 'linear-gradient(to right, transparent 0, #000 ' + (atStart ? 0 : fade) + 'px, #000 calc(100% - ' + (atEnd ? 0 : fade) + 'px), transparent 100%)';
    el.style.maskImage = mask; el.style.webkitMaskImage = mask;
    var ratio = el.clientWidth / el.scrollWidth, max = el.scrollWidth - el.clientWidth;
    railEl.classList.toggle('on', ratio < 0.999);
    thumbEl.style.width = (ratio * 100) + '%';
    thumbEl.style.marginLeft = ((max > 0 ? el.scrollLeft / max : 0) * (100 - ratio * 100)) + '%';
  }
  trackEl.addEventListener('scroll', syncEdges, { passive: true });
  if (window.ResizeObserver) { var ro = new ResizeObserver(syncEdges); ro.observe(trackEl); }
  window.addEventListener('resize', syncEdges);

  function railTo(x) {
    var r = railEl.getBoundingClientRect(), ratio = trackEl.clientWidth / trackEl.scrollWidth, tw = r.width * ratio;
    var p = (x - r.left - tw / 2) / (r.width - tw);
    trackEl.scrollLeft = Math.max(0, Math.min(1, p)) * (trackEl.scrollWidth - trackEl.clientWidth);
  }
  railEl.addEventListener('pointerdown', function (e) {
    railEl.classList.add('held');
    railTo(e.clientX);
    var mv = function (ev) { railTo(ev.clientX); };
    var up = function () { railEl.classList.remove('held'); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  });

  /* ------------------------------------------------------------ tema (escolhido no perfil)
     Duas famílias: VIVOX (bege e dourado / marrom e dourado) e WB (branco / preto).
     Em cada uma, o modo pode seguir o sistema, ficar sempre claro ou sempre escuro. */
  var root = document.documentElement;
  var FAMS = [
    { id: 'vivox', name: 'VIVOX', desc: 'Bege, marrom e dourado', lc: ['#F6F0E7', '#FFFDF8', '#1E1A16'], dc: ['#11100E', '#221F1A', '#F6F0E7'] },
    { id: 'wb', name: 'WB', desc: 'Branco e preto', lc: ['#FFFFFF', '#F1F1F3', '#111111'], dc: ['#000000', '#1A1A1A', '#FFFFFF'] }
  ];
  var MODES = [['auto', 'Sistema'], ['light', 'Claro'], ['dark', 'Escuro']];
  var themeFam = 'wb', themeMode = 'light';
  try {
    var savedTheme = localStorage.getItem('vivox-kanban-theme') || '';
    if (localStorage.getItem('vvox-sync-artifact-ui-version') !== '3') {
      savedTheme = 'wb:light';
      localStorage.setItem('vvox-sync-artifact-ui-version', '3');
    }
    var LEGACY = { auto: 'vivox:auto', light: 'vivox:light', dark: 'vivox:dark', white: 'wb:light', black: 'wb:dark' };
    var pair = (LEGACY[savedTheme] || savedTheme).split(':');
    if (FAMS.some(function (f) { return f.id === pair[0]; }) && MODES.some(function (m) { return m[0] === pair[1]; })) { themeFam = pair[0]; themeMode = pair[1]; }
  } catch (err) {}
  var sysLight = window.matchMedia('(prefers-color-scheme: light)');
  function resolveTheme() {
    var m = themeMode;
    if (m === 'auto') {
      if (themeFam === 'vivox') return null;
      m = sysLight.matches ? 'light' : 'dark';
    }
    return themeFam === 'vivox' ? m : (m === 'light' ? 'white' : 'black');
  }
  function applyTheme() {
    var t = resolveTheme();
    if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    try { localStorage.setItem('vivox-kanban-theme', themeFam + ':' + themeMode); } catch (err) {}
  }
  applyTheme();
  if (sysLight.addEventListener) sysLight.addEventListener('change', function () { if (themeMode === 'auto') applyTheme(); });
  function themeLabel() {
    return FAMS.filter(function (f) { return f.id === themeFam; })[0].name + ' · ' + MODES.filter(function (m) { return m[0] === themeMode; })[0][1];
  }
  function themesHTML() {
    var mh = {
      auto: 'Muda sozinho conforme o tema do seu computador ou celular.',
      light: 'Sempre claro, mesmo que o sistema esteja no escuro.',
      dark: 'Sempre escuro, mesmo que o sistema esteja no claro.'
    };
    return '<div class="grp" style="margin-top:14px">Tema</div><div class="themes" role="group" aria-label="Tema da interface">' + FAMS.map(function (f) {
      return '<button type="button" class="thb" data-fam="' + f.id + '" aria-pressed="' + (f.id === themeFam) + '"><span class="tp2" aria-hidden="true">' + [f.lc, f.dc].map(function (c) { return '<span class="h" style="--b:' + c[0] + ';--k:' + c[1] + ';--t:' + c[2] + '"><i></i></span>'; }).join('') + '</span><span><b>' + f.name + '</b><small>' + f.desc + '</small></span></button>';
    }).join('') + '</div>' +
      '<div class="grp" style="margin-top:10px">Modo</div><div class="seg full" role="group" aria-label="Modo do tema">' + MODES.map(function (m) {
        return '<button type="button" data-mode="' + m[0] + '" aria-pressed="' + (m[0] === themeMode) + '">' + m[1] + '</button>';
      }).join('') + '</div><p class="rolehelp">' + mh[themeMode] + '</p>';
  }

  /* dica de nome nos avatares: uma só caixa fixa na tela, que nunca é cortada pelo cartão, pela coluna ou pela janela */
  var tipEl = document.createElement('div');
  tipEl.className = 'gtip';
  tipEl.setAttribute('role', 'tooltip');
  tipEl.hidden = true;
  document.body.appendChild(tipEl);
  /* dicas de qualquer elemento: o atributo title vira o balão do quadro (o balão cinza do navegador não aparece mais) */
  var TIP_SEL = '.av[aria-label],[title],[data-tip]', tipTimer = 0, tipFor = null;
  function tipTextOf(el) {
    if (el.matches('.av[aria-label]')) return el.getAttribute('aria-label');
    if (el.hasAttribute('title')) {
      var t = el.getAttribute('title');
      if (t) { el.setAttribute('data-tip', t); if (!el.hasAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', t); }
      el.removeAttribute('title');
    }
    return el.getAttribute('data-tip') || '';
  }
  function showTip(el) {
    var txt = tipTextOf(el);
    if (!txt) { hideTip(); return; }
    tipFor = el;
    tipEl.textContent = txt;
    tipEl.classList.remove('below');
    tipEl.hidden = false;
    var r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight, cx = r.left + r.width / 2;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2)), top = r.top - h - 9;
    if (top < 8) { top = r.bottom + 9; tipEl.classList.add('below'); }
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
    tipEl.style.setProperty('--ax', Math.max(10, Math.min(w - 10, cx - left)) + 'px');
  }
  function hideTip() { clearTimeout(tipTimer); tipEl.hidden = true; tipFor = null; }
  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest ? e.target.closest(TIP_SEL) : null;
    if (!a) { if (!tipEl.hidden || tipTimer) hideTip(); return; }
    if (a === tipFor && !tipEl.hidden) return;
    clearTimeout(tipTimer);
    tipEl.hidden = true;
    tipTimer = setTimeout(function () { showTip(a); }, a.matches('.av[aria-label]') ? 0 : 260);
  });
  document.addEventListener('focusin', function (e) {
    var a = e.target.closest ? e.target.closest(TIP_SEL) : null;
    var fv = false; try { fv = !!(a && e.target.matches && e.target.matches(':focus-visible')); } catch (err) {}
    if (fv) showTip(a); else hideTip();
  });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('pointerdown', hideTip);
  document.addEventListener('scroll', hideTip, true);
  window.addEventListener('blur', hideTip);

  /* ------------------------------------------------------------ calendário de publicações
     Tabela de vagas por cliente. Cada cliente posta em dias fixos da semana (padrão: terça e quinta).
     Os conteúdos das colunas marcadas como "Agendado" (verde) e "Por fazer" (cinza) ocupam as próximas vagas livres, em fila.
     Uma postagem feita fora do dia ocupa a próxima vaga e a fila anda. */
  var mainView = 'board', calWeek = 'all', calNames = false, calY = new Date().getFullYear(), calM = new Date().getMonth();
  try { var sv0 = localStorage.getItem('vivox-kanban-view'); if (sv0 === 'cal' || sv0 === 'act') mainView = sv0; } catch (err) {}
  var WD3 = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'], WD_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var CLIENT_DAYS = {};
  try {
    var rawD = JSON.parse(localStorage.getItem('vivox-kanban-clientdays') || 'null');
    if (rawD && typeof rawD === 'object') Object.keys(rawD).forEach(function (k) {
      if (Array.isArray(rawD[k])) { var a = rawD[k].filter(function (n) { return n >= 0 && n <= 6; }).slice(0, 7); if (a.length) CLIENT_DAYS[k] = a; }
    });
  } catch (err) {}
  function daysOf(name) { return CLIENT_DAYS[name] && CLIENT_DAYS[name].length ? CLIENT_DAYS[name] : [2, 4]; }
  function saveDays() { try { localStorage.setItem('vivox-kanban-clientdays', JSON.stringify(CLIENT_DAYS)); } catch (err) {} }
  function planLegend() {
    var cs = cols.filter(function (c) { return c.plan; });
    if (!cs.length) return '<span>Marque uma coluna no menu dela, em Calendário de publicações, para ela aparecer aqui.</span>';
    return cs.map(function (c) { return '<span><i class="kdot" style="--cc:var(--sw-' + c.color + ')"></i><b>' + esc(c.name) + '</b>' + (c.plan === 'sched' ? 'agendado' : 'por fazer') + '</span>'; }).join('');
  }
  function stCol(t) { var l = locate(t.id); return l ? colById(l.col) : null; }
  function blockOf(d) { return Math.min(4, Math.ceil(d.getDate() / 7)); }

  /* clientes da tabela: todos os que aparecem nas tarefas do quadro; "Sem cliente" só se houver conteúdo na fila */
  function calClients() {
    var seen = {}, noClientInQueue = false;
    allTasks().forEach(function (t) {
      var c = clientOf(t), col = stCol(t);
      if (c) seen[c] = 1; else if (col && col.plan) noClientInQueue = true;
    });
    var list = Object.keys(seen).sort();
    if (noClientInQueue) list.push('');
    return list;
  }
  /* fila de um cliente: agendados primeiro, depois por fazer; dentro de cada grupo vale a ordem das colunas e dos cartões no quadro */
  function queueOf(name) {
    var sched = [], todo = [];
    cols.forEach(function (c) {
      if (!c.plan) return;
      c.tasks.forEach(function (t) { if (clientOf(t) === name) (c.plan === 'sched' ? sched : todo).push({ task: t, plan: c.plan }); });
    });
    return sched.concat(todo);
  }
  /* distribui a fila nas vagas livres a partir de hoje; postagens fora do dia ocupam a próxima vaga */
  function planFor(name, from, to) {
    var days = daysOf(name), today0 = startOfDay(new Date()), slots = [], i;
    var start = from < today0 ? from : today0, end = addDays(today0, 420) > to ? addDays(today0, 420) : to;
    for (var d = startOfDay(start); d <= end; d = addDays(d, 1)) if (days.indexOf(d.getDay()) > -1) slots.push(d);
    var occ = {};
    allTasks().forEach(function (t) {
      var col = stCol(t);
      if (!col || col.role !== 'done' || !t.deliveredAt || clientOf(t) !== name) return;
      var pd = startOfDay(t.deliveredAt);
      if (pd < startOfDay(start)) return;
      var onDay = days.indexOf(pd.getDay()) > -1, k = -1;
      for (i = 0; i < slots.length; i++) {
        if (occ[ymd(slots[i])]) continue;
        if (onDay ? slots[i] >= pd : slots[i] > pd) { k = i; break; }
      }
      if (k > -1) occ[ymd(slots[k])] = { task: t, off: !onDay, at: pd };
    });
    var free = slots.filter(function (s) { return s >= today0 && !occ[ymd(s)]; }), put = {}, q = queueOf(name);
    q.forEach(function (it, n) { if (free[n]) put[ymd(free[n])] = it; });
    return { occ: occ, put: put, queued: q.length };
  }
  function weekRange(b, y, m) {
    var last = new Date(y, m + 1, 0).getDate();
    return [(b - 1) * 7 + 1, b === 4 ? last : b * 7];
  }
  function renderPubCal() {
    var el = $('calView');
    if (mainView !== 'cal') return;
    if (typeof pvEl !== 'undefined' && pvEl && !pvEl.hidden) hidePv();
    var sc0 = el.querySelector('.kcm'), keep = sc0 ? sc0.scrollLeft : 0;
    var names = calClients(), today0 = startOfDay(new Date()), todayKey = ymd(today0);
    var mFirst = new Date(calY, calM, 1), mLast = new Date(calY, calM + 1, 0);
    var union = {};
    names.forEach(function (n) { daysOf(n).forEach(function (w) { union[w] = 1; }); });
    var dates = [];
    for (var d = new Date(mFirst); d <= mLast; d = addDays(d, 1)) {
      if (!union[d.getDay()]) continue;
      var b = blockOf(d);
      if (calWeek === 'all' || +calWeek === b) dates.push(d);
    }
    var plans = {}, nSched = 0, nTodo = 0;
    names.forEach(function (n) {
      plans[n] = planFor(n, mFirst, mLast);
      Object.keys(plans[n].put).forEach(function (k) {
        var p = k.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
        if (dt.getFullYear() === calY && dt.getMonth() === calM) { if (plans[n].put[k].plan === 'sched') nSched++; else nTodo++; }
      });
    });
    var h = '<div class="kh"><div class="knav"><button type="button" class="cn" data-knav="-1" aria-label="Mês anterior">' + icon('chevL') + '</button><button type="button" class="cn" data-knav="1" aria-label="Próximo mês">' + icon('chevR') + '</button></div>' +
      '<h2>' + MONTH_FULL[calM] + ' de ' + calY + '</h2><button type="button" class="pill" data-ktoday>Hoje</button>' +
      '<div class="seg" role="group" aria-label="Semanas do mês"><button type="button" data-kweek="all" aria-pressed="' + (calWeek === 'all') + '">Mês</button>' +
      [1, 2, 3, 4].map(function (w) { return '<button type="button" data-kweek="' + w + '" aria-pressed="' + (calWeek === String(w)) + '">Semana ' + w + '</button>'; }).join('') + '</div>' +
      '<span class="ksp"></span><span class="ksub">' + nSched + (nSched === 1 ? ' agendado' : ' agendados') + ' · ' + nTodo + ' por fazer neste período</span></div>';
    h += '<div class="klg" aria-label="Legenda">' + planLegend() + '<span><i class="kdot post">' + icon('check') + '</i><b>Postado</b>esta vaga já foi usada</span><span><i class="lgfree"></i><b>Livre</b>sem conteúdo ainda</span></div><p class="klr">Cada cliente preenche as vagas na ordem da fila. Se alguém posta fora do dia, essa postagem ocupa a próxima vaga e a fila anda.</p>';
    if (!names.length || !dates.length) {
      h += '<div class="kcm"><p class="kempty">' + (!names.length ? 'Ainda não há clientes nas tarefas deste quadro. Preencha o campo Cliente ao criar tarefas.' : 'Nenhum dia de postagem nesta semana.') + '</p></div>';
    } else {
      var gcols = 'minmax(210px,250px) repeat(' + dates.length + ',minmax(' + (calNames ? 98 : 54) + 'px,1fr))', firstIdx = {}, seenBk = 0;
      dates.forEach(function (x, i) { var bk = blockOf(x); if (firstIdx[bk] === undefined) firstIdx[bk] = i; });
      var sepAt = function () { return ''; };
      h += '<div class="kcm' + (calNames ? ' names' : '') + '"><div class="kcg" style="grid-template-columns:' + gcols + '" role="table" aria-label="Vagas de postagem por cliente"><span></span>';
      [1, 2, 3, 4].forEach(function (bk) {
        var cs = dates.filter(function (x) { return blockOf(x) === bk; });
        if (!cs.length) return;
        var r = weekRange(bk, calY, calM);
        h += '<div class="kwh' + '' + '" style="grid-column:span ' + cs.length + '">Semana ' + bk + '<small>dias ' + r[0] + ' a ' + r[1] + '</small></div>';
      });
      h += '<span></span>';
      dates.forEach(function (x, i) { h += '<div class="kdh' + (ymd(x) === todayKey ? ' tod' : '') + sepAt(i) + '"><span>' + WD3[x.getDay()] + '</span><b>' + p2(x.getDate()) + '</b>' + '</div>'; });
      names.forEach(function (n) {
        var pl = plans[n], dn = daysOf(n);
        h += '<div class="kcname">' + (n ? clientAvatar(n) : '<span class="cav kno">?</span>') + '<span class="kti"><b>' + esc(n || 'Sem cliente') + '</b><span class="kdays">' +
          dn.map(function (w) { return '<u>' + WD3[w] + '</u>'; }).join('') + '<s>' + pl.queued + (pl.queued === 1 ? ' conteúdo na fila' : ' conteúdos na fila') + '</s></span></span>' +
          '<button type="button" class="ib" data-kdays="' + esc(n) + '" aria-haspopup="dialog" aria-expanded="false" aria-label="Dias de postagem de ' + esc(n || 'Sem cliente') + '" title="Mudar os dias de postagem">' + icon('pen') + '</button></div>';
        dates.forEach(function (x, i) {
          var k = ymd(x), cls = 'kc' + (k === todayKey ? ' tod' : '') + sepAt(i);
          if (dn.indexOf(x.getDay()) < 0) { h += '<div class="' + cls + ' off" title="' + esc((n || 'Sem cliente') + ' não posta neste dia') + '"></div>'; return; }
          var o = pl.occ[k], it = pl.put[k];
          if (o) {
            var tip = o.off ? 'Postado fora do dia (' + WD_LONG[o.at.getDay()].toLowerCase() + ', ' + fDate(o.at) + '): ocupa esta vaga. ' + o.task.title : 'Postado: ' + o.task.title;
            h += '<div class="' + cls + ' has"><button type="button" class="kdot post" data-kprev="' + o.task.id + '" data-slot="' + k + '" data-kind="post" aria-haspopup="dialog" aria-label="' + esc(tip) + '">' + icon('check') + '</button>' +
              (calNames ? '<span class="klab post">' + (o.off ? 'postado ' + WD3[o.at.getDay()].toLowerCase() + ' ' + p2(o.at.getDate()) : 'postado') + '</span>' : '') + '</div>';
          } else if (it) {
            var c = stCol(it.task), tip2 = it.task.title + ' · ' + (c ? c.name : '') + ' · ' + (it.plan === 'sched' ? 'Agendado' : 'Por fazer');
            h += '<div class="' + cls + ' has"><button type="button" class="kdot ' + it.plan + '" style="--cc:var(--sw-' + (c ? c.color : 'gray') + ')" data-kprev="' + it.task.id + '" data-slot="' + k + '" data-kind="' + it.plan + '" aria-haspopup="dialog" aria-label="' + esc(tip2) + '"></button>' +
              (calNames ? '<span class="klab">' + esc(it.task.title) + '</span>' : '') + '</div>';
          } else h += '<div class="' + cls + (x < today0 ? ' past' : ' free') + '"></div>';
        });
      });
      h += '</div></div>';
    }
    el.innerHTML = h;
    var sc = el.querySelector('.kcm');
    if (sc && keep) sc.scrollLeft = keep;
    if (popState && popState.type === 'cdays') {
      var nbtn = Array.prototype.filter.call(el.querySelectorAll('[data-kdays]'), function (x) { return x.dataset.kdays === popState.role; })[0];
      if (nbtn) { popState.anchor = nbtn; nbtn.setAttribute('aria-expanded', 'true'); }
    }
  }
  function setMain(v, quiet) {
    mainView = v;
    closePop();
    $('board').hidden = v !== 'board';
    $('calView').hidden = v !== 'cal';
    $('actView').hidden = v !== 'act';
    $('toolbar').hidden = v !== 'board' || !fOpen;
    document.body.classList.toggle('calmode', v !== 'board');
    Array.prototype.forEach.call($('viewSeg').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === v)); });
    try { localStorage.setItem('vivox-kanban-view', v); } catch (err) {}
    if (v === 'cal') renderPubCal(); else if (v === 'act') renderAct(); else syncEdges();
    if (!quiet) { enterView(v === 'cal' ? $('calView') : v === 'act' ? $('actView') : $('board')); say(v === 'cal' ? 'Calendário de publicações aberto.' : v === 'act' ? 'Atividade da equipe aberta.' : 'Quadro aberto.'); }
  }
  (function () {
    var segs = $('viewSeg').querySelectorAll('button');
    segs[0].innerHTML = icon('layout') + '<span class="vl">Quadro</span>';
    segs[1].innerHTML = icon('cal') + '<span class="vl">Calendário</span>';
    segs[2].innerHTML = icon('zap') + '<span class="vl">Atividade</span>';
    segs[0].title = 'Quadro'; segs[1].title = 'Calendário de publicações'; segs[2].title = 'Atividade da equipe'; segs[2].setAttribute('aria-label', 'Ver a atividade da equipe');
    segs[0].setAttribute('aria-label', 'Ver como quadro'); segs[1].setAttribute('aria-label', 'Ver como calendário de publicações');
    $('viewSeg').addEventListener('click', function (e) { var b = e.target.closest('[data-view]'); if (b && b.dataset.view !== mainView) setMain(b.dataset.view); });
  })();
  function cdaysPopHTML() {
    var n = popState.role, dn = daysOf(n);
    return '<h4>Dias de postagem</h4><p class="hint" style="margin:0 0 10px">' + esc(n || 'Sem cliente') + ' posta nos dias marcados. Cada postagem fora desses dias ocupa a próxima vaga.</p>' +
      '<div class="rolegrid" role="group" aria-label="Dias da semana">' + [1, 2, 3, 4, 5, 6, 0].map(function (w) { return '<button type="button" data-wd="' + w + '" aria-pressed="' + (dn.indexOf(w) > -1) + '">' + WD_LONG[w].slice(0, 3) + '</button>'; }).join('') + '</div>' +
      '<div class="prow" style="margin-top:12px"><button class="btn sm" type="button" data-wdreset>Terça e quinta</button><button class="btn primary sm" type="button" data-pcancel>Pronto</button></div>';
  }
  var calEl = $('calView');
  calEl.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-copen]'))) { openDetail(b.dataset.copen); return; }
    if ((b = e.target.closest('[data-knav]'))) { var dt = new Date(calY, calM + (+b.dataset.knav), 1); calY = dt.getFullYear(); calM = dt.getMonth(); renderPubCal(); return; }
    if (e.target.closest('[data-ktoday]')) { calY = new Date().getFullYear(); calM = new Date().getMonth(); renderPubCal(); return; }
    if ((b = e.target.closest('[data-kweek]'))) { calWeek = b.dataset.kweek; renderPubCal(); return; }
    if ((b = e.target.closest('[data-kdays]'))) { openPop('cdays', b, b.dataset.kdays); }
  });

  /* prévia da vaga: passar o mouse (ou clicar) no quadradinho mostra um mini-cartão; o botão ao lado dele abre a tarefa completa */
  var pvEl = document.createElement('div'), pvId = '', pvPinned = false, pvTimer = 0, pvBtn = null;
  pvEl.className = 'kpv'; pvEl.hidden = true; pvEl.setAttribute('role', 'dialog'); pvEl.setAttribute('aria-label', 'Prévia do conteúdo');
  document.body.appendChild(pvEl);
  function pvHTML(btn) {
    var l = locate(btn.dataset.kprev);
    if (!l) return '';
    var t = l.task, c = colById(l.col), kind = btn.dataset.kind, cl = clientOf(t), di = dueInfo(t), p = btn.dataset.slot.split('-'), slot = new Date(+p[0], +p[1] - 1, +p[2]);
    var cc = kind === 'post' ? 'green' : c.color;
    var badge = kind === 'sched' ? 'Agendado' : kind === 'todo' ? 'Por fazer' : 'Postado';
    var steps = t.steps || [], done = steps.filter(function (x) { return x.done; }).length, txt = (t.desc || t.note || '').replace(/\s+/g, ' ').trim();
    var meta = '<span class="kmi"><i style="background:var(--sw-' + c.color + ')"></i>' + esc(c.name) + '</span>' +
      '<span class="kmi">' + icon('cal') + (kind === 'post' ? 'Vaga ' : 'Vaga ') + WD3[slot.getDay()].charAt(0) + WD3[slot.getDay()].slice(1).toLowerCase() + ' ' + fDate(slot) + '</span>';
    if (kind === 'post' && t.deliveredAt) meta += '<span class="kmi">' + icon('check') + 'Postado ' + esc(fFull(t.deliveredAt)) + '</span>';
    else if (t.dueAt) meta += '<span class="kmi' + (di.cls === 'late' ? ' late' : '') + '">' + icon('clock') + 'Prazo ' + esc(di.base) + (di.extra ? ' · ' + di.extra : '') + '</span>';
    if (steps.length) meta += '<span class="kmi">' + icon('list') + done + '/' + steps.length + ' etapas</span>';
    return '<div class="kpm" style="--cc:var(--sw-' + cc + ')"><div class="kpt">' + clientAvatar(cl) + '<span class="kcn">' + esc(cl || 'Sem cliente') + '</span><span class="kbd">' + badge + '</span></div>' +
      '<b class="kti2">' + esc(t.title) + '</b>' + (txt ? '<p class="kds">' + esc(txt.length > 150 ? txt.slice(0, 150) + '…' : txt) + '</p>' : '') +
      '<div class="kmeta">' + meta + '</div><div class="kav">' + people(t).map(function (n) { return avatar(n, n + ' · ' + rolesOf(t, n).map(function (k) { return ROLES[k].label; }).join(' e ')); }).join('') + '</div></div>' +
      '<button type="button" class="kgo" data-kgo="' + t.id + '" aria-label="Abrir todas as informações da tarefa" title="Abrir todas as informações">' + icon('eye') + '<span>Abrir</span></button>';
  }
  function hidePv() { clearTimeout(pvTimer); pvEl.hidden = true; pvId = ''; pvPinned = false; pvBtn = null; }
  function showPv(btn, pin) {
    clearTimeout(pvTimer);
    var html = pvHTML(btn);
    if (!html) { hidePv(); return; }
    pvEl.innerHTML = html;
    pvEl.hidden = false; pvId = btn.dataset.kprev; pvBtn = btn;
    if (pin) pvPinned = true;
    var r = btn.getBoundingClientRect(), w = pvEl.offsetWidth, h = pvEl.offsetHeight;
    var left = Math.max(10, Math.min(window.innerWidth - w - 10, r.left + r.width / 2 - w / 2)), top = r.bottom + 8;
    if (top + h > window.innerHeight - 10) top = Math.max(10, r.top - h - 8);
    pvEl.style.left = left + 'px'; pvEl.style.top = top + 'px';
  }
  function softHide() { clearTimeout(pvTimer); if (pvPinned) return; pvTimer = setTimeout(hidePv, 180); }
  calEl.addEventListener('mouseover', function (e) {
    var b = e.target.closest ? e.target.closest('[data-kprev]') : null;
    if (!b) return;
    clearTimeout(pvTimer);
    if (pvBtn === b && !pvEl.hidden) return;
    if (pvPinned) return;
    pvTimer = setTimeout(function () { showPv(b, false); }, 90);
  });
  calEl.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('[data-kprev]')) softHide(); });
  calEl.addEventListener('focusin', function (e) { var b = e.target.closest ? e.target.closest('[data-kprev]') : null; if (b && !pvPinned) showPv(b, false); });
  calEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-kprev]');
    if (!b) return;
    if (pvPinned && pvBtn === b) { hidePv(); return; }
    pvPinned = false; showPv(b, true);
  });
  pvEl.addEventListener('mouseenter', function () { clearTimeout(pvTimer); });
  pvEl.addEventListener('mouseleave', softHide);
  pvEl.addEventListener('click', function (e) {
    var g = e.target.closest('[data-kgo]');
    if (!g) return;
    var id = g.dataset.kgo;
    hidePv();
    openDetail(id);
  });
  document.addEventListener('pointerdown', function (e) { if (!pvEl.hidden && !pvEl.contains(e.target) && !(e.target.closest && e.target.closest('[data-kprev]'))) hidePv(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pvEl.hidden) hidePv(); });
  window.addEventListener('resize', hidePv);
  document.addEventListener('scroll', function (e) { if (!pvEl.hidden && !pvEl.contains(e.target)) hidePv(); }, true);

  /* ------------------------------------------------------------ atividade
     Linha do tempo do que a equipe fez: criação, etapas, entregas, prazos, anexos e comentários, agrupada por dia. */
  var actFilter = 'all', actLimit = 40, ACT_ICON = {};
  Object.keys(KIND_ICON).forEach(function (k) { ACT_ICON[k] = KIND_ICON[k]; });
  ACT_ICON.create = 'plus'; ACT_ICON.file = 'clip'; ACT_ICON.link = 'link'; ACT_ICON.edit = 'pen';
  function actKind(text) {
    if (/criou a tarefa/.test(text)) return 'create';
    if (/anexou|removeu o anexo/.test(text)) return 'file';
    if (/\blink\b/.test(text)) return 'link';
    if (/descrição|etapa|sugeriu/.test(text)) return 'edit';
    return kindOf(text);
  }
  function actEvents() {
    var out = [];
    boards.forEach(function (b) {
      b.cols.forEach(function (c) {
        c.tasks.forEach(function (t) {
          (t.chat || []).forEach(function (m) {
            if (m.type === 'sys') {
              var actor = PEOPLE.filter(function (n) { return m.text.indexOf(n + ' ') === 0; })[0] || '';
              out.push({ at: m.at, actor: actor, verb: actor ? m.text.slice(actor.length + 1) : m.text, kind: actKind(m.text), msg: false, task: t, board: b });
            } else if (m.type === 'msg') {
              out.push({ at: m.at, actor: m.who, verb: m.audio ? 'enviou um áudio em' : 'comentou em', quote: m.audio ? '' : (m.text.length > 140 ? m.text.slice(0, 140) + '…' : m.text), kind: 'msg', msg: true, task: t, board: b });
            }
          });
        });
      });
    });
    out.sort(function (a, b) { return b.at - a.at; });
    return out;
  }
  function renderAct() {
    var el = $('actView');
    if (mainView !== 'act') return;
    var all = actEvents().filter(function (e) { return actFilter === 'all' || (actFilter === 'msg' ? e.msg : !e.msg); });
    var shown = all.slice(0, actLimit), groups = [], idx = {}, i = 0;
    shown.forEach(function (e) {
      var k = dayLabel(e.at);
      if (idx[k] === undefined) { idx[k] = groups.length; groups.push({ label: k, items: [] }); }
      groups[idx[k]].items.push(e);
    });
    var h = '<div class="ah"><div><h2>Atividade</h2><p>O que a equipe fez nos quadros, do mais recente ao mais antigo.</p></div><span class="abdg">' + all.length + (all.length === 1 ? ' atualização' : ' atualizações') + '</span></div>' +
      '<div class="seg afl" role="group" aria-label="Tipo de atividade">' + [['all', 'Tudo'], ['msg', 'Comentários'], ['chg', 'Mudanças']].map(function (f) { return '<button type="button" data-afil="' + f[0] + '" aria-pressed="' + (actFilter === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>';
    if (!groups.length) h += '<p class="aempty">Nada por aqui ainda. Quando alguém mexer numa tarefa ou comentar, aparece nesta linha do tempo.</p>';
    groups.forEach(function (g) {
      h += '<section class="agrp"><div class="asep">' + esc(g.label) + '</div><ol class="alist">';
      g.items.forEach(function (e) {
        var t = e.task, tip = e.board.name + ' · abrir ' + fmtNum(t.num);
        h += '<li><button type="button" class="ait" style="--i:' + Math.min(i++, 14) + '" data-aopen="' + t.id + '" title="' + esc(tip) + '"><span class="aav">' +
          (e.actor ? avatar(e.actor) : '<span class="av asys">' + icon('zap') + '</span>') +
          '<span class="aic k-' + e.kind + '">' + icon(ACT_ICON[e.kind] || 'bell') + '</span></span>' +
          '<span class="atx">' + (e.actor ? '<b>' + esc(e.actor) + '</b> ' : '') + esc(e.verb) + ' <b>' + esc(fmtNum(t.num) + ' ' + t.title) + '</b>' + (e.quote ? '<span class="aq">“' + esc(e.quote) + '”</span>' : '') + '</span>' +
          '<time class="atm">' + esc(relTime(e.at)) + '</time></button></li>';
      });
      h += '</ol></section>';
    });
    if (all.length > shown.length) h += '<button type="button" class="btn sm amore" data-amore>Mostrar mais ' + Math.min(40, all.length - shown.length) + '</button>';
    el.innerHTML = h;
  }
  $('actView').addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-afil]'))) { actFilter = b.dataset.afil; actLimit = 40; renderAct(); return; }
    if (e.target.closest('[data-amore]')) { actLimit += 40; renderAct(); return; }
    if ((b = e.target.closest('[data-aopen]'))) {
      var f = findTask(b.dataset.aopen);
      if (!f) { toast('Essa tarefa não existe mais'); return; }
      if (f.board !== cur) selectBoard(f.board.id, true);
      openDetail(b.dataset.aopen);
    }
  });

  /* ------------------------------------------------------------ movimento ao tocar e apertar
     Onda (ripple) no ponto do clique e um pulinho elástico ao soltar. Desligado com "reduzir movimento" no sistema. */
  var PRESS_SEL = '.btn,.pill,.tab,.seg button,.add,.send,.edit,.opt-b,.menu button,.nselb,.aplay,.kgo,.aspd,.askip,.micb,.fbtn,.icon-btn:not(.bell),.ib,.play,.plink,.ndue,.kmore,.cn,.stagebtn,.rb2,.thb,.tcard,.swb,.icb,.cd,.cm,.tq button,.quick4 button,.rolegrid button';
  var SPRING = 'cubic-bezier(.34,1.56,.64,1)';
  document.addEventListener('pointerdown', function (e) {
    if (reduce || e.button > 0) return;
    var b = e.target.closest ? e.target.closest(PRESS_SEL) : null;
    if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
    var r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2, x = e.clientX - r.left, y = e.clientY - r.top;
    if (!(r.width > 0)) return;
    b.classList.add('rip-clip');
    if (getComputedStyle(b).position === 'static') b.classList.add('rip-host');
    var s = document.createElement('span');
    s.className = 'rip';
    s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (x - size / 2) + 'px;top:' + (y - size / 2) + 'px';
    b.appendChild(s);
    s.addEventListener('animationend', function () { s.remove(); });
    setTimeout(function () { if (s.isConnected) s.remove(); }, 900);
  }, true);
  document.addEventListener('click', function (e) {
    if (reduce) return;
    var b = e.target.closest ? e.target.closest(PRESS_SEL) : null;
    if (!b || b.disabled || !b.isConnected || !b.animate || b.closest('.card')) return;
    b.animate([{ transform: 'scale(.955)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.35,.5,1)' });
  }, true);
  /* assenta o cartão depois de soltar, e faz os cartões novos entrarem deslizando */
  function settle(el) {
    if (reduce || !el || !el.animate) return;
    el.animate([{ transform: 'scale(1.015)' }, { transform: 'scale(.995)', offset: .6 }, { transform: 'scale(1)' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function enterCards() {
    if (reduce) return;
    Object.keys(cardEls).forEach(function (id) {
      var el = cardEls[id];
      if (el.dataset.enter && el.isConnected) {
        delete el.dataset.enter;
        el.animate([{ opacity: 0, transform: 'translateY(14px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  }
  function popIn(el) {
    if (reduce || !el || !el.animate) return;
    el.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .6 }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function enterView(el) {
    if (reduce || !el) return;
    el.classList.remove('vin'); void el.offsetWidth; el.classList.add('vin');
  }

  function flySend() {
    if (reduce) return;
    var ic = $('sendBtn').querySelector('svg');
    if (ic && ic.animate) ic.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(16px,-16px)', opacity: 0, offset: .45 }, { transform: 'translate(-16px,16px)', opacity: 0, offset: .46 }, { transform: 'translate(0,0)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)' });
  }
  var appReady = false;

  var syncApplying = false, syncConfig = null, syncNeedsReload = false, syncFailedDraft = null, syncCorrectionRequest = null, syncConnectionTimer = null;
  function syncCorrectionHTML() {
    return '<h4>Pedir correção</h4><form class="colf" data-form="correction"><div class="fld"><label for="syncCorrectionReason">O que precisa ser ajustado?</label><input id="syncCorrectionReason" type="text" maxlength="2000" autocomplete="off" required placeholder="Descreva a correção necessária"></div><div class="prow"><button class="btn primary sm" type="submit">Solicitar correção</button><button class="btn sm" type="button" data-pcancel>Cancelar</button></div></form>';
  }
  function syncAskCorrection(task, apply) {
    if (syncBusy || syncNeedsReload) return;
    if (grabbed && cardEls[grabbed]) cardEls[grabbed].classList.remove('grabbed');
    grabbed = null;
    closePop();
    syncCorrectionRequest = { id: task.id, apply: apply };
    var anchor = detailId === task.id && $('infof').querySelector('[data-act="fix"]') || cardEls[task.id] || $('boardMenuBtn');
    openPop('correction', anchor, task.id);
  }
  function syncSubmitCorrection() {
    var request = syncCorrectionRequest, input = $('syncCorrectionReason');
    if (!request || !input) return;
    var reason = input.value.trim();
    if (!reason) { input.setCustomValidity('Descreva o que precisa ser ajustado.'); input.reportValidity(); input.focus(); return; }
    input.setCustomValidity('');
    closePop(true);
    request.apply(reason);
  }
  popEl.addEventListener('input', function(e) { if (e.target.id === 'syncCorrectionReason') e.target.setCustomValidity(''); });
  function syncClone(value) {
    if (value instanceof Date) return new Date(value);
    if (Array.isArray(value)) return value.map(syncClone);
    if (!value || typeof value !== 'object') return value;
    var out = {};
    Object.keys(value).forEach(function (key) {
      if (['file', 'docP', 'thumb'].indexOf(key) < 0) out[key] = syncClone(value[key]);
    });
    return out;
  }
  function syncSnapshot() { return syncClone({ boards: boards }); }
  function syncNavigate() {
    if (!syncBooted || syncApplying || !cur) return;
    parent.postMessage({type:'vvox-sync:navigate', boardId:cur.id, taskId:detailId || null}, location.origin);
  }
  function syncSetBusy(value) {
    syncBusy = value;
    document.body.setAttribute('aria-busy', String(value));
  }
  function syncUiDraft() {
    var active = document.activeElement, values = [];
    document.querySelectorAll('#msgInput, #stNew, #descTa, #refUrl, #refTitle, .addform input').forEach(function (el) {
      values.push({id:el.id, value:el.value, html:el.isContentEditable ? el.innerHTML : null, col:el.closest('.addform') && el.closest('.addform').dataset.form});
    });
    return {values:values, active:active && active.id, start:active && active.selectionStart, end:active && active.selectionEnd, scroll:trackEl.scrollLeft, info:infoEl.scrollTop};
  }
  function syncHydrate(state, initial) {
    var ui = syncUiDraft(), map = state.idMap && state.idMap.all || {};
    var currentId = map[cur && cur.id] || (initial && syncConfig.boardId) || (cur && cur.id);
    var taskId = map[detailId] || detailId || (initial && syncConfig.taskId);
    var oldPop = popState && {type:popState.type, ref:popState.role, draft:syncClone(popState.draft), state:popState};
    syncApplying = true;
    try {
    boards = state.boards;
    var columnPrefs = {};
    try { columnPrefs = JSON.parse(localStorage.getItem('vvox-sync-column-ui:' + syncBackend.user.id) || '{}'); } catch (_) {}
    boards.forEach(function(b) { b.cols = b.cols.map(function(c) {
      var preference = columnPrefs[c.id] || {}, raw = Object.assign({},c);
      raw.fill = Object.prototype.hasOwnProperty.call(preference,'fill') ? preference.fill : true;
      raw.collapsed = !!preference.collapsed;
      raw.apart = preference.apart === 'start' || preference.apart === 'end' ? preference.apart : c.role === 'done' ? 'end' : '';
      raw.dim = typeof preference.dim === 'number' ? preference.dim : c.role === 'done' ? 0.25 : 1;
      var mapped = mkCol(raw); mapped._server = c._server; mapped.def = c.def || mapped.def; return mapped;
    }); });
    boards.forEach(function(b) { b.cols.forEach(function(c) { c.tasks.forEach(function(t) { if (t.descHtml) t.descHtml = sanitizeHTML(t.descHtml); if(t.category && !catOf(t.category)) CATS.push({id:t.category,label:t.category,icon:CAT_ICONS.indexOf(t.categoryIcon)>=0?t.categoryIcon:'star',group:'other'}); }); }); });
    PEOPLE = state.PEOPLE; PROFILES = state.PROFILES; viewer = state.viewer;
    if (!boards.length) throw new Error('Nenhum quadro disponível para esta conta.');
    var linkedBoard = taskId && boards.find(function(b) {return b.cols.some(function(c) {return c.tasks.some(function(t) {return t.id === taskId;});});});
    cur = linkedBoard || boards.find(function(b) {return b.id === currentId;}) || boards[0]; cols = cur.cols;
    cardEls = {}; grabbed = null;
    closePop();
    paintViewer(); paintBoardHead(); rebuildBoard(); renderToolbar(); paintBell(); setMain(mainView,true); appReady = true;
    if (taskId && locate(taskId)) {
      detailId = taskId; ovEl.hidden = false; document.body.classList.add('locked');
      renderDetail(); renderChat(initial);
    } else if (detailId) closeDetail();
    if (initial) { applyDefaultPreset(true); renderToolbar(); render(); }
    ui.values.forEach(function (draft) {
      if (draft.col) {
        var columnId = map[draft.col] || draft.col;
        if (footEls[columnId]) { openAdd(columnId); draft.id = 'novo-' + columnId; }
      }
      var el = document.getElementById(draft.id);
      if (!el) return;
      if (draft.html !== null) el.innerHTML = draft.html; else el.value = draft.value;
    });
    // A newly added column opens its original customization popover after its real ID arrives.
    if (oldPop && oldPop.type === 'board') {
      openPop('board', $('boardMenuBtn')); if (oldPop.draft) popState.draft = oldPop.draft; buildPop(); placePop();
    }
    if (oldPop && oldPop.type === 'col') {
      var columnId = map[oldPop.ref] || oldPop.ref;
      var anchor = colEls[columnId] && colEls[columnId].querySelector('.menu-btn');
      if (anchor) { openPop('col', anchor, columnId); if (oldPop.draft) popState.draft = oldPop.draft; buildPop(); placePop(); }
    }
    var focus = ui.active && document.getElementById(map[ui.active] || ui.active);
    if (focus) {
      focus.focus({preventScroll:true});
      if (typeof focus.setSelectionRange === 'function' && ui.start != null) { try {focus.setSelectionRange(ui.start,ui.end);} catch (_) {} }
    }
    trackEl.scrollLeft = ui.scroll; infoEl.scrollTop = ui.info;
    syncNeedsReload = false;
    syncBase = syncSnapshot(); syncDeletes = {tasks:[],columns:[],boards:[]}; syncMoved = [];
    syncApplying = false; syncBooted = true;
    document.body.style.visibility = '';
    document.body.dataset.syncReady = 'true';
    try { localStorage.setItem('vvox-sync-original-export-version','3'); } catch (_) {}
    syncNavigate();
    } catch (error) {syncNeedsReload = true; throw error;} finally {syncApplying = false;}
  }
  function syncCaptureSubmission(before, after) {
    if (!detailId) return null;
    function lookup(state) {for (var b of state.boards) for (var c of b.cols) for (var t of c.tasks) if(t.id===detailId) return t;}
    var prior = lookup(before), next = lookup(after); if(!prior || !next) return null;
    var messages = next.chat.filter(function(m) {return m.type === 'msg' && !prior.chat.some(function(old) {return old.type === 'msg' && old.text === m.text && +old.at === +m.at;});});
    var description = next.descHtml !== prior.descHtml || next.desc !== prior.desc ? {html:next.descHtml || esc(next.desc).replace(/\n/g,'<br>'),plain:next.desc} : null;
    return {id:detailId,messages:messages,description:description};
  }
  function syncRestoreFailedDraft() {
    var draft = syncFailedDraft, at = draft && locate(draft.id);
    if (!draft || !at || detailId !== draft.id) return;
    var unsent = draft.messages.filter(function(m) {return !at.task.chat.some(function(saved) {return saved.type==='msg' && saved.who === viewer && saved.who === m.who && saved.text===m.text && Math.abs(+saved.at - +m.at)<60000;});});
    if(unsent.length) inputEl.value = unsent.map(function(m){return m.text;}).join('\n');
    if(draft.description && at.task.desc !== draft.description.plain) {
      descEdit = true; renderDetail(); if($('descTa')) $('descTa').innerHTML = draft.description.html;
    }
    if(!syncNeedsReload) syncFailedDraft = null;
  }
  async function syncRecover(error) {
    if (error && error.status === 401) { parent.postMessage({type:"vvox-sync:unauthorized"}, location.origin); return; }
    try { syncHydrate(await syncBackend.load(), false); }
    catch (reloadError) { syncNeedsReload = true; console.error('VVOX Sync: recarga indisponível', reloadError.message); }
    syncRestoreFailedDraft();
    toast(error && error.message || 'Não foi possível salvar. Tente novamente.');
  }
  async function syncFlush() {
    syncFlushTimer = null;
    if (!syncBooted || syncBusy || syncNeedsReload || syncApplying || drag || grabbed) return;
    var after = syncSnapshot();
    if (JSON.stringify(after) === JSON.stringify(syncBase)) return;
    after._syncDeletes = syncClone(syncDeletes); after._syncMovedTaskIds = syncMoved.slice();
    syncFailedDraft = syncCaptureSubmission(syncBase, after);
    syncSetBusy(true);
    try { syncHydrate(await syncBackend.commit(syncBase, after), false); syncFailedDraft = null; }
    catch (error) { await syncRecover(error); }
    finally { syncSetBusy(false); }
  }
  function syncSchedule() {
    if (!syncBooted || syncApplying) return;
    clearTimeout(syncFlushTimer); syncFlushTimer = setTimeout(syncFlush, 0);
  }
  async function syncCommand(task, action, correctionReason) {
    if (syncBusy || !syncCan(task, action)) return;
    var body = {versao:task._server.versao};
    if (action === 'corrigir') {
      if (!correctionReason) { syncAskCorrection(task, function(reason) { syncCommand(task, action, reason); }); return; }
      body.motivo = correctionReason;
    }
    syncSetBusy(true);
    try {
      await syncBackend.command(task.id, action, body);
      syncHydrate(await syncBackend.load(), false);
      toast({iniciar:'Play iniciado',pausar:'Play pausado',entregar:'Tarefa entregue para aprovação',aprovar:'Entrega aprovada',corrigir:'Correção solicitada ao criador'}[action]);
    } catch (error) { await syncRecover(error); }
    finally { syncSetBusy(false); }
  }
  async function syncUpload(task, files) {
    if (syncBusy || !canAttach(task)) return;
    if (files.some(function(f) {return f.size > MAX_FILE;})) { toast('Limite de 350 MB por arquivo'); return; }
    if ((task.files || []).length + files.length > 30) { toast('Limite de 30 anexos por tarefa'); return; }
    syncSetBusy(true);
    try {
      await window.VvoxSyncTaskExtras.upload(files,task,syncBackend.api,syncBackend.user);
      syncHydrate(await syncBackend.load(),false); toast('Arquivo anexado');
    } catch(error) {await syncRecover(error);}
    finally {syncSetBusy(false);}
  }
  ['click','submit','change','keydown','pointerdown','pointerup','pointercancel','focusout'].forEach(function(type) {
    window.addEventListener(type, function(e) {
      var retry = e.target && e.target.closest && e.target.closest('[data-sync-retry]');
      if (retry) {
        if (type === 'click') { e.preventDefault(); e.stopImmediatePropagation(); void syncLoadInitial(); }
        return;
      }
      if (!syncBooted && type !== 'focusout' && !(type === 'keydown' && e.key === 'Tab')) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (syncNeedsReload && ['click','submit','change','keydown','pointerdown'].indexOf(type) >= 0) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (!syncBusy) { syncSetBusy(true); syncBackend.load().then(function(state) {syncHydrate(state,false);syncRestoreFailedDraft();toast('Conexão recuperada. Confira a tarefa antes de continuar.');}).catch(function() {toast('Sem conexão. Recarregue a página antes de continuar.');}).finally(function() {syncSetBusy(false);}); }
        return;
      }
      if (syncBusy && ['click','submit','change','keydown','pointerdown'].indexOf(type) >= 0) {
        e.preventDefault(); e.stopImmediatePropagation(); return;
      }
      syncSchedule();
    }, true);
  });
  window.addEventListener('message', function(e) {
    if(e.source !== parent || e.origin !== location.origin || !e.data || e.data.type !== 'vvox-sync:init' || !syncBooted || syncBusy) return;
    var cfg = e.data;
    if(cfg.boardId && cfg.boardId !== cur.id) selectBoard(cfg.boardId,true);
    if(cfg.taskId && cfg.taskId !== detailId) {var found = findTask(cfg.taskId); if(found && found.board !== cur) selectBoard(found.board.id,true); openDetail(cfg.taskId);}
    if(!cfg.taskId && detailId) closeDetail();
  });
  function syncConnectionState(error, message) {
    if (error && error.status === 401) { parent.postMessage({type:"vvox-sync:unauthorized"}, location.origin); }
    document.body.style.visibility = '';
    document.body.dataset.syncReady = 'false';
    trackEl.innerHTML = '<div class="empty" role="' + (error ? 'alert' : 'status') + '"><p>' + esc(error && error.message || message || 'Carregando quadros…') + '</p>' + (error ? '<button class="btn primary sm" type="button" data-sync-retry>Tentar novamente</button>' : '') + '</div>';
    if (error) { var retry = trackEl.querySelector('[data-sync-retry]'); if (retry) retry.focus(); }
  }
  function syncWaitForSession() {
    clearTimeout(syncConnectionTimer);
    syncConnectionState(null, 'Conectando à sua conta…');
    parent.postMessage({ type: 'vvox-sync:ready' }, location.origin);
    syncConnectionTimer = setTimeout(function() {
      if (!syncConfig) syncConnectionState(new Error('A sessão não respondeu. Tente conectar novamente.'));
    }, 12000);
  }
  async function syncLoadInitial() {
    if (syncBusy) return;
    if (!syncConfig) { syncWaitForSession(); return; }
    clearTimeout(syncConnectionTimer);
    syncSetBusy(true); syncNeedsReload = false;
    syncConnectionState(null, 'Carregando quadros…');
    try {
      if (typeof window.createVvoxSyncBackend !== 'function') throw new Error('Não foi possível iniciar a conexão do painel. Tente novamente.');
      if (!syncBackend) syncBackend = window.createVvoxSyncBackend(syncConfig);
      syncHydrate(await syncBackend.load(), true);
    } catch(error) {
      syncConnectionState(error);
    } finally { syncSetBusy(false); }
  }
  syncWaitForSession();
  window.vvoxSyncHostConfig.then(function(config) {
    syncConfig = config;
    void syncLoadInitial();
  });
  setInterval(async function() {
    if(!syncBooted || syncBusy || drag || grabbed || popState || descEdit || lbOpen() || !$('bov').hidden || nOpen() || rec) return;
    if(document.activeElement && document.activeElement.matches('input,textarea,[contenteditable]')) return;
    if(JSON.stringify(syncSnapshot()) !== JSON.stringify(syncBase)) {syncSchedule(); return;}
    syncSetBusy(true);
    try {syncHydrate(await syncBackend.load(),false);} catch (_) {} finally {syncSetBusy(false);}
  },30000);


})();
