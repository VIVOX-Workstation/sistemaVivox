import React, { useState } from 'react';
import type { Cliente } from '../../types';
import { api } from '../../api/client';
import { Button } from '../Button';
import { Textarea } from '../Textarea';
import { Save } from 'lucide-react';

interface Props {
  cliente: Cliente;
  onChange: (id: string) => void;
}

export function NotesTab({ cliente, onChange }: Props) {
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/clientes/${cliente.id}`, { observacoes });
      onChange(cliente.id);
    } catch (err) {
      alert("Erro ao salvar observações");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Observações Internas</h3>
      <p className="text-sm text-slate-500 mb-4">
        Utilize este espaço para anotar informações importantes, particularidades no atendimento ou qualquer detalhe relevante sobre a conta.
      </p>
      
      <Textarea 
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Digite suas observações aqui..."
        rows={12}
        className="font-sans"
      />
      
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isSaving || observacoes === cliente.observacoes} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar Observações'}
        </Button>
      </div>
    </div>
  );
}
