const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateClient() {
  const updated = await prisma.cliente.update({
    where: { id: 'c0bc26a4-8ea7-42a9-8bf8-3fa75d6681af' },
    data: {
      ga4PropertyId: '550043870',
      gscSiteUrl: 'sc-domain:dramanuelacordeiropediatra.com.br',
    },
  });
  console.log('✅ Cliente Kelson atualizado com os IDs reais do Google:', updated.nomeFantasia);
}

updateClient()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
