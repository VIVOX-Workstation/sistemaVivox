import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, X, Send, Maximize2, Minimize2, Loader2, Sparkles } from 'lucide-react';
import { api } from '../api/client';

export function FloatingAssistant({ clienteId }: { clienteId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // O Vercel AI SDK cuida de todo o estado das mensagens e streaming!
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: 'http://localhost:3000/ia/chat', // Ajustar conforme a URL base do backend real
    body: { clienteId },
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 group flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6 absolute opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 text-indigo-300" />
        <Bot className="w-7 h-7 group-hover:scale-90 transition-all duration-300" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-[600px] h-[800px]' : 'w-[380px] h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-100" />
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-indigo-600" />
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
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-xs text-slate-400">Processando contexto e mercado...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        >
          <input
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 py-1"
            value={input}
            onChange={handleInputChange}
            placeholder="Faça uma pergunta estratégica..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-full transition-colors flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
