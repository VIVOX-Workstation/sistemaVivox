import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Cliente } from '../../types';
import { api } from '../../api/client';

// Anotações internas do cliente (campo observacoes), no layout clean.

interface Props {
  cliente: Cliente;
  onChange: (id: string) => void;
}

export function NotesTab({ cliente, onChange }: Props) {
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState(false);
  const alterado = observacoes !== (cliente.observacoes || '');

  const handleSave = async () => {
    setIsSaving(true);
    setErro(false);
    try {
      await api.patch(`/clientes/${cliente.id}`, { observacoes });
      onChange(cliente.id);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch {
      setErro(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card cp" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
      <div className="sec-t">
        <h2>Anotações internas</h2>
        {salvo && <span className="meta"><Check className="i" aria-hidden="true" />Salvo agora</span>}
        {erro && <span className="meta" style={{ color: 'var(--bad)' }} role="alert">Não foi possível salvar</span>}
      </div>
      <label htmlFor="notas" className="sr">Anotações internas</label>
      <textarea
        id="notas"
        className="inp"
        rows={10}
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Tom de voz, restrições, quem aprova, horários de aprovação"
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p className="mut" style={{ fontSize: 12.5 }}>Só a equipe interna vê estas anotações.</p>
        <button className="btn pri sm" type="button" onClick={handleSave} disabled={isSaving || !alterado}>
          {isSaving ? 'Salvando...' : 'Salvar anotações'}
        </button>
      </div>
    </section>
  );
}
