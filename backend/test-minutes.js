const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const creds = require('./google-credentials.json');

async function testMinutes() {
  console.log('--- TESTANDO GA4 REALTIME MINUTES AGO ---');
  const propertyId = '550043870';
  
  try {
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      projectId: creds.project_id,
    });

    // 1. Minutos atrás (minutesAgo) no Realtime Report
    const [minutesRes] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'minutesAgo' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'minutesAgo' }, desc: true }]
    });

    console.log('✅ Resposta por minutesAgo:');
    if (minutesRes.rows && minutesRes.rows.length > 0) {
      minutesRes.rows.forEach(r => {
        console.log(`Minuto ${r.dimensionValues[0]?.value} atrás: ${r.metricValues[0]?.value} usuários`);
      });
    } else {
      console.log('Sem dados de minutesAgo ou 0 usuários nos minutos recentes.');
    }

  } catch (err) {
    console.error('❌ ERRO NO TESTE DE MINUTOS:', err.message);
  }
}

testMinutes();
