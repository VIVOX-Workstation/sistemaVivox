import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Settings, Users, UserPlus, CheckCircle2, ShieldAlert, Edit2, KeyRound } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR';
  createdAt: string;
}

export function Configuracoes() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'COLABORADOR') => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      loadUsers(); // refresh the list
    } catch (err) {
      console.error('Erro ao alterar cargo', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/users', { nome, email, senha });
      setSuccess('Usuário criado com sucesso!');
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFDF8] p-6 rounded-[11px] border border-[#D8CBB8] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#8A6828]" />
            <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">
              Configurações
            </h1>
          </div>
          <p className="text-xs text-[#625746]">
            Gerencie os usuários e permissões do sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA DE USUÁRIOS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#D8CBB8]/70 pb-2">
            <Users className="w-4 h-4 text-[#B89455]" />
            <h2 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
              Usuários do Sistema
            </h2>
          </div>

          <div className="bg-[#FFFDF8] rounded-[11px] border border-[#D8CBB8] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#625746]">Carregando usuários...</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#FAF6F0] border-b border-[#E5D9C8]">
                    <th className="px-4 py-3 font-semibold text-[#847663] text-xs">Usuário</th>
                    <th className="px-4 py-3 font-semibold text-[#847663] text-xs hidden md:table-cell">E-mail</th>
                    <th className="px-4 py-3 font-semibold text-[#847663] text-xs">Papel</th>
                    <th className="px-4 py-3 font-semibold text-[#847663] text-xs">Criado em</th>
                    <th className="px-4 py-3 font-semibold text-[#847663] text-xs text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D9C8]/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#FAF6F0]/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#FAF2E4] border border-[#E8D4B4] rounded-lg flex items-center justify-center text-[#8A6828] font-bold text-xs">
                            {user.nome?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#1E1A16] text-xs">{user.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#625746] hidden md:table-cell">{user.email}</td>
                      <td className="px-4 py-3 text-xs text-[#625746]">
                        {currentUser?.role === 'ADMIN' && currentUser.id !== user.id ? (
                          <select 
                            value={user.role || 'COLABORADOR'} 
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'ADMIN' | 'COLABORADOR')}
                            className="bg-white border border-[#D8CBB8] rounded px-2 py-1 text-xs text-[#1E1A16] focus:outline-none focus:border-[#B89455]"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="COLABORADOR">COLABORADOR</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'ADMIN' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F6F0E7] text-[#8F8271]'
                          }`}>
                            {user.role || 'COLABORADOR'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#625746]">{formatarDataBR(user.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-[#8A6828] hover:bg-[#FAF2E4] rounded-md transition-colors"
                            title="Editar Usuário"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openResetModal(user)}
                            className="p-1.5 text-[#B83B32] hover:bg-[#FDF2F2] rounded-md transition-colors"
                            title="Redefinir Senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-[#625746]">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FORMULÁRIO NOVO USUÁRIO */}
        <div className="space-y-4">
          <div className="border-b border-[#D8CBB8]/70 pb-2">
            <h2 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#B89455]" />
              Novo Usuário
            </h2>
          </div>

          <form onSubmit={handleCreateUser} className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#847663] mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] px-3 py-2 text-[#1E1A16] focus:outline-none focus:border-[#B89455] focus:ring-1 focus:ring-[#B89455]"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#847663] mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] px-3 py-2 text-[#1E1A16] focus:outline-none focus:border-[#B89455] focus:ring-1 focus:ring-[#B89455]"
                placeholder="exemplo@vivox.com.br"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#847663] mb-1">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full text-sm rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] px-3 py-2 text-[#1E1A16] focus:outline-none focus:border-[#B89455] focus:ring-1 focus:ring-[#B89455]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[#FDF2F2] border border-[#FCDAD7] text-[#B83B32] p-2.5 rounded-lg text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="flex items-start gap-2 bg-[#E6F4EA] border border-[#CEEAD6] text-[#247A4A] p-2.5 rounded-lg text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loadingForm}
              className="w-full py-2.5 rounded-lg bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingForm ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal Editar Usuário */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Usuário"
      >
        <form onSubmit={handleEditUser} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-[#847663] mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
              className="w-full text-sm rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] px-3 py-2 text-[#1E1A16] focus:outline-none focus:border-[#B89455] focus:ring-1 focus:ring-[#B89455]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#847663] mb-1">E-mail</label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full text-sm rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] px-3 py-2 text-[#1E1A16] focus:outline-none focus:border-[#B89455] focus:ring-1 focus:ring-[#B89455]"
            />
          </div>
          
          {editError && (
            <div className="flex items-start gap-2 bg-[#FDF2F2] border border-[#FCDAD7] text-[#B83B32] p-2.5 rounded-lg text-xs font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{editError}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 text-xs font-semibold text-[#625746] hover:bg-[#FAF6F0] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingForm}
              className="px-4 py-2 rounded-lg bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {loadingForm ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Redefinir Senha */}
      <Modal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        title="Redefinir Senha"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
          <p className="text-sm text-[#625746] mb-4">
            Defina uma nova senha para o usuário <strong>{resettingUser?.nome}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[#847663] mb-1">Nova Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={newSenha}
              onChange={(e) => setNewSenha(e.target.value)}
              className="w-full text-sm rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] px-3 py-2 text-[#1E1A16] focus:outline-none focus:border-[#B89455] focus:ring-1 focus:ring-[#B89455]"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          {resetError && (
            <div className="flex items-start gap-2 bg-[#FDF2F2] border border-[#FCDAD7] text-[#B83B32] p-2.5 rounded-lg text-xs font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{resetError}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setResettingUser(null)}
              className="px-4 py-2 text-xs font-semibold text-[#625746] hover:bg-[#FAF6F0] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingForm}
              className="px-4 py-2 rounded-lg bg-[#B83B32] hover:bg-[#9E3128] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {loadingForm ? 'Salvando...' : 'Redefinir Senha'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
