import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Injectable()
export class CursosService {
  constructor(private prisma: PrismaService) {}

  // --- CURSOS (Admin) ---

  async create(dto: CreateCursoDto, autorId: string) {
    return this.prisma.curso.create({
      data: {
        ...dto,
        autorId,
      },
    });
  }

  async findAll() {
    return this.prisma.curso.findMany({
      include: {
        autor: { select: { id: true, nome: true } },
        _count: { select: { modulos: true } },
      },
      orderBy: { ordem: 'asc' },
    });
  }

  async findOne(id: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        modulos: {
          include: {
            aulas: {
              orderBy: { ordem: 'asc' },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!curso) throw new NotFoundException('Curso não encontrado');
    return curso;
  }

  async update(id: string, dto: UpdateCursoDto) {
    await this.findOne(id);
    return this.prisma.curso.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.curso.delete({ where: { id } });
  }

  async reordenarCursos(ids: string[]) {
    const transactions = ids.map((id, index) =>
      this.prisma.curso.update({
        where: { id },
        data: { ordem: index },
      })
    );
    await this.prisma.$transaction(transactions);
    return { success: true };
  }

  // --- MÓDULOS ---

  async addModulo(cursoId: string, dto: CreateModuloDto) {
    await this.findOne(cursoId);
    return this.prisma.modulo.create({
      data: {
        ...dto,
        cursoId,
      },
    });
  }

  async updateModulo(moduloId: string, dto: UpdateModuloDto) {
    const modulo = await this.prisma.modulo.findUnique({ where: { id: moduloId } });
    if (!modulo) throw new NotFoundException('Módulo não encontrado');

    return this.prisma.modulo.update({
      where: { id: moduloId },
      data: dto,
    });
  }

  async removeModulo(moduloId: string) {
    const modulo = await this.prisma.modulo.findUnique({ where: { id: moduloId } });
    if (!modulo) throw new NotFoundException('Módulo não encontrado');

    return this.prisma.modulo.delete({ where: { id: moduloId } });
  }

  async reordenarModulos(cursoId: string, ids: string[]) {
    const transactions = ids.map((id, index) =>
      this.prisma.modulo.update({
        where: { id, cursoId },
        data: { ordem: index },
      })
    );
    await this.prisma.$transaction(transactions);
    return { success: true };
  }

  // --- AULAS ---

  async addAula(moduloId: string, dto: CreateAulaDto) {
    const modulo = await this.prisma.modulo.findUnique({ where: { id: moduloId } });
    if (!modulo) throw new NotFoundException('Módulo não encontrado');

    return this.prisma.aula.create({
      data: {
        ...dto,
        moduloId,
      },
    });
  }

  async updateAula(aulaId: string, dto: UpdateAulaDto) {
    const aula = await this.prisma.aula.findUnique({ where: { id: aulaId } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    return this.prisma.aula.update({
      where: { id: aulaId },
      data: dto,
    });
  }

  async removeAula(aulaId: string) {
    const aula = await this.prisma.aula.findUnique({ where: { id: aulaId } });
    if (!aula) throw new NotFoundException('Aula não encontrada');

    return this.prisma.aula.delete({ where: { id: aulaId } });
  }

  async reordenarAulas(moduloId: string, ids: string[]) {
    const transactions = ids.map((id, index) =>
      this.prisma.aula.update({
        where: { id, moduloId },
        data: { ordem: index },
      })
    );
    await this.prisma.$transaction(transactions);
    return { success: true };
  }

  // --- EDUCACIONAL (Leitura + Progresso) ---

  async getCursosPublicados(userId: string) {
    const cursos = await this.prisma.curso.findMany({
      where: { publicado: true },
      include: {
        modulos: {
          include: {
            aulas: {
              include: {
                progresso: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });

    return cursos.map((curso) => {
      let totalAulas = 0;
      let aulasConcluidas = 0;

      curso.modulos.forEach((modulo) => {
        totalAulas += modulo.aulas.length;
        modulo.aulas.forEach((aula) => {
          if (aula.progresso.length > 0 && aula.progresso[0].concluidaEm) {
            aulasConcluidas++;
          }
        });
      });

      const progressoPercentual = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

      // Ocultar dados profundos para a listagem (ou retornar conforme desejado)
      const { modulos, ...cursoSemModulos } = curso;
      return {
        ...cursoSemModulos,
        progressoPercentual,
      };
    });
  }

  async getCursoPublicado(id: string, userId: string) {
    const curso = await this.prisma.curso.findFirst({
      where: { id, publicado: true },
      include: {
        modulos: {
          include: {
            aulas: {
              include: {
                progresso: {
                  where: { userId },
                },
              },
              orderBy: { ordem: 'asc' },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!curso) throw new NotFoundException('Curso não encontrado ou não publicado');

    let totalAulas = 0;
    let aulasConcluidas = 0;

    const modulosComProgresso = curso.modulos.map((modulo) => {
      const aulasComProgresso = modulo.aulas.map((aula) => {
        totalAulas++;
        const concluida = aula.progresso.length > 0 && !!aula.progresso[0].concluidaEm;
        if (concluida) aulasConcluidas++;
        
        const { progresso, ...rest } = aula;
        return {
          ...rest,
          concluida,
        };
      });
      return {
        ...modulo,
        aulas: aulasComProgresso,
      };
    });

    const progressoPercentual = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

    return {
      ...curso,
      modulos: modulosComProgresso,
      progressoPercentual,
    };
  }

  async concluirAula(aulaId: string, userId: string) {
    return this.prisma.aulaProgresso.upsert({
      where: {
        aulaId_userId: { aulaId, userId },
      },
      create: {
        aulaId,
        userId,
        concluidaEm: new Date(),
      },
      update: {
        concluidaEm: new Date(),
      },
    });
  }

  async desconcluirAula(aulaId: string, userId: string) {
    return this.prisma.aulaProgresso.upsert({
      where: {
        aulaId_userId: { aulaId, userId },
      },
      create: {
        aulaId,
        userId,
        concluidaEm: null,
      },
      update: {
        concluidaEm: null,
      },
    });
  }
}
