import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { devboardApi, type DevCard, type DevCardTag, type DevCardColuna, type DevChecklistItem } from '../api/devboard';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import {
  ArrowLeft,
  GitBranch,
  ShieldCheck,
  Plus,
  Inbox,
  LoaderCircle,
  GitPullRequest,
  CircleCheckBig,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  UserPlus,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { githubApi, type GithubPR, type GithubIssue } from '../api/github';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.94c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.76 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.15v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

const TAG_STYLE: Record<DevCardTag, { label: string; bg: string; text: string; border: string }> = {
  FEATURE: { label: 'feature', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  BUG: { label: 'bug', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  ENHANCEMENT: { label: 'enhancement', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DOCS: { label: 'docs', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const COLUMNS: { id: DevCardColuna; label: string; icon: typeof Inbox; accent: string; bg: string; border: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', icon: Inbox, accent: 'text-stone-500', bg: 'bg-stone-100', border: 'border-stone-300' },
  { id: 'EM_PROGRESSO', label: 'Em progresso', icon: LoaderCircle, accent: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300' },
  { id: 'EM_REVISAO', label: 'Em revisão', icon: GitPullRequest, accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-300' },
  { id: 'CONCLUIDO', label: 'Concluído', icon: CircleCheckBig, accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300' },
];

function timeAgo(iso: string) {
  const diffMs = Date.now() - Date.parse(iso);
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'há 1 mês' : `há ${months} meses`;
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function statusBadgeForColuna(coluna: DevCardColuna): { label: string; bg: string; text: string } {
  if (coluna === 'CONCLUIDO') return { label: 'Concluído', bg: 'bg-violet-50', text: 'text-violet-700' };
  if (coluna === 'EM_REVISAO') return { label: 'Em revisão', bg: 'bg-amber-50', text: 'text-amber-700' };
  if (coluna === 'EM_PROGRESSO') return { label: 'Em andamento', bg: 'bg-emerald-50', text: 'text-emerald-700' };
  return { label: 'Backlog', bg: 'bg-stone-100', text: 'text-stone-600' };
}

export type BoardItem =
  | { type: 'local'; data: DevCard; coluna: DevCardColuna; id: string }
  | { type: 'github-issue'; data: GithubIssue; coluna: DevCardColuna; id: string };

function findPrByNumber(prs: GithubPR[], number: number | null | undefined): GithubPR | undefined {
  if (number == null) return undefined;
  return prs.find((pr) => pr.number === number);
}

// ============================================================================
// Página
// ============================================================================

export function DevBoard() {
  const { id: clienteId, servicoId } = useParams<{ id: string; servicoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nomeCliente, setNomeCliente] = useState('');
  const [cards, setCards] = useState<DevCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubRepo, setGithubRepo] = useState<string | null>(null);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubPRs, setGithubPRs] = useState<GithubPR[]>([]);
  const [githubIssues, setGithubIssues] = useState<GithubIssue[]>([]);
  const [linkPrModalForCard, setLinkPrModalForCard] = useState<string | null>(null);
  const [linkCardModalForPr, setLinkCardModalForPr] = useState<number | null>(null);

  const loadCards = useCallback(async () => {
    if (!servicoId) return;
    const data = await devboardApi.listByServico(servicoId);
    setCards(data);
  }, [servicoId]);

  const syncGithub = useCallback(async () => {
    if (!servicoId) return;
    setGithubSyncing(true);
    try {
      const res = await githubApi.syncGithub(servicoId);
      setGithubConnected(res.connected);
      if (res.connected && res.repoOwner && res.repoName) {
        setGithubRepo(`${res.repoOwner}/${res.repoName}`);
      } else {
        setGithubRepo(null);
      }
      setGithubPRs(res.pullRequests || []);
      setGithubIssues(res.issues || []);
    } catch (err) {
      console.error('Failed to sync github:', err);
    } finally {
      setGithubSyncing(false);
    }
  }, [servicoId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (servicoId) {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('github') === 'connected') {
            window.history.replaceState({}, document.title, window.location.pathname);
            await syncGithub();
          }

          const [res] = await Promise.all([
            api.get(`/servicos/${servicoId}`).catch(() => null),
            loadCards(),
            syncGithub(),
          ]);
          const nome = res?.data?.cliente?.nomeFantasia;
          if (nome && active) setNomeCliente(nome);
          if (!nome && clienteId) {
            const cRes = await api.get(`/clientes/${clienteId}`).catch(() => null);
            if (active) setNomeCliente(cRes?.data?.nomeFantasia || cRes?.data?.razaoSocial || '');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [clienteId, servicoId, loadCards, syncGithub]);

  const handleConnectGithub = async () => {
    if (!servicoId) return;
    try {
      const { url } = await githubApi.getInstallUrl(servicoId);
      window.location.href = url;
    } catch (err) {
      console.error('Failed to get install url', err);
      alert('Erro ao conectar com GitHub.');
    }
  };

  const allBoardItems = useMemo(() => {
    const items: BoardItem[] = cards.map(c => ({ type: 'local', data: c, coluna: c.coluna, id: c.id }));

    githubIssues.forEach(issue => {
      if (issue.state === 'closed') return;
      items.push({ type: 'github-issue', data: issue, coluna: 'BACKLOG', id: `gh-issue-${issue.number}` });
    });

    return items;
  }, [cards, githubIssues]);

  // PRs do GitHub ainda não vinculados a nenhum card local -- ficam na coluna "Pull Requests"
  // até alguém explicitamente vincular (fluxo manual, não automático por branch).
  const linkedPrNumbers = useMemo(
    () => new Set(cards.filter((c) => c.githubPrNumber != null).map((c) => c.githubPrNumber as number)),
    [cards],
  );
  const unlinkedPRs = useMemo(
    () => githubPRs.filter((pr) => !(pr.state === 'closed' && !pr.merged) && !linkedPrNumbers.has(pr.number)),
    [githubPRs, linkedPrNumbers],
  );

  const repoSlug = useMemo(() => {
    const base = (nomeCliente || 'cliente').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `vivox/${base || 'projeto'}-app`;
  }, [nomeCliente]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || null;

  const moveCardLocal = (id: string, coluna: DevCardColuna) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, coluna } : c)));
    devboardApi.update(id, { coluna }).catch(() => loadCards());
  };

  const assumirCard = (id: string) => {
    if (!user) return;
    const card = cards.find((c) => c.id === id);
    const novaColuna = card && card.coluna === 'BACKLOG' ? 'EM_PROGRESSO' : card?.coluna;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, assignee: user.nome, coluna: novaColuna || c.coluna } : c)));
    devboardApi.update(id, { assignee: user.nome, ...(novaColuna ? { coluna: novaColuna } : {}) }).catch(() => loadCards());
  };

  const handleCreateCard = async (payload: { title: string; tag: DevCardTag; description: string }) => {
    if (!servicoId) return;
    const created = await devboardApi.create({ servicoId, title: payload.title, tag: payload.tag, description: payload.description || undefined });
    setCards((prev) => [...prev, created]);
    setCreateModalOpen(false);
  };

  const handleUpdateCard = (id: string, patch: Partial<DevCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    devboardApi.update(id, patch as any).catch(() => loadCards());
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Excluir este card do DevBoard? Essa ação não pode ser desfeita.')) return;
    await devboardApi.remove(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSelectedCardId(null);
  };

  const linkCardToPr = (cardId: string, prNumber: number) => {
    handleUpdateCard(cardId, { githubPrNumber: prNumber });
    setLinkPrModalForCard(null);
    setLinkCardModalForPr(null);
  };

  const unlinkCard = (cardId: string) => {
    handleUpdateCard(cardId, { githubPrNumber: null });
  };

  const openPrsCount = githubConnected 
    ? githubPRs.filter(pr => pr.state === 'open').length 
    : cards.filter((c) => c.coluna === 'EM_PROGRESSO' || c.coluna === 'EM_REVISAO').length;
  const activeBranches = githubConnected
    ? new Set([...githubPRs.filter(pr => pr.state === 'open').map(pr => pr.headBranch), ...cards.filter((c) => c.coluna !== 'CONCLUIDO').map((c) => c.branch)]).size
    : new Set(cards.filter((c) => c.coluna !== 'CONCLUIDO').map((c) => c.branch)).size;
  const contributors = githubConnected
    ? new Set([...githubPRs.map(pr => pr.author), ...cards.filter(c => c.assignee).map(c => c.assignee)]).size
    : new Set(cards.filter((c) => c.assignee).map((c) => c.assignee)).size;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C7A15F]" />
        <span className="text-sm font-semibold text-[#8F8271]">Carregando DevBoard…</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 pt-6 pb-20 bg-[#FAF7F2]">
      {selectedCard ? (
        <DevBoardDetail
          card={selectedCard}
          linkedPr={findPrByNumber(githubPRs, selectedCard.githubPrNumber)}
          repoSlug={repoSlug}
          currentUserName={user?.nome || null}
          onBack={() => setSelectedCardId(null)}
          onMove={(coluna) => moveCardLocal(selectedCard.id, coluna)}
          onAssumir={() => assumirCard(selectedCard.id)}
          onUpdate={(patch) => handleUpdateCard(selectedCard.id, patch)}
          onDelete={() => handleDeleteCard(selectedCard.id)}
          onRequestLinkPr={() => setLinkPrModalForCard(selectedCard.id)}
          onUnlinkPr={() => unlinkCard(selectedCard.id)}
        />
      ) : (
        <DevBoardKanban
          items={allBoardItems}
          unlinkedPRs={unlinkedPRs}
          repoSlug={repoSlug}
          nomeCliente={nomeCliente}
          currentUserName={user?.nome || null}
          openPrsCount={openPrsCount}
          activeBranches={activeBranches}
          contributors={contributors}
          githubConnected={githubConnected}
          githubRepo={githubRepo}
          githubSyncing={githubSyncing}
          onConnectGithub={handleConnectGithub}
          onSyncGithub={syncGithub}
          onOpenCard={(id) => setSelectedCardId(id)}
          onMoveCard={moveCardLocal}
          onAssumirCard={assumirCard}
          onNovaIssue={() => setCreateModalOpen(true)}
          onBack={() => navigate(`/cliente/${clienteId}?tab=services`)}
          onRequestLinkCard={(prNumber) => setLinkCardModalForPr(prNumber)}
        />
      )}

      <NovaIssueModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSubmit={handleCreateCard} />

      <LinkPrModal
        isOpen={!!linkPrModalForCard}
        onClose={() => setLinkPrModalForCard(null)}
        prs={unlinkedPRs}
        onSelect={(prNumber) => linkPrModalForCard && linkCardToPr(linkPrModalForCard, prNumber)}
      />
      <LinkCardModal
        isOpen={linkCardModalForPr != null}
        onClose={() => setLinkCardModalForPr(null)}
        cards={cards.filter((c) => c.githubPrNumber == null)}
        onSelect={(cardId) => linkCardModalForPr != null && linkCardToPr(cardId, linkCardModalForPr)}
      />
    </div>
  );
}

// ============================================================================
// Modal — Nova Issue
// ============================================================================

function NovaIssueModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (payload: { title: string; tag: DevCardTag; description: string }) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState<DevCardTag>('FEATURE');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), tag, description: description.trim() });
      setTitle(''); setTag('FEATURE'); setDescription('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Issue">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Título" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Adicionar tela de favoritos" />
        <Select label="Tipo" value={tag} onChange={(e) => setTag(e.target.value as DevCardTag)}>
          <option value="FEATURE">Feature</option>
          <option value="BUG">Bug</option>
          <option value="ENHANCEMENT">Enhancement</option>
          <option value="DOCS">Docs</option>
        </Select>
        <Textarea label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que precisa ser feito?" rows={3} />
        <div className="flex justify-end pt-2 gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D8CBB8] text-[#1E1A16] hover:bg-[#FAF7F2] transition-colors cursor-pointer">Cancelar</button>
          <button type="submit" disabled={saving || !title.trim()} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#181512] hover:bg-[#2B261F] text-white transition-colors cursor-pointer disabled:opacity-50">
            {saving ? 'Criando…' : 'Criar Issue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// Modais — Vincular card ↔ PR
// ============================================================================

function LinkPrModal({ isOpen, onClose, prs, onSelect }: { isOpen: boolean; onClose: () => void; prs: GithubPR[]; onSelect: (prNumber: number) => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vincular a um PR do GitHub">
      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {prs.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-8">Nenhum PR disponível para vincular no momento.</p>
        )}
        {prs.map((pr) => (
          <button
            key={pr.number}
            onClick={() => onSelect(pr.number)}
            className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-[#C7A15F] hover:bg-[#FAF2E4]/40 transition-colors cursor-pointer"
          >
            <GithubIcon className="w-4 h-4 text-stone-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-800 truncate">{pr.title}</p>
              <p className="text-[11px] font-mono text-stone-400 truncate">#{pr.number} · {pr.headBranch}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function LinkCardModal({ isOpen, onClose, cards, onSelect }: { isOpen: boolean; onClose: () => void; cards: DevCard[]; onSelect: (cardId: string) => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vincular a um card do board">
      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {cards.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-8">Nenhum card sem vínculo disponível. Crie um card primeiro.</p>
        )}
        {cards.map((card) => {
          const tag = TAG_STYLE[card.tag];
          return (
            <button
              key={card.id}
              onClick={() => onSelect(card.id)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-[#C7A15F] hover:bg-[#FAF2E4]/40 transition-colors cursor-pointer"
            >
              <span className={`inline-flex items-center rounded-full ${tag.bg} ${tag.text} border ${tag.border} px-2 py-0.5 text-[10px] font-bold uppercase shrink-0`}>{tag.label}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-800 truncate">{card.title}</p>
                <p className="text-[11px] font-mono text-stone-400 truncate">{card.branch}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

// ============================================================================
// Tela 1 — Board Kanban principal
// ============================================================================

function DevBoardKanban({
  items, unlinkedPRs, repoSlug, nomeCliente, currentUserName, openPrsCount, activeBranches, contributors,
  githubConnected, githubRepo, githubSyncing, onConnectGithub, onSyncGithub,
  onOpenCard, onMoveCard, onAssumirCard, onNovaIssue, onBack, onRequestLinkCard,
}: {
  items: BoardItem[]; unlinkedPRs: GithubPR[]; repoSlug: string; nomeCliente: string; currentUserName: string | null;
  openPrsCount: number; activeBranches: number; contributors: number;
  githubConnected: boolean; githubRepo: string | null; githubSyncing: boolean;
  onConnectGithub: () => void; onSyncGithub: () => void;
  onOpenCard: (id: string) => void; onMoveCard: (id: string, coluna: DevCardColuna) => void; onAssumirCard: (id: string) => void;
  onNovaIssue: () => void; onBack: () => void; onRequestLinkCard: (prNumber: number) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DevCardColuna | null>(null);

  return (
    <>
      {/* CABEÇALHO */}
      <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            title="Voltar ao Mapa de Serviços do cliente"
            className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#D8CBB8] hover:border-[#1E1A16] hover:bg-white flex items-center justify-center text-[#1E1A16] transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#B89455]" />
              <h1 className="text-lg font-bold text-[#1E1A16] tracking-tight">DevBoard</h1>
            </div>
            <p className="text-xs text-[#8F8271] mt-0.5">
              Pipeline de desenvolvimento do app {nomeCliente ? `de ${nomeCliente}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {githubConnected && githubRepo ? (
            <>
              <a href={`https://github.com/${githubRepo}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#14120E] text-[#C7A15F] hover:bg-[#2B261F] transition-colors px-3 py-1.5 text-xs font-bold">
                <GithubIcon className="w-3.5 h-3.5" />
                {githubRepo}
              </a>
              <button onClick={onSyncGithub} disabled={githubSyncing} className="flex items-center gap-1.5 rounded-full bg-[#FAF2E4] border border-[#E8D4B4] text-[#8A6828] hover:bg-[#F2E5CE] transition-colors px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${githubSyncing ? 'animate-spin' : ''}`} />
                Sincronizar
              </button>
            </>
          ) : (
            <button onClick={onConnectGithub} className="flex items-center gap-1.5 rounded-full bg-[#14120E] text-white hover:bg-[#2B261F] transition-colors px-3 py-1.5 text-xs font-bold cursor-pointer">
              <GithubIcon className="w-3.5 h-3.5" />
              Conectar repositório GitHub
            </button>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-[#FAF2E4] border border-[#E8D4B4] text-[#8A6828] px-3 py-1.5 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            main · protegida
          </span>
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-white border border-[#E8E7E4] text-[#46433E] px-3 py-1.5 text-xs font-semibold">
            <GitPullRequest className="w-3.5 h-3.5 text-[#8A6828]" /> {openPrsCount} PRs abertos
          </span>
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-white border border-[#E8E7E4] text-[#46433E] px-3 py-1.5 text-xs font-semibold">
            <GitBranch className="w-3.5 h-3.5 text-[#8A6828]" /> {activeBranches} branches ativas
          </span>
          <button onClick={onNovaIssue} className="flex items-center gap-1.5 rounded-full bg-[#B89455] hover:bg-[#C7A15F] text-[#1D160B] px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Nova Issue
          </button>
        </div>
      </div>

      {/* COLUNAS DO KANBAN */}
      <div className="flex gap-5 overflow-x-auto pb-2" onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}>
        {/* COLUNA DE PULL REQUESTS — inbox de PRs sincronizados do GitHub ainda sem vínculo manual */}
        <div className="w-[300px] shrink-0 flex flex-col">
          <div className="flex items-center justify-between rounded-t-2xl border border-stone-300 bg-stone-100 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold text-stone-700">
              <GithubIcon className="w-4 h-4" />
              Pull Requests
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold">{unlinkedPRs.length}</span>
            </span>
          </div>
          <div className="flex-1 bg-white/60 border border-t-0 border-stone-300 rounded-b-2xl p-3 space-y-3 min-h-[200px]">
            {unlinkedPRs.length === 0 && (
              <p className="text-center text-[11px] text-stone-400 py-6">Nenhum PR aguardando vínculo</p>
            )}
            {unlinkedPRs.map((pr) => (
              <div key={pr.number} className="w-full text-left bg-white rounded-xl border border-stone-200 border-l-4 border-stone-400 hover:border-l-[#1E1A16] hover:shadow-md transition-all p-3.5 group">
                <a href={pr.htmlUrl} target="_blank" rel="noreferrer" className="w-full text-left block outline-none">
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide">
                    <GithubIcon className="w-3 h-3" /> PR do GitHub
                  </span>
                  <h4 className="mt-2 text-[13px] font-semibold text-stone-800 leading-snug group-hover:text-[#8A6828] transition-colors line-clamp-2">
                    {pr.title}
                  </h4>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-500">
                    {pr.authorAvatarUrl ? (
                      <img src={pr.authorAvatarUrl} alt={pr.author} className="h-5 w-5 rounded-full border border-stone-200" />
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[9.5px] font-bold text-stone-600 border border-stone-200">
                        {initials(pr.author)}
                      </span>
                    )}
                    <span className="font-medium text-stone-600">{pr.author}</span>
                    <span>·</span>
                    <span>{timeAgo(pr.createdAt)}</span>
                  </div>
                  <p className="mt-2 font-mono text-[10.5px] text-stone-400 truncate">{pr.headBranch} → {pr.baseBranch}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 font-semibold text-stone-600">
                      <GitPullRequest className="w-3 h-3" /> #{pr.number}
                    </span>
                  </div>
                </a>
                <button
                  onClick={() => onRequestLinkCard(pr.number)}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[#D8CBB8] text-[11px] font-bold text-[#8A6828] hover:bg-[#FAF2E4] hover:border-solid transition-all cursor-pointer"
                >
                  <GitBranch className="w-3 h-3" /> Vincular a um card
                </button>
              </div>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => {
          const colCards = items.filter((c) => c.coluna === col.id);
          const Icon = col.icon;
          const isDropTarget = dropTarget === col.id;
          return (
            <div
              key={col.id}
              className="w-[300px] shrink-0 flex flex-col"
              onDragOver={(e) => { e.preventDefault(); if (dropTarget !== col.id) setDropTarget(col.id); }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain') || draggedId;
                if (id) onMoveCard(id, col.id);
                setDraggedId(null);
                setDropTarget(null);
              }}
            >
              <div className={`flex items-center justify-between rounded-t-2xl border ${col.border} ${col.bg} px-4 py-3 ${isDropTarget ? 'ring-2 ring-[#B89455]' : ''}`}>
                <span className={`flex items-center gap-2 text-sm font-bold ${col.accent}`}>
                  <Icon className={`w-4 h-4 ${col.id === 'EM_PROGRESSO' ? 'animate-spin' : ''}`} />
                  {col.label}
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold">{colCards.length}</span>
                </span>
                <button onClick={onNovaIssue} title="Adicionar card" className={`w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors cursor-pointer ${col.accent}`}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={`flex-1 bg-white/60 border border-t-0 ${col.border} rounded-b-2xl p-3 space-y-3 min-h-[200px] ${isDropTarget ? 'bg-[#FAF2E4]/60' : ''}`}>
                {colCards.length === 0 && (
                  <p className="text-center text-[11px] text-stone-400 py-6">Nenhum card nesta coluna</p>
                )}
                {colCards.map((item) => {
                  if (item.type === 'local') {
                    const card = item.data;
                    const tag = TAG_STYLE[card.tag];
                    const checklistDone = card.checklist.filter((i) => i.done).length;
                    const progress = card.checklist.length > 0 ? Math.round((checklistDone / card.checklist.length) * 100) : null;
                    const jaAssumido = currentUserName && card.assignee === currentUserName;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => { setDraggedId(card.id); e.dataTransfer.setData('text/plain', card.id); }}
                        className={`w-full text-left bg-white rounded-xl border border-stone-200 border-l-4 ${col.border} hover:border-l-[#B89455] hover:shadow-md transition-all p-3.5 cursor-grab active:cursor-grabbing group ${col.id === 'CONCLUIDO' ? 'opacity-55 hover:opacity-100' : ''}`}
                      >
                        <button onClick={() => onOpenCard(card.id)} className="w-full text-left cursor-pointer">
                          <span className={`inline-flex items-center rounded-full ${tag.bg} ${tag.text} border ${tag.border} px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide`}>
                            {tag.label}
                          </span>
                          <h4 className="mt-2 text-[13px] font-semibold text-stone-800 leading-snug group-hover:text-[#8A6828] transition-colors line-clamp-2">
                            {card.title}
                          </h4>
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-500">
                            {card.assignee ? (
                              <>
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FAF2E4] text-[9.5px] font-bold text-[#8A6828] border border-[#E8D4B4]/60">
                                  {initials(card.assignee)}
                                </span>
                                <span className="font-medium text-stone-600">{card.assignee}</span>
                              </>
                            ) : (
                              <span className="italic text-stone-400">Sem responsável</span>
                            )}
                            <span>·</span>
                            <span>{timeAgo(card.createdAt)}</span>
                          </div>
                          <p className="mt-2 font-mono text-[10.5px] text-stone-400 truncate">{card.branch}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                            {card.githubPrNumber != null ? (
                              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                <GithubIcon className="w-3 h-3" /> PR #{card.githubPrNumber} vinculado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-semibold text-stone-400">
                                <GitPullRequest className="w-3 h-3" /> Card #{card.prNumber}
                              </span>
                            )}
                          </div>
                          {progress != null && (
                            <div className="mt-2.5 w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${col.id === 'CONCLUIDO' ? 'bg-emerald-500' : 'bg-[#C7A15F]'}`} style={{ width: `${progress}%` }} />
                            </div>
                          )}
                        </button>
                        {!jaAssumido && (
                          <button
                            onClick={() => onAssumirCard(card.id)}
                            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[#D8CBB8] text-[11px] font-bold text-[#8A6828] hover:bg-[#FAF2E4] hover:border-solid transition-all cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" /> Assumir
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (item.type === 'github-issue') {
                    const issue = item.data;
                    return (
                      <div key={item.id} className={`w-full text-left bg-white rounded-xl border border-stone-200 border-l-4 ${col.border} hover:border-l-[#1E1A16] hover:shadow-md transition-all p-3.5 group`}>
                        <a href={issue.htmlUrl} target="_blank" rel="noreferrer" className="w-full text-left block outline-none">
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide">
                            <GithubIcon className="w-3 h-3" /> Issue do GitHub
                          </span>
                          <h4 className="mt-2 text-[13px] font-semibold text-stone-800 leading-snug group-hover:text-[#8A6828] transition-colors line-clamp-2">
                            {issue.title}
                          </h4>
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-500">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[9.5px] font-bold text-stone-600 border border-stone-200">
                              {initials(issue.author)}
                            </span>
                            <span className="font-medium text-stone-600">{issue.author}</span>
                            <span>·</span>
                            <span>{timeAgo(issue.createdAt)}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                            <span className="flex items-center gap-1 font-semibold text-stone-600">
                              #{issue.number}
                            </span>
                          </div>
                        </a>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* RODAPÉ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-2xl px-5 py-3 text-xs text-[#8F8271]">
        <span className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" /> {items.length} cards no board
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Branch main com proteção ativa
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {contributors} contribuidores ativos
        </span>
      </div>
    </>
  );
}

// ============================================================================
// Tela 2 — Detalhes do card / PR
// ============================================================================

function DevBoardDetail({
  card, linkedPr, repoSlug, currentUserName, onBack, onMove, onAssumir, onUpdate, onDelete, onRequestLinkPr, onUnlinkPr,
}: {
  card: DevCard; linkedPr: GithubPR | undefined; repoSlug: string; currentUserName: string | null;
  onBack: () => void; onMove: (coluna: DevCardColuna) => void; onAssumir: () => void;
  onUpdate: (patch: Partial<DevCard>) => void; onDelete: () => void;
  onRequestLinkPr: () => void; onUnlinkPr: () => void;
}) {
  const status = statusBadgeForColuna(card.coluna);
  const jaAssumido = currentUserName && card.assignee === currentUserName;
  const checklistDone = card.checklist.filter((i) => i.done).length;
  const [novoItem, setNovoItem] = useState('');
  const [descricao, setDescricao] = useState(card.description || '');

  useEffect(() => { setDescricao(card.description || ''); }, [card.id, card.description]);

  const toggleChecklistItem = (index: number) => {
    const checklist = card.checklist.map((item, i) => (i === index ? { ...item, done: !item.done } : item));
    onUpdate({ checklist });
  };

  const addChecklistItem = () => {
    if (!novoItem.trim()) return;
    onUpdate({ checklist: [...card.checklist, { label: novoItem.trim(), done: false }] });
    setNovoItem('');
  };

  const removeChecklistItem = (index: number) => {
    onUpdate({ checklist: card.checklist.filter((_, i) => i !== index) });
  };

  const saveDescricao = () => {
    if (descricao !== (card.description || '')) onUpdate({ description: descricao });
  };

  return (
    <>
      {/* BARRA SUPERIOR */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#1E1A16] bg-[#FFFDF8] border border-[#D8CBB8] hover:border-[#1E1A16] hover:bg-white rounded-xl px-3.5 py-2 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Board
        </button>
        <span className="text-xs text-stone-500 font-mono">
          {repoSlug} <ChevronRight className="w-3 h-3 inline mx-0.5" /> pull/{card.prNumber}
        </span>
      </div>

      {/* CABEÇALHO DO PR */}
      <div className="bg-white border border-[#E8E7E4] rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full ${status.bg} ${status.text} px-2.5 py-1 text-xs font-bold`}>
              <GitPullRequest className="w-3.5 h-3.5" /> {status.label}
            </span>
            {linkedPr && (
              <a
                href={linkedPr.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#14120E] text-[#C7A15F] hover:bg-[#2B261F] transition-colors px-2.5 py-1 text-xs font-bold"
              >
                <GithubIcon className="w-3.5 h-3.5" /> PR #{linkedPr.number} no GitHub
              </a>
            )}
          </div>
          <button onClick={onDelete} title="Excluir card" className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
        <h1 className="text-xl font-bold text-[#1E1A16] leading-snug">
          {card.title} <span className="text-stone-400 font-medium">#{card.prNumber}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-500">
          {card.assignee ? (
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF2E4] text-[9.5px] font-bold text-[#8A6828] border border-[#E8D4B4]/60">
                {initials(card.assignee)}
              </span>
              <strong className="text-stone-700 font-semibold">{card.assignee}</strong>
            </span>
          ) : (
            <span className="italic text-stone-400">Sem responsável designado</span>
          )}
          <span className="flex items-center gap-1 font-mono">
            <GitBranch className="w-3.5 h-3.5" /> {card.branch} → {card.targetBranch}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Aberto {timeAgo(card.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Atualizado {timeAgo(card.updatedAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          {/* DESCRIÇÃO */}
          <section className="bg-white border border-[#E8E7E4] rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-[#1E1A16]">Descrição</h3>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onBlur={saveDescricao}
              placeholder="O que precisa ser feito nesse card?"
              rows={4}
              className="w-full text-sm text-stone-600 leading-relaxed bg-[#FAFAF9] border border-stone-200 rounded-lg p-3 outline-none focus:border-[#C7A15F] resize-y"
            />
          </section>

          {/* CHECKLIST */}
          <section className="bg-white border border-[#E8E7E4] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1E1A16]">Checklist</h3>
              <span className="text-xs font-bold text-stone-500">{checklistDone}/{card.checklist.length || 0} concluídos</span>
            </div>
            {card.checklist.length === 0 && <p className="text-xs text-stone-400">Nenhum item ainda.</p>}
            <ul className="space-y-2">
              {card.checklist.map((item: DevChecklistItem, index) => (
                <li key={index} className="flex items-center gap-2.5 text-sm group">
                  <button onClick={() => toggleChecklistItem(index)} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border cursor-pointer ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`}>
                    {item.done && <CircleCheckBig className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`flex-1 ${item.done ? 'text-stone-500 line-through' : 'text-stone-700 font-medium'}`}>{item.label}</span>
                  <button onClick={() => removeChecklistItem(index)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 pt-1">
              <input
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                placeholder="Adicionar item..."
                className="flex-1 text-xs bg-[#FAFAF9] border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-[#C7A15F]"
              />
              <button onClick={addChecklistItem} className="px-3 py-2 rounded-lg bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold transition-colors cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <SidebarBlock title="Ações" icon={GitPullRequest}>
            {!jaAssumido && (
              <button onClick={onAssumir} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#B89455] hover:bg-[#C7A15F] text-[#1D160B] text-xs font-bold transition-colors cursor-pointer mb-2">
                <UserPlus className="w-3.5 h-3.5" /> Assumir card
              </button>
            )}
            {jaAssumido && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 mb-2">
                <CircleCheckBig className="w-3.5 h-3.5" /> Você assumiu este card
              </p>
            )}

            {linkedPr ? (
              <div className="space-y-1.5">
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5" /> Vinculado ao PR #{linkedPr.number}
                </p>
                <button
                  onClick={onUnlinkPr}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-stone-300 text-[11px] font-bold text-stone-500 hover:bg-stone-50 hover:border-solid transition-all cursor-pointer"
                >
                  Desvincular PR
                </button>
              </div>
            ) : (
              <button
                onClick={onRequestLinkPr}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#D8CBB8] text-xs font-bold text-[#8A6828] hover:bg-[#FAF2E4] hover:border-solid transition-all cursor-pointer"
              >
                <GithubIcon className="w-3.5 h-3.5" /> Vincular a um PR
              </button>
            )}

            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1.5 mt-3">Mover para</p>
            <div className="space-y-1.5">
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  disabled={col.id === card.coluna}
                  onClick={() => onMove(col.id)}
                  className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    col.id === card.coluna ? 'bg-stone-100 text-stone-400 cursor-default' : 'text-stone-600 hover:bg-[#FAF2E4] hover:text-[#8A6828] cursor-pointer'
                  }`}
                >
                  <col.icon className="w-3.5 h-3.5" /> {col.label}
                </button>
              ))}
            </div>
          </SidebarBlock>

          <SidebarBlock title="Detalhes" icon={GitBranch}>
            <dl className="space-y-1.5 text-xs">
              <Row label="Branch" value={card.branch} mono />
              <Row label="Destino" value={card.targetBranch} mono />
              <Row label="Aberto em" value={new Date(card.createdAt).toLocaleDateString('pt-BR')} />
              <Row label="Atualizado" value={timeAgo(card.updatedAt)} />
            </dl>
          </SidebarBlock>
        </aside>
      </div>

      {/* RODAPÉ */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 px-1">
        <span>pull/{card.prNumber} · {repoSlug}</span>
        <span>Última atualização {timeAgo(card.updatedAt)}</span>
      </div>
    </>
  );
}

function SidebarBlock({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#E8E7E4] rounded-2xl p-4">
      <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#1E1A16] uppercase tracking-wide mb-3">
        <Icon className="w-3.5 h-3.5 text-[#B89455]" /> {title}
      </h4>
      {children}
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-stone-400">{label}</dt>
      <dd className={`text-stone-700 font-semibold text-right truncate max-w-[150px] ${mono ? 'font-mono' : ''}`} title={value}>{value}</dd>
    </div>
  );
}
