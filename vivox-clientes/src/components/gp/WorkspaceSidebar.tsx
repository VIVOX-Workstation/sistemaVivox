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
      className={`bg-white border-r border-[#D8CBB8] h-full flex flex-col transition-all duration-200 shrink-0 select-none z-10 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Topo da Sidebar de Workspaces */}
      <div className="p-3.5 border-b border-[#D8CBB8] flex items-center justify-between gap-2 shrink-0 bg-[#FFFDF8]">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-[#C7A15F]" />
            <h3 className="text-xs font-bold text-[#1E1A16] tracking-tight">
              Workspaces
            </h3>
            <span className="text-[10px] font-bold text-[#8A6828] bg-[#C7A15F]/20 border border-[#C7A15F]/30 px-2 py-0.5 rounded-full">
              {workspaces.length}
            </span>
          </div>
        ) : (
          <FolderKanban className="w-4 h-4 text-[#C7A15F] mx-auto" />
        )}

        <div className="flex items-center gap-1">
          {!collapsed && (
            <button
              onClick={onOpenCreateWorkspace}
              title="Criar novo workspace"
              className="p-1 rounded-md text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir workspaces' : 'Recolher workspaces'}
            className="p-1 rounded-md text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Lista de Workspaces */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#FAF7F2]">
        {/* Item: Visão Geral / Todos os Workspaces */}
        <button
          onClick={() => onSelectWorkspace(null)}
          title="Todos os Workspaces"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedWorkspaceId === null
              ? 'bg-gradient-to-r from-[#241F1A] to-[#181512] text-[#F6F0E7] border border-[#C7A15F]/40 shadow-xs'
              : 'text-[#625746] hover:bg-white hover:text-[#1E1A16]'
          }`}
        >
          <Globe className={`w-4 h-4 shrink-0 ${selectedWorkspaceId === null ? 'text-[#C7A15F]' : 'text-[#8F8271]'}`} />
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between truncate">
              <span className="truncate">Todos os Espaços</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedWorkspaceId === null
                    ? 'bg-[#C7A15F]/25 text-[#E8D7B8] border border-[#C7A15F]/30'
                    : 'bg-white text-[#625746] border border-[#D8CBB8]'
                }`}
              >
                {totalTarefasGeral}
              </span>
            </div>
          )}
        </button>

        {/* Separador */}
        {!collapsed && (
          <div className="pt-3 px-3 text-[10px] font-bold text-[#8F8271] uppercase tracking-wider">
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
                    ? 'bg-[#FFFDF8] text-[#1E1A16] border border-[#C7A15F]/70 shadow-2xs font-bold'
                    : 'text-[#625746] hover:bg-white hover:text-[#1E1A16]'
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
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected
                            ? 'bg-[#C7A15F]/20 text-[#8A6828]'
                            : 'bg-black/5 text-[#8F8271]'
                        }`}
                      >
                        {tarefaCount}
                      </span>
                    </div>

                    {ws.cliente && (
                      <span className="text-[10px] text-[#8F8271] flex items-center gap-1 truncate mt-0.5">
                        <Building2 className="w-2.5 h-2.5 shrink-0 text-[#C7A15F]" />
                        <span className="truncate">{ws.cliente.nomeFantasia}</span>
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
