import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Criando extensão vector se não existir...');
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  
  console.log('Criando índice HNSW na coluna vetor (DocumentoVetorial)...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DocumentoVetorial_vetor_hnsw_idx" 
      ON "DocumentoVetorial" 
      USING hnsw (vetor vector_cosine_ops);
    `);
    console.log('Índice HNSW criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar índice HNSW:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
