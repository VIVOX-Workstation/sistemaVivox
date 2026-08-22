import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenPanelService } from '../analytics/openpanel/openpanel.service';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { encoding_for_model, Tiktoken } from 'tiktoken';
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private tokenizer: Tiktoken;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly openpanelService?: OpenPanelService,
  ) {
    this.tokenizer = encoding_for_model('text-embedding-3-small');
  }

  /**
   * Vetoriza um texto (PDF extraído, Site, Tendência) e salva no banco.
   * Divide o texto em chunks precisos por token e gera os embeddings.
   */
  async vectorizeText(
    clienteId: string,
    text: string,
    tipo: 'TEXTO' | 'LINK' | 'ARQUIVO' | 'TENDENCIA_SEMANA',
    titulo?: string,
  ) {
    this.logger.log(`Vetorizando texto para cliente ${clienteId} (${tipo})...`);

    // 1. Configurar o Splitter contando TOKENS reais, não caracteres genéricos
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      lengthFunction: (text: string) => this.tokenizer.encode(text).length,
    });

    // 2. Quebrar o texto longo em pedaços menores (chunks)
    const chunks = await splitter.createDocuments([text]);
    if (chunks.length === 0) return;

    const chunkTexts = chunks.map((c) => c.pageContent);

    // 3. Gerar Embeddings em lote
    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: chunkTexts,
    });

    // 4. Salvar no banco usando prisma.$executeRaw para prevenir SQL Injection no vetor
    for (let i = 0; i < chunkTexts.length; i++) {
      const conteudo = chunkTexts[i];
      const embeddingArray = embeddings[i];
      const embeddingStr = JSON.stringify(embeddingArray);

      // Usando cast ::vector seguro e queryRaw com bind parameters
      await this.prisma.$executeRaw`
        INSERT INTO "DocumentoVetorial" (
          "id", "clienteId", "conteudo", "tipo", "titulo", "vetor", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          ${clienteId},
          ${conteudo},
          ${tipo},
          ${titulo ?? null},
          ${embeddingStr}::vector,
          NOW(),
          NOW()
        );
      `;
    }

    this.logger.log(`Vetorização concluída. ${chunks.length} chunks salvos.`);
  }

  /**
   * Busca no banco de vetores os trechos mais relevantes para uma query de um cliente.
   * Garante isolamento estrito de tenant (clienteId).
   */
  async searchContext(clienteId: string, query: string, limit: number = 5) {
    // 1. Tenta busca vetorial se houver chave OpenAI configurada
    if (process.env.OPENAI_API_KEY) {
      try {
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-small'),
          value: query,
        });

        const embeddingStr = JSON.stringify(embedding);

        const matches = await this.prisma.$queryRaw<
          Array<{ id: string; conteudo: string; tipo: string; titulo: string | null }>
        >`
          SELECT "id", "conteudo", "tipo", "titulo" 
          FROM "DocumentoVetorial"
          WHERE "clienteId" = ${clienteId}
          ORDER BY vetor <=> ${embeddingStr}::vector
          LIMIT ${limit};
        `;

        if (matches && matches.length > 0) {
          return matches;
        }
      } catch (err) {
        this.logger.warn('Busca vetorial falhou, utilizando fallback textual direto.');
      }
    }

    // 2. Fallback Seguro: Busca os documentos e inteligências mais recentes do cliente diretamente
    try {
      const directDocs = await this.prisma.documentoVetorial.findMany({
        where: { clienteId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, conteudo: true, tipo: true, titulo: true },
      });
      return directDocs;
    } catch {
      return [];
    }
  }

  /**
   * Consolida TODO o cérebro e inteligência do cliente (Fontes, Mapa Mental, Briefing, Mercado, Perfil)
   */
  async getFullClientContext(clienteId: string): Promise<string> {
    try {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        include: {
          fontesContexto: true,
          inteligenciasMercado: {
            orderBy: { data: 'desc' },
            take: 3,
          },
          servicosContratados: {
            include: {
              planejamento: {
                include: {
                  escopoItens: true,
                  marcos: true,
                  referencias: true,
                },
              },
            },
          },
          producoes: {
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: {
              id: true,
              tipo: true,
              status: true,
              createdAt: true,
            },
          },
          publicacoes: {
            orderBy: { curtidas: 'desc' },
            take: 5,
            select: {
              tipo: true,
              alcance: true,
              curtidas: true,
              comentarios: true,
              compartilhamentos: true,
            },
          },
          oportunidades: {
            where: { status: 'ABERTA' },
            take: 5,
            select: {
              servicoSugerido: true,
              justificativa: true,
            },
          },
          documentosVetoriais: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!cliente) return '';

      let contextStr = `=== PERFIL DO CLIENTE ===\n`;
      contextStr += `Nome Fantasia / Marca: ${cliente.nomeFantasia}\n`;
      if (cliente.razaoSocial) contextStr += `Razão Social: ${cliente.razaoSocial}\n`;
      contextStr += `Segmento de Atuação: ${cliente.segmento}\n`;
      if (cliente.observacoes) contextStr += `Observações e Detalhes do Cliente: ${cliente.observacoes}\n`;

      if (cliente.fontesContexto && cliente.fontesContexto.length > 0) {
        contextStr += `\n=== FONTES & CONTEXTO DO SEGUNDO CÉREBRO (MAPA MENTAL DE ESTRATÉGIA) ===\n`;
        cliente.fontesContexto.forEach((f, idx) => {
          contextStr += `${idx + 1}. [${f.tipo}] ${f.titulo}\n   Detalhes / Conteúdo: ${f.descricao || '(Sem descrição detalhada)'}\n`;
        });
      }

      if (cliente.inteligenciasMercado && cliente.inteligenciasMercado.length > 0) {
        contextStr += `\n=== INTELIGÊNCIA DE MERCADO, TENDÊNCIAS E PESQUISAS ===\n`;
        cliente.inteligenciasMercado.forEach((i, idx) => {
          contextStr += `Pesquisa ${idx + 1} (${new Date(i.data).toLocaleDateString()}):\nResumo: ${i.resumo}\n`;
          if (i.tendencias) {
            contextStr += `Tendências Mapeadas: ${JSON.stringify(i.tendencias)}\n`;
          }
        });
      }

      if (cliente.servicosContratados && cliente.servicosContratados.length > 0) {
        contextStr += `\n=== SERVIÇOS CONTRATADOS & PLANEJAMENTOS ===\n`;
        cliente.servicosContratados.forEach((s) => {
          contextStr += `• Serviço: ${s.tipoServico} (Status: ${s.status})\n`;
          if (s.descricaoEscopo) contextStr += `  Escopo Geral: ${s.descricaoEscopo}\n`;
          if (s.planejamento) {
            if (s.planejamento.ideiaBriefing) {
              contextStr += `  Briefing / Direcionamento: ${s.planejamento.ideiaBriefing}\n`;
            }
            if (s.planejamento.escopoItens && s.planejamento.escopoItens.length > 0) {
              contextStr += `  Entregáveis Planejados:\n`;
              s.planejamento.escopoItens.forEach((item) => {
                contextStr += `    - ${item.titulo} (${item.status}) ${item.descricao ? `: ${item.descricao}` : ''}\n`;
              });
            }
          }
        });
      }

      if (cliente.producoes && cliente.producoes.length > 0) {
        contextStr += `\n=== HISTÓRICO DE PRODUÇÕES RECENTES ===\n`;
        cliente.producoes.forEach((p) => {
          contextStr += `- Formato: ${p.tipo} | Status: ${p.status}\n`;
        });
      }

      if (cliente.publicacoes && cliente.publicacoes.length > 0) {
        contextStr += `\n=== POSTS DE MAIOR PERFORMANCE / ENGAJAMENTO (REFERÊNCIAS) ===\n`;
        cliente.publicacoes.forEach((pub, idx) => {
          contextStr += `Top Post ${idx + 1}: Tipo: ${pub.tipo} | Curtidas: ${pub.curtidas || 0} | Comentários: ${pub.comentarios || 0} | Compartilhamentos: ${pub.compartilhamentos || 0}\n`;
        });
      }

      if (cliente.oportunidades && cliente.oportunidades.length > 0) {
        contextStr += `\n=== OPORTUNIDADES COMERCIAIS IDENTIFICADAS ===\n`;
        cliente.oportunidades.forEach((op) => {
          contextStr += `- Sugestão: ${op.servicoSugerido} (${op.justificativa || 'Sem justificativa'})\n`;
        });
      }

      // Métricas em Tempo Real do OpenPanel (Landing Page / Site)
      if (cliente.openpanelProjectId && this.openpanelService) {
        try {
          const openpanelRes = await this.openpanelService.getOpenPanelMetrics(
            cliente.openpanelProjectId,
            cliente.openpanelClientId,
            cliente.openpanelClientSecret,
            '30d',
          );

          if (openpanelRes && openpanelRes.success && openpanelRes.overview) {
            const ov = openpanelRes.overview;
            const durationMin = Math.floor(ov.avgSessionDuration / 60);
            const durationSec = ov.avgSessionDuration % 60;
            const durationFormatted = `${String(durationMin).padStart(2, '0')}:${String(durationSec).padStart(2, '0')}`;
            const whatsappCount = openpanelRes.whatsappClicks ? openpanelRes.whatsappClicks.length : 0;
            const whatsappConvRate = ov.totalSessions > 0 ? ((whatsappCount / ov.totalSessions) * 100).toFixed(0) : '0';

            contextStr += `\n=== MÉTRICAS REAIS DA LANDING PAGE / SITE (OPENPANEL EM TEMPO REAL) ===\n`;
            contextStr += `• Projeto OpenPanel: ${cliente.openpanelProjectId}\n`;
            contextStr += `• Visualizações Totais (Pageviews): ${ov.totalScreenViews}\n`;
            contextStr += `• Total de Sessões: ${ov.totalSessions}\n`;
            contextStr += `• Visitantes Únicos: ${ov.uniqueVisitors}\n`;
            contextStr += `• Páginas por Sessão: ${ov.viewsPerSession}\n`;
            contextStr += `• Duração Média da Sessão: ${durationFormatted} (${ov.avgSessionDuration} segundos)\n`;
            contextStr += `• Taxa de Rejeição (Bounce Rate): ${ov.bounceRate}%\n`;
            contextStr += `• Conversões WhatsApp: ${whatsappCount} cliques registrados (Taxa de Conversão: ${whatsappConvRate}%)\n`;

            if (openpanelRes.pages && openpanelRes.pages.length > 0) {
              contextStr += `• Principais Páginas Acessadas: ${openpanelRes.pages.map((p) => `${p.path} (${p.pageviews} views, ${p.sessions} sessões)`).join(', ')}\n`;
            }

            if (openpanelRes.referrers && openpanelRes.referrers.length > 0) {
              contextStr += `• Principais Origens de Tráfego: ${openpanelRes.referrers.map((s) => `${s.name}: ${s.sessions} sessões (${s.percentage}%)`).join(', ')}\n`;
            }
          }
        } catch (err) {
          this.logger.warn(`Não foi possível obter métricas do OpenPanel para cliente ${clienteId}: ${err}`);
        }
      }

      return contextStr;
    } catch (err) {
      this.logger.error('Erro ao consolidar contexto do cliente', err);
      return '';
    }
  }
}
