import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientesModule } from './clientes/clientes.module';
import { ServicosModule } from './servicos/servicos.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { ProducoesModule } from './producoes/producoes.module';
import { MidiasModule } from './midias/midias.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PlanejamentoServicoModule } from './planejamento-servico/planejamento-servico.module';
import { IaModule } from './ia/ia.module';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule, ClientesModule, ServicosModule, UsersModule, AuthModule, StorageModule, ProducoesModule, MidiasModule, AnalyticsModule, PlanejamentoServicoModule, IaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
