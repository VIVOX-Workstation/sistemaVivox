import React, { useState } from 'react';
import type { Cliente, Contato } from '../../types';
import { api } from '../../api/client';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Plus, Trash2, Edit2, Mail, Phone } from 'lucide-react';

interface Props {
  cliente: Cliente;
  onChange: (id: string) => void;
}

export function OverviewTab({ cliente, onChange }: Props) {
  const [isContatoModalOpen, setContatoModalOpen] = useState(false);
  const [currentContato, setCurrentContato] = useState<Partial<Contato>>({});

  const handleSaveContato = async (e: React.FormEvent) => {
    e.preventDefault();
    const newContato = {
      ...currentContato,
      id: currentContato.id || crypto.randomUUID(),
    } as Contato;

    let novosContatos = [...cliente.contatos];
    if (currentContato.id) {
      novosContatos = novosContatos.map(c => c.id === currentContato.id ? newContato : c);
    } else {
      novosContatos.push(newContato);
    }

    try {
      await api.patch(`/clientes/${cliente.id}`, { contatos: novosContatos });
      onChange(cliente.id);
      setContatoModalOpen(false);
      setCurrentContato({});
    } catch (err) {
      alert("Erro ao salvar contato.");
    }
  };

  const handleDeleteContato = async (id: string) => {
    if (confirm('Remover contato?')) {
      const novosContatos = cliente.contatos.filter(c => c.id !== id);
      try {
        await api.patch(`/clientes/${cliente.id}`, { contatos: novosContatos });
        onChange(cliente.id);
      } catch (err) {
        alert("Erro ao remover contato.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">Dados Cadastrais</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">Razão Social</dt>
              <dd className="font-medium text-slate-900 text-right">{cliente.razaoSocial || '-'}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">CNPJ/CPF</dt>
              <dd className="font-medium text-slate-900 text-right">{cliente.cnpjCpf || '-'}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">Início de Contrato</dt>
              <dd className="font-medium text-slate-900 text-right">
                {cliente.dataInicioContrato ? new Date(cliente.dataInicioContrato).toLocaleDateString('pt-BR') : '-'}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Contatos</h3>
            <Button variant="ghost" size="sm" onClick={() => { setCurrentContato({}); setContatoModalOpen(true); }} className="h-8">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          
          <div className="space-y-3">
            {cliente.contatos.map(contato => (
              <div key={contato.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-start justify-between group">
                <div>
                  <h4 className="font-semibold text-slate-900">{contato.nome}</h4>
                  <p className="text-xs text-slate-500 mb-2">{contato.cargo}</p>
                  <div className="flex flex-col gap-1 text-sm text-slate-600">
                    {contato.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {contato.email}</div>}
                    {contato.telefone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {contato.telefone}</div>}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => { setCurrentContato(contato); setContatoModalOpen(true); }}>
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => handleDeleteContato(contato.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
            {cliente.contatos.length === 0 && (
              <p className="text-sm text-slate-500 italic">Nenhum contato cadastrado.</p>
            )}
          </div>
        </div>
      </div>

      {/* INTEGRAÇÕES GOOGLE (GA4 & SEARCH CONSOLE) */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Integrações Google (Métricas & SEO)</h3>
            <p className="text-xs text-slate-500 mt-0.5">IDs vinculados para busca automática de tráfego e palavras-chave ranqueadas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Google Analytics 4 (GA4)</span>
              <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                {cliente.ga4PropertyId ? `Propriedade #${cliente.ga4PropertyId}` : 'Não configurado'}
              </p>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cliente.ga4PropertyId ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
              {cliente.ga4PropertyId ? 'Configurado' : 'Pendente'}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Google Search Console (GSC)</span>
              <p className="font-mono text-xs font-bold text-slate-900 mt-0.5 truncate max-w-[220px]">
                {cliente.gscSiteUrl || 'Não configurado'}
              </p>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cliente.gscSiteUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
              {cliente.gscSiteUrl ? 'Configurado' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isContatoModalOpen} 
        onClose={() => setContatoModalOpen(false)}
        title={currentContato.id ? 'Editar Contato' : 'Novo Contato'}
      >
        <form onSubmit={handleSaveContato} className="space-y-4">
          <Input 
            label="Nome" 
            required 
            value={currentContato.nome || ''} 
            onChange={e => setCurrentContato({...currentContato, nome: e.target.value})} 
          />
          <Input 
            label="Cargo" 
            required 
            value={currentContato.cargo || ''} 
            onChange={e => setCurrentContato({...currentContato, cargo: e.target.value})} 
          />
          <Input 
            label="E-mail" 
            type="email" 
            value={currentContato.email || ''} 
            onChange={e => setCurrentContato({...currentContato, email: e.target.value})} 
          />
          <Input 
            label="Telefone / WhatsApp" 
            value={currentContato.telefone || ''} 
            onChange={e => setCurrentContato({...currentContato, telefone: e.target.value, whatsapp: e.target.value})} 
          />
          <div className="flex justify-end pt-4 gap-2">
            <Button variant="outline" type="button" onClick={() => setContatoModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
