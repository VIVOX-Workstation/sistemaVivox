import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GithubAppService } from './github-app.service';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(private readonly githubAppService: GithubAppService) {}

  private async fetchGithubApi(endpoint: string, installationId: string, options: RequestInit = {}) {
    const token = await this.githubAppService.getInstallationAccessToken(installationId);
    
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`GitHub API error on ${endpoint}: ${errorText}`);
      throw new InternalServerErrorException(`Erro ao se comunicar com o GitHub (${response.status}).`);
    }

    return response.json();
  }

  async getInstallationRepositories(installationId: string) {
    const data = await this.fetchGithubApi('/installation/repositories', installationId);
    return data.repositories || [];
  }

  async listPullRequests(owner: string, repo: string, installationId: string) {
    const [openPrs, closedPrs] = await Promise.all([
      this.fetchGithubApi(`/repos/${owner}/${repo}/pulls?state=open`, installationId),
      this.fetchGithubApi(`/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=10`, installationId)
    ]);

    const allPrs = [...openPrs, ...closedPrs];

    return allPrs.filter(pr => {
      // Ignora PRs de forks
      const headRepoFullName = pr.head?.repo?.full_name;
      if (headRepoFullName && headRepoFullName !== `${owner}/${repo}`) {
        return false;
      }
      
      // Ignora dependabot/renovate a menos que tenha label que denote tarefa explícita
      const isBot = pr.user?.login === 'dependabot[bot]' || pr.user?.login === 'renovate[bot]';
      if (isBot) {
        const hasTarefaLabel = pr.labels?.some((l: any) => l.name?.toLowerCase().includes('tarefa'));
        if (!hasTarefaLabel) return false;
      }

      return true;
    });
  }

  async listIssues(owner: string, repo: string, installationId: string) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);
    const sinceStr = sinceDate.toISOString();

    const data = await this.fetchGithubApi(`/repos/${owner}/${repo}/issues?state=all&since=${sinceStr}&per_page=100`, installationId);

    // Na API do GitHub, PRs também retornam no endpoint de issues.
    // Para separar, filtramos tudo que tem pull_request preenchido.
    return data.filter((item: any) => !item.pull_request);
  }

  async getPullRequestCommits(owner: string, repo: string, pull_number: number, installationId: string) {
    const commits = await this.fetchGithubApi(`/repos/${owner}/${repo}/pulls/${pull_number}/commits`, installationId);
    
    return commits.map((c: any) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit?.message,
      author: c.commit?.author?.name || c.author?.login || 'Desconhecido',
      date: c.commit?.author?.date,
    }));
  }

  async getPullRequestChecks(owner: string, repo: string, ref: string, installationId: string) {
    const data = await this.fetchGithubApi(`/repos/${owner}/${repo}/commits/${ref}/check-runs`, installationId);
    
    return (data.check_runs || []).filter((cr: any) => {
      return cr.conclusion !== null && cr.conclusion !== 'skipped';
    });
  }
}
