import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CronogramasService, respostaPdf } from '../acompanhamento/cronogramas.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortalCliente } from '../auth/portal-cliente.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInteresseDto } from './dto/create-interesse.dto';
import { PortalService } from './portal.service';
import { AcompanhamentoService } from '../acompanhamento/acompanhamento.service';
import { FiltroAcompanhamentoDto } from '../acompanhamento/dto/filtro-acompanhamento.dto';

type PortalRequest = { user: { clienteId?: string | null } };

@Controller('portal')
@PortalCliente()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENTE)
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly acompanhamentoService: AcompanhamentoService,
    private readonly cronogramasService: CronogramasService,
  ) {}

  private clienteId(req: PortalRequest): string {
    if (!req.user.clienteId) throw new ForbiddenException('Usuário sem cliente vinculado ao portal.');
    return req.user.clienteId;
  }

  @Get('mapa-servicos')
  mapaServicos(@Req() req: PortalRequest) {
    return this.portalService.mapaServicos(this.clienteId(req));
  }

  @Post('interesses')
  registrarInteresse(@Req() req: PortalRequest, @Body() dto: CreateInteresseDto) {
    return this.portalService.registrarInteresse(this.clienteId(req), dto);
  }

  @Get('acompanhamento')
  acompanhamento(@Req() req: PortalRequest, @Query() filtro: FiltroAcompanhamentoDto) {
    return this.acompanhamentoService.consultar(this.clienteId(req), filtro);
  }

  @Get('acompanhamento/meses')
  mesesAcompanhamento(@Req() req: PortalRequest) {
    return this.acompanhamentoService.meses(this.clienteId(req));
  }

  @Get('cronogramas')
  cronogramas(@Req() req: PortalRequest) {
    return this.cronogramasService.listar(this.clienteId(req), false);
  }

  @Get('cronogramas/:id/arquivo')
  async arquivoCronograma(@Req() req: PortalRequest, @Param('id') id: string) {
    return respostaPdf(await this.cronogramasService.arquivo(id, this.clienteId(req)));
  }
}
