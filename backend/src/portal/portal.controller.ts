import { Body, Controller, ForbiddenException, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortalCliente } from '../auth/portal-cliente.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInteresseDto } from './dto/create-interesse.dto';
import { PortalService } from './portal.service';
import { AcompanhamentoService } from '../acompanhamento/acompanhamento.service';
import { MesAcompanhamentoDto } from '../acompanhamento/dto/mes-acompanhamento.dto';

type PortalRequest = { user: { clienteId?: string | null } };

@Controller('portal')
@PortalCliente()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENTE)
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly acompanhamentoService: AcompanhamentoService,
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
  acompanhamento(@Req() req: PortalRequest, @Query() query: MesAcompanhamentoDto) {
    return this.acompanhamentoService.listar(this.clienteId(req), query.ano, query.mes);
  }

  @Get('acompanhamento/meses')
  mesesAcompanhamento(@Req() req: PortalRequest) {
    return this.acompanhamentoService.meses(this.clienteId(req));
  }
}
