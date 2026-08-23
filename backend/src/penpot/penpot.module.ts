import { Module } from '@nestjs/common';
import { PenpotService } from './penpot.service';
import { PenpotController } from './penpot.controller';

@Module({
  controllers: [PenpotController],
  providers: [PenpotService],
  exports: [PenpotService],
})
export class PenpotModule {}
