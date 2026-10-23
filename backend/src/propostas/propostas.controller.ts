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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ModuloSistema } from '@prisma/client';
import { respostaPdf } from '../acompanhamento/cronogramas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequerModulo } from '../auth/modulos.decorator';
import { SalvarPropostaDto, SalvarPropostaPdfDto } from './proposta.dto';
import { PROPOSTA_PDF_MAX_BYTES, PropostasService } from './propostas.service';

const UPLOAD_PDF = FileInterceptor('arquivo', { limits: { fileSize: PROPOSTA_PDF_MAX_BYTES, files: 1 } });

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
  criar(
    @Param('clienteId') clienteId: string,
    @Body() dto: SalvarPropostaDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.service.criar(clienteId, dto, req.user.userId);
  }
  @Post('pdf')
  @UseInterceptors(UPLOAD_PDF)
  criarPdf(
    @Param('clienteId') clienteId: string,
    @UploadedFile() arquivo: Express.Multer.File | undefined,
    @Body() dto: SalvarPropostaPdfDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.service.criarPdf(clienteId, arquivo, dto, req.user.userId);
  }
  @Patch(':id/pdf')
  @UseInterceptors(UPLOAD_PDF)
  editarPdf(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @UploadedFile() arquivo: Express.Multer.File | undefined,
    @Body() dto: SalvarPropostaPdfDto,
  ) {
    return this.service.editarPdf(clienteId, id, arquivo, dto);
  }
  @Get(':id/arquivo')
  @Header('Cache-Control', 'no-store')
  async arquivo(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    return respostaPdf(await this.service.arquivo(clienteId, id));
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
  @Get(':id/compartilhar')
  @Header('Cache-Control', 'no-store')
  linkAtivo(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    return this.service.linkAtivo(clienteId, id);
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
  constructor(private readonly service: PropostasService) {}
  @Get(':token/arquivo')
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Header('X-Robots-Tag', 'noindex, nofollow')
  async arquivo(@Param('token') token: string) {
    return respostaPdf(await this.service.arquivoPublico(token));
  }
  @Get(':token')
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Header('X-Robots-Tag', 'noindex, nofollow')
  documento(@Req() req: { proposta: unknown }) {
    return req.proposta;
  }
}
