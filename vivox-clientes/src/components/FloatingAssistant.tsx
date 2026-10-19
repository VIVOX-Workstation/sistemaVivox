import { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
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
  /** Aberto pelo botão "Assistente" da barra superior (Layout). */
  open: boolean;
  onClose: () => void;
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
  const { open, onClose } = props;
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

  // Fica montado mesmo fechado para não perder a conversa ao fechar o painel
  return (
    <aside
      hidden={!open}
      aria-label="Assistente VIVOX"
      className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[var(--vx-surface)] border-l border-[var(--vx-line)] shadow-[-24px_0_60px_-30px_rgba(40,25,5,0.4)] font-[family-name:var(--vx-font)] text-[var(--vx-ink)] transition-[width] duration-300 ${
        isExpanded ? 'w-[min(680px,100%)]' : 'w-[min(420px,100%)]'
      }`}
    >
      {/* Cabeçalho */}
      <div className="h-14 px-4 border-b border-[var(--vx-line)] flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--vx-accent-soft)] flex items-center justify-center shrink-0">
          {isClientMode ? (
            <Wand2 className="w-4 h-4 text-[var(--vx-accent)]" aria-hidden="true" />
          ) : (
            <Building2 className="w-4 h-4 text-[var(--vx-accent)]" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">
            {isClientMode ? `Especialista: ${clientName || 'Cliente'}` : 'Assistente VIVOX'}
          </h2>
          <p className="text-xs text-[var(--vx-ink-3)] truncate">
            {isClientMode ? 'Conectado ao briefing e à inteligência da marca' : 'Visão geral da agência'}
          </p>
        </div>
        <div className="flex items-center gap-0.5 text-[var(--vx-ink-3)]">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              title="Limpar conversa"
              aria-label="Limpar conversa"
              className="w-8 h-8 grid place-items-center hover:bg-[var(--vx-sunken)] hover:text-[var(--vx-ink)] rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Diminuir painel' : 'Ampliar painel'}
            aria-label={isExpanded ? 'Diminuir painel' : 'Ampliar painel'}
            className="w-8 h-8 grid place-items-center hover:bg-[var(--vx-sunken)] hover:text-[var(--vx-ink)] rounded-lg transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Fechar o assistente"
            aria-label="Fechar o assistente"
            className="w-8 h-8 grid place-items-center hover:bg-[var(--vx-sunken)] hover:text-[var(--vx-ink)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="text-center my-auto flex flex-col items-center gap-2 px-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--vx-accent-soft)] grid place-items-center">
              <Sparkles className="w-5 h-5 text-[var(--vx-accent)]" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold">
              {isClientMode ? `Como posso ajudar com ${clientName || 'este cliente'}?` : 'Como posso ajudar?'}
            </h3>
            <p className="text-xs text-[var(--vx-ink-3)] max-w-xs leading-relaxed">
              {isClientMode
                ? 'Peça roteiros de reels, carrosséis, legendas e pautas no tom de voz da marca.'
                : 'Pergunte sobre métricas, clientes que precisam de atenção, gargalos da equipe ou relatórios.'}
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[var(--vx-ink)] text-white rounded-br-sm'
                    : 'bg-[var(--vx-sunken)] text-[var(--vx-ink)] rounded-bl-sm'
                }`}
              >
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div className="space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-sm font-semibold mt-2 mb-1" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-[13px] font-semibold mt-2 mb-1" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-[13px] font-semibold mt-1.5 mb-0.5" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-1 pl-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-1 pl-1" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                        p: ({ node, ...props }) => <p className="my-1 leading-relaxed" {...props} />,
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-2 rounded-lg border border-[var(--vx-line)] bg-[var(--vx-surface)]">
                            <table className="w-full text-left border-collapse text-[12.5px]" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-[var(--vx-soft)] text-[var(--vx-ink-3)]" {...props} />,
                        th: ({ node, ...props }) => <th className="p-2 font-semibold text-[11.5px] uppercase tracking-wide" {...props} />,
                        td: ({ node, ...props }) => <td className="p-2 border-t border-[var(--vx-line)]" {...props} />,
                        code: ({ node, ...props }) => (
                          <code className="bg-[var(--vx-surface)] px-1.5 py-0.5 rounded text-[12px] font-mono border border-[var(--vx-line)]" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-[var(--vx-accent)] pl-2.5 my-1 text-[var(--vx-ink-2)] italic" {...props} />
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Ações da resposta: copiar e enviar para o Kanban */}
                {m.role === 'assistant' && m.content && (
                  <div className="mt-2 pt-2 border-t border-[var(--vx-line)] flex items-center justify-between gap-2 text-[12px] text-[var(--vx-ink-3)]">
                    <span>{m.timestamp || ''}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--vx-surface)] hover:text-[var(--vx-ink)] transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[var(--vx-ok)]" />
                            <span className="text-[var(--vx-ok)] font-medium">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      {isClientMode && (
                        <button
                          type="button"
                          onClick={() => handleCreateKanban(m.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[var(--vx-accent-ink)] hover:bg-[var(--vx-surface)] transition-colors font-medium"
                          title="Enviar como card para o Kanban de Produções"
                        >
                          {kanbanSuccessId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[var(--vx-ok)]" />
                              <span className="text-[var(--vx-ok)]">Criado no Kanban</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Kanban</span>
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
          <div className="flex justify-start" role="status">
            <div className="bg-[var(--vx-sunken)] rounded-xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2 text-[13px] text-[var(--vx-ink-2)]">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--vx-line-strong)] border-t-[var(--vx-accent)] animate-spin" aria-hidden="true" />
              Pensando…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões e campo de mensagem */}
      <div className="p-3 border-t border-[var(--vx-line)] shrink-0 space-y-2">
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
          className="flex items-center gap-2"
        >
          <label htmlFor="assistente-msg" className="sr-only">Mensagem para o assistente</label>
          <input
            id="assistente-msg"
            className="flex-1 min-w-0 h-10 px-3 rounded-[10px] border border-[var(--vx-line-strong)] bg-[var(--vx-surface)] text-[13.5px] text-[var(--vx-ink)] placeholder:text-[#8C8073] focus:outline-none focus:border-[var(--vx-accent)] focus:shadow-[0_0_0_3px_var(--vx-ring)]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isClientMode ? `Peça algo para ${clientName || 'este cliente'}` : 'Pergunte ao assistente'}
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Enviar"
            className="w-10 h-10 rounded-[10px] grid place-items-center shrink-0 bg-[var(--vx-accent)] text-white hover:bg-[var(--vx-accent-ink)] transition-colors disabled:bg-[var(--vx-sunken)] disabled:text-[var(--vx-ink-3)] disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
