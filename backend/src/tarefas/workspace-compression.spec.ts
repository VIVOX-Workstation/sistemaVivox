import express from 'express';
import request from 'supertest';
import { workspaceCompression } from './workspace-compression';

describe('compressão das respostas do workspace', () => {
  const payload = Array.from({ length: 100 }, (_, id) => ({
    id, titulo: 'Tarefa com acentuação e descrição preservada', status: 'CONCLUIDA',
  }));
  const app = express();
  app.use(['/tarefas', '/projetos'], workspaceCompression());
  app.get('/tarefas', (_req, res) => res.json(payload));
  app.get('/projetos', (_req, res) => res.json({ id: 'workspace' }));
  app.get('/assistant/stream', (_req, res) => res.type('text/event-stream').send('data: teste\n\n'));

  it('comprime a lista grande sem alterar tarefas ou caracteres', async () => {
    const response = await request(app).get('/tarefas').set('Accept-Encoding', 'gzip').expect(200);
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.headers.vary).toContain('Accept-Encoding');
    expect(response.body).toEqual(payload);
  });

  it('continua atendendo clientes sem suporte à compressão', async () => {
    const response = await request(app).get('/tarefas').set('Accept-Encoding', 'identity').expect(200);
    expect(response.headers['content-encoding']).toBeUndefined();
    expect(response.body).toEqual(payload);
  });

  it('não comprime respostas pequenas nem o streaming do assistente', async () => {
    const small = await request(app).get('/projetos').set('Accept-Encoding', 'gzip').expect(200);
    const stream = await request(app).get('/assistant/stream').set('Accept-Encoding', 'gzip').expect(200);
    expect(small.headers['content-encoding']).toBeUndefined();
    expect(stream.headers['content-encoding']).toBeUndefined();
    expect(stream.text).toBe('data: teste\n\n');
  });
});
