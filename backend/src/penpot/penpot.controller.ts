import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PenpotService } from './penpot.service';

@Controller('penpot')
export class PenpotController {
  private readonly logger = new Logger(PenpotController.name);

  constructor(private readonly penpotService: PenpotService) {}

  @Post('criar-arquivo')
  async criarArquivo(@Body() body: { titulo?: string; clienteNome?: string }) {
    try {
      const res = await this.penpotService.criarArquivo(body.titulo || 'Novo Arquivo', body.clienteNome);
      return res;
    } catch (err: any) {
      this.logger.error(`Falha ao criar arquivo no Penpot: ${err.message}`);
      const isProd = process.env.NODE_ENV === 'production';
      const penpotHost = process.env.PENPOT_PUBLIC_URI || (isProd ? 'http://179.198.120.113:9005' : 'http://localhost:9005');
      return {
        fileId: '',
        projectId: '',
        url: `${penpotHost}/#/workspace`,
        fallback: true,
        error: err.message,
      };
    }
  }
}
