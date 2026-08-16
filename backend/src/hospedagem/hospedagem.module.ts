import { Module } from '@nestjs/common';
import { HospedagemService } from './hospedagem.service';
import { HospedagemController } from './hospedagem.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HospedagemController],
  providers: [HospedagemService],
  exports: [HospedagemService],
})
export class HospedagemModule {}
