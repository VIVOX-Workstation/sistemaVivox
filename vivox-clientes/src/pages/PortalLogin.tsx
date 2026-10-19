import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { VivoxFlowLogo } from '../components/brand/VivoxFlowLogo';

// Login exclusivo dos clientes (/portal/entrar), no layout clean (canvas › PortalLogin).
// A equipe continua usando /login.
export function PortalLogin() {
  const { signIn, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link compartilhado pode levar direto a uma página do portal; só aceita caminhos internos do portal
  const [searchParams] = useSearchParams();
  const destinoBruto = searchParams.get('destino') || '';
  const destino = /^\/portal(\/|\?|$)/.test(destinoBruto) && !destinoBruto.startsWith('//') ? destinoBruto : '/portal';

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CLIENTE') navigate(destino, { replace: true });
  }, [isAuthenticated, user, navigate, destino]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), senha });
      if (data.user?.role !== 'CLIENTE') {
        // Conta da equipe: não abre sessão por aqui
        setError('Este acesso é exclusivo para clientes. Membros da equipe entram pelo sistema.');
        return;
      }
      signIn(data.access_token, data.user);
      navigate(destino, { replace: true });
    } catch (err: unknown) {
      const r = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      setError(r?.status === 401 ? 'Login ou senha incorretos.' : r?.data?.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vxp vxp-center">
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <VivoxFlowLogo className="pl-logo" />
          <span className="kick">Portal do cliente</span>
        </div>

        <form className="card" onSubmit={handleSubmit} style={{ width: '100%', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 650 }}>Acompanhe o seu projeto</h1>
            <p className="mut" style={{ marginTop: 4 }}>Entre com o login e a senha que a equipe VIVOX enviou para você.</p>
          </div>
          <div className="fld">
            <label htmlFor="p-login">Login</label>
            <input id="p-login" className="inp" type="text" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sua-empresa@cliente.vivox" />
          </div>
          <div className="fld">
            <label htmlFor="p-senha">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                id="p-senha"
                className="inp"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                style={{ paddingRight: 44 }}
              />
              <button
                className="ib sm"
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
              >
                {mostrarSenha ? <EyeOff className="i" aria-hidden="true" /> : <Eye className="i" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {error && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{error}</p>}
          <button className="btn pri full" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar no portal'}</button>
          <p className="mut" style={{ fontSize: 12.5, textAlign: 'center' }}>Perdeu o acesso? Fale com o seu atendimento VIVOX.</p>
        </form>

        <p className="mut" style={{ fontSize: 12 }}>
          Faz parte da equipe? <Link to="/login" style={{ color: 'var(--acc-ink)', fontWeight: 580 }}>Entrar no sistema</Link>
        </p>
      </div>
    </div>
  );
}

export default PortalLogin;
