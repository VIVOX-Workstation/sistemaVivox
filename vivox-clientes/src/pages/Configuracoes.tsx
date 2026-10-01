import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  Users,
  UserPlus,
  CheckCircle2,
  ShieldAlert,
  Edit2,
  KeyRound,
  UserCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import './planning-workspace.css';

interface User {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR';
  createdAt: string;
}

type Role = 'ADMIN' | 'COLABORADOR';
type Secao = 'equipe' | 'novo' | 'conta';

const SECOES: { id: Secao; label: string; icon: React.ReactNode }[] = [
  { id: 'equipe', label: 'Equipe', icon: <Users className="w-4 h-4" /> },
  { id: 'novo', label: 'Novo usuário', icon: <UserPlus className="w-4 h-4" /> },
  { id: 'conta', label: 'Minha conta', icon: <UserCircle className="w-4 h-4" /> },
];

const INPUT_CLASS = 'pw-glass-control w-full h-10 px-3 text-sm text-[#1E1A16] outline-none rounded-xl';
const LABEL_CLASS = 'block text-xs font-semibold text-[#5E574C] mb-1.5';

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1 mb-5">
      <h2 className="text-base font-bold text-[#1E1A16] tracking-tight">{title}</h2>
      <p className="text-xs text-[#5E574C]">{subtitle}</p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-[#FDF2F2] border border-[#FCDAD7] text-[#B83B32] p-2.5 rounded-xl text-xs font-medium">
      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
      <p>{message}</p>
    </div>
  );
}

function RoleBadge({ role }: { role?: Role }) {
  const r = role || 'COLABORADOR';
  return (
    <span className={`pw-glass-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${r === 'ADMIN' ? 'pw-glass-success' : ''}`}>
      {r}
    </span>
  );
}

function ConfigSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Carregando usuários">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="pw-glass-card h-16" />
      ))}
    </div>
  );
}

export function Configuracoes() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSecao = searchParams.get('secao') || searchParams.get('tab');
  const secao: Secao = SECOES.some((s) => s.id === rawSecao) ? (rawSecao as Secao) : 'equipe';

  const setSecao = (s: Secao) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    next.set('secao', s);
    setSearchParams(next, { replace: true });
  };

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create User State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState('');

  // Reset Password State
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newSenha, setNewSenha] = useState('');
  const [resetError, setResetError] = useState('');

  // Role change confirmation
  const [pendingRole, setPendingRole] = useState<{ user: User; role: Role } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    loadUsers();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      showToast('Papel atualizado.');
      loadUsers(); // refresh the list
    } catch (err) {
      console.error('Erro ao alterar cargo', err);
      showToast('Não foi possível alterar o papel.');
    }
  };

  const confirmRoleChange = async () => {
    if (!pendingRole) return;
    const { user, role } = pendingRole;
    setPendingRole(null);
    await handleRoleChange(user.id, role);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    setError('');

    try {
      await api.post('/users', { nome, email, senha });
      showToast('Usuário criado com sucesso!');
      setNome('');
      setEmail('');
      setSenha('');
      loadUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar usuário.');
    } finally {
      setLoadingForm(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditNome(user.nome);
    setEditEmail(user.email);
    setEditError('');
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoadingForm(true);
    setEditError('');
    try {
      await api.patch(`/users/${editingUser.id}`, { nome: editNome, email: editEmail });
      setEditingUser(null);
      showToast('Salvo! Dados do usuário atualizados.');
      loadUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Erro ao atualizar usuário.');
    } finally {
      setLoadingForm(false);
    }
  };

  const openResetModal = (user: User) => {
    setResettingUser(user);
    setNewSenha('');
    setResetError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setLoadingForm(true);
    setResetError('');
    try {
      await api.patch(`/users/${resettingUser.id}`, { senha: newSenha });
      setResettingUser(null);
      showToast('Senha redefinida.');
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Erro ao resetar senha.');
    } finally {
      setLoadingForm(false);
    }
  };

  const formatarDataBR = (dataStr?: string) => {
    if (!dataStr) return '-';
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR');
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const me = users.find((u) => u.id === currentUser?.id);

  return (
    <div className="planning-workspace w-full space-y-6">
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* CABEÇALHO */}
      <div className="pw-glass-panel p-6 space-y-1">
        <span className="pw-section-label">Configurações</span>
        <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">Usuários e permissões</h1>
        <p className="text-xs text-[#5E574C]">Gerencie a equipe, os papéis de acesso e os dados da sua conta.</p>
      </div>

      {/* SEÇÕES */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Seções de configurações">
        {SECOES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={secao === s.id}
            onClick={() => setSecao(s.id)}
            className={`pw-glass-tab rounded-xl px-4 py-2 text-xs font-semibold text-[#1E1A16] flex items-center gap-2 cursor-pointer ${
              secao === s.id ? 'is-active' : ''
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* EQUIPE */}
      {secao === 'equipe' && (
        <section className="pw-glass-panel p-6">
          <SectionHeader
            title="Equipe"
            subtitle={
              isAdmin
                ? 'Veja todos os usuários do sistema, altere papéis, edite dados e redefina senhas.'
                : 'Veja os usuários do sistema. Apenas administradores podem alterar papéis.'
            }
          />

          {loading && users.length === 0 ? (
            <ConfigSkeleton />
          ) : loadError && users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center py-8">
              <AlertTriangle className="w-6 h-6 text-[#B83B32]" />
              <p className="text-sm font-semibold text-[#1E1A16]">Não foi possível carregar os usuários.</p>
              <button
                type="button"
                onClick={loadUsers}
                className="pw-glass-control pw-glass-primary rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center py-8">
              <Users className="w-6 h-6 text-[#7A6440]" />
              <p className="text-sm font-semibold text-[#1E1A16]">Nenhum usuário encontrado.</p>
              <button
                type="button"
                onClick={() => setSecao('novo')}
                className="pw-glass-control pw-glass-primary rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Criar primeiro usuário
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loadError && <p className="text-xs text-[#B83B32]">Falha ao atualizar; exibindo os últimos dados carregados.</p>}
              {users.map((user) => (
                <div key={user.id} className="pw-glass-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-3 min-w-0 md:flex-1">
                    <div className="w-10 h-10 shrink-0 bg-[#FAF2E4] border border-[#E8D4B4] rounded-xl flex items-center justify-center text-[#8A6828] font-bold text-sm">
                      {user.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E1A16] truncate">
                        {user.nome}
                        {user.id === currentUser?.id && <span className="ml-2 text-[11px] font-bold text-[#7A6440]">(você)</span>}
                      </p>
                      <p className="text-xs text-[#5E574C] truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap md:justify-end">
                    {isAdmin && currentUser?.id !== user.id ? (
                      <select
                        value={user.role || 'COLABORADOR'}
                        onChange={(e) => setPendingRole({ user, role: e.target.value as Role })}
                        aria-label={`Papel de ${user.nome}`}
                        className="pw-glass-control rounded-xl h-9 px-2 text-xs font-semibold text-[#1E1A16] outline-none cursor-pointer"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="COLABORADOR">COLABORADOR</option>
                      </select>
                    ) : (
                      <RoleBadge role={user.role} />
                    )}
                    <span className="text-xs text-[#5E574C] whitespace-nowrap">Desde {formatarDataBR(user.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="pw-glass-control rounded-xl px-3 py-2 text-xs font-semibold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer"
                        title="Editar usuário"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#7A6440]" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => openResetModal(user)}
                        className="pw-glass-control rounded-xl px-3 py-2 text-xs font-semibold text-[#B83B32] flex items-center gap-1.5 cursor-pointer"
                        title="Redefinir senha"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Redefinir senha
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* NOVO USUÁRIO */}
      {secao === 'novo' && (
        <section className="pw-glass-panel p-6 max-w-xl">
          <SectionHeader
            title="Novo usuário"
            subtitle="Crie o acesso de uma pessoa da equipe. Ela entra com o e-mail e a senha definidos aqui."
          />
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Nome completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="exemplo@vivox.com.br"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={loadingForm}
              className="pw-glass-control pw-glass-primary rounded-xl w-full sm:w-auto px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" /> {loadingForm ? 'Criando...' : 'Criar usuário'}
            </button>
          </form>
        </section>
      )}

      {/* MINHA CONTA */}
      {secao === 'conta' && (
        <section className="pw-glass-panel p-6 max-w-xl">
          <SectionHeader title="Minha conta" subtitle="Dados do usuário com o qual você está conectado." />
          <div className="pw-glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 bg-[#FAF2E4] border border-[#E8D4B4] rounded-xl flex items-center justify-center text-[#8A6828] font-bold">
              {(me?.nome || currentUser?.nome || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1E1A16] truncate">{me?.nome || currentUser?.nome || '-'}</p>
              <p className="text-xs text-[#5E574C] truncate">{me?.email || currentUser?.email || '-'}</p>
            </div>
            <RoleBadge role={currentUser?.role as Role | undefined} />
          </div>
          {me && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => openEditModal(me)}
                className="pw-glass-control rounded-xl px-3 py-2 text-xs font-semibold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#7A6440]" /> Editar meus dados
              </button>
              <button
                type="button"
                onClick={() => openResetModal(me)}
                className="pw-glass-control rounded-xl px-3 py-2 text-xs font-semibold text-[#B83B32] flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" /> Redefinir minha senha
              </button>
            </div>
          )}
        </section>
      )}

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[60] pw-glass-pill pw-glass-success px-4 py-2.5 text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Modal Confirmar Papel */}
      <Modal isOpen={!!pendingRole} onClose={() => setPendingRole(null)} title="Alterar papel">
        <div className="space-y-4 mt-2">
          <p className="text-sm text-[#625746]">
            Alterar o papel de <strong>{pendingRole?.user.nome}</strong> para <strong>{pendingRole?.role}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setPendingRole(null)}
              className="px-4 py-2 text-xs font-semibold text-[#625746] hover:bg-[#FAF6F0] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmRoleChange}
              className="px-4 py-2 rounded-xl bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Usuário */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Editar Usuário">
        <form onSubmit={handleEditUser} className="space-y-4 mt-2">
          <div>
            <label className={LABEL_CLASS}>Nome completo</label>
            <input type="text" required value={editNome} onChange={(e) => setEditNome(e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>E-mail</label>
            <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={INPUT_CLASS} />
          </div>

          {editError && <ErrorBox message={editError} />}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 text-xs font-semibold text-[#625746] hover:bg-[#FAF6F0] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingForm}
              className="px-4 py-2 rounded-xl bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loadingForm ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Redefinir Senha */}
      <Modal isOpen={!!resettingUser} onClose={() => setResettingUser(null)} title="Redefinir Senha">
        <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
          <p className="text-sm text-[#625746] mb-4">
            Defina uma nova senha para o usuário <strong>{resettingUser?.nome}</strong>. A senha atual deixará de funcionar.
          </p>
          <div>
            <label className={LABEL_CLASS}>Nova senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={newSenha}
              onChange={(e) => setNewSenha(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {resetError && <ErrorBox message={resetError} />}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setResettingUser(null)}
              className="px-4 py-2 text-xs font-semibold text-[#625746] hover:bg-[#FAF6F0] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingForm}
              className="px-4 py-2 rounded-xl bg-[#B83B32] hover:bg-[#9E3128] text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loadingForm ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
