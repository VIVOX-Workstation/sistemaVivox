import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { encoding_for_model, Tiktoken } from 'tiktoken';
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private tokenizer: Tiktoken;

  constructor(private readonly prisma: PrismaService) {
    // Inicializa o tokenizer para o mesmo modelo de embedding que usaremos
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
    // 1. Gerar o vetor da pergunta
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: query,
    });

    const embeddingStr = JSON.stringify(embedding);

    // 2. Busca por Similaridade (Cosine Similarity <=>)
    // Aplica filtro rigoroso por clienteId para isolamento (Tenant)
    // OBS FUTURA: Para chunks do tipo 'TENDENCIA_SEMANA', aplicar filtro de recência se necessário.
    const matches = await this.prisma.$queryRaw<
      Array<{ id: string; conteudo: string; tipo: string; titulo: string | null }>
    >`
      SELECT "id", "conteudo", "tipo", "titulo" 
      FROM "DocumentoVetorial"
      WHERE "clienteId" = ${clienteId}
      ORDER BY vetor <=> ${embeddingStr}::vector
      LIMIT ${limit};
    `;

    return matches;
  }
}
