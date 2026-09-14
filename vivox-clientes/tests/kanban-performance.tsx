// Fixture local, sem autenticação, consultas ou alterações no banco.
import React, { Profiler, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KanbanBoard } from '../src/components/gp/KanbanBoard';
import type { Tarefa, StatusTarefa } from '../src/types';
import '../src/index.css';

const initialTasks = Array.from({ length: 2829 }, (_, index) => ({
  id: `fixture-${index}`,
  titulo: `Tarefa de teste ${index + 1}${index % 3 === 0 ? ' com título longo para verificar a altura variável do cartão' : ''}`,
  status: index < 479 ? 'A_FAZER' : index < 481 ? 'EM_ANDAMENTO' : 'CONCLUIDA',
  prioridade: index % 7 === 0 ? 'URGENTE' : 'MEDIA',
  tags: [],
  responsavel: { id: 'fixture-user', nome: 'Pessoa de Teste', email: '' },
  cliente: index % 4 === 0 ? { id: 'fixture-client', nomeFantasia: 'Cliente de exemplo' } : undefined,
  prazo: index % 4 === 0 ? '2026-09-09T15:00:00' : undefined,
  checklist: index % 5 === 0 ? [{ id: 'item-1', titulo: 'Briefing', concluido: true }, { id: 'item-2', titulo: 'Revisão', concluido: false }] : [],
  _count: { comentarios: index % 5, checklist: 0 },
})) as Tarefa[];

function Fixture() {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const filtered = useMemo(() => tasks.filter(t => t.titulo.includes(search)), [tasks, search]);
  const select = useCallback((task: Tarefa) => setSelected(task.titulo), []);
  const update = useCallback((id: string, status: StatusTarefa) => {
    setTasks(previous => previous.map(task => task.id === id ? { ...task, status } : task));
  }, []);
  return (
    <div style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
      <label>Pesquisar teste <input aria-label="Pesquisar teste" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <output aria-label="Tarefa selecionada">{selected}</output>
      <KanbanBoard tarefas={filtered} onSelectTarefa={select} onUpdateStatus={update} onQuickCreate={() => {}} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <Profiler id="kanban" onRender={(_id, phase, duration) => {
    if (phase === 'mount') document.getElementById('render-duration')!.textContent = `Montagem React: ${duration.toFixed(1)} ms`;
  }}>
    <Fixture />
  </Profiler>,
);
