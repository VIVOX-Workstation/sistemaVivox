/**
 * @typedef {{id: string, nome?: string, email?: string, role?: string}} SyncUser
 * @typedef {{apiUrl: string, token: string|(() => string), user: SyncUser, workspaceId?: string, signal?: AbortSignal}} SyncBackendConfig
 * @typedef {{method?: string, body?: unknown, signal?: AbortSignal}} SyncRequestOptions
 * The host owns one instance per account/workspace and aborts its signal on unmount.
 * Use a token getter when authentication can refresh during the mounted session.
 */
(function (global) {
  'use strict';
  var COLORS = {
    gray: '#94a3b8',
    green: '#22c55e',
    orange: '#f59e0b',
    red: '#ef4444',
    gold: '#c7a15f',
    blue: '#3b82f6',
    violet: '#a855f7',
    teal: '#14b8a6',
    pink: '#ec4899',
  };
  var PRIORITIES = { urgent: 'URGENTE', high: 'ALTA', normal: 'MEDIA', low: 'BAIXA' },
    CAT = 'vvox:category:';
  var CATEGORY_ICON_TAG = 'vvox:category-icon:';
  var CATEGORY_ICONS = [
    'video',
    'layout',
    'globe',
    'phone',
    'printer',
    'sparkles',
    'layers',
    'camera',
    'mic',
    'mega',
    'mail',
    'doc',
    'code',
    'pen',
    'palette',
    'chat',
    'trend',
    'star',
  ];
  var BUILTIN_CATEGORY_ICONS = {
    Vídeo: 'video',
    'Landing page': 'layout',
    Site: 'globe',
    App: 'phone',
    Impresso: 'printer',
    Motion: 'sparkles',
    'Materiais digitais': 'layers',
    'Identidade visual': 'palette',
    'Redes sociais': 'chat',
    'Tráfego pago': 'trend',
    Fotografia: 'camera',
    'E-mail marketing': 'mail',
    'Copy e roteiro': 'pen',
  };
  function categoryIcon(name, value) {
    return CATEGORY_ICONS.includes(value) ? value : BUILTIN_CATEGORY_ICONS[name] || 'star';
  }
  var LEGACY_DEFAULTS = {
    BACKLOG: ['gray', 'inbox'], A_FAZER: ['gold', 'list'],
    EM_ANDAMENTO: ['blue', 'zap'], EM_REVISAO: ['orange', 'eye'],
    CONCLUIDA: ['green', 'circleCheck'],
  };
  var DEFAULTS = {
    queue: ['gray', 'inbox'],
    doing: ['blue', 'zap'],
    review: ['orange', 'eye'],
    done: ['green', 'circleCheck'],
    none: ['gray', 'list'],
  };
  function date(v) {
    var d = v ? new Date(v) : null;
    return d && Number.isFinite(d.getTime()) ? d : null;
  }
  function iso(v) {
    var d = date(v);
    return d ? d.toISOString() : null;
  }
  function same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function list(s) {
    return Array.isArray(s) ? s : (s && s.boards) || [];
  }
  function textOf(html) {
    return typeof DOMParser !== 'undefined'
      ? new DOMParser().parseFromString(html, 'text/html').body.textContent || ''
      : html.replace(/<[^>]*>/g, '');
  }
  async function mapLimit(items, fn) {
    var next = 0,
      result = new Array(items.length);
    await Promise.all(
      Array.from({ length: Math.min(6, items.length) }, async function () {
        while (next < items.length) {
          var i = next++;
          result[i] = await fn(items[i]);
        }
      }),
    );
    return result;
  }
  function indexTasks(boards) {
    var map = new Map();
    boards.forEach(function (b) {
      (b.cols || []).forEach(function (c) {
        (c.tasks || []).forEach(function (t, i) {
          if (map.has(t.id))
            throw new Error('Uma tarefa apareceu mais de uma vez. Atualize o quadro.');
          map.set(t.id, { task: t, board: b, col: c, index: i });
        });
      });
    });
    return map;
  }
  // Unchanged neighbours never need edit permission during a single-card reorder.
  function stableIds(before, after) {
    var pos = new Map(
        before.map(function (id, i) {
          return [id, i];
        }),
      ),
      a = after.filter(function (id) {
        return pos.has(id);
      }),
      tails = [],
      prev = new Array(a.length).fill(-1);
    a.forEach(function (id, i) {
      var lo = 0,
        hi = tails.length;
      while (lo < hi) {
        var m = (lo + hi) >> 1;
        if (pos.get(a[tails[m]]) < pos.get(id)) lo = m + 1;
        else hi = m;
      }
      if (lo) prev[i] = tails[lo - 1];
      tails[lo] = i;
    });
    var result = new Set(),
      k = tails[tails.length - 1];
    while (k !== undefined && k >= 0) {
      result.add(a[k]);
      k = prev[k];
    }
    return result;
  }
  /** @param {SyncBackendConfig} config */
  global.createVvoxSyncBackend = function (config) {
    config = config || {};
    var base = String(config.apiUrl || '').replace(/\/$/, ''),
      user = config.user || {},
      userId = user.id || user.userId || user.sub;
    var names = new Map(),
      ids = new Map(),
      people = [],
      profiles = Object.create(null),
      pending = false,
      lastLoadedIds = null;
    /** @param {string} path @param {SyncRequestOptions} [options] */
    async function api(path, options) {
      options = options || {};
      var headers = {
          Authorization:
            'Bearer ' + (typeof config.token === 'function' ? config.token() : config.token || ''),
        },
        body = options.body;
      if (body !== undefined && !(typeof FormData !== 'undefined' && body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }
      var response = await fetch(base + path, {
          method: options.method || 'GET',
          headers: headers,
          body: body,
          credentials: 'omit',
          signal: options.signal || config.signal,
        }),
        raw = await response.text(),
        data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (_) {
        data = null;
      }
      if (!response.ok) {
        var message = data && data.message,
          err = new Error(
            Array.isArray(message)
              ? message.join(' ')
              : message || 'Não foi possível salvar a alteração (' + response.status + ').',
          );
        err.status = response.status;
        err.data = data;
        throw err;
      }
      return data;
    }
    function peopleName(value) {
      if (!value) return '';
      return (
        names.get(typeof value === 'string' ? value : value.id) ||
        (typeof value === 'object' ? value.nome || value.name || '' : '')
      );
    }
    function nameToId(name) {
      if (!name) return null;
      if (!ids.has(name))
        throw new Error('A pessoa selecionada não está disponível. Atualize o quadro.');
      return ids.get(name);
    }
    api.nameToId = nameToId;
    api.userId = nameToId;
    api.peopleName = peopleName;
    api.getTask = function (id) {
      return api('/kanban/tarefas/' + encodeURIComponent(id));
    };
    function registerPeople(users, tasks) {
      var byId = new Map();
      users.forEach(function (p) {
        if (p.role !== 'CLIENTE') byId.set(p.id, p);
      });
      if (userId && !byId.has(userId)) byId.set(userId, Object.assign({}, user, { id: userId }));
      tasks.forEach(function (t) {
        [t.autor, t.revisor, t.responsavel]
          .concat(
            t.observadores || [],
            (t.comentarios || []).map(function (c) {
              return c.autor;
            }),
          )
          .forEach(function (p) {
            if (p && p.id && !byId.has(p.id)) byId.set(p.id, p);
          });
      });
      var count = new Map();
      byId.forEach(function (p) {
        var n = p.nome || p.name || p.email || 'Usuário';
        count.set(n, (count.get(n) || 0) + 1);
      });
      names = new Map();
      ids = new Map();
      people = [];
      profiles = Object.create(null);
      byId.forEach(function (p) {
        var n = p.nome || p.name || p.email || 'Usuário';
        if (count.get(n) > 1) n += ' (' + (p.email || p.id) + ')';
        while (ids.has(n)) n += ' · ' + p.id.slice(0, 8);
        names.set(p.id, n);
        ids.set(n, p.id);
        people.push(n);
        var handle = String(p.email || n)
          .split('@')[0]
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9._-]/gi, '.')
          .toLowerCase();
        if (
          Object.values(profiles).some(function (pf) {
            return pf.user === handle;
          })
        )
          handle += '.' + p.id.slice(0, 6);
        profiles[n] = {
          id: p.id,
          user: handle,
          email: p.email || '',
          photo: extrasHelper() ? extrasHelper().sanitizeImageUrl(p.fotoUrl || p.avatarUrl || '') : '',
          role: p.role,
        };
      });
    }
    function mapTask(t) {
      var tag = (t.tags || []).find(function (x) {
          return x.indexOf(CAT) === 0;
        }),
        description = t.descricao || '',
        rich = /<\/?[a-z][\s\S]*>/i.test(description);
      var value = {
        id: t.id,
        num: t.numero,
        numero: t.numero,
        title: t.titulo,
        client: t.clienteNome || (t.cliente && t.cliente.nomeFantasia) || '',
        source: t.fonte || '',
        note: t.subtitulo || [t.clienteNome || (t.cliente && t.cliente.nomeFantasia), t.fonte].filter(Boolean).join(' · '),
        links: (Array.isArray(t.linksReferencia) ? t.linksReferencia : []).map(function (link) {
          return { id: link.id, url: link.url, title: link.title || '', by: link.by || '', at: date(link.at) };
        }),
        desc: rich ? textOf(description) : description,
        descHtml: rich ? description : '',
        priority:
          Object.keys(PRIORITIES).find(function (k) {
            return PRIORITIES[k] === t.prioridade;
          }) || 'normal',
        category: tag
          ? tag.slice(CAT.length)
          : (t.servico && t.servico.tipoServico) ||
            (t.tags || []).find(function (x) {
              return x.indexOf('vvox:') !== 0;
            }) ||
            '',
        owner: peopleName(t.autor || t.autorId),
        lead: peopleName(t.revisor || t.revisorId),
        maker: peopleName(t.responsavel || t.responsavelId),
        createdAt: date(t.createdAt),
        dueAt: date(t.prazo),
        startedAt: date(t.dataInicio),
        deliveredAt: date(t.entregueEm || t.aprovadoEm || t.dataConclusao),
        acc: Math.max(
          0,
          t.tempo ? t.tempo.acumuladoSegundos * 1000 : (t.horasGastas || 0) * 3600000,
        ),
        since: t.tempo && t.tempo.sessaoAtiva ? date(t.tempo.sessaoAtiva.inicio).getTime() : null,
        viewers: (t.observadores || []).map(peopleName),
        steps: [],
        chat: [],
        files: [],
        _server: t,
      };
      var iconTag = (t.tags || []).find(function (tag) {
        return tag.indexOf(CATEGORY_ICON_TAG) === 0;
      });
      value.categoryIcon = categoryIcon(
        value.category,
        iconTag ? iconTag.slice(CATEGORY_ICON_TAG.length) : '',
      );
      var extras = global.VvoxSyncTaskExtras || global.vvoxSyncTaskExtras;
      if (extras) Object.assign(value, extras.mapTaskExtras(t, peopleName, userId));
      return value;
    }
    function mapColumn(c, tasks, fixed) {
      var def = LEGACY_DEFAULTS[c.statusLegado] || DEFAULTS[c.papel] || DEFAULTS.none,
        color =
          c.corInterface ||
          (fixed
            ? def[0]
            : Object.keys(COLORS).find(function (k) {
                return COLORS[k].toLowerCase() === String(c.cor).toLowerCase();
              }) || def[0]),
        icon = c.icone || def[1];
      return {
        id: c.id,
        name: c.nome,
        role: c.papel,
        color: color,
        accent: color,
        icon: icon,
        mk: c.marcador || 'dot',
        fill: !!c.preenchida,
        plan: typeof c.planoPublicacao === 'string' ? c.planoPublicacao : c.papel === 'queue' ? 'todo' : c.papel === 'review' ? 'sched' : '',
        def: { name: c.nome, color: color, icon: icon, role: c.papel },
        tasks: tasks
          .filter(function (t) {
            return t.colunaId === c.id;
          })
          .map(mapTask),
        _server: c,
      };
    }
    async function load() {
      var raw = await Promise.all([api('/kanban/quadros'), api('/users'), api('/tarefas')]),
        summaries = raw[2];
      if (config.workspaceId)
        summaries = summaries.filter(function (t) {
          return t.projetoId === config.workspaceId;
        });
      var tasks = await mapLimit(summaries, function (t) {
        return api.getTask(t.id);
      });
      registerPeople(raw[1], tasks);
      var boards = raw[0].map(function (b) {
        return {
          id: b.id,
          name: b.nome,
          desc:
            b.descricao ||
            (b.fixo ? 'Quadro de demandas do dia a dia, da entrada à entrega aprovada.' : ''),
          icon: b.icone || (b.fixo ? 'zap' : 'layout'),
          color: b.cor || (b.fixo ? 'gold' : 'teal'),
          fixed: !!b.fixo,
          cols: b.colunas.map(function (c) {
            return mapColumn(c, tasks, b.fixo);
          }),
          _server: b,
        };
      });
      lastLoadedIds = {
        boards: new Set(
          boards.map(function (b) {
            return b.id;
          }),
        ),
        columns: new Set(
          boards.flatMap(function (b) {
            return b.cols.map(function (c) {
              return c.id;
            });
          }),
        ),
        tasks: new Set(
          tasks.map(function (t) {
            return t.id;
          }),
        ),
      };
      return {
        boards: boards,
        PEOPLE: people.slice(),
        PROFILES: Object.fromEntries(Object.entries(profiles)),
        viewer: peopleName(userId),
        user: user,
      };
    }
    function boardPayload(b) {
      return {
        nome: b.name,
        descricao: b.desc || '',
        icone: b.icon || 'layout',
        cor: b.color || 'teal',
      };
    }
    function columnPayload(c, order) {
      var value = {
        nome: c.name,
        papel: c.role || 'none',
        cor: COLORS[c.color] || COLORS.gray,
        corInterface: c.color || 'gray',
        icone: c.icon || 'list',
        marcador: c.mk || 'dot',
        preenchida: !!c.fill,
        planoPublicacao: ['todo', 'sched'].includes(c.plan) ? c.plan : '',
      };
      if (order !== undefined) value.ordem = order;
      return value;
    }
    function taskPayload(t, raw) {
      if (!Object.prototype.hasOwnProperty.call(PRIORITIES, t.priority || 'normal'))
        throw new Error('Escolha uma prioridade disponível: Urgente, Alta, Normal ou Baixa.');
      var tags = ((raw && raw.tags) || []).filter(function (tag) {
        return tag.indexOf(CAT) !== 0 && tag.indexOf(CATEGORY_ICON_TAG) !== 0;
      });
      tags.push(CAT + (t.category || ''));
      if (t.category) tags.push(CATEGORY_ICON_TAG + categoryIcon(t.category, t.categoryIcon));
      return {
        titulo: t.title,
        descricao: t.descHtml || t.desc || '',
        clienteNome: t.client || '',
        fonte: t.source || '',
        subtitulo: t.note || '',
        linksReferencia: (t.links || []).map(function (link) {
          var value = { id: String(link.id), url: link.url, title: link.title || '', by: link.by || '' };
          if (iso(link.at)) value.at = iso(link.at);
          return value;
        }),
        prioridade: PRIORITIES[t.priority || 'normal'],
        prazo: iso(t.dueAt),
        responsavelId: nameToId(t.maker),
        revisorId: nameToId(t.lead),
        tags: tags,
      };
    }
    function extrasHelper() {
      return global.VvoxSyncTaskExtras || global.vvoxSyncTaskExtras;
    }
    async function command(id, action, payload) {
      if (!['iniciar', 'pausar', 'entregar', 'aprovar', 'corrigir', 'mover'].includes(action))
        throw new Error('Ação de tarefa inválida.');
      return api('/kanban/tarefas/' + encodeURIComponent(id) + '/' + action, {
        method: 'POST',
        body: payload || {},
      });
    }
    async function commit(before, after) {
      if (pending) throw new Error('Aguarde a alteração atual ser salva.');
      pending = true;
      try {
        var oldBoards = list(before),
          nextBoards = list(after),
          oldTasks = indexTasks(oldBoards),
          nextTasks = indexTasks(nextBoards),
          oldBoardMap = new Map(
            oldBoards.map(function (b) {
              return [b.id, b];
            }),
          ),
          oldCols = new Map();
        oldBoards.forEach(function (b) {
          b.cols.forEach(function (c) {
            oldCols.set(c.id, c);
          });
        });
        var boardIds = new Map(),
          columnIds = new Map(),
          taskIds = new Map(),
          current = new Map();
        oldTasks.forEach(function (e, id) {
          current.set(id, e.task._server);
        });
        var movedIds = new Set((after && after._syncMovedTaskIds) || []);
        var removed = (after && after._syncDeletes) || {},
          intents = {
            tasks: new Set(removed.tasks || []),
            columns: new Set(removed.columns || []),
            boards: new Set(removed.boards || []),
          };
        var nextBoardIds = new Set(
            nextBoards.map(function (b) {
              return b.id;
            }),
          ),
          nextColIds = new Set(
            nextBoards.flatMap(function (b) {
              return b.cols.map(function (c) {
                return c.id;
              });
            }),
          );
        // Absence is never deletion intent. Validate the complete loaded snapshot
        // and require IDs recorded by a confirmed, explicit delete interaction.
        if (!lastLoadedIds) throw new Error('Carregue os dados do servidor antes de salvar.');
        for (var kind of ['boards', 'columns', 'tasks']) {
          var oldSet =
            kind === 'boards'
              ? new Set(oldBoardMap.keys())
              : kind === 'columns'
                ? new Set(oldCols.keys())
                : new Set(oldTasks.keys());
          if (
            oldSet.size !== lastLoadedIds[kind].size ||
            Array.from(oldSet).some(function (id) {
              return !lastLoadedIds[kind].has(id);
            })
          )
            throw new Error('O estado da tela está incompleto. Atualize antes de salvar.');
          for (var target of intents[kind])
            if (!oldSet.has(target))
              throw new Error('A exclusão solicitada não corresponde a um registro carregado.');
        }
        for (var [oldTaskId] of oldTasks)
          if (!nextTasks.has(oldTaskId) && !intents.tasks.has(oldTaskId))
            throw new Error(
              'Uma tarefa saiu da tela sem uma ação explícita de exclusão. Atualize o quadro.',
            );
        for (var oldBoard of oldBoards) {
          if (!nextBoardIds.has(oldBoard.id)) {
            if (!intents.boards.has(oldBoard.id))
              throw new Error('A exclusão do quadro precisa ser confirmada.');
            if (
              oldBoard.cols.some(function (c) {
                return c.tasks.length;
              })
            )
              throw new Error('Só é possível excluir um quadro vazio.');
          } else
            for (var oldCol of oldBoard.cols)
              if (!nextColIds.has(oldCol.id) && !intents.columns.has(oldCol.id))
                throw new Error('A exclusão da coluna precisa ser confirmada.');
        }
        nextTasks.forEach(function (entry, id) {
          var taskExtras = extrasHelper();
          if (taskExtras) taskExtras.validateTaskExtras(entry.task);
          var old = oldTasks.get(id);
          taskPayload(entry.task, old && old.task._server);
          if (old && old.board.id !== entry.board.id)
            throw new Error('Mover tarefas entre quadros ainda não está disponível.');
          if (old && old.task.owner !== entry.task.owner)
            throw new Error('O proprietário é o autor original e não pode ser transferido.');
          if (!old && entry.task.owner && entry.task.owner !== peopleName(userId))
            throw new Error('Novas tarefas pertencem à conta que as criou.');
          if (!old && !['queue', 'none'].includes(entry.col.role))
            throw new Error(
              'Crie a tarefa em uma etapa inicial e depois use as ações de execução e aprovação.',
            );
        });
        for (var board of nextBoards) {
          var priorBoard = oldBoardMap.get(board.id);
          boardIds.set(board.id, board.id);
          if (!priorBoard) {
            var payload = boardPayload(board);
            payload.colunas = board.cols.map(function (c) {
              return columnPayload(c);
            });
            var createdBoard = await api('/kanban/quadros', { method: 'POST', body: payload });
            boardIds.set(board.id, createdBoard.id);
            board.cols.forEach(function (c, i) {
              columnIds.set(c.id, createdBoard.colunas[i].id);
            });
          } else {
            if (!same(boardPayload(priorBoard), boardPayload(board)))
              await api('/kanban/quadros/' + board.id, {
                method: 'PATCH',
                body: boardPayload(board),
              });
            for (var ci = 0; ci < board.cols.length; ci++) {
              var col = board.cols[ci],
                priorCol = oldCols.get(col.id);
              columnIds.set(col.id, col.id);
              if (!priorCol) {
                var createdCol = await api('/kanban/quadros/' + board.id + '/colunas', {
                  method: 'POST',
                  body: columnPayload(col),
                });
                columnIds.set(col.id, createdCol.id);
                await api('/kanban/colunas/' + createdCol.id, {
                  method: 'PATCH',
                  body: { ordem: ci },
                });
              } else {
                var pi = priorBoard.cols.findIndex(function (c) {
                  return c.id === col.id;
                });
                if (!same(columnPayload(priorCol, pi), columnPayload(col, ci)))
                  await api('/kanban/colunas/' + col.id, {
                    method: 'PATCH',
                    body: columnPayload(col, ci),
                  });
              }
            }
          }
        }
        // Only explicit confirmed task deletions reach the API; missing records
        // or deleted boards can never cascade into task deletion here.
        for (var deleteId of intents.tasks)
          if (!nextTasks.has(deleteId))
            await api('/tarefas/' + encodeURIComponent(deleteId), { method: 'DELETE' });
        for (var [id, entry] of nextTasks) {
          var oldEntry = oldTasks.get(id),
            task = entry.task,
            original = oldEntry && oldEntry.task._server;
          if (!oldEntry) {
            var create = taskPayload(task);
            create.quadroId = boardIds.get(entry.board.id);
            create.colunaId = columnIds.get(entry.col.id);
            if (config.workspaceId) create.projetoId = config.workspaceId;
            var created = await api('/tarefas', { method: 'POST', body: create });
            current.set(id, created);
            taskIds.set(id, created.id);
          } else {
            taskIds.set(id, id);
            var was = taskPayload(oldEntry.task, original),
              now = taskPayload(task, original),
              patch = {};
            Object.keys(now).forEach(function (k) {
              if (!same(was[k], now[k])) patch[k] = now[k];
            });
            if (Object.keys(patch).length) {
              patch.versao = original.versao;
              current.set(id, await api('/tarefas/' + id, { method: 'PATCH', body: patch }));
            }
          }
        }
        async function act(id, action, payload) {
          var result = await command(
            taskIds.get(id),
            action,
            Object.assign({}, payload || {}, { versao: current.get(id).versao }),
          );
          current.set(id, result);
          return result;
        }
        for (var [pauseId, pauseEntry] of nextTasks) {
          var previous = oldTasks.get(pauseId);
          if (
            previous &&
            previous.col.id === pauseEntry.col.id &&
            previous.task.since &&
            !pauseEntry.task.since &&
            current.get(pauseId).tempo.sessaoAtiva
          )
            await act(pauseId, 'pausar');
        }
        for (var wantedBoard of nextBoards)
          for (var wantedCol of wantedBoard.cols) {
            var oldColumn = oldCols.get(wantedCol.id),
              stable = stableIds(
                oldColumn
                  ? oldColumn.tasks
                      .filter(function (t) {
                        return !movedIds.has(t.id);
                      })
                      .map(function (t) {
                        return t.id;
                      })
                  : [],
                wantedCol.tasks.map(function (t) {
                  return t.id;
                }),
              );
            for (var position = wantedCol.tasks.length - 1; position >= 0; position--) {
              var wantedTask = wantedCol.tasks[position],
                oldLocation = oldTasks.get(wantedTask.id);
              if (
                !stable.has(wantedTask.id) ||
                (oldLocation && oldLocation.col.id !== wantedCol.id)
              ) {
                var move = { colunaId: columnIds.get(wantedCol.id) };
                if (position + 1 < wantedCol.tasks.length)
                  move.antesDeId = taskIds.get(wantedCol.tasks[position + 1].id);
                if (wantedTask._syncCorrectionReason)
                  move.motivo = wantedTask._syncCorrectionReason;
                await act(wantedTask.id, 'mover', move);
              }
            }
          }
        for (var [startId, startEntry] of nextTasks) {
          var prior = oldTasks.get(startId);
          if (
            startEntry.task.since &&
            (!prior || !prior.task.since) &&
            !current.get(startId).tempo.sessaoAtiva
          )
            await act(startId, 'iniciar');
        }
        var extras = extrasHelper();
        if (extras)
          for (var [extraId, extraEntry] of nextTasks) {
            var oldTask = oldTasks.get(extraId),
              raw = current.get(extraId),
              realId = taskIds.get(extraId);
            var beforeTask = oldTask
              ? Object.assign({}, oldTask.task, { id: realId, _server: raw })
              : { id: realId, steps: [], chat: [], files: [], viewers: [], _server: raw };
            await extras.commitExtras(
              beforeTask,
              Object.assign({}, extraEntry.task, { id: realId, _server: raw }),
              api,
              user,
            );
          }
        for (var columnId of intents.columns)
          if (!nextColIds.has(columnId))
            await api('/kanban/colunas/' + encodeURIComponent(columnId), { method: 'DELETE' });
        for (var boardId of intents.boards)
          if (!nextBoardIds.has(boardId))
            await api('/kanban/quadros/' + encodeURIComponent(boardId), { method: 'DELETE' });
        var state = await load();
        state.idMap = {
          boards: Object.fromEntries(boardIds),
          columns: Object.fromEntries(columnIds),
          tasks: Object.fromEntries(taskIds),
          all: Object.fromEntries([...boardIds, ...columnIds, ...taskIds]),
        };
        return state;
      } finally {
        pending = false;
      }
    }
    return {
      load: load,
      commit: commit,
      command: command,
      uploadAudio: function (task, file, duration) {
        var extras = extrasHelper();
        if (!extras || !extras.uploadAudio) throw new Error('O envio de áudio não está disponível. Atualize a página.');
        return extras.uploadAudio(task, file, api, user, duration);
      },
      api: api,
      user: user,
      peopleName: peopleName,
      nameToId: nameToId,
    };
  };
})(window);
