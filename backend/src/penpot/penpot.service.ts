import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PenpotService {
  private readonly logger = new Logger(PenpotService.name);
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.PENPOT_DB_HOST || 'vivox-penpot-postgres',
      port: 5432,
      user: process.env.PENPOT_DB_USER || 'penpot',
      password: process.env.PENPOT_DB_PASSWORD || 'penpot',
      database: process.env.PENPOT_DB_NAME || 'penpot',
    });
  }

  async criarArquivo(titulo: string, nomeCliente?: string): Promise<{ fileId: string; projectId: string; url: string }> {
    const client = await this.pool.connect();
    try {
      // 1. Busca a Organização/Time principal (ex: VIVOX, priorizando times não-default)
      const teamRes = await client.query(
        "SELECT id, name FROM team WHERE is_default = false OR name ILIKE '%vivox%' ORDER BY is_default ASC LIMIT 1"
      );
      const teamId = teamRes.rows[0]?.id;

      if (!teamId) {
        throw new Error('Nenhuma organização encontrada no Penpot');
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

      if (modelRes.rows.length === 0) {
        throw new Error('Nenhum arquivo base encontrado no Penpot para modelo');
      }

      const m = modelRes.rows[0];

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
      const penpotHost = process.env.PENPOT_PUBLIC_URI || 'http://localhost:9005';
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
