import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { PortalModule } from '../portal/portal.module';

@Module({
  imports: [PortalModule],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
