const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const rootDir = path.resolve(__dirname, '..');
const envExamplePath = path.join(rootDir, '.env.example');
const envPath = path.join(rootDir, '.env');

async function main() {
  console.log('--- Validador de Variáveis de Ambiente de Produção ---');
  
  if (!fs.existsSync(envExamplePath)) {
    console.error(`Erro: Arquivo .env.example não encontrado em ${envExamplePath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(envPath)) {
    console.error(`Erro: Arquivo .env (com credenciais do Coolify) não encontrado em ${envPath}`);
    process.exit(1);
  }
  
  // Ler .env.example para obter as chaves esperadas
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  const expectedKeys = envExampleContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const match = line.match(/^([^=]+)=/);
      return match ? match[1].trim() : null;
    })
    .filter(key => key);
    
  console.log(`Carregadas ${expectedKeys.length} chaves esperadas do .env.example.`);
  
  // Ler .env para obter credenciais do Coolify
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
  
  const coolifyUrl = envVars.COOLIFY_URL;
  const coolifyApiKey = envVars.COOLIFY_API_KEY;
  const appBackendUuid = envVars.COOLIFY_APP_BACKEND_UUID;
  
  if (!coolifyUrl || !coolifyApiKey || !appBackendUuid) {
    console.error('Erro: Credenciais do Coolify (COOLIFY_URL, COOLIFY_API_KEY, COOLIFY_APP_BACKEND_UUID) não encontradas no .env da raiz.');
    process.exit(1);
  }
  
  console.log(`Conectando ao Coolify em ${coolifyUrl}...`);
  
  try {
    const response = await fetch(`${coolifyUrl}/api/v1/applications/${appBackendUuid}/envs`, {
      headers: {
        'Authorization': `Bearer ${coolifyApiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API do Coolify: ${response.status} ${response.statusText}`);
    }
    
    const prodEnvs = await response.json();
    
    // Filtrar apenas as variáveis de produção real (is_preview === false)
    const prodRealEnvs = prodEnvs.filter(e => e.is_preview === false);
    const prodEnvsMap = {};
    prodRealEnvs.forEach(e => {
      prodEnvsMap[e.key] = e.value;
    });
    
    console.log(`\nVerificando variáveis no escopo de produção (Total no Coolify: ${prodRealEnvs.length}):`);
    
    let issuesFound = 0;
    
    // Lista de variáveis que podem ser ignoradas (chaves locais de setup, etc.)
    const ignoreList = ['SETUP_TOKEN', 'PORT'];
    
    for (const key of expectedKeys) {
      if (ignoreList.includes(key)) continue;
      
      const prodValue = prodEnvsMap[key];
      
      if (prodValue === undefined) {
        console.warn(`\x1b[33m⚠️  Mapeamento ausente:\x1b[0m Variável "${key}" está no .env.example mas NÃO está configurada na produção do Coolify.`);
        issuesFound++;
      } else {
        // Validar se o valor contém localhost
        if (prodValue && prodValue.includes('localhost')) {
          console.error(`\x1b[31m❌  Configuração incorreta:\x1b[0m A variável "${key}" em produção contém "localhost" no valor: "${prodValue}"`);
          issuesFound++;
        }
      }
    }
    
    if (issuesFound === 0) {
      console.log('\x1b[32m✅  Sucesso!\x1b[0m Todas as variáveis críticas de produção estão mapeadas e parecem válidas.');
    } else {
      console.warn(`\nForam encontrados ${issuesFound} potenciais problemas nas variáveis de produção.`);
    }
  } catch (error) {
    console.error('Falha ao validar variáveis de ambiente:', error.message);
    process.exit(1);
  }
}

main();
