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
      const penpotHost = process.env.PENPOT_PUBLIC_URI || (isProd ? 'http://179.198.120.113.sslip.io:9005' : 'http://localhost:9005');
      return {
        fileId: '',
        projectId: '',
        url: `${penpotHost}/#/workspace`,
        fallback: true,
        error: err.message,
      };
    }
  }

  @Post('reset-usuario')
  async resetUsuario(@Body() body: { email?: string; senha?: string }) {
    return this.penpotService.resetarUsuario(body.email || 'kelson.almeida123@gmail.com', body.senha || 'Vivox@2026');
  }

  @Post('definir-senha')
  async definirSenha(@Body() body: { email?: string; senha?: string }) {
    return this.penpotService.definirSenha(body.email || 'kelson.almeida123@gmail.com', body.senha || 'Vivox@2026');
  }
}
