import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { DevCardTag, DevCardColuna } from '@prisma/client';

export class UpdateDevCardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(DevCardTag)
  @IsOptional()
  tag?: DevCardTag;

  @IsEnum(DevCardColuna)
  @IsOptional()
  coluna?: DevCardColuna;

  @IsString()
  @IsOptional()
  assignee?: string | null;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  targetBranch?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  checklist?: { label: string; done: boolean }[];
}
