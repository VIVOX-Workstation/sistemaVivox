import { PartialType } from '@nestjs/mapped-types';
import { CreateTarefaDto } from './create-tarefa.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateTarefaDto extends PartialType(CreateTarefaDto) {
  @IsOptional()
  @IsDateString()
  dataConclusao?: string;
}
