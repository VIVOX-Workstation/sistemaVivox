const fs = require('fs');
const path = require('path');

const token = '1|XF4JCgzFDlhhQwvmYhr6uL1xWIQRUDMyaYXvMG14ad659375';
const url = 'https://kpcoolify.vivoxmarketing.com.br';

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.trim().match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

async function addEnv(uuid, key, value) {
  try {
    const res = await fetch(url + '/api/v1/applications/' + uuid + '/envs', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, value, is_preview: false })
    });
    console.log('ENV', key, res.status);
    if (res.status !== 201) {
      console.log('Response:', await res.text());
    }
  } catch(e) {
    console.log('ENV ERR', key, e.message);
  }
}

async function main() {
  const backUuid = 'fspfs4v8y2bztilcxjrklddy';
  const frontUuid = 'vj4kejhoakuvvfjohfcdmizs';

  const backendEnvs = {
    DATABASE_URL: 'postgresql://vivox:vivoxpassword123@jg4ruirtlq74gerpljyyjuap:5432/vivox?schema=public',
    NODE_ENV: 'production',
    PORT: '3000',
    JWT_SECRET: envVars.JWT_SECRET || 'c8dfa976a47b4e98f023e85e1358ef9b62c7104b2a8f89e4',
    SETUP_TOKEN: 'setup_vivox_prod_98745',
    CORS_ORIGINS: 'https://flow.vivoxmarketing.com.br,http://localhost:5173',
    GROQ_API_KEY: envVars.GROQ_API_KEY,
    GOOGLE_CLIENT_EMAIL: envVars.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: envVars.GOOGLE_PRIVATE_KEY,
    GOOGLE_PROJECT_ID: envVars.GOOGLE_PROJECT_ID,
    OPENPANEL_API_URL: envVars.OPENPANEL_API_URL || 'https://opapi.convocacaovivox.site',
    S3_ENDPOINT: 'https://minio.vivoxmarketing.com.br',
    S3_PUBLIC_URL: 'https://minio.vivoxmarketing.com.br/vivox-media',
    S3_ACCESS_KEY: 'vivox',
    S3_SECRET_KEY: 'vivox12345',
    S3_BUCKET: 'vivox-media',
    S3_REGION: 'us-east-1',
    S3_FORCE_PATH_STYLE: 'true'
  };

  console.log('--- Enviando Envs do Backend ---');
  for (const [k, v] of Object.entries(backendEnvs)) {
    if (v) await addEnv(backUuid, k, v);
  }

  console.log('--- Enviando Envs do Frontend ---');
  await addEnv(frontUuid, 'VITE_API_URL', 'https://api.vivoxmarketing.com.br');

  console.log('Pronto!');
}

main();
