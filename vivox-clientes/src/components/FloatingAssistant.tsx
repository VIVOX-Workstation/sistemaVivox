import { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Bot,
  X,
  Send,
  Maximize2,
  Minimize2,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  Building2,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { CanvasAnimation } from './ui/set-of-animations-4';
import { getApiBaseUrl, api } from '../api/client';
import { QuickPromptChips } from './ia/QuickPromptChips';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface FloatingAssistantProps {
  clienteId?: string;
  clienteNome?: string;
}

export function FloatingAssistant(props: FloatingAssistantProps) {
  const location = useLocation();
  const params = useParams<{ id?: string }>();

  // Detecta clienteId via prop ou extração da rota atual (/cliente/:id ou /analytics/:id)
  let activeClienteId = props.clienteId || params.id;
  if (!activeClienteId) {
    const match = location.pathname.match(/\/(?:cliente|analytics)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1] && match[1] !== 'novo') {
      activeClienteId = match[1];
    }
  }

  const isClientMode = Boolean(activeClienteId);

  const [clientName, setClientName] = useState<string>(props.clienteNome || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [kanbanSuccessId, setKanbanSuccessId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Busca o nome do cliente se estiver no modo cliente e não tiver o nome ainda
  useEffect(() => {
    if (activeClienteId && !props.clienteNome) {
      api
        .get(`/clientes/${activeClienteId}`)
        .then((res) => {
          if (res.data?.nomeFantasia) {
            setClientName(res.data.nomeFantasia);
          }
        })
        .catch(() => {});
    }
  }, [activeClienteId, props.clienteNome]);

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKanban = async (messageId: string) => {
    if (!activeClienteId) return;
    try {
      setKanbanSuccessId(messageId);
      await api.post('/ia/productions/create-from-ai', {
        clienteId: activeClienteId,
        tipo: 'POST',
      });
      setTimeout(() => setKanbanSuccessId(null), 3000);
    } catch (err) {
      console.error('Erro ao criar no Kanban:', err);
      setKanbanSuccessId(null);
    }
  };

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('@Vivox:token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/ia/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clienteId: activeClienteId || undefined,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o servidor de IA');
      }

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantText += chunk;

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, content: assistantText } : m)),
          );
        }
      }
    } catch (err) {
      console.error('Erro no chat da IA:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            'Desculpe, ocorreu uma oscilação na conexão com a IA. Por favor, verifique se a API do backend está ativa.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3.5 bg-[#14120E] hover:bg-[#1E1B15] text-[#C7A15F] rounded-full shadow-2xl hover:shadow-[0_0_25px_rgba(199,161,95,0.35)] transition-all duration-300 z-50 group flex items-center justify-center border border-[#3A3327]"
        title={isClientMode ? `Especialista: ${clientName || 'Cliente'}` : 'Vivox Master AI'}
      >
        <Sparkles className="w-6 h-6 absolute opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 text-[#C7A15F]" />
        <Bot className="w-6 h-6 group-hover:scale-75 transition-all duration-300 text-[#C7A15F]" />
        {isClientMode && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C7A15F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C7A15F]"></span>
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-[#14120E] border border-[#2F2920] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-[680px] h-[820px]' : 'w-[420px] h-[640px]'
      }`}
    >
      {/* Header */}
      <div className="bg-[#0E0D0B] p-3.5 border-b border-[#24201A] text-[#F6F0E7] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#24201A] border border-[#3E3529] flex items-center justify-center shrink-0">
            {isClientMode ? (
              <Wand2 className="w-4 h-4 text-[#C7A15F]" />
            ) : (
              <Building2 className="w-4 h-4 text-[#C7A15F]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs text-[#F6F0E7] tracking-tight">
                {isClientMode
                  ? `Especialista: ${clientName || 'Cliente'}`
                  : 'Vivox Master AI'}
              </h3>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#24201A] text-[#C7A15F] border border-[#3A3327]">
                {isClientMode ? 'Marketing & Criação' : 'Operações & Relatórios'}
              </span>
            </div>
            <p className="text-[10px] text-[#8F8271]">
              {isClientMode
                ? 'Conectado ao briefing e inteligência da marca'
                : 'Visão executiva global da agência'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#8F8271]">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Limpar conversa"
              className="p-1.5 hover:bg-[#1E1B15] hover:text-[#D8CFBF] rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimizar janela' : 'Expandir janela'}
            className="p-1.5 hover:bg-[#1E1B15] hover:text-[#D8CFBF] rounded-md transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            title="Fechar chat"
            className="p-1.5 hover:bg-[#1E1B15] hover:text-[#D8CFBF] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#14120E] flex flex-col relative">
        {messages.length === 0 ? (
          <div className="text-center text-[#8F8271] my-auto flex flex-col items-center px-4">
            <div className="scale-90 mb-3">
              <CanvasAnimation animationId={isLoading ? 'sphere-scan' : 'sphere-idle'} />
            </div>
            <h4 className="text-sm font-semibold text-[#F6F0E7] mb-1">
              {isClientMode ? `Como posso criar para ${clientName || 'este cliente'}?` : 'Central de Inteligência Vivox'}
            </h4>
            <p className="text-xs text-[#8F8271] max-w-xs leading-relaxed">
              {isClientMode
                ? 'Estou pronto para gerar roteiros de reels, carrosséis, copies de alta conversão e calendário de pautas alinhados ao tom de voz.'
                : 'Pergunte sobre métricas consolidadas, clientes que precisam de atenção, gargalos operacionais ou relatórios estratégicos.'}
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md group relative ${
                  m.role === 'user'
                    ? 'bg-[#24201A] border border-[#3E3529] text-[#F6F0E7] rounded-br-none'
                    : 'bg-[#1A1713] border border-[#2D261E] text-[#E5DCce] rounded-bl-none'
                }`}
              >
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-xs">{m.content}</div>
                ) : (
                  <div className="prose-dark text-xs space-y-2 leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-sm font-bold text-[#C7A15F] mt-2 mb-1 border-b border-[#3E3529] pb-1" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-xs font-bold text-[#C7A15F] mt-2 mb-1" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-xs font-semibold text-[#F6F0E7] mt-1.5 mb-0.5" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold text-[#F6F0E7]" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside space-y-1 my-1 pl-1 text-[#E5DCce]" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside space-y-1 my-1 pl-1 text-[#E5DCce]" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="text-xs leading-relaxed" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="my-1 text-[#E5DCce] leading-relaxed" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-2 rounded-lg border border-[#3E3529]">
                            <table className="w-full text-left border-collapse text-[11px]" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-[#24201A] text-[#C7A15F] border-b border-[#3E3529]" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="p-2 font-bold text-[10px] uppercase tracking-wider" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="p-2 border-t border-[#2D261E] bg-[#14120E]/40 text-[#E5DCce]" {...props} />
                        ),
                        code: ({ node, ...props }) => (
                          <code className="bg-[#0E0D0B] text-[#C7A15F] px-1.5 py-0.5 rounded text-[10px] font-mono border border-[#2D261E]" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-[#C7A15F] pl-2.5 my-1 text-[#8F8271] italic text-xs" {...props} />
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Ações da Mensagem (Copiar e Enviar pro Kanban) */}
                {m.role === 'assistant' && m.content && (
                  <div className="mt-2.5 pt-2 border-t border-[#29231A] flex items-center justify-between gap-2 text-[10px] text-[#8F8271]">
                    <span>{m.timestamp || ''}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#24201A] hover:bg-[#2F2922] text-[#D8CFBF] transition-colors"
                        title="Copiar texto"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      {isClientMode && (
                        <button
                          onClick={() => handleCreateKanban(m.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#24201A] hover:bg-[#2F2922] text-[#C7A15F] hover:text-[#E2BD78] transition-colors font-medium"
                          title="Enviar como card para o Kanban de Produções"
                        >
                          {kanbanSuccessId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Criado no Kanban!</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3 h-3" />
                              <span>+ Kanban</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-[#1A1713] border border-[#2D261E] rounded-2xl rounded-bl-none pr-4 pl-2 py-1.5 shadow-md flex items-center gap-2">
              <div className="w-8 h-8 overflow-hidden relative flex items-center justify-center">
                <div className="scale-[0.25]">
                  <CanvasAnimation animationId="sphere-scan" />
                </div>
              </div>
              <span className="text-xs text-[#C7A15F] font-medium tracking-wide">
                Processando inteligência estratégica...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer & Quick Chips */}
      <div className="p-3 bg-[#0E0D0B] border-t border-[#24201A] shrink-0 space-y-2">
        <QuickPromptChips
          isClientMode={isClientMode}
          onSelectPrompt={(prompt) => handleSendPrompt(prompt)}
          disabled={isLoading}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(input);
          }}
          className="flex items-center gap-2 bg-[#1A1713] border border-[#2F2920] rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-[#C7A15F]/60 focus-within:shadow-[0_0_15px_rgba(199,161,95,0.15)] transition-all"
        >
          <input
            className="flex-1 bg-transparent border-none focus:outline-none text-xs text-[#F6F0E7] placeholder:text-[#6B6154] py-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isClientMode
                ? `Peça um roteiro, copy ou ideia para ${clientName || 'este cliente'}...`
                : 'Pergunte sobre relatórios, clientes ou desempenho global...'
            }
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center shrink-0 ${
              !input.trim() || isLoading
                ? 'bg-[#24201A] text-[#6B6154] cursor-not-allowed border border-[#332B21]'
                : 'bg-[#C7A15F] hover:bg-[#D4B070] text-[#14120E] shadow-sm hover:shadow-[0_0_12px_rgba(199,161,95,0.4)] cursor-pointer font-bold'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
