import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DevCardTag } from '@prisma/client';

export class CreateDevCardDto {
  @IsString()
  servicoId: string;

  @IsString()
  title: string;

  @IsEnum(DevCardTag)
  @IsOptional()
  tag?: DevCardTag;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  branch?: string;
}
