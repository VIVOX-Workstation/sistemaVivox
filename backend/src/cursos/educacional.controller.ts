import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('educacional')
@UseGuards(JwtAuthGuard)
export class EducacionalController {
  constructor(private readonly cursosService: CursosService) {}

  @Get('cursos')
  getCursosPublicados(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.cursosService.getCursosPublicados(userId);
  }

  @Get('cursos/:id')
  getCursoPublicado(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.cursosService.getCursoPublicado(id, userId);
  }

  @Post('aulas/:aulaId/concluir')
  concluirAula(@Param('aulaId') aulaId: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.cursosService.concluirAula(aulaId, userId);
  }

  @Delete('aulas/:aulaId/concluir')
  desconcluirAula(@Param('aulaId') aulaId: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.cursosService.desconcluirAula(aulaId, userId);
  }
}
