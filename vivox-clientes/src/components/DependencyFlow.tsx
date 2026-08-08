import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  reconnectEdge,
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Save, Trash2, Search, ChevronDown, MousePointer2,
  Maximize, Type, LayoutTemplate, Layers
} from 'lucide-react';
import { Button } from './Button';

let nodeIdCounter = 1;
const newNodeId = () => `node_${Date.now()}_${nodeIdCounter++}`;

function ProcessNode({ data, selected }: any) {
  return (
    <div style={{
      background: data.fill || '#ffffff',
      border: `${data.strokeWidth || 2}px solid ${data.stroke || '#6366f1'}`,
      borderRadius: 8, padding: '10px 18px', minWidth: 140,
      textAlign: 'center', fontFamily: 'Inter, sans-serif',
      fontSize: data.fontSize || 13, color: data.fontColor || '#1e293b', fontWeight: 500,
      boxShadow: selected ? '0 0 0 2px #6366f1, 0 4px 12px rgba(99,102,241,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
      cursor: 'move',
    }}>
      <Handle type="target" position={Position.Left} id="l" className="flow-handle flow-handle-indigo" />
      <Handle type="target" position={Position.Top} id="t" className="flow-handle flow-handle-indigo" />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} id="r" className="flow-handle flow-handle-indigo" />
      <Handle type="source" position={Position.Bottom} id="b" className="flow-handle flow-handle-indigo" />
    </div>
  );
}

function StartNode({ data, selected }: any) {
  return (
    <div style={{
      background: data.fill || '#ecfdf5', border: `2px solid ${data.stroke || '#10b981'}`,
      borderRadius: 50, padding: '8px 24px', minWidth: 110, textAlign: 'center',
      fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#065f46', fontWeight: 'bold',
      boxShadow: selected ? '0 0 0 2px #10b981, 0 4px 12px rgba(16,185,129,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
      cursor: 'move',
    }}>
      <Handle type="target" position={Position.Left} id="l" className="flow-handle flow-handle-green" />
      <Handle type="target" position={Position.Top} id="t" className="flow-handle flow-handle-green" />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} id="r" className="flow-handle flow-handle-green" />
      <Handle type="source" position={Position.Bottom} id="b" className="flow-handle flow-handle-green" />
    </div>
  );
}

function EndNode({ data, selected }: any) {
  return (
    <div style={{
      background: data.fill || '#fef2f2', border: `2px solid ${data.stroke || '#ef4444'}`,
      borderRadius: 50, padding: '8px 24px', minWidth: 110, textAlign: 'center',
      fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#991b1b', fontWeight: 'bold',
      boxShadow: selected ? '0 0 0 2px #ef4444, 0 4px 12px rgba(239,68,68,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
      cursor: 'move',
    }}>
      <Handle type="target" position={Position.Left} id="l" className="flow-handle flow-handle-red" />
      <Handle type="target" position={Position.Top} id="t" className="flow-handle flow-handle-red" />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} id="r" className="flow-handle flow-handle-red" />
      <Handle type="source" position={Position.Bottom} id="b" className="flow-handle flow-handle-red" />
    </div>
  );
}

function DecisionNode({ data, selected }: any) {
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <polygon points="50,2 98,50 50,98 2,50" fill={data.fill || '#fef3c7'} stroke={data.stroke || '#f59e0b'} strokeWidth={selected ? 3 : 2} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#78350f', fontWeight: 'bold', textAlign: 'center', padding: '0 12px', cursor: 'move' }}>
        {data.label}
      </div>
      <Handle type="target" position={Position.Left} id="l" className="flow-handle flow-handle-amber" />
      <Handle type="target" position={Position.Top} id="t" className="flow-handle flow-handle-amber" />
      <Handle type="source" position={Position.Right} id="r" className="flow-handle flow-handle-amber" />
      <Handle type="source" position={Position.Bottom} id="b" className="flow-handle flow-handle-amber" />
    </div>
  );
}

function DatabaseNode({ data, selected }: any) {
  return (
    <div style={{ position: 'relative', width: 80, height: 85 }}>
      <svg viewBox="0 0 80 85" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <ellipse cx="40" cy="15" rx="38" ry="12" fill={data.fill || '#e2e8f0'} stroke={data.stroke || '#64748b'} strokeWidth="2" />
        <rect x="2" y="15" width="76" height="55" fill={data.fill || '#f1f5f9'} stroke={data.stroke || '#64748b'} strokeWidth="2" />
        <ellipse cx="40" cy="70" rx="38" ry="12" fill={data.fill || '#e2e8f0'} stroke={data.stroke || '#64748b'} strokeWidth="2" />
        <ellipse cx="40" cy="15" rx="38" ry="12" fill={data.fill || '#e2e8f0'} stroke={data.stroke || '#64748b'} strokeWidth="2" />
      </svg>
      <div style={{ position: 'absolute', top: 20, left: 0, right: 0, bottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#334155', fontWeight: 500, textAlign: 'center', padding: '0 8px', cursor: 'move' }}>
        {data.label}
      </div>
      <Handle type="target" position={Position.Left} id="l" className="flow-handle flow-handle-slate" />
      <Handle type="target" position={Position.Top} id="t" className="flow-handle flow-handle-slate" />
      <Handle type="source" position={Position.Right} id="r" className="flow-handle flow-handle-slate" />
      <Handle type="source" position={Position.Bottom} id="b" className="flow-handle flow-handle-slate" />
    </div>
  );
}

const nodeTypes: NodeTypes = { process: ProcessNode, start: StartNode, end: EndNode, decision: DecisionNode, database: DatabaseNode };

function convertToReactFlow(initialNodes: any[], initialEdges: any[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  if (Array.isArray(initialNodes)) {
    initialNodes.forEach((n: any) => {
      let type = 'process';
      if (n.type === 'start' || (n.nodeType === 'startEndNode' && n.attributes?.attrs?.body?.fill !== '#fef2f2')) type = 'start';
      else if (n.type === 'end' || n.data?.type === 'end') type = 'end';
      else if (n.type === 'decision' || n.nodeType === 'decisionNode' || n.type === 'standard.Polygon') type = 'decision';
      else if (n.type === 'database' || n.nodeType === 'databaseNode' || n.type === 'standard.Cylinder') type = 'database';
      else if (n.type === 'standard.Ellipse') type = (n.attrs?.body?.fill === '#fef2f2' || n.attributes?.attrs?.body?.fill === '#fef2f2') ? 'end' : 'start';
      const label = n.data?.label || n.attrs?.label?.text || n.attributes?.attrs?.label?.text || 'Processo';
      const pos = n.position || { x: n.attributes?.position?.x ?? 100, y: n.attributes?.position?.y ?? 100 };
      nodes.push({ id: n.id, type, position: pos, data: { label, fill: n.data?.fill || '#ffffff', stroke: n.data?.stroke || '#6366f1', strokeWidth: n.data?.strokeWidth || 2, strokeDash: '0', fontSize: 13, fontColor: '#1e293b' } });
    });
  }
  if (Array.isArray(initialEdges)) {
    initialEdges.forEach((e: any) => {
      const src = e.source?.id || (typeof e.source === 'string' ? e.source : '');
      const tgt = e.target?.id || (typeof e.target === 'string' ? e.target : '');
      if (!src || !tgt) return;
      edges.push({ id: e.id || `e_${Date.now()}`, source: src, target: tgt, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }, style: { stroke: '#64748b', strokeWidth: 2 }, label: e.label || '' });
    });
  }
  return { nodes, edges };
}

interface InspectorState { fill: string; stroke: string; strokeWidth: number; strokeDash: string; text: string; fontSize: number; fontColor: string; }
const defaultInspector: InspectorState = { fill: '#ffffff', stroke: '#6366f1', strokeWidth: 2, strokeDash: '0', text: '', fontSize: 13, fontColor: '#1e293b' };

function InnerFlow({ initialNodes, initialEdges, onSave }: { initialNodes?: any; initialEdges?: any; onSave: (n: any, e: any) => Promise<void> }) {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presentation' | 'text'>('presentation');
  const [inspector, setInspector] = useState<InspectorState>(defaultInspector);

  useEffect(() => {
    const { nodes: n, edges: e } = convertToReactFlow(initialNodes || [], initialEdges || []);
    setNodes(n); setEdges(e);
    setTimeout(() => fitView({ padding: 0.2 }), 150);
  }, [initialNodes, initialEdges]);

  const onConnect = useCallback((params: Connection) =>
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }, style: { stroke: '#64748b', strokeWidth: 2 } }, eds)), [setEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedId) || null;

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedId(node.id);
    setInspector({ fill: (node.data.fill as string) || '#fff', stroke: (node.data.stroke as string) || '#6366f1', strokeWidth: (node.data.strokeWidth as number) || 2, strokeDash: (node.data.strokeDash as string) || '0', text: (node.data.label as string) || '', fontSize: (node.data.fontSize as number) || 13, fontColor: (node.data.fontColor as string) || '#1e293b' });
  }, []);

  const onPaneClick = useCallback(() => { setSelectedId(null); setInspector(defaultInspector); }, []);

  const applyInspector = useCallback((key: keyof InspectorState, value: any) => {
    setInspector((p) => ({ ...p, [key]: value }));
    if (!selectedId) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id !== selectedId) return n;
      const d = { ...n.data };
      if (key === 'text') d.label = value;
      else (d as any)[key] = value;
      return { ...n, data: d };
    }));
  }, [selectedId, setNodes]);

  const addNode = useCallback((type: string, position?: { x: number; y: number }) => {
    const pos = position ?? { x: 200, y: 200 };
    const id = newNodeId();
    const defaults: Record<string, { label: string; fill: string; stroke: string }> = {
      start: { label: 'In�cio', fill: '#ecfdf5', stroke: '#10b981' },
      end: { label: 'Fim', fill: '#fef2f2', stroke: '#ef4444' },
      decision: { label: 'Decis�o?', fill: '#fef3c7', stroke: '#f59e0b' },
      database: { label: 'Banco de Dados', fill: '#f1f5f9', stroke: '#64748b' },
      process: { label: 'Processo', fill: '#ffffff', stroke: '#6366f1' },
    };
    const d = defaults[type] || defaults.process;
    setNodes((nds) => [...nds, { id, type, position: pos, data: { label: d.label, fill: d.fill, stroke: d.stroke, strokeWidth: 2, strokeDash: '0', fontSize: 13, fontColor: '#1e293b' } }]);
    setSelectedId(id);
    setInspector({ ...defaultInspector, fill: d.fill, stroke: d.stroke, text: d.label });
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }, [selectedId, setNodes, setEdges]);


  const edgeReconnectSuccessful = useRef(true);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
  }, [setEdges]);

  const onReconnectEnd = useCallback((_, edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeReconnectSuccessful.current = true;
  }, [setEdges]);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(type, pos);
  }, [screenToFlowPosition, addNode]);

  const stencilItems = [
    { type: 'start', label: 'In�cio', preview: <div className="w-12 h-6 border-2 border-emerald-500 bg-emerald-50 rounded-full" /> },
    { type: 'process', label: 'Processo', preview: <div className="w-12 h-8 border-2 border-indigo-500 bg-indigo-50 rounded-md" /> },
    { type: 'decision', label: 'Decis�o', preview: <div className="w-10 h-10 border-2 border-amber-500 bg-amber-50 rotate-45 scale-75" /> },
    { type: 'database', label: 'Banco DB', preview: <div className="w-10 h-10 border-2 border-slate-500 bg-slate-50 rounded-[50%/15%]" /> },
    { type: 'end', label: 'Fim', preview: <div className="w-12 h-6 border-2 border-red-500 bg-red-50 rounded-full" /> },
  ];

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl bg-slate-50 overflow-hidden font-sans" style={{ height: 750 }}>
      {/* TOOLBAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-md">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Canvas Principal</span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button onClick={() => fitView({ padding: 0.1 })} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors" title="Fit to Screen">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => addNode('process')} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 flex items-center gap-1.5 transition-colors shadow-sm">
            + Adicionar Processo
          </button>
          <Button onClick={() => onSave(nodes, edges)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Save className="w-4 h-4 mr-2" /> Salvar Diagrama
          </Button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", height: "694px" }}>
        {/* STENCIL */}
        <div style={{ width: 256, background: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0, height: "100%" }}>
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Buscar formas..." className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Flowchart B�sicas</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {stencilItems.map(({ type, label, preview }) => (
                <div key={type}
                  className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg bg-white hover:border-indigo-400 hover:shadow-sm hover:-translate-y-0.5 cursor-grab active:cursor-grabbing transition-all group select-none"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', type); e.dataTransfer.effectAllowed = 'move'; }}
                  onClick={() => addNode(type)}
                  title="Clique ou arraste para adicionar"
                >
                  {preview}
                  <span className="text-[11px] mt-2 font-medium text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CANVAS */}
        <div style={{ flex: 1, position: "relative", height: "100%" }} onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            style={{ width: "100%", height: "100%" }}
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            reconnectRadius={20}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }, style: { stroke: '#64748b', strokeWidth: 2 } }}
            fitView fitViewOptions={{ padding: 0.3 }} minZoom={0.2} maxZoom={3}
            proOptions={{ hideAttribution: true }} deleteKeyCode="Delete"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
            <Controls showInteractive={false} />
            <MiniMap className="!bg-white !border !border-slate-200 !rounded-lg !shadow-md" />
            {nodes.length === 0 && (
              <Panel position="top-center">
                <div className="mt-28 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none">
                  <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-3xl text-slate-300">+</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500">Arraste formas para c� ou clique em "+ Adicionar Processo"</p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* INSPECTOR */}
        <div style={{ width: 288, background: "white", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0, height: "100%", overflowY: "auto" }}>
          {!selectedNode ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <MousePointer2 className="w-12 h-12 mb-4 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">Nenhum elemento selecionado</p>
              <p className="text-xs mt-2">Clique em uma forma para editar suas propriedades.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Propriedades Do N�</span>
                <button onClick={deleteSelected} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex border-b border-slate-200">
                {(['presentation', 'text'] as const).map((tab) => (
                  <button key={tab} className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setActiveTab(tab)}>
                    {tab === 'presentation' ? <><LayoutTemplate className="w-3.5 h-3.5" /> Apar�ncia</> : <><Type className="w-3.5 h-3.5" /> Texto</>}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {activeTab === 'presentation' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preenchimento</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={inspector.fill} onChange={(e) => applyInspector('fill', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0" />
                        <input type="text" value={inspector.fill} onChange={(e) => applyInspector('fill', e.target.value)} className="flex-1 text-sm border border-slate-200 rounded-md px-2 py-1.5 font-mono text-slate-600 focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Linha / Borda</label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input type="color" value={inspector.stroke} onChange={(e) => applyInspector('stroke', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0" />
                          <input type="text" value={inspector.stroke} onChange={(e) => applyInspector('stroke', e.target.value)} className="flex-1 text-sm border border-slate-200 rounded-md px-2 py-1.5 font-mono text-slate-600 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1"><span className="text-xs text-slate-600">Espessura</span><span className="text-xs text-slate-500">{inspector.strokeWidth}px</span></div>
                          <input type="range" min="0" max="10" step="1" value={inspector.strokeWidth} onChange={(e) => applyInspector('strokeWidth', parseInt(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-600 block mb-1">Estilo</span>
                          <select value={inspector.strokeDash} onChange={(e) => applyInspector('strokeDash', e.target.value)} className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500">
                            <option value="0">S�lida</option><option value="5 5">Tracejada</option><option value="10 10">Tracejada Larga</option><option value="2 4">Pontilhada</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {activeTab === 'text' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Conte�do</label>
                      <textarea value={inspector.text} onChange={(e) => applyInspector('text', e.target.value)} placeholder="Digite o texto..." className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-700 focus:outline-none focus:border-indigo-500 min-h-[80px] resize-y" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estilo da Fonte</label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input type="color" value={inspector.fontColor} onChange={(e) => applyInspector('fontColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0" />
                          <span className="text-xs text-slate-600">Cor do Texto</span>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1"><span className="text-xs text-slate-600">Tamanho</span><span className="text-xs text-slate-500">{inspector.fontSize}px</span></div>
                          <input type="range" min="8" max="36" step="1" value={inspector.fontSize} onChange={(e) => applyInspector('fontSize', parseInt(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props { planejamentoId: string; initialNodes?: any; initialEdges?: any; onSave: (nodes: any, edges: any) => Promise<void>; }

export function DependencyFlow({ planejamentoId, initialNodes, initialEdges, onSave }: Props) {
  return (
    <ReactFlowProvider>
      <InnerFlow initialNodes={initialNodes} initialEdges={initialEdges} onSave={onSave} />
    </ReactFlowProvider>
  );
}
