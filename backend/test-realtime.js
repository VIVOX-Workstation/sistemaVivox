const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const creds = require('./google-credentials.json');

async function testRealtime() {
  console.log('--- TESTANDO GA4 REALTIME REPORT ---');
  const propertyId = '550043870';
  
  try {
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      projectId: creds.project_id,
    });

    // 1. Total de usuários ativos agora (últimos 30 minutos)
    const [summaryRes] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'eventCount' }],
    });

    console.log('✅ REALTIME REPORT EXECUTADO COM SUCESSO!');
    const summaryRow = summaryRes.rows?.[0];
    console.log('📊 Usuários Ativos nos últimos 30 minutos:', summaryRow?.metricValues?.[0]?.value || '0');
    console.log('📊 Visualizações de tela em tempo real:', summaryRow?.metricValues?.[1]?.value || '0');
    console.log('📊 Eventos em tempo real:', summaryRow?.metricValues?.[2]?.value || '0');

    // 2. Páginas ativas agora
    const [pagesRes] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 10,
    });

    console.log('📄 Páginas com usuários agora:');
    if (pagesRes.rows && pagesRes.rows.length > 0) {
      pagesRes.rows.forEach(r => {
        console.log(`- ${r.dimensionValues[0]?.value}: ${r.metricValues[0]?.value} usuários`);
      });
    } else {
      console.log('Nenhum usuário navegando neste instante (0 ativos nos últimos 30 min).');
    }

    // 3. Dispositivos ativos
    const [devicesRes] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    });

    console.log('📱 Dispositivos em tempo real:');
    if (devicesRes.rows && devicesRes.rows.length > 0) {
      devicesRes.rows.forEach(r => {
        console.log(`- ${r.dimensionValues[0]?.value}: ${r.metricValues[0]?.value} usuários`);
      });
    }
  } catch (err) {
    console.error('❌ ERRO NO REALTIME GA4:', err.message);
  }
}

testRealtime();
