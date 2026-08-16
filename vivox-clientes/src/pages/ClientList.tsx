import { useEffect, useState } from 'react';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">Clientes</h1>
          <p className="text-xs text-[#625746] mt-0.5">Gerencie a carteira de clientes e métricas da agência.</p>
        </div>
        <Button onClick={() => navigate('/cliente/novo')} className="shrink-0 gap-2 font-bold">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 bg-[#FFFDF8] border-[#D8CBB8]">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#847663]" />
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
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-[#B89455] cursor-pointer flex flex-col bg-[#FFFDF8] border-[#D8CBB8]">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-[11px] bg-[#FAF2E4] border border-[#E8D4B4] text-[#8A6828] flex items-center justify-center shrink-0">
                    {cliente.logoUrl ? (
                      <img src={cliente.logoUrl} alt={cliente.nomeFantasia} className="w-full h-full object-cover rounded-[11px]" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(cliente.status)} className="capitalize text-[11px]">
                    {cliente.status.toLowerCase()}
                  </Badge>
                </div>
                <h3 className="font-bold text-[#1E1A16] group-hover:text-[#8A6828] transition-colors line-clamp-1">
                  {cliente.nomeFantasia}
                </h3>
                <p className="text-xs text-[#625746] mb-4 line-clamp-1">
                  {cliente.segmento}
                </p>
                
                <div className="mt-auto pt-4 border-t border-[#EEE7DC] flex justify-between items-center text-xs">
                  <span className="text-[#847663]">Responsável:</span>
                  <span className="font-medium text-[#1E1A16]">{cliente.responsavel?.nome || 'Nenhum'}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {filteredClientes.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#847663] bg-[#FFFDF8] rounded-[11px] border border-[#D8CBB8] border-dashed">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
