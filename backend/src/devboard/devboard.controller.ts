import { ModuloSistema } from '@prisma/client';
import { RequerModulo } from '../auth/modulos.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DevboardService } from './devboard.service';
import { CreateDevCardDto } from './dto/create-dev-card.dto';
import { UpdateDevCardDto } from './dto/update-dev-card.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GithubService } from '../github/github.service';

@Controller('devboard')
export class DevboardController {
  constructor(
    private readonly devboardService: DevboardService,
    private readonly githubService: GithubService,
  ) {}

  @Get('github/callback')
  async githubCallback(
    @Query('installation_id') installationId: string,
    @Query('setup_action') setupAction: string,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!installationId || !state) {
      return res.redirect(`${frontendBaseUrl}/?error=ParametrosGithubInvalidos`);
    }

    try {
      // Decode o servicoId do state
      const servicoId = Buffer.from(state, 'base64').toString('utf-8');

      const servico = await this.devboardService.getServico(servicoId);
      const devboardUrl = `${frontendBaseUrl}/cliente/${servico.clienteId}/servicos/${servicoId}/devboard`;

      // Busca os repositórios da instalação
      const repos = await this.githubService.getInstallationRepositories(installationId);

      if (!repos || repos.length === 0) {
        return res.redirect(`${devboardUrl}?github=error`);
      }

      // Uma instalação pode dar acesso a vários repositórios (ex: "All repositories",
      // ou "Only select repositories" com mais de um marcado). Só auto-seleciona quando
      // não há ambiguidade; caso contrário o usuário escolhe na própria tela do DevBoard.
      if (repos.length > 1) {
        return res.redirect(`${devboardUrl}?github=selectRepo&installationId=${installationId}`);
      }

      const repo = repos[0];
      const repoOwner = repo.owner.login;
      const repoName = repo.name;

      await this.devboardService.saveGithubConfig(servicoId, installationId, repoOwner, repoName);

      return res.redirect(`${devboardUrl}?github=connected`);
    } catch (err: any) {
      console.error('Erro no callback do GitHub:', err);
      return res.redirect(`${frontendBaseUrl}/?error=FalhaConexaoGithub`);
    }
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Get('servico/:servicoId')
  findByServico(@Param('servicoId') servicoId: string) {
    return this.devboardService.findByServico(servicoId);
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Get('servico/:servicoId/github/install-url')
  getGithubInstallUrl(@Param('servicoId') servicoId: string) {
    const appSlug = process.env.GITHUB_APP_SLUG || 'vivox-devboard';
    const state = Buffer.from(servicoId).toString('base64');
    
    return {
      url: `https://github.com/apps/${appSlug}/installations/new?state=${state}`
    };
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Get('servico/:servicoId/github/installation-repos')
  async listInstallationRepos(
    @Param('servicoId') servicoId: string,
    @Query('installationId') installationId?: string,
  ) {
    let targetInstId = installationId;
    if (!targetInstId) {
      const servico = await this.devboardService.getServico(servicoId);
      targetInstId = servico.githubInstallationId || undefined;
    }
    if (!targetInstId) {
      targetInstId = (await this.devboardService.getAnyActiveInstallationId()) || undefined;
    }
    if (!targetInstId) {
      const appInstallations = await this.githubService.listAppInstallations();
      if (appInstallations && appInstallations.length > 0) {
        targetInstId = String(appInstallations[0].id);
      }
    }

    if (!targetInstId) {
      return { installationId: null, repositories: [] };
    }

    const repos = await this.githubService.getInstallationRepositories(targetInstId);
    return {
      installationId: targetInstId,
      repositories: (repos || []).map((r: any) => ({
        owner: r.owner.login,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
      })),
    };
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Post('servico/:servicoId/github/select-repo')
  async selectGithubRepo(
    @Param('servicoId') servicoId: string,
    @Body() dto: { installationId: string; repoOwner: string; repoName: string },
  ) {
    await this.devboardService.saveGithubConfig(servicoId, dto.installationId, dto.repoOwner, dto.repoName);
    return { success: true };
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Post('servico/:servicoId/github/disconnect')
  async disconnectGithub(@Param('servicoId') servicoId: string) {
    await this.devboardService.disconnectGithub(servicoId);
    return { success: true };
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Get('servico/:servicoId/github/sync')
  async syncGithubData(@Param('servicoId') servicoId: string) {
    const servico = await this.devboardService.getServico(servicoId);

    if (!servico.githubInstallationId || !servico.githubRepoOwner || !servico.githubRepoName) {
      return { connected: false, pullRequests: [], issues: [] };
    }

    const { githubInstallationId, githubRepoOwner, githubRepoName } = servico;

    // Busca PRs e Issues
    const [prs, issues] = await Promise.all([
      this.githubService.listPullRequests(githubRepoOwner, githubRepoName, githubInstallationId),
      this.githubService.listIssues(githubRepoOwner, githubRepoName, githubInstallationId),
    ]);

    // Para cada PR aberto, busca os commits e os checks
    const prsWithDetails = await Promise.all(prs.map(async (pr: any) => {
      let commits: any[] = [];
      let checks: any[] = [];

      if (pr.state === 'open') {
        try {
          commits = await this.githubService.getPullRequestCommits(githubRepoOwner, githubRepoName, pr.number, githubInstallationId);
          // O ref do check-runs normalmente é o SHA do último commit no PR (head sha)
          const headSha = pr.head?.sha;
          if (headSha) {
            checks = await this.githubService.getPullRequestChecks(githubRepoOwner, githubRepoName, headSha, githubInstallationId);
          }
        } catch (e) {
          console.warn(`Erro ao buscar detalhes do PR ${pr.number}`, e);
        }
      }

      return {
        number: pr.number,
        title: pr.title,
        state: pr.state,
        merged: !!pr.merged_at,
        author: pr.user?.login || 'desconhecido',
        authorAvatarUrl: pr.user?.avatar_url,
        htmlUrl: pr.html_url,
        headBranch: pr.head?.ref,
        baseBranch: pr.base?.ref,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        closedAt: pr.closed_at || undefined,
        labels: (pr.labels || []).map((l: any) => l.name),
        commits: commits.map((c: any) => ({
          sha: c.sha,
          message: c.message,
          author: c.author,
          date: c.date,
          additions: 0,
          deletions: 0,
        })),
        checks: checks.map((c: any) => ({ name: c.name, status: c.status, conclusion: c.conclusion })),
      };
    }));

    return {
      connected: true,
      installationId: githubInstallationId,
      repoOwner: githubRepoOwner,
      repoName: githubRepoName,
      pullRequests: prsWithDetails,
      issues: issues.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.user?.login || 'desconhecido',
        htmlUrl: issue.html_url,
        createdAt: issue.created_at,
        closedAt: issue.closed_at || undefined,
        labels: (issue.labels || []).map((l: any) => (typeof l === 'string' ? l : l.name)),
      })),
    };
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDevCardDto) {
    return this.devboardService.create(dto);
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDevCardDto) {
    return this.devboardService.update(id, dto);
  }

  @RequerModulo({ todos: [ModuloSistema.CLIENTES] })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devboardService.remove(id);
  }
}
