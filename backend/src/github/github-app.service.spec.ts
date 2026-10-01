import { generateKeyPairSync } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { GithubAppService } from './github-app.service';

describe('GithubAppService', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const originalEnv = { ...process.env };
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.GITHUB_APP_ID = '123';
    process.env.GITHUB_APP_PRIVATE_KEY = privateKey;
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it.each([
    privateKey,
    `"${privateKey.replace(/\n/g, '\\n')}"`,
    `'${privateKey.replace(/\n/g, '\\r\\n')}'`,
    privateKey.replace(/\n/g, '\\\\n'),
  ])('authenticates with a PEM environment representation %#', async (key) => {
    process.env.GITHUB_APP_PRIVATE_KEY = key;
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ id: 42 }] });
    await expect(new GithubAppService().listAppInstallations()).resolves.toEqual([{ id: 42 }]);
    const token = fetchMock.mock.calls[0][1].headers.Authorization.slice(7);
    expect(jwt.verify(token, publicKey, { algorithms: ['RS256'] })).toMatchObject({ iss: '123' });
  });

  it('reports missing credentials instead of pretending the app is not installed', async () => {
    delete process.env.GITHUB_APP_PRIVATE_KEY;
    await expect(new GithubAppService().listAppInstallations()).rejects.toThrow('incompletas');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports an invalid key without exposing its contents', async () => {
    process.env.GITHUB_APP_PRIVATE_KEY = 'invalid-secret';
    await expect(new GithubAppService().listAppInstallations()).rejects.toThrow('chave privada');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('distinguishes rejected credentials from no installations', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    await expect(new GithubAppService().listAppInstallations()).rejects.toThrow('HTTP 401');
  });

  it('keeps a genuinely empty installation list', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    await expect(new GithubAppService().listAppInstallations()).resolves.toEqual([]);
  });

  it('reports network failures', async () => {
    fetchMock.mockRejectedValue(new Error('network failure'));
    await expect(new GithubAppService().listAppInstallations()).rejects.toThrow('acessar o GitHub');
  });
});
