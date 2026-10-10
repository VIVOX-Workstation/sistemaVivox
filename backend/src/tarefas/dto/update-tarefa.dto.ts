import { PartialType } from '@nestjs/mapped-types';
import { CreateTarefaDto } from './create-tarefa.dto';
import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class UpdateTarefaDto extends PartialType(CreateTarefaDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  versao?: number;
  @IsOptional()
  @IsDateString()
  dataConclusao?: string;
}
