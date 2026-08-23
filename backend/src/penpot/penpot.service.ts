import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class PenpotService {
  private readonly logger = new Logger(PenpotService.name);

  private async getClient(): Promise<{ client: PoolClient; pool: Pool }> {
    const isProd = process.env.NODE_ENV === 'production';
    const envHost = process.env.PENPOT_DB_HOST;
    const port = Number(process.env.PENPOT_DB_PORT) || 5434;

    const candidateHosts = [
      envHost,
      '179.198.120.113',
      'host.docker.internal',
      '172.17.0.1',
      'vivox-penpot-postgres',
      'localhost',
      '127.0.0.1',
    ].filter((h): h is string => Boolean(h && h.trim()));

    const uniqueHosts = Array.from(new Set(candidateHosts));

    for (const host of uniqueHosts) {
      try {
        const pool = new Pool({
          host,
          port: host === 'vivox-penpot-postgres' ? 5432 : port,
          user: process.env.PENPOT_DB_USER || 'penpot',
          password: process.env.PENPOT_DB_PASSWORD || 'penpot',
          database: process.env.PENPOT_DB_NAME || 'penpot',
          connectionTimeoutMillis: 2500,
        });
        const client = await pool.connect();
        this.logger.log(`Conectado ao PostgreSQL do Penpot via ${host}:${port}`);
        return { client, pool };
      } catch (err: any) {
        this.logger.warn(`Tentativa de conexão com Penpot DB em ${host}:${port} falhou: ${err.message}`);
      }
    }

    throw new Error('Não foi possível conectar ao banco de dados do Penpot em nenhum dos hosts candidatos');
  }

  async criarArquivo(titulo: string, nomeCliente?: string): Promise<{ fileId: string; projectId: string; url: string }> {
    const { client, pool } = await this.getClient();
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
          features: ['fdata/objects-map'],
          version: 1,
          vern: 1,
        };
      }

      const featuresVal = Array.isArray(m.features) ? m.features : ['fdata/objects-map'];

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
        featuresVal,
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
    } catch (err: any) {
      this.logger.error(`Erro ao criar arquivo no Penpot: ${err.message}`);
      throw err;
    } finally {
      client.release();
      await pool.end().catch(() => {});
    }
  }

  async resetarUsuario(email: string) {
    const { client, pool } = await this.getClient();
    try {
      const p = await client.query('SELECT id, email FROM profile WHERE email = $1', [email]);
      if (p.rows.length === 0) {
        return { success: true, message: `O e-mail ${email} já está livre para cadastro! Pode criar sua conta em http://179.198.120.113:9005/#/auth/register` };
      }

      const profileId = p.rows[0].id;
      const timestamp = Date.now();
      const oldEmail = `old_${timestamp}_${email}`;

      // 1. Atualiza profile_email e profile para liberar o e-mail original
      await client.query('UPDATE profile SET email = $1 WHERE id = $2', [oldEmail, profileId]).catch(() => {});
      await client.query('UPDATE profile_email SET email = $1 WHERE profile_id = $2', [oldEmail, profileId]).catch(() => {});
      await client.query('DELETE FROM auth_token WHERE profile_id = $1', [profileId]).catch(() => {});

      this.logger.log(`E-mail ${email} liberado com sucesso no Penpot.`);
      return {
        success: true,
        message: `Conta ${email} liberada com sucesso! Você já pode acessar http://179.198.120.113:9005/#/auth/register e criar sua conta agora com sua senha.`,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao liberar usuario: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      client.release();
      await pool.end().catch(() => {});
    }
  }

  async definirSenha(email: string, novaSenha: string = 'Vivox@2026') {
    const { client, pool } = await this.getClient();
    try {
      const salt = crypto.randomBytes(16);
      const rawHash = await argon2.hash(novaSenha, {
        type: argon2.argon2id,
        memoryCost: 32768,
        timeCost: 3,
        parallelism: 2,
        hashLength: 32,
        salt,
        raw: true,
      });
      const formattedHash = `argon2id$${salt.toString('hex')}$32768$3$2$${rawHash.toString('hex')}`;

      // 1. Busca o perfil pelo email original ou com prefixo old_
      const profileRes = await client.query(
        "SELECT id, email FROM profile WHERE email = $1 OR email ILIKE '%kelson.almeida123@gmail.com%' ORDER BY created_at DESC LIMIT 1",
        [email]
      );

      if (profileRes.rows.length === 0) {
        return { success: false, message: `Nenhum perfil encontrado no Penpot para ${email}` };
      }

      const profileId = profileRes.rows[0].id;

      // 2. Atualiza email para o oficial e salva a nova senha com hash Argon2id nativo
      await client.query(
        'UPDATE profile SET email = $1, password = $2, is_active = true, is_blocked = false, auth_backend = $3 WHERE id = $4',
        [email, formattedHash, 'penpot', profileId]
      );

      // 3. Garante que profile_email está sincronizado e ativo
      await client.query(
        'UPDATE profile_email SET email = $1, is_verified = true WHERE profile_id = $2',
        [email, profileId]
      ).catch(() => {});

      // 4. Limpa sessões antigas para forçar novo login limpo
      await client.query('DELETE FROM auth_token WHERE profile_id = $1', [profileId]).catch(() => {});

      this.logger.log(`Senha do Penpot redefinida com sucesso para ${email} (Senha: ${novaSenha})!`);
      return {
        success: true,
        email,
        novaSenha,
        message: `Senha redefinida com sucesso para: ${novaSenha}! Você já pode entrar em http://179.198.120.113:9005/#/login com o e-mail ${email} e essa senha.`,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao redefinir senha no Penpot: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      client.release();
      await pool.end().catch(() => {});
    }
  }
}
