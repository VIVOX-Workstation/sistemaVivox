import { api } from './client';

export interface GithubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  additions: number;
  deletions: number;
}

export interface GithubCheck {
  name: string;
  status: string;
  conclusion: string | null;
}

export interface GithubPR {
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged: boolean;
  author: string;
  authorAvatarUrl?: string;
  htmlUrl: string;
  headBranch: string;
  baseBranch: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  commits: GithubCommit[];
  checks: GithubCheck[];
  labels: string[];
}

export interface GithubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  author: string;
  htmlUrl: string;
  createdAt: string;
  closedAt?: string;
  labels: string[];
}

export interface GithubSyncResult {
  connected: boolean;
  repoOwner?: string;
  repoName?: string;
  pullRequests: GithubPR[];
  issues: GithubIssue[];
}

export const githubApi = {
  getInstallUrl: async (servicoId: string): Promise<{ url: string }> => {
    const res = await api.get(`/devboard/servico/${servicoId}/github/install-url`);
    return res.data;
  },
  syncGithub: async (servicoId: string): Promise<GithubSyncResult> => {
    const res = await api.get(`/devboard/servico/${servicoId}/github/sync`);
    return res.data;
  },
};
