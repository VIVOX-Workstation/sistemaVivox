const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://equipe_vivox:Vivox_2026_Database!@179.198.120.113:5432/vivox?schema=public"
    }
  }
});

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
