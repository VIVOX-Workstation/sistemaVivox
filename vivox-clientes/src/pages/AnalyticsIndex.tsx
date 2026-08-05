import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Search, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';

export function AnalyticsIndex() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clientes.filter(c => 
    c.nomeFantasia.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            Vivox Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Selecione um cliente ativo para acessar o painel de resultados e oportunidades.</p>
        </div>
        
        <div className="w-full md:w-72">
          <Input 
            icon={<Search className="w-4 h-4" />}
            placeholder="Buscar cliente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando clientes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(cliente => (
            <div 
              key={cliente.id} 
              onClick={() => navigate(`/analytics/${cliente.id}`)}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {cliente.nomeFantasia.charAt(0).toUpperCase()}
                </div>
                <Badge variant={cliente.status === 'ATIVO' ? 'success' : cliente.status === 'PROSPECT' ? 'warning' : 'neutral'}>
                  {cliente.status}
                </Badge>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {cliente.nomeFantasia}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{cliente.segmento}</p>
              
              <div className="mt-6 flex items-center text-sm font-medium text-indigo-600">
                Acessar Dashboard
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Nenhum cliente ativo encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
