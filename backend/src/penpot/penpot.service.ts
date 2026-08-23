import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PenpotService {
  private readonly logger = new Logger(PenpotService.name);
  private pool: Pool;

  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    const host = process.env.PENPOT_DB_HOST || (isProd ? '179.198.120.113' : 'localhost');
    const port = Number(process.env.PENPOT_DB_PORT) || (isProd ? 5434 : 5432);

    this.pool = new Pool({
      host,
      port,
      user: process.env.PENPOT_DB_USER || 'penpot',
      password: process.env.PENPOT_DB_PASSWORD || 'penpot',
      database: process.env.PENPOT_DB_NAME || 'penpot',
      connectionTimeoutMillis: 5000,
    });
  }

  async criarArquivo(titulo: string, nomeCliente?: string): Promise<{ fileId: string; projectId: string; url: string }> {
    const client = await this.pool.connect();
    try {
      // 1. Busca a Organização/Time principal (ex: VIVOX, priorizando times não-default)
      let teamRes = await client.query(
        "SELECT id, name FROM team WHERE is_default = false OR name ILIKE '%vivox%' ORDER BY is_default ASC LIMIT 1"
      );
      let teamId = teamRes.rows[0]?.id;

      if (!teamId) {
        // Busca qualquer time existente no Penpot
        const anyTeam = await client.query('SELECT id FROM team ORDER BY created_at ASC LIMIT 1');
        teamId = anyTeam.rows[0]?.id;
      }

      if (!teamId) {
        // Se ainda não há time, cria um time default da agência VIVOX
        const newTeam = await client.query(
          "INSERT INTO team (id, name, is_default) VALUES (gen_random_uuid(), 'VIVOX Comunicação', false) RETURNING id"
        );
        teamId = newTeam.rows[0]?.id;
      }

      // 2. Busca ou cria o Projeto correspondente ao Cliente dentro da Organização VIVOX
      const projectName = nomeCliente && nomeCliente.trim() ? nomeCliente.trim() : 'Projetos Gerais';
      let projectRes = await client.query(
        'SELECT id FROM project WHERE team_id = $1 AND name = $2 AND deleted_at IS NULL LIMIT 1',
        [teamId, projectName]
      );

      let projectId = projectRes.rows[0]?.id;

      if (!projectId) {
        // Se ainda não existe projeto para este cliente na organização, cria automaticamente
        const novoProjetoRes = await client.query(
          'INSERT INTO project (id, team_id, name, is_default) VALUES (gen_random_uuid(), $1, $2, false) RETURNING id',
          [teamId, projectName]
        );
        projectId = novoProjetoRes.rows[0].id;
      }

      // 3. Busca o template binário do arquivo base (prioriza Template_Limpo ou arquivos recentes)
      const modelRes = await client.query(
        `SELECT is_shared, has_media_trimmed, revn, data, features, version, vern 
         FROM file 
         WHERE data IS NOT NULL 
         ORDER BY (name = 'Template_Limpo' OR name = 'Template' OR name = 'Template Vazio') DESC, created_at DESC 
         LIMIT 1`
      );

      let m = modelRes.rows[0];
      if (!m) {
        m = {
          is_shared: false,
          has_media_trimmed: false,
          revn: 0,
          data: null,
          features: '["fdata/objects-map"]',
          version: 1,
          vern: 1,
        };
      }

      // Insere o novo arquivo na Organização e Projeto corretos com revn 0
      const insertQuery = `
        INSERT INTO file (id, project_id, name, is_shared, has_media_trimmed, revn, data, features, version, vern)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 0, $5, $6, $7, $8)
        RETURNING id, project_id, name
      `;
      const values = [
        projectId,
        titulo,
        m.is_shared || false,
        m.has_media_trimmed || false,
        m.data,
        m.features,
        m.version || 1,
        m.vern || 0,
      ];

      const res = await client.query(insertQuery, values);
      const row = res.rows[0];
      const isProd = process.env.NODE_ENV === 'production';
      const penpotHost = process.env.PENPOT_PUBLIC_URI || (isProd ? 'http://179.198.120.113:9005' : 'http://localhost:9005');
      const fileUrl = `${penpotHost}/#/workspace/${row.project_id}/${row.id}`;

      this.logger.log(`Arquivo criado na Organização VIVOX [Projeto: ${projectName}]: ${row.name} -> ${fileUrl}`);

      return {
        fileId: row.id,
        projectId: row.project_id,
        url: fileUrl,
      };
    } catch (err) {
      this.logger.error('Erro ao criar arquivo no Penpot:', err);
      throw err;
    } finally {
      client.release();
    }
  }
}
