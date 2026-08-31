import { Module } from '@nestjs/common';
import { QuadrosController } from './quadros.controller';
import { QuadrosService } from './quadros.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [QuadrosController],
  providers: [QuadrosService],
  exports: [QuadrosService],
})
export class QuadrosModule {}
