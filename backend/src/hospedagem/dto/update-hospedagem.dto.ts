import { PartialType } from '@nestjs/mapped-types';
import { CreateHospedagemDto } from './create-hospedagem.dto';

export class UpdateHospedagemDto extends PartialType(CreateHospedagemDto) {}
