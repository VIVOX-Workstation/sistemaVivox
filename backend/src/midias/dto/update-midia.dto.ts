import { PartialType } from '@nestjs/mapped-types';
import { CreateMidiaDto } from './create-midia.dto';

export class UpdateMidiaDto extends PartialType(CreateMidiaDto) {}
