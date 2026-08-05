import { Module } from '@nestjs/common';
import { MidiasService } from './midias.service';
import { MidiasController } from './midias.controller';

@Module({
  controllers: [MidiasController],
  providers: [MidiasService],
})
export class MidiasModule {}
