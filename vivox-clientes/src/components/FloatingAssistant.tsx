import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { CanvasAnimation } from './ui/set-of-animations-4';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function FloatingAssistant({ clienteId }: { clienteId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userText };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o servidor');
      }

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantText += chunk;

          setMessages(prev =>
            prev.map(m => (m.id === assistantMessageId ? { ...m, content: assistantText } : m))
          );
        }
      }
    } catch (err) {
      console.error('Erro no chat da IA:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu uma falha ao consultar o cérebro da IA. Verifique se o backend está ativo.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-[var(--vivox-brand)] hover:bg-[var(--vivox-brand-hover)] text-[var(--vivox-on-brand)] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 group flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6 absolute opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 text-[var(--vivox-surface-strong)]" />
        <Bot className="w-7 h-7 group-hover:scale-90 transition-all duration-300" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-[var(--vivox-surface)] border border-[var(--vivox-border)] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-[600px] h-[800px]' : 'w-[380px] h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-[var(--vivox-surface-strong)] p-4 border-b border-[var(--vivox-border)] text-[var(--vivox-text)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--vivox-brand)]" />
          <h3 className="font-semibold text-sm">Consultor Especialista (IA)</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--vivox-background)] flex flex-col relative">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--vivox-text-muted)] mt-4 flex flex-col items-center">
            <div className="scale-90 mb-2">
              <CanvasAnimation animationId={isLoading ? "sphere-scan" : "sphere-idle"} />
            </div>
            <p className="text-sm px-4">
              Olá! Eu sou o assistente IA da Vivox. Conheço o contexto e o mercado deste cliente. Como posso ajudar na estratégia hoje?
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[var(--vivox-surface-strong)] border border-[var(--vivox-border)] text-[var(--vivox-text)] rounded-br-none'
                    : 'bg-[var(--vivox-surface)] border border-[var(--vivox-border)] text-[var(--vivox-text)] rounded-bl-none'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-[var(--vivox-surface)] border border-[var(--vivox-border)] rounded-2xl rounded-bl-none pr-4 pl-1 py-1 shadow-sm flex items-center gap-1">
              <div className="w-12 h-12 overflow-hidden relative flex items-center justify-center">
                <div className="scale-[0.3]">
                  <CanvasAnimation animationId="sphere-scan" />
                </div>
              </div>
              <span className="text-xs text-[var(--vivox-text-muted)] font-medium tracking-wide">Analisando o cérebro...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[var(--vivox-surface)] border-t border-[var(--vivox-border)] shrink-0">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 bg-[var(--vivox-surface-raised)] border border-[var(--vivox-border)] rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-[rgba(184,148,85,0.50)] focus-within:shadow-[0_0_0_2px_rgba(184,148,85,0.12)] transition-all"
        >
          <input
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-[var(--vivox-text)] placeholder:text-[var(--vivox-text-muted)] py-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta estratégica..."
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-full transition-colors flex items-center justify-center shrink-0 ${
              !input.trim() || isLoading
                ? 'bg-[var(--vivox-surface-strong)] text-[var(--vivox-text-muted)] cursor-not-allowed border border-[var(--vivox-border)]'
                : 'bg-[var(--vivox-brand)] hover:bg-[var(--vivox-brand-hover)] text-[var(--vivox-on-brand)] shadow-sm hover:shadow-md cursor-pointer border border-[rgba(126,94,45,0.28)]'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
