import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Key, 
  User as UserIcon, 
  Globe, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  MessageSquare, 
  Calendar, 
  Link as LinkIcon,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { portalApi, type AcessoPortalResponse, type ClienteInteresse } from '../../api/portal';

interface AcessoPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNome: string;
  /** Página do portal aberta após o login (ex.: acompanhamento já filtrado) */
  caminhoDestino?: string;
  /** Texto do convite enviado ao cliente */
  descricaoDestino?: string;
}

export function AcessoPortalModal({
  isOpen,
  onClose,
  clienteId,
  clienteNome,
  caminhoDestino,
  descricaoDestino,
}: AcessoPortalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acesso, setAcesso] = useState<AcessoPortalResponse | null>(null);
  const [interesses, setInteresses] = useState<ClienteInteresse[]>([]);
  const [redefinindo, setRedefinindo] = useState(false);

  // Estados de feedback de cópia
  const [copiadoUrl, setCopiadoUrl] = useState(false);
  const [copiadoLogin, setCopiadoLogin] = useState(false);
  const [copiadoSenha, setCopiadoSenha] = useState(false);
  const [copiadoTudo, setCopiadoTudo] = useState(false);
  const [copiadoInterno, setCopiadoInterno] = useState(false);

  useEffect(() => {
    if (isOpen && clienteId) {
      carregarDados();
    } else {
      // Reset ao fechar
      setError(null);
      setCopiadoUrl(false);
      setCopiadoLogin(false);
      setCopiadoSenha(false);
      setCopiadoTudo(false);
      setCopiadoInterno(false);
    }
  }, [isOpen, clienteId]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [acessoData, interessesData] = await Promise.all([
        portalApi.getAcessoPortal(clienteId),
        portalApi.getInteressesCliente(clienteId),
      ]);
      setAcesso(acessoData);
      setInteresses(interessesData || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados do portal do cliente:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar os dados de acesso ao portal.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedefinirSenha = async () => {
    if (!confirm('Deseja realmente gerar uma nova senha para este cliente? O acesso anterior deixará de funcionar imediatamente.')) {
      return;
    }

    setRedefinindo(true);
    try {
      const novoAcesso = await portalApi.redefinirSenhaPortal(clienteId);
      setAcesso(novoAcesso);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      alert(err.response?.data?.message || 'Erro ao redefinir senha do cliente.');
    } finally {
      setRedefinindo(false);
    }
  };

  const copyToClipboard = (text: string, setCopiedFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  const caminhoLogin = caminhoDestino
    ? `/portal/entrar?destino=${encodeURIComponent(caminhoDestino)}`
    : '/portal/entrar';
  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}${caminhoLogin}` : caminhoLogin;

  const handleCopiarTudo = () => {
    if (!acesso) return;
    const mensagemWhatsApp = 
`*Acesso ao Portal do Cliente - Vivox*
Olá! Seguem seus dados exclusivos de acesso ao nosso Portal:

🔗 *Link:* ${portalUrl}
👤 *Login:* ${acesso.login}
🔑 *Senha:* ${acesso.senha}

${descricaoDestino || 'Acesse para visualizar os serviços contratados e novidades disponíveis para a sua marca!'}`;

    copyToClipboard(mensagemWhatsApp, setCopiadoTudo);
  };

  const handleCopiarLinkInterno = () => {
    copyToClipboard(window.location.href, setCopiadoInterno);
  };

  const formatarData = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOVO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONTATADO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONVERTIDO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DESCARTADO':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#181512]/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="pw-glass-modal relative z-50 w-full max-w-2xl rounded-3xl bg-[#FFFDF8]/95 p-6 shadow-2xl border border-white/60 max-h-[92vh] flex flex-col text-[#1E1A16] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#524B40]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center text-[#8A6828] shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#8A6828]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1E1A16] font-archivo">
                Acesso do Cliente ao Portal
              </h2>
              <p className="text-xs text-[#5E574C]">
                Credenciais e interesses de <span className="font-bold text-[#1E1A16]">{clienteNome}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="pw-glass-control p-2 text-[#5E574C] hover:text-[#1E1A16] rounded-full transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#C7A15F] animate-spin" />
              <p className="text-xs font-bold text-[#5E574C]">Carregando credenciais e interesses...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Erro ao carregar dados do portal</span>
              </div>
              <p className="text-xs text-red-700">{error}</p>
              <button
                type="button"
                onClick={carregarDados}
                className="mt-2 px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-xs font-bold text-red-900 transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : acesso ? (
            <>
              {/* Aviso se acesso foi criado agora */}
              {acesso.criadoAgora && (
                <div className="p-3.5 rounded-2xl bg-[#E6F4EA] border border-[#CEEAD6] text-[#247A4A] flex items-center gap-2.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#247A4A]" />
                  <span className="text-xs font-bold">
                    Acesso criado agora! As credenciais abaixo foram geradas com sucesso para este cliente.
                  </span>
                </div>
              )}

              {/* Bloco de Credenciais */}
              <div className="pw-glass-panel p-5 rounded-2xl border border-white/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="pw-section-label text-xs font-bold text-[#7A6440] uppercase tracking-wider">
                    Dados de Acesso
                  </span>
                  <button
                    type="button"
                    onClick={handleRedefinirSenha}
                    disabled={redefinindo}
                    className="pw-glass-control px-2.5 py-1 text-[11px] font-bold text-[#7A6440] hover:text-[#1E1A16] flex items-center gap-1 rounded-lg cursor-pointer"
                    title="Gera uma nova senha aleatória para o cliente"
                  >
                    <RefreshCw className={`w-3 h-3 ${redefinindo ? 'animate-spin' : ''}`} />
                    <span>{redefinindo ? 'Gerando...' : 'Gerar nova senha'}</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* URL do Portal */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 border border-[#524B40]/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-4 h-4 text-[#8A6828] shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-[#5E574C] block">URL do Portal</span>
                        <span className="font-mono text-xs font-semibold text-[#1E1A16] select-all">{portalUrl}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(portalUrl, setCopiadoUrl)}
                      className="pw-glass-control p-1.5 rounded-lg text-[#5E574C] hover:text-[#1E1A16] cursor-pointer shrink-0"
                      title="Copiar URL"
                    >
                      {copiadoUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Login */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 border border-[#524B40]/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserIcon className="w-4 h-4 text-[#8A6828] shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-[#5E574C] block">Login</span>
                        <span className="font-mono text-xs font-semibold text-[#1E1A16] select-all">{acesso.login}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acesso.login, setCopiadoLogin)}
                      className="pw-glass-control p-1.5 rounded-lg text-[#5E574C] hover:text-[#1E1A16] cursor-pointer shrink-0"
                      title="Copiar Login"
                    >
                      {copiadoLogin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Senha */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 border border-[#524B40]/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key className="w-4 h-4 text-[#8A6828] shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-[#5E574C] block">Senha</span>
                        <span className="font-mono text-xs font-bold text-[#1E1A16] select-all tracking-wider">{acesso.senha}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acesso.senha, setCopiadoSenha)}
                      className="pw-glass-control p-1.5 rounded-lg text-[#5E574C] hover:text-[#1E1A16] cursor-pointer shrink-0"
                      title="Copiar Senha"
                    >
                      {copiadoSenha ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botão Copiar Tudo e Link Interno */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#524B40]/10">
                  <button
                    type="button"
                    onClick={handleCopiarTudo}
                    className="pw-glass-control pw-glass-primary w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.02]"
                  >
                    {copiadoTudo ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Texto copiado para WhatsApp!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar tudo (pronto para WhatsApp)</span>
                      </>
                    )}
                  </button>

                  {/* Ação antiga mantida como link pequeno */}
                  <button
                    type="button"
                    onClick={handleCopiarLinkInterno}
                    className="text-[11px] font-semibold text-[#7A6440] hover:text-[#1E1A16] underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{copiadoInterno ? 'Link interno copiado!' : 'Copiar link interno deste perfil'}</span>
                  </button>
                </div>
              </div>

              {/* Seção de Interesses do Cliente */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#8A6828]" />
                    <span className="font-archivo text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                      Interesses do Cliente ({interesses.length})
                    </span>
                  </div>
                </div>

                {interesses.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white/40 border border-[#524B40]/10 text-center space-y-1">
                    <p className="text-xs font-semibold text-[#5E574C]">
                      Nenhum interesse manifestado pelo cliente até o momento.
                    </p>
                    <p className="text-[11px] text-[#847663]">
                      Quando o cliente clicar em "Tenho interesse" no portal, o registro aparecerá aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {interesses.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3.5 rounded-2xl bg-white/70 border border-[#524B40]/10 space-y-2 hover:bg-white/90 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-[#8A6828]" />
                            <span className="text-xs font-bold text-[#1E1A16]">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                            <span className="text-[10px] text-[#847663] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatarData(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        {item.mensagem && (
                          <div className="text-xs text-[#5E574C] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#524B40]/5 italic">
                            "{item.mensagem}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#524B40]/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="pw-glass-control px-4 py-2 rounded-xl text-xs font-bold text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
