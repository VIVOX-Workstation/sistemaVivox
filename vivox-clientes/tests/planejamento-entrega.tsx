// Fixture isolated from real services: every API request uses the in-memory adapter below.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { api } from '../src/api/client';
import { PlanejamentoServico } from '../src/pages/PlanejamentoServico';
import '../src/index.css';
const serviceId = 'fixture-entrega';
const initialItem = { id: 'item-1', titulo: 'Landing page de lançamento', descricao: 'Apresentar a nova oferta e captar contatos.', status: 'PLANEJAMENTO', prazo: '2026-10-01', estrutura: [{id:'s1', titulo:'Apresentação', descricao:'Explicar a proposta de valor.'}], copyTexto:'Texto anterior preservado.', etapas:[{id:'e1',titulo:'Briefing aprovado',concluido:true},{id:'e2',titulo:'Produzir design',concluido:false}], createdAt:'2026-09-12T12:00:00Z' };
let plan = {id: 'fixture-plan', flowNodes: [initialItem]};
let tasks: any[] = [{id:'fixture-task', titulo:'Revisar layout', status:'EM_ANDAMENTO', prioridade:'MEDIA', servicoId:serviceId, responsavel:{nome:'Pessoa de teste'}, tags:[], checklist:[], createdAt:'2026-09-12T12:00:00Z'}];
let hospedagens: any[] = [];
// Keep fixture data separate and reset only the fixture key on each full reload.
localStorage.removeItem('@Vivox:itensPlanejados:' + serviceId);
api.defaults.adapter = async (config) => {
  const url = config.url || '';
  let data: any = null;
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  if (url === '/servicos/' + serviceId) data = {id:serviceId,tipoServico:'LANDING_PAGE',cliente:{nomeFantasia:'Cliente de demonstração'}};
  else if (url.startsWith('/planejamento-servico/servico/')) data = plan;
  else if (url.startsWith('/planejamento-servico/') && config.method === 'patch') { plan = {...plan,...body}; data = plan; }
  else if (url.startsWith('/planejamento-servico') && config.method === 'post') { plan = {...plan,...body}; data = plan; }
  else if (url.startsWith('/hospedagens/cliente/')) data = hospedagens;
  else if (url === '/hospedagens' && config.method === 'post') {
    const nova = { id: 'hosp-' + Date.now(), ...body, dataRenovacaoVps: body.dataInicioHospedagem ? new Date(new Date(body.dataInicioHospedagem).setMonth(new Date(body.dataInicioHospedagem).getMonth() + (body.prazoHospedagemMeses || 12))).toISOString() : undefined };
    hospedagens = [...hospedagens, nova];
    data = nova;
  }
  else if (url.startsWith('/hospedagens/') && config.method === 'patch') {
    const id = url.replace('/hospedagens/', '');
    const idx = hospedagens.findIndex((h) => h.id === id);
    if (idx >= 0) {
      hospedagens[idx] = { ...hospedagens[idx], ...body };
      data = hospedagens[idx];
    } else {
      const nova = { id, ...body };
      hospedagens = [...hospedagens, nova];
      data = nova;
    }
  }
  else if (url.startsWith('/hospedagens/') && config.method === 'delete') {
    const id = url.replace('/hospedagens/', '');
    hospedagens = hospedagens.filter((h) => h.id !== id);
    data = { success: true };
  }
  else if (url === '/tarefas' && config.method === 'post') { data = {...body,id:'created-' + tasks.length,checklist:[],tags:[],createdAt:new Date().toISOString()}; tasks = [...tasks,data]; }
  else if (url === '/tarefas') data = tasks;
  else if (url === '/users') data = [{id:'fixture-user',nome:'Pessoa de teste',email:'teste@example.com'}];
  else if (url === '/clientes' || url === '/projetos' || url.startsWith('/servicos/cliente/')) data = [];
  else throw new Error('Request not supported in isolated fixture: ' + url);
  return {data,status:200,statusText:'OK',headers:{},config};
};
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/cliente/fixture-client/servicos/'+serviceId+'/planejamento/item-1']}><div style={{maxWidth:1200,margin:'0 auto',padding:24}}><Routes><Route path="/cliente/:id/servicos/:servicoId/planejamento/:itemId?" element={<PlanejamentoServico />} /></Routes></div></MemoryRouter>);
