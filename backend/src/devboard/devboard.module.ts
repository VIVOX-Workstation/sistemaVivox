import { Module } from '@nestjs/common';
import { DevboardService } from './devboard.service';
import { DevboardController } from './devboard.controller';
import { GithubModule } from '../github/github.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, GithubModule],
  controllers: [DevboardController],
  providers: [DevboardService],
})
export class DevboardModule {}
