import { Module } from '@nestjs/common';
import { GithubAppService } from './github-app.service';
import { GithubService } from './github.service';

@Module({
  providers: [GithubAppService, GithubService],
  exports: [GithubAppService, GithubService],
})
export class GithubModule {}
