import { Controller, Post, Body } from '@nestjs/common';
import { PenpotService } from './penpot.service';

@Controller('penpot')
export class PenpotController {
  constructor(private readonly penpotService: PenpotService) {}

  @Post('criar-arquivo')
  async criarArquivo(@Body() body: { titulo?: string; clienteNome?: string }) {
    return this.penpotService.criarArquivo(body.titulo || 'Novo Arquivo', body.clienteNome);
  }
}
