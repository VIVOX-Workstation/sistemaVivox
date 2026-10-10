/* Persistence helpers for the unchanged VVOX Sync Artifact interface. */
(function (global) {
  'use strict';

  var MAX_FILE_BYTES = 350 * 1024 * 1024;
  var MAX_FILES = 30;
  var fileMetadata = new Map();
  var remoteBlobs = new Map();

  function array(value) { return Array.isArray(value) ? value : []; }
  function taskId(task) { return typeof task === 'string' ? task : task && task.id; }
  function pathId(id) { return encodeURIComponent(String(id)); }
  function serverId(item) { return item && (item._serverId || item._commentId || item.id); }
  function personName(person, lookup) {
    var name = typeof lookup === 'function' ? lookup(person) : '';
    return name || person && (person.nome || person.name) || 'Usuário';
  }
  function date(value) {
    if (value instanceof Date) return value;
    var parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  function attachmentURL(value) {
    try {
      var url = new URL(value);
      // These URLs are used by the original template in HTML attributes.
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      if (url.username || url.password) return null;
      return url.href.replace(/"/g, '%22').replace(/'/g, '%27').replace(/</g, '%3C').replace(/>/g, '%3E');
    } catch (_) { return null; }
  }
  function sanitizeImageUrl(value) {
    if (typeof value !== 'string' || !value) return '';
    if (value.length <= 90000 && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)) return value;
    var safe = attachmentURL(value);
    // Avatars are interpolated into CSS url() by the original renderer.
    return safe ? safe.replace(/[()\\\s]/g, function (character) { return '%' + character.charCodeAt(0).toString(16).toUpperCase(); }) : '';
  }
  function mapAttachment(comment, lookup, server, actorId) {
    if (!comment || comment.sistema) return null;
    var match = /^📎 Anexo: \[([^\r\n]*)\]\((https?:\/\/[^\s]+)\)$/.exec(comment.texto || '');
    if (!match) return null;
    var url = attachmentURL(match[2]);
    if (!url) return null;
    var meta = fileMetadata.get(comment.id) || {};
    return {
      id: comment.id, _serverId: comment.id, _commentId: comment.id,
      name: match[1], size: typeof comment.anexoTamanho === 'number' ? comment.anexoTamanho : typeof meta.size === 'number' ? meta.size : null,
      type: comment.anexoTipo || meta.type || '', url: url,
      by: personName(comment.autor, lookup), at: date(comment.createdAt),
      canRemove: !!(server && server.permissoes && server.permissoes.visualizar && (server.permissoes.editar || actorId && (server.responsavelId === actorId || comment.autorId === actorId))),
    };
  }
  function mapChat(comment, lookup) {
    var who = personName(comment.autor, lookup);
    var message = {
      id: comment.id, _serverId: comment.id,
      type: comment.sistema ? 'sys' : 'msg', who: who,
      text: comment.sistema ? who + ' ' + comment.texto : comment.texto,
      at: date(comment.createdAt),
    };
    if (typeof comment.audioDuracao === 'number' && !comment.sistema) {
      var attachment = mapAttachment(comment, lookup);
      if (attachment) {
        message.text = '';
        message.audio = { id: comment.id, url: attachment.url, name: attachment.name, size: attachment.size, type: attachment.type, dur: comment.audioDuracao };
      }
    }
    return message;
  }
  function mapTaskExtras(server, peopleNameFn, actorId) {
    var comments = array(server.comentarios);
    return {
      steps: array(server.checklist).slice().sort(function (a, b) { return a.ordem - b.ordem; }).map(function (item) {
        return { id: item.id, _serverId: item.id, _ordem: item.ordem, text: item.titulo, done: !!item.concluido, by: '', at: null };
      }),
      chat: comments.map(function (comment) { return mapChat(comment, peopleNameFn); }),
      files: comments.map(function (comment) { return mapAttachment(comment, peopleNameFn, server, actorId); }).filter(Boolean),
    };
  }
  function requireTask(task) {
    var id = taskId(task);
    if (!id) throw new Error('Salve a tarefa antes de alterar seus anexos ou etapas.');
    return id;
  }
  function ensureAllowed(task, permission, message) {
    var permissions = task && task._server && task._server.permissoes;
    if (permissions && permissions[permission] === false) throw new Error(message);
  }
  function stepMap(steps) {
    var result = new Map();
    array(steps).forEach(function (step, index) { result.set(String(serverId(step)), { item: step, index: index }); });
    return result;
  }
  function sameNames(a, b) {
    return JSON.stringify(Array.from(new Set(array(a))).sort()) === JSON.stringify(Array.from(new Set(array(b))).sort());
  }
  function chatKey(entry) {
    var at = entry.at instanceof Date ? entry.at.toISOString() : entry.at;
    return JSON.stringify([entry.type, entry.who || '', entry.text || '', at || '']);
  }
  function newMessages(before, after) {
    var counts = new Map();
    array(before).forEach(function (entry) {
      var key = entry._serverId || entry.id || chatKey(entry);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return array(after).filter(function (entry) {
      if (entry.type !== 'msg') return false;
      var key = entry._serverId || entry.id || chatKey(entry);
      var count = counts.get(key) || 0;
      if (count) { counts.set(key, count - 1); return false; }
      // IDs from the server denote persisted messages even if a stale snapshot lacks them.
      return !entry._serverId;
    });
  }

  async function uploadAttachment(task, file, api, user, audioDuration) {
    var id = requireTask(task);
    ensureAllowed(task, 'comentar', 'Você não tem permissão para anexar arquivos nesta tarefa.');
    if (!(file instanceof global.Blob)) throw new Error('Selecione um arquivo válido.');
    if (file.size > MAX_FILE_BYTES) throw new Error('O arquivo excede o limite de 350 MB.');
    var form = new global.FormData();
    form.append('file', file, file.name || 'arquivo');
    if (audioDuration !== undefined) form.append('audioDuracao', String(audioDuration));
    var comment = await api('/tarefas/' + pathId(id) + '/anexo', { method: 'POST', body: form });
    fileMetadata.set(comment.id, { size: file.size, type: file.type || '' });
    var mapped = mapAttachment(comment, api.peopleName, task && task._server, user && (user.id || user.userId || user.sub));
    if (!mapped) throw new Error('O arquivo foi enviado, mas sua resposta não pôde ser lida. Atualize a tarefa.');
    mapped.file = file;
    if (audioDuration !== undefined) mapped._audioMessage = mapChat(comment, api.peopleName);
    return mapped;
  }

  async function uploadAudio(task, file, api, user, duration) {
    if (!(file instanceof global.Blob)) throw new Error('Selecione um arquivo de áudio válido.');
    if (!/^audio\//.test(file.type) && !/\.(mp3|wav|m4a|ogg|oga|aac|webm|opus|amr|3gp)$/i.test(file.name || '')) throw new Error('Selecione um arquivo de áudio.');
    if (file.size > 25 * 1024 * 1024) throw new Error('O áudio passa de 25 MB.');
    if (array(task && task.files).length >= MAX_FILES) throw new Error('Limite de 30 anexos por tarefa.');
    var seconds = Math.min(86400, Math.max(0, Math.round(Number(duration) || 0)));
    var attachment = await uploadAttachment(task, file, api, user, seconds);
    if (!attachment._audioMessage || !attachment._audioMessage.audio) throw new Error('O áudio foi enviado, mas sua resposta não pôde ser lida. Atualize a tarefa.');
    return attachment._audioMessage;
  }

  async function upload(files, task, api, user) {
    var list = Array.from(files || []);
    if (array(task && task.files).length + list.length > MAX_FILES) throw new Error('Limite de 30 anexos por tarefa.');
    list.forEach(function (file) {
      if (!(file instanceof global.Blob)) throw new Error('Selecione um arquivo válido.');
      if (file.size > MAX_FILE_BYTES) throw new Error('"' + (file.name || 'Arquivo') + '" excede o limite de 350 MB.');
    });
    var completed = [];
    try {
      for (var i = 0; i < list.length; i++) completed.push(await uploadAttachment(task, list[i], api, user));
    } catch (error) {
      error.completedFiles = completed;
      if (completed.length) error.message = completed.length + ' arquivo(s) enviado(s). ' + error.message;
      throw error;
    }
    return completed;
  }

  function validateTaskExtras(task) {
    if (!task || !Array.isArray(task.steps) || !Array.isArray(task.chat) || !Array.isArray(task.files)) {
      throw new Error('O conteúdo da tarefa está incompleto. Atualize antes de salvar.');
    }
  }
  async function commitExtras(before, after, api, user) {
    validateTaskExtras(before); validateTaskExtras(after);
    var id = requireTask(after);
    var oldSteps = stepMap(before.steps), nextSteps = stepMap(after.steps);
    var oldFiles = array(before.files), nextFiles = array(after.files);
    var messages = newMessages(before.chat, after.chat);
    var viewersChanged = !sameNames(before.viewers, after.viewers);
    var viewerIds;
    if (viewersChanged) {
      ensureAllowed(after, 'editar', 'Você não tem permissão para alterar os visualizadores.');
      var resolve = api.nameToId || api.userId;
      if (typeof resolve !== 'function') throw new Error('A lista de pessoas ainda não foi carregada.');
      viewerIds = Array.from(new Set(array(after.viewers).map(function (name) {
        var personId = resolve(name);
        if (!personId) throw new Error('Visualizador não encontrado: ' + name + '.');
        return personId;
      })));
    }
    if (messages.length) ensureAllowed(after, 'comentar', 'Você não tem permissão para comentar nesta tarefa.');
    if (messages.some(function (message) { return message.audio && !message._serverId; })) {
      throw new Error('Envie o áudio pelo botão de anexo antes de salvar a conversa.');
    }
    var structuralChange = oldSteps.size !== nextSteps.size;
    oldSteps.forEach(function (previous, key) {
      var next = nextSteps.get(key);
      if (!next || next.item.text !== previous.item.text || next.index !== previous.index) structuralChange = true;
      if (next && !!next.item.done !== !!previous.item.done) ensureAllowed(after, 'marcarChecklist', 'Você não tem permissão para marcar as etapas.');
    });
    if (structuralChange) ensureAllowed(after, 'editarChecklist', 'Você não tem permissão para editar as etapas.');
    var changed = false;
    // Persist real IDs on the in-memory entries so retries never create duplicates.
    for (var previous of oldSteps.values()) {
      if (!nextSteps.has(String(serverId(previous.item)))) {
        await api('/tarefas/checklist/' + pathId(serverId(previous.item)), { method: 'DELETE' });
        changed = true;
      }
    }
    for (var index = 0; index < array(after.steps).length; index++) {
      var step = after.steps[index], key = String(serverId(step)), old = oldSteps.get(key);
      if (!old) {
        if (step._serverId) continue;
        var created = await api('/tarefas/' + pathId(id) + '/checklist', { method: 'POST', body: { titulo: step.text, ordem: index } });
        step.id = created.id; step._serverId = created.id; step._ordem = created.ordem;
        if (step.done) await api('/tarefas/checklist/' + pathId(created.id), { method: 'PATCH', body: { concluido: true } });
        changed = true;
      } else {
        var patch = {};
        if (step.text !== old.item.text) patch.titulo = step.text;
        if (!!step.done !== !!old.item.done) patch.concluido = !!step.done;
        // Do not send ordem when only checking a box: it needs a separate permission.
        if (index !== old.index) patch.ordem = index;
        if (Object.keys(patch).length) {
          var updated = await api('/tarefas/checklist/' + pathId(serverId(step)), { method: 'PATCH', body: patch });
          step._ordem = updated.ordem;
          changed = true;
        }
      }
    }
    for (var message of messages) {
      if (!String(message.text || '').trim()) continue;
      var saved = await api('/tarefas/' + pathId(id) + '/comentarios', { method: 'POST', body: { texto: message.text } });
      Object.assign(message, mapChat(saved, api.peopleName));
      changed = true;
    }
    var nextFileIds = new Set(nextFiles.map(function (file) { return String(serverId(file)); }));
    for (var file of oldFiles) {
      if (!nextFileIds.has(String(serverId(file)))) {
        await api('/tarefas/' + pathId(id) + '/anexos/' + pathId(file._commentId || serverId(file)), { method: 'DELETE' });
        changed = true;
      }
    }
    var oldFileIds = new Set(oldFiles.map(function (file) { return String(serverId(file)); }));
    for (var nextFile of nextFiles) {
      if (!nextFile._serverId && !nextFile._commentId && !oldFileIds.has(String(nextFile.id))) {
        var uploaded = await uploadAttachment(after, nextFile.file, api, user);
        Object.assign(nextFile, uploaded);
        changed = true;
      }
    }
    if (viewersChanged) {
      await api('/tarefas/' + pathId(id) + '/observadores', { method: 'PATCH', body: { observadorIds: viewerIds } });
      changed = true;
    }
    return changed && typeof api.getTask === 'function' ? api.getTask(id) : null;
  }

  async function getFileBlob(file) {
    if (file.file instanceof global.Blob) return file.file;
    var url = attachmentURL(file.url);
    if (!url) throw new Error('Endereço do anexo inválido.');
    if (!remoteBlobs.has(url)) {
      var request = global.fetch(url, { credentials: 'omit' }).then(function (response) {
        if (!response.ok) throw new Error('Não foi possível baixar o anexo (' + response.status + ').');
        return response.blob();
      }).catch(function (error) { remoteBlobs.delete(url); throw error; });
      remoteBlobs.set(url, request);
    }
    var blob = await remoteBlobs.get(url);
    file.size = blob.size;
    if (blob.type) file.type = blob.type;
    fileMetadata.set(file._commentId || serverId(file), { size: blob.size, type: blob.type || '' });
    return blob;
  }
  async function getFileArrayBuffer(file) { return (await getFileBlob(file)).arrayBuffer(); }

  var helpers = {
    mapTaskExtras: mapTaskExtras, commitExtras: commitExtras, validateTaskExtras: validateTaskExtras, sanitizeImageUrl: sanitizeImageUrl,
    uploadAttachment: uploadAttachment, upload: upload, uploadFiles: upload, uploadAudio: uploadAudio,
    getFileBlob: getFileBlob, getFileArrayBuffer: getFileArrayBuffer,
  };
  global.VvoxSyncTaskExtras = helpers;
  global.vvoxSyncTaskExtras = helpers;
})(window);
