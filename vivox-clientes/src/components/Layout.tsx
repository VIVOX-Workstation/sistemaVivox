import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Users, 
  BarChart2, 
  CheckSquare, 
  GraduationCap, 
  PenTool, 
  Palette, 
  Film, 
  Kanban 
} from 'lucide-react';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col shadow-xl z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <span className="text-xl font-black text-white tracking-tight">SISTEMA</span>
          <span className="text-xl font-medium text-indigo-400 ml-2 tracking-tight">VIVOX</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Users className="w-5 h-5" />
            Vivox Clientes
          </NavLink>
          
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <BarChart2 className="w-5 h-5" />
            Vivox Analytics
          </NavLink>
          
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/50 transition-colors">
            <CheckSquare className="w-5 h-5" />
            Vivox Revisão
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/50 transition-colors">
            <GraduationCap className="w-5 h-5" />
            Vivox Educacional
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/50 transition-colors">
            <PenTool className="w-5 h-5" />
            Vivox Analista
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/50 transition-colors">
            <Palette className="w-5 h-5" />
            Vivox Studio
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/50 transition-colors">
            <Film className="w-5 h-5" />
            Vivox Film
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/50 transition-colors">
            <Kanban className="w-5 h-5" />
            Vivox GP
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
