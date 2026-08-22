import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Cliente, StatusCliente } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { Card } from '../components/Card';

export function ClientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nomeFantasia: '',
    razaoSocial: '',
    cnpjCpf: '',
    segmento: '',
    responsavelId: user?.id || '',
    status: 'PROSPECT',
    dataInicioContrato: new Date().toISOString().split('T')[0],
    contatos: [],
    observacoes: '',
    openpanelProjectId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        ...formData,
        nomeFantasia: formData.nomeFantasia || '',
        segmento: formData.segmento || '',
        status: (formData.status as string).toUpperCase() as StatusCliente,
        cnpjCpf: formData.cnpjCpf || '00000000000',
        dataInicioContrato: formData.dataInicioContrato ? new Date(formData.dataInicioContrato).toISOString() : new Date().toISOString(),
        openpanelProjectId: formData.openpanelProjectId?.trim() || undefined,
        contatos: [],
      };

      if (!payload.responsavelId) {
        delete payload.responsavelId;
      }
      
      const response = await api.post('/clientes', payload);
      navigate(`/`);
    } catch (error) {
      console.error(error);
      alert('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="px-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Novo Cliente</h1>
          <p className="text-sm text-slate-500">Cadastre um novo cliente no sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Dados Básicos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Nome Fantasia *" 
              name="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={handleChange}
              required
            />
            <Input 
              label="Razão Social" 
              name="razaoSocial"
              value={formData.razaoSocial}
              onChange={handleChange}
            />
            <Input 
              label="CNPJ/CPF" 
              name="cnpjCpf"
              value={formData.cnpjCpf}
              onChange={handleChange}
            />
            <Input 
              label="Segmento *" 
              name="segmento"
              value={formData.segmento}
              onChange={handleChange}
              required
            />
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Contrato & Agência</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Status *" 
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="PROSPECT">Prospect</option>
              <option value="ATIVO">Ativo</option>
              <option value="PAUSADO">Pausado</option>
              <option value="ENCERRADO">Encerrado</option>
            </Select>

            <Input 
              label="Responsável Interno (Seu ID) *" 
              name="responsavelId"
              value={formData.responsavelId}
              onChange={handleChange}
              readOnly
              required
            />
            
            <Input 
              label="Data de Início" 
              type="date"
              name="dataInicioContrato"
              value={formData.dataInicioContrato}
              onChange={handleChange}
              required
            />
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-lg font-semibold text-slate-900">Integração OpenPanel (Métricas de Tráfego)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Opcional. Preencha para sincronizar automaticamente as métricas de acessos do site/LP.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="ID do Projeto OpenPanel"
                name="openpanelProjectId"
                placeholder="Ex: nome-do-cliente-lp"
                value={formData.openpanelProjectId || ''}
                onChange={handleChange}
              />
              <p className="text-[11px] text-slate-400 mt-1">Slug do projeto exibido no dashboard do OpenPanel.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Informações Adicionais</h2>
          <Textarea 
            label="Observações Gerais"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={4}
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
