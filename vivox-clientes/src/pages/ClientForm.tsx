import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Cliente, StatusCliente } from '../types';

// Cadastro de cliente no layout clean (canvas › ClienteNovo). Envia para POST /clientes.

export function ClientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
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
    email: '',
    telefone: '',
    localizacao: '',
    loginsSenhas: '',
    ga4PropertyId: '',
    gscSiteUrl: '',
    openpanelProjectId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const payload: Record<string, unknown> = {
        ...formData,
        nomeFantasia: formData.nomeFantasia || '',
        segmento: formData.segmento || '',
        status: (formData.status as string).toUpperCase() as StatusCliente,
        cnpjCpf: formData.cnpjCpf || '00000000000',
        dataInicioContrato: formData.dataInicioContrato
          ? new Date(formData.dataInicioContrato).toISOString()
          : new Date().toISOString(),
        ga4PropertyId: formData.ga4PropertyId?.trim() || undefined,
        gscSiteUrl: formData.gscSiteUrl?.trim() || undefined,
        openpanelProjectId: formData.openpanelProjectId?.trim() || undefined,
        contatos: [],
      };
      if (!payload.responsavelId) delete payload.responsavelId;

      const response = await api.post('/clientes', payload);
      const id = response.data?.id;
      navigate(id ? `/cliente/${id}` : '/clientes');
    } catch (error) {
      console.error(error);
      setErro('Não foi possível salvar o cliente. Confira os campos e tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const campo = (name: keyof Cliente, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="fld">
      <label htmlFor={`n-${name}`}>{label}</label>
      <input
        id={`n-${name}`}
        className="inp"
        name={name}
        value={(formData[name] as string) ?? ''}
        onChange={handleChange}
        {...extra}
      />
    </div>
  );

  return (
    <div className="vxp">
      <div className="pg" style={{ maxWidth: 1000 }}>
        <div className="ph">
          <div>
            <h1>Novo cliente</h1>
            <p>Os campos com * são obrigatórios. O restante pode ser preenchido depois, no perfil.</p>
          </div>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <div className="fs">
            <div><h2>Dados básicos</h2><p>Como o cliente aparece no sistema e no portal.</p></div>
            <div className="grid g2">
              {campo('nomeFantasia', 'Nome fantasia *', { required: true, placeholder: 'Ex.: Clínica Aurora' })}
              {campo('razaoSocial', 'Razão social', { placeholder: 'Ex.: Aurora Serviços Médicos LTDA' })}
              {campo('cnpjCpf', 'CNPJ ou CPF', { placeholder: '00.000.000/0000-00' })}
              {campo('segmento', 'Segmento *', { required: true, placeholder: 'Ex.: Saúde · oftalmologia' })}
              {campo('email', 'E-mail', { type: 'email', placeholder: 'contato@cliente.com.br' })}
              {campo('telefone', 'Telefone ou WhatsApp', { placeholder: '(00) 00000-0000' })}
              {campo('localizacao', 'Cidade e estado', { placeholder: 'Ex.: Campinas, SP' })}
            </div>
          </div>

          <div className="fs">
            <div><h2>Contrato</h2><p>Define em que filtro o cliente aparece.</p></div>
            <div className="grid g3">
              <div className="fld">
                <label htmlFor="n-status">Status *</label>
                <select id="n-status" className="inp" name="status" value={formData.status} onChange={handleChange} required>
                  <option value="PROSPECT">Prospect</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="PAUSADO">Pausado</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
              </div>
              {campo('dataInicioContrato', 'Início do contrato', { type: 'date', required: true })}
              <div className="fld">
                <label htmlFor="n-resp">Responsável</label>
                <input id="n-resp" className="inp" value={user?.nome ?? ''} readOnly aria-readonly="true" />
                <small>Quem cadastra fica como responsável.</small>
              </div>
            </div>
          </div>

          <div className="fs">
            <div><h2>Integrações</h2><p>Liga o cliente ao painel de Analytics.</p></div>
            <div className="grid g3">
              {campo('ga4PropertyId', 'Google Analytics 4', { placeholder: 'ID da propriedade' })}
              {campo('gscSiteUrl', 'Search Console', { placeholder: 'https://site.com.br/' })}
              {campo('openpanelProjectId', 'OpenPanel', { placeholder: 'slug-do-projeto' })}
            </div>
          </div>

          <div className="fs">
            <div><h2>Acessos</h2><p>Visível só para a equipe interna.</p></div>
            <div className="fld">
              <label htmlFor="n-ac">Logins, senhas ou link do cofre</label>
              <textarea id="n-ac" className="inp" rows={3} name="loginsSenhas" value={formData.loginsSenhas || ''} onChange={handleChange} placeholder="Prefira o link do cofre de senhas" />
            </div>
          </div>

          <div className="fs">
            <div><h2>Observações</h2><p>Contexto para quem vai atender.</p></div>
            <div className="fld">
              <label htmlFor="n-obs" className="sr">Observações</label>
              <textarea id="n-obs" className="inp" rows={3} name="observacoes" value={formData.observacoes || ''} onChange={handleChange} placeholder="Tom de voz, restrições, horários de aprovação" />
            </div>
          </div>

          <div className="dlg-f" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span className="mut" style={{ fontSize: 12.5, alignSelf: 'center', color: erro ? 'var(--bad)' : undefined }} role={erro ? 'alert' : undefined}>
              {erro || 'Depois de salvar, você vai para o perfil do cliente.'}
            </span>
            <div className="acts">
              <Link className="btn sec" to="/clientes">Cancelar</Link>
              <button className="btn pri" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar cliente'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
