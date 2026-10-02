import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import './planning-workspace.css';

// Login exclusivo dos clientes (/portal/entrar). A equipe continua usando /login.
export function PortalLogin() {
  const { signIn, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  useLiquidGlass(workspaceRef, true);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CLIENTE') navigate('/portal', { replace: true });
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), senha });
      if (data.user?.role !== 'CLIENTE') {
        // Conta da equipe: não abre sessão por aqui
        setError('Este acesso é exclusivo para clientes. Membros da equipe devem entrar pelo painel interno.');
        return;
      }
      signIn(data.access_token, data.user);
      navigate('/portal', { replace: true });
    } catch (err: any) {
      setError(
        err.response?.status === 401
          ? 'Login ou senha incorretos.'
          : err.response?.data?.message || 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={workspaceRef}
      className="planning-workspace w-full flex items-center justify-center text-[#1E1A16]"
      // inline porque .planning-workspace (CSS sem layer) sobrescreve min-h-screen e soma 80px de padding-bottom
      style={{ minHeight: '100dvh', paddingBottom: 24 }}
    >
      <div className="pw-lg-scene" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <div className="pw-glass-panel p-7 sm:p-8 rounded-[28px] border border-white/60 shadow-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center shadow-2xs">
              <Sparkles className="w-6 h-6 text-[#8A6828]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#7A6440] uppercase tracking-wider block">
                Vivox Marketing
              </span>
              <h1 className="font-archivo text-xl sm:text-2xl font-extrabold text-[#1E1A16]">
                Portal do Cliente
              </h1>
              <p className="text-xs text-[#5E574C] mt-1">
                Acompanhe seus serviços e descubra novas soluções para a sua marca.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#1E1A16]">Login</span>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/80 border border-[#524B40]/15 focus-within:border-[#C7A15F] transition-colors">
                <Mail className="w-4 h-4 text-[#8A6828] shrink-0" />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sua-empresa@cliente.vivox"
                  className="w-full bg-transparent text-sm text-[#1E1A16] placeholder-[#8F8271] focus:outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#1E1A16]">Senha</span>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/80 border border-[#524B40]/15 focus-within:border-[#C7A15F] transition-colors">
                <Lock className="w-4 h-4 text-[#8A6828] shrink-0" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#1E1A16] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="text-[#8F8271] hover:text-[#1E1A16] cursor-pointer"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full pw-glass-control pw-glass-gold px-4 py-3 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{loading ? 'Entrando...' : 'Entrar no portal'}</span>
            </button>
          </form>

          <p className="text-[11px] text-center text-[#847663]">
            Não tem acesso ou esqueceu a senha? Fale com a equipe Vivox.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PortalLogin;
