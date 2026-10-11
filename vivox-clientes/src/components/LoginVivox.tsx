import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye, EyeOff, LockKeyhole, Mail, LoaderCircle } from 'lucide-react';
import FlowingPaths from './FlowingPaths';
import '../pages/FlowHome.css';
import './LoginVivox.css';

interface LoginVivoxProps {
  onSubmit: (data: { email: string; senha: string; lembrar: boolean }) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  defaultEmail?: string;
}

export default function LoginVivox({ onSubmit, loading = false, error = null, defaultEmail = '' }: LoginVivoxProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(Boolean(defaultEmail));
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Entrar — VIVOX Flow';
    return () => { document.title = previousTitle; };
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!loading) void onSubmit({ email, senha, lembrar });
  };

  return (
    <div className="flow-home flow-login">
      <a className="flow-skip" href="#login-main">Pular para o conteúdo</a>
      <header className="flow-header">
        <Link className="flow-brand flow-login-brand" to="/" aria-label="Voltar à página inicial do VIVOX Flow">
          <img src="/brand/vivox-logo.svg" alt="VIVOX" width="472" height="117" />
          <span>Flow</span>
        </Link>
      </header>
      <main id="login-main" className="flow-main flow-login-main">
        <div className="flow-login-content">
          <h1>Bem-vindo de volta.</h1>
          <p className="flow-login-intro">Entre para continuar seu trabalho.</p>
          <form onSubmit={handleSubmit} className="flow-login-form" aria-busy={loading}>
            <div className="flow-login-field">
              <label htmlFor="email">E-mail</label>
              <div className="flow-login-input">
                <Mail size={18} aria-hidden="true" />
                <input id="email" name="email" type="email" autoComplete="username" required disabled={loading}
                  value={email} onChange={event => setEmail(event.target.value)} placeholder="Seu e-mail"
                  autoCapitalize="none" spellCheck={false} aria-describedby={error ? 'login-error' : undefined} />
              </div>
            </div>
            <div className="flow-login-field">
              <label htmlFor="senha">Senha</label>
              <div className="flow-login-input">
                <LockKeyhole size={18} aria-hidden="true" />
                <input id="senha" name="senha" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  required disabled={loading} value={senha} onChange={event => setSenha(event.target.value)}
                  placeholder="Sua senha" aria-describedby={error ? 'login-error' : undefined} />
                <button type="button" className="flow-login-eye" disabled={loading} aria-pressed={showPassword}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(value => !value)}>
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <label className="flow-login-remember">
              <input type="checkbox" checked={lembrar} disabled={loading} onChange={event => setLembrar(event.target.checked)} />
              Lembrar de mim
            </label>
            {error && <div role="alert" id="login-error" className="flow-login-error">{error}</div>}
            <button type="submit" className="flow-enter flow-login-submit" disabled={loading}>
              <span>{loading ? 'Entrando…' : 'Entrar'}</span>
              <span className="flow-enter-icon">
                {loading ? <LoaderCircle className="flow-login-spinner" size={21} aria-hidden="true" /> : <ArrowUpRight size={22} aria-hidden="true" />}
              </span>
            </button>
          </form>
          <Link to="/" className="flow-login-back">Voltar à página inicial</Link>
        </div>
      </main>
      <FlowingPaths />
      <footer className="flow-footer"><span>Ideias em movimento.</span><span>VIVOX Flow</span></footer>
    </div>
  );
}