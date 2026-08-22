import React, { useState } from 'react';
import type { Projeto } from '../../types';
import { 
  Plus, 
  Globe, 
  FolderKanban, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Building2
} from 'lucide-react';

interface WorkspaceSidebarProps {
  workspaces: Projeto[];
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  onOpenCreateWorkspace: () => void;
  onOpenEditWorkspace: (workspace: Projeto) => void;
  onDeleteWorkspace: (id: string) => void;
  totalTarefasGeral: number;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenEditWorkspace,
  onDeleteWorkspace,
  totalTarefasGeral,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <aside
      className={`bg-white border-r border-slate-200 h-full flex flex-col transition-all duration-200 shrink-0 select-none z-10 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Topo da Sidebar de Workspaces */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">
              Workspaces
            </h3>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {workspaces.length}
            </span>
          </div>
        ) : (
          <FolderKanban className="w-4 h-4 text-emerald-600 mx-auto" />
        )}

        <div className="flex items-center gap-1">
          {!collapsed && (
            <button
              onClick={onOpenCreateWorkspace}
              title="Criar novo workspace"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir workspaces' : 'Recolher workspaces'}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Lista de Workspaces */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Item: Visão Geral / Todos os Workspaces */}
        <button
          onClick={() => onSelectWorkspace(null)}
          title="Todos os Workspaces"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedWorkspaceId === null
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between truncate">
              <span className="truncate">Todos os Espaços</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedWorkspaceId === null
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {totalTarefasGeral}
              </span>
            </div>
          )}
        </button>

        {/* Separador */}
        {!collapsed && (
          <div className="pt-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Seus Espaços
          </div>
        )}

        {/* Workspaces Cadastrados */}
        {workspaces.map((ws) => {
          const isSelected = selectedWorkspaceId === ws.id;
          const tarefaCount = ws._count?.tarefas ?? 0;

          return (
            <div key={ws.id} className="relative group">
              <button
                onClick={() => onSelectWorkspace(ws.id)}
                title={ws.nome}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-sm shrink-0">{ws.icone || '📁'}</span>

                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs leading-tight">
                        {ws.nome}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isSelected
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tarefaCount}
                      </span>
                    </div>

                    {ws.cliente && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5">
                        <Building2 className="w-2.5 h-2.5 text-slate-400" />
                        {ws.cliente.nomeFantasia}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Menu de Ações no Hover */}
              {!collapsed && (
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === ws.id ? null : ws.id);
                    }}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {openMenuId === ws.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onOpenEditWorkspace(ws);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onDeleteWorkspace(ws.id);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão Inferior Criar Workspace */}
      <div className="p-2.5 border-t border-slate-200 shrink-0">
        <button
          onClick={onOpenCreateWorkspace}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            collapsed ? 'p-2' : ''
          }`}
          title="Novo Workspace"
        >
          <Plus className="w-4 h-4" />
          {!collapsed && <span>Novo Workspace</span>}
        </button>
      </div>
    </aside>
  );
};
