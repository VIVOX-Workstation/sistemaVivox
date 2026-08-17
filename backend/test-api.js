const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testEndpoint() {
  const user = await prisma.user.findFirst();
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'troque-por-um-segredo-forte',
    { expiresIn: '1h' }
  );

  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/analytics/google/c0bc26a4-8ea7-42a9-8bf8-3fa75d6681af?days=30&refresh=true',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('--- RESPOSTA DE PÁGINAS DO GA4 REAL ---');
        console.log('Páginas:', parsed.ga4?.pages);
        console.log('Eventos:', parsed.ga4?.events);
        console.log('Overview:', parsed.ga4?.overview);
      } catch (e) {
        console.log('Raw:', data);
      }
    });
  });

  req.on('error', console.error);
  req.end();
}

testEndpoint()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
