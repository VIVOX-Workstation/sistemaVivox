import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.planejamentoServico.deleteMany({}).then(() => console.log('Deleted')).catch(console.error).finally(() => prisma.$disconnect());
