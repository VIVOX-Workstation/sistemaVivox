import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Building2 } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Select } from '../components/Select';

export function ClientList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const matchesSearch = c.nomeFantasia.toLowerCase().includes(search.toLowerCase()) || 
                          (c.razaoSocial && c.razaoSocial.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter ? c.status.toLowerCase() === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'success';
      case 'PAUSADO': return 'warning';
      case 'ENCERRADO': return 'danger';
      case 'PROSPECT': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-sm text-slate-500">Gerencie a carteira de clientes da agência.</p>
        </div>
        <Button onClick={() => navigate('/cliente/novo')} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input 
            placeholder="Buscar por nome..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="prospect">Prospect</option>
            <option value="encerrado">Encerrado</option>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredClientes.map((cliente) => (
          <Link key={cliente.id} to={`/cliente/${cliente.id}`} className="block group">
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-indigo-200 cursor-pointer flex flex-col">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    {cliente.logoUrl ? (
                      <img src={cliente.logoUrl} alt={cliente.nomeFantasia} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(cliente.status)} className="capitalize">
                    {cliente.status.toLowerCase()}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {cliente.nomeFantasia}
                </h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-1">
                  {cliente.segmento}
                </p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Responsável:</span>
                  <span className="font-medium text-slate-700">{cliente.responsavel?.nome || 'Nenhum'}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {filteredClientes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
