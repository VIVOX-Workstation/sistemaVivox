import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { CheckCircle2, Pencil, KeyRound, RefreshCw, AlertTriangle } from 'lucide-react';
import { VxDialog } from '../components/clean/VxDialog';
import { useAuth } from '../context/AuthContext';
import { MODULOS, TODOS_MODULOS } from '../config/modulos';
import { usersApi } from '../api/users';
import { useSidebarPrefs } from '../utils/sidebarPrefs';

interface User {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR';
  createdAt: string;
  modulos?: string[];
}

type Role = 'ADMIN' | 'COLABORADOR';
type Secao = 'equipe' | 'novo' | 'conta' | 'aparencia';

const SECOES: { id: Secao; label: string }[] = [
  { id: 'equipe', label: 'Equipe' },
  { id: 'novo', label: 'Novo usuário' },
  { id: 'conta', label: 'Minha conta' },
  { id: 'aparencia', label: 'Aparência' },
];

const PAPEL: Record<Role, string> = { ADMIN: 'Administrador', COLABORADOR: 'Colaborador' };

const iniciais = (nome?: string) =>
  (nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

function Erro({ message }: { message: string }) {
  return <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{message}</p>;
}

export function Configuracoes() {
  const { prefs: sidebarPrefs, update: updateSidebar } = useSidebarPrefs();
  const { user: currentUser, refreshUser } = useAuth();
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

  // Modulos Modal State
  const [modulosUser, setModulosUser] = useState<User | null>(null);
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);
  const [savingModulos, setSavingModulos] = useState(false);
  const [modulosError, setModulosError] = useState('');

  const openModulosModal = (u: User) => {
    setModulosUser(u);
    setSelectedModulos(u.modulos || []);
    setModulosError('');
  };

  const toggleModulo = (id: string) => {
    setSelectedModulos((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSaveModulos = async () => {
    if (!modulosUser) return;
    setSavingModulos(true);
    setModulosError('');
    try {
      const updated = await usersApi.updateUserModulos(modulosUser.id, selectedModulos);
      setUsers((prev) =>
        prev.map((u) => (u.id === modulosUser.id ? { ...u, modulos: updated.modulos || selectedModulos } : u))
      );
      showToast('Módulos de acesso atualizados com sucesso.');
      if (modulosUser.id === currentUser?.id) {
        await refreshUser();
      }
      setModulosUser(null);
    } catch (err: any) {
      console.error('Erro ao atualizar módulos do usuário:', err);
      setModulosError(err.response?.data?.message || 'Não foi possível salvar os módulos.');
    } finally {
      setSavingModulos(false);
    }
  };

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
    <div className="vxp">
      <div className="pg" style={{ maxWidth: 1100 }}>
        <div className="ph">
          <div>
            <h1>Configurações do sistema</h1>
            <p>Equipe, permissões, a sua conta e a aparência do painel.</p>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Seções">
          {SECOES.map((s) => (
            <button key={s.id} className={secao === s.id ? 'tab on' : 'tab'} type="button" role="tab" aria-selected={secao === s.id} onClick={() => setSecao(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {secao === 'equipe' && (
          <section className="card">
            {loading && users.length === 0 ? (
              <div className="cp animate-pulse" aria-busy="true" aria-label="Carregando usuários" style={{ display: 'grid', gap: 10 }}>
                {[1, 2, 3, 4].map((n) => <div key={n} style={{ height: 44, borderRadius: 8, background: 'var(--sk)' }} />)}
              </div>
            ) : loadError && users.length === 0 ? (
              <div className="empty">
                <AlertTriangle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
                <b>Não foi possível carregar os usuários.</b>
                <button type="button" className="btn pri sm" onClick={loadUsers}><RefreshCw className="i" aria-hidden="true" />Tentar de novo</button>
              </div>
            ) : users.length === 0 ? (
              <div className="empty">
                <b>Nenhum usuário encontrado.</b>
                <button type="button" className="btn pri sm" onClick={() => setSecao('novo')}>Criar primeiro usuário</button>
              </div>
            ) : (
              <>
                {loadError && <p className="cp" style={{ color: 'var(--bad)', fontSize: 12.5, paddingBottom: 0 }}>Falha ao atualizar; exibindo os últimos dados carregados.</p>}
                <div className="tw">
                  <table className="tbl">
                    <thead>
                      <tr><th>Pessoa</th><th>Papel</th><th>Módulos liberados</th><th>Desde</th><th><span className="sr">Ações</span></th></tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const papel = (user.role || 'COLABORADOR') as Role;
                        const eu = user.id === currentUser?.id;
                        return (
                          <tr key={user.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className="av">{iniciais(user.nome)}</span>
                                <div style={{ minWidth: 0 }}>
                                  <b style={{ display: 'block', fontWeight: 600 }}>{user.nome}{eu && <span className="mut" style={{ fontWeight: 500 }}> (você)</span>}</b>
                                  <small className="mut" style={{ fontSize: 12 }}>{user.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {isAdmin && !eu ? (
                                <select
                                  className="inp"
                                  style={{ width: 160, height: 34 }}
                                  value={papel}
                                  aria-label={`Papel de ${user.nome}`}
                                  onChange={(e) => setPendingRole({ user, role: e.target.value as Role })}
                                >
                                  <option value="ADMIN">Administrador</option>
                                  <option value="COLABORADOR">Colaborador</option>
                                </select>
                              ) : (
                                <span className={papel === 'ADMIN' ? 'bd acc' : 'bd plain'}>{PAPEL[papel]}</span>
                              )}
                            </td>
                            <td className="mut">
                              {papel === 'ADMIN'
                                ? 'Acesso total'
                                : (user.modulos || []).length === 0
                                ? 'Nenhum'
                                : `${(user.modulos || []).length} de ${MODULOS.length}`}
                            </td>
                            <td className="mut" style={{ whiteSpace: 'nowrap' }}>{formatarDataBR(user.createdAt)}</td>
                            <td className="r">
                              <div className="acts" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                {isAdmin && papel !== 'ADMIN' && (
                                  <button className="btn sec sm" type="button" onClick={() => openModulosModal(user)}>Permissões</button>
                                )}
                                <button className="ib sm" type="button" aria-label={`Editar ${user.nome}`} title="Editar usuário" onClick={() => openEditModal(user)}>
                                  <Pencil className="i" aria-hidden="true" />
                                </button>
                                <button className="ib sm" type="button" aria-label={`Redefinir senha de ${user.nome}`} title="Redefinir senha" onClick={() => openResetModal(user)}>
                                  <KeyRound className="i" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {secao === 'novo' && (
          <form className="card cp" onSubmit={handleCreateUser} style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 630 }}>Novo usuário</h2>
              <p className="mut" style={{ fontSize: 12.5, marginTop: 2 }}>A pessoa entra com o e-mail e a senha definidos aqui. Depois, libere os módulos em Equipe.</p>
            </div>
            <div className="fld">
              <label htmlFor="nu1">Nome completo</label>
              <input id="nu1" className="inp" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="fld">
              <label htmlFor="nu2">E-mail</label>
              <input id="nu2" className="inp" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@vivoxmarketing.com.br" />
            </div>
            <div className="fld">
              <label htmlFor="nu3">Senha inicial</label>
              <input id="nu3" className="inp" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
            </div>
            {error && <Erro message={error} />}
            <button className="btn pri" type="submit" disabled={loadingForm} style={{ alignSelf: 'flex-start' }}>
              {loadingForm ? 'Criando...' : 'Criar usuário'}
            </button>
          </form>
        )}

        {secao === 'conta' && (
          <section className="card cp" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="av" style={{ width: 52, height: 52, fontSize: 16 }}>{iniciais(me?.nome || currentUser?.nome)}</span>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 16 }}>{me?.nome || currentUser?.nome || '-'}</b>
                <p className="mut">{me?.email || currentUser?.email || '-'} · {PAPEL[(currentUser?.role as Role) || 'COLABORADOR'] ?? currentUser?.role}</p>
              </div>
            </div>
            {me && (
              <div className="acts">
                <button className="btn sec" type="button" onClick={() => openEditModal(me)}><Pencil className="i" aria-hidden="true" />Editar meus dados</button>
                <button className="btn sec" type="button" onClick={() => openResetModal(me)}><KeyRound className="i" aria-hidden="true" />Trocar minha senha</button>
              </div>
            )}
          </section>
        )}

        {secao === 'aparencia' && (
          <section className="card cp" style={{ maxWidth: 640 }}>
            <h2 style={{ fontSize: 15, fontWeight: 630 }}>Aparência</h2>
            <p className="mut" style={{ fontSize: 12.5, marginTop: 2 }}>Fica salvo neste navegador.</p>
            <div className="opt">
              <div><b>Barra lateral recolhida</b><small>Mostra só os ícones dos módulos.</small></div>
              <button
                className={sidebarPrefs.collapsed ? 'tgl on' : 'tgl'}
                type="button"
                role="switch"
                aria-checked={sidebarPrefs.collapsed}
                aria-label="Barra lateral recolhida"
                onClick={() => updateSidebar({ collapsed: !sidebarPrefs.collapsed })}
              />
            </div>
          </section>
        )}
      </div>

      {toast && (
        <div role="status" className="toast"><CheckCircle2 className="i" aria-hidden="true" />{toast}</div>
      )}

      <VxDialog open={!!pendingRole} onClose={() => setPendingRole(null)} title="Alterar papel">
        <p>
          Alterar o papel de <b>{pendingRole?.user.nome}</b> para <b>{pendingRole ? PAPEL[pendingRole.role] : ''}</b>?
        </p>
        <div className="acts" style={{ justifyContent: 'flex-end' }}>
          <button className="btn sec" type="button" onClick={() => setPendingRole(null)}>Cancelar</button>
          <button className="btn pri" type="button" onClick={confirmRoleChange}>Confirmar</button>
        </div>
      </VxDialog>

      <VxDialog open={!!editingUser} onClose={() => setEditingUser(null)} title="Editar usuário">
        <form onSubmit={handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fld">
            <label htmlFor="eu1">Nome completo</label>
            <input id="eu1" className="inp" required value={editNome} onChange={(e) => setEditNome(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="eu2">E-mail</label>
            <input id="eu2" className="inp" type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          </div>
          {editError && <Erro message={editError} />}
          <div className="acts" style={{ justifyContent: 'flex-end' }}>
            <button className="btn sec" type="button" onClick={() => setEditingUser(null)}>Cancelar</button>
            <button className="btn pri" type="submit" disabled={loadingForm}>{loadingForm ? 'Salvando...' : 'Salvar alterações'}</button>
          </div>
        </form>
      </VxDialog>

      <VxDialog
        open={!!resettingUser}
        onClose={() => setResettingUser(null)}
        title="Redefinir senha"
        subtitle={resettingUser ? `Nova senha para ${resettingUser.nome}. A senha atual deixa de funcionar.` : undefined}
      >
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fld">
            <label htmlFor="rs1">Nova senha</label>
            <input id="rs1" className="inp" type="password" required minLength={6} value={newSenha} onChange={(e) => setNewSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>
          {resetError && <Erro message={resetError} />}
          <div className="acts" style={{ justifyContent: 'flex-end' }}>
            <button className="btn sec" type="button" onClick={() => setResettingUser(null)}>Cancelar</button>
            <button className="btn pri" type="submit" disabled={loadingForm}>{loadingForm ? 'Salvando...' : 'Redefinir senha'}</button>
          </div>
        </form>
      </VxDialog>

      <VxDialog
        open={!!modulosUser}
        onClose={() => !savingModulos && setModulosUser(null)}
        title={`Permissões de ${modulosUser?.nome || ''}`}
        subtitle="Escolha os módulos que esta pessoa pode abrir. O menu e as rotas seguem esta lista."
      >
        <div className="acts">
          <button className="btn gh sm" type="button" onClick={() => setSelectedModulos([...TODOS_MODULOS])}>Marcar todos</button>
          <button className="btn gh sm" type="button" onClick={() => setSelectedModulos([])}>Limpar</button>
        </div>
        <div>
          {MODULOS.map((mod) => {
            const ativo = selectedModulos.includes(mod.id);
            return (
              <div className="pm" key={mod.id}>
                <div><b>{mod.label}</b><small>{mod.descricao}</small></div>
                <button className={ativo ? 'tgl on' : 'tgl'} type="button" role="switch" aria-checked={ativo} aria-label={mod.label} onClick={() => toggleModulo(mod.id)} />
              </div>
            );
          })}
        </div>
        {modulosError && <Erro message={modulosError} />}
        <div className="acts" style={{ justifyContent: 'space-between' }}>
          <span className="mut" style={{ fontSize: 12.5 }}>{selectedModulos.length} de {MODULOS.length} módulos</span>
          <div className="acts">
            <button className="btn sec" type="button" disabled={savingModulos} onClick={() => setModulosUser(null)}>Cancelar</button>
            <button className="btn pri" type="button" disabled={savingModulos} onClick={handleSaveModulos}>{savingModulos ? 'Salvando...' : 'Salvar permissões'}</button>
          </div>
        </div>
      </VxDialog>
    </div>
  );
}
