import {
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Header,
  Injectable,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ModuloSistema } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequerModulo } from '../auth/modulos.decorator';
import { SalvarPropostaDto } from './proposta.dto';
import { PropostasService } from './propostas.service';

@Controller('clientes/:clienteId/propostas')
@UseGuards(JwtAuthGuard)
@RequerModulo({ todos: [ModuloSistema.CLIENTES] })
export class PropostasController {
  constructor(private readonly service: PropostasService) {}
  @Get()
  listar(@Param('clienteId') clienteId: string) {
    return this.service.listar(clienteId);
  }
  @Post()
  criar(@Param('clienteId') clienteId: string, @Body() dto: SalvarPropostaDto) {
    return this.service.criar(clienteId, dto);
  }
  @Patch(':id')
  editar(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @Body() dto: SalvarPropostaDto,
  ) {
    return this.service.editar(clienteId, id, dto);
  }
  @Delete(':id')
  excluir(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    return this.service.excluir(clienteId, id);
  }
  @Post(':id/compartilhar')
  compartilhar(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    return this.service.compartilhar(clienteId, id);
  }
  @Delete(':id/compartilhar')
  revogar(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    return this.service.revogar(clienteId, id);
  }
}

// Exceção intencional ao JWT: o cliente acessa só o documento pelo segredo do link.
// O token tem 256 bits, somente seu hash é persistido, e pode ser revogado pela equipe.
@Injectable()
export class PropostaLinkGuard implements CanActivate {
  constructor(private readonly service: PropostasService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.proposta = await this.service.publica(request.params.token);
    return true;
  }
}

@Controller('propostas-publicas')
@UseGuards(PropostaLinkGuard)
export class PropostasPublicasController {
  @Get(':token')
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Header('X-Robots-Tag', 'noindex, nofollow')
  documento(@Req() req: { proposta: unknown }) {
    return req.proposta;
  }
}
