import { AnalyticsService } from './analytics.service';

// Regressão: metaAuthMethod só era gravado como 'INSTAGRAM' (login direto) e nunca
// voltava para 'FACEBOOK' nem era limpo. Um cliente que trocava de fluxo ficava
// marcado como INSTAGRAM e o token do Facebook era enviado para graph.instagram.com.
describe('metaAuthMethod nos fluxos da Meta', () => {
  let updates: any[];

  const build = (instagramAuth: any = {}) => {
    updates = [];
    const prisma = {
      cliente: {
        findUnique: async () => ({ id: 'cliente-1' }),
        update: async ({ data }: any) => { updates.push(data); return { id: 'cliente-1' }; },
      },
    };
    const none = null as any;
    return new AnalyticsService(prisma as any, none, none, none, none, none, instagramAuth as any, none, none);
  };

  const comInstagram = [{ id: 'page-1', name: 'Página', instagram_business_account: { id: 'ig-1', username: 'conta' } }];

  it('marca FACEBOOK ao conectar pelo fluxo de Página do Facebook', async () => {
    const service = build({
      exchangeCodeForLongLivedToken: async () => 'token-longo',
      getConnectedPagesAndInstagram: async () => comInstagram,
    });
    await service.handleInstagramCallback('cliente-1', 'code');
    expect(updates.at(-1).metaAuthMethod).toBe('FACEBOOK');
  });

  it('limpa o método quando nenhuma página tem Instagram vinculado', async () => {
    const service = build({
      exchangeCodeForLongLivedToken: async () => 'token-longo',
      getConnectedPagesAndInstagram: async () => [{ id: 'page-1', name: 'Página sem Instagram' }],
    });
    const resultado = await service.handleInstagramCallback('cliente-1', 'code');
    expect(resultado.success).toBe(false);
    expect(updates.at(-1).metaAuthMethod).toBeNull();
  });

  it('marca FACEBOOK ao selecionar outra conta do Instagram', async () => {
    const service = build();
    await service.selectInstagramAccount('cliente-1', { pageId: 'page-1', instagramAccountId: 'ig-2' });
    expect(updates.at(-1).metaAuthMethod).toBe('FACEBOOK');
  });

  it('limpa o método ao desconectar', async () => {
    const service = build();
    await service.disconnectInstagram('cliente-1');
    expect(updates.at(-1).metaAuthMethod).toBeNull();
  });
});
