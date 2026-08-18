const { PrismaClient } = require('@prisma/client');
// Lê DATABASE_URL do ambiente (.env local ou variável exportada na hora) — nunca hardcoded aqui.
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Tentando conectar no banco...");
    await prisma.$connect();
    console.log("SUCESSO! ✅ Conexão estabelecida com o banco de dados no Coolify!");
  } catch (error) {
    console.error("FALHA! ❌ Erro ao conectar:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
