import { Module } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CursosController } from './cursos.controller';
import { EducacionalController } from './educacional.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [CursosController, EducacionalController],
  providers: [CursosService],
  exports: [CursosService],
})
export class CursosModule {}
