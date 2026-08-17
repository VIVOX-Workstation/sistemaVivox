const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { google } = require('googleapis');
const creds = require('./google-credentials.json');

async function testGA4() {
  console.log('--- TESTANDO GOOGLE ANALYTICS 4 ---');
  const propertyId = '550043870'; // ID Real da Propriedade Dra. Manuela C...
  console.log('Service Account:', creds.client_email);
  console.log('Property ID:', propertyId);
  
  try {
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      projectId: creds.project_id,
    });

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'userEngagementDuration' },
        { name: 'bounceRate' },
      ],
    });

    console.log('✅ GA4 CONECTADO COM SUCESSO!');
    if (response && response.rows && response.rows.length > 0) {
      const values = response.rows[0].metricValues;
      console.log('📊 Métricas Reais do GA4 (Últimos 30 dias):');
      console.log('- Visualizações de Página (Page Views):', values[0]?.value);
      console.log('- Sessões (Sessions):', values[1]?.value);
      console.log('- Usuários Totais (Total Users):', values[2]?.value);
      console.log('- Duração Total de Engajamento (s):', values[3]?.value);
      console.log('- Taxa de Rejeição (Bounce Rate):', values[4]?.value);
    } else {
      console.log('ℹ️ Conexão autorizada! A propriedade ainda não possui eventos registrados nos últimos 30 dias.');
    }
  } catch (err) {
    console.error('❌ ERRO AO CONSULTAR GA4:', err.message);
  }
}

async function testGSC() {
  console.log('\n--- TESTANDO GOOGLE SEARCH CONSOLE ---');
  const siteUrl = 'sc-domain:dramanuelacordeiropediatra.com.br';
  console.log('Site URL:', siteUrl);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      projectId: creds.project_id,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const today = new Date();
    const endDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = new Date(today.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const queryRes = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: startDate,
        endDate: endDate,
        dimensions: ['query'],
        rowLimit: 5,
      },
    });

    console.log('✅ GSC CONECTADO COM SUCESSO!');
    console.log('📊 Top Consultas SEO Reais:', queryRes.data.rows || 'Sem cliques recentes.');
  } catch (err) {
    console.error('❌ ERRO AO CONSULTAR GSC:', err.message);
  }
}

async function run() {
  await testGA4();
  await testGSC();
}

run();
