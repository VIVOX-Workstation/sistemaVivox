import React, { useState } from 'react';
import Tree from 'react-d3-tree';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { FonteContexto } from '../types';

interface Props {
  fontes: FonteContexto[];
  aiTreeData?: any;
}

// Componente customizado para o Nó
const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
  const isRoot = nodeDatum.__rd3t.depth === 0;
  const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
  const isExpanded = nodeDatum.__rd3t.expanded;

  // Cores personalizadas dependendo do nível
  const bgColors = [
    'bg-indigo-200 border-indigo-300 text-indigo-900', // Root
    'bg-blue-100 border-blue-200 text-blue-800',     // Nível 1
    'bg-emerald-100 border-emerald-200 text-emerald-800' // Nível 2+
  ];
  const depthClass = bgColors[Math.min(nodeDatum.__rd3t.depth, bgColors.length - 1)];

  return (
    <g>
      <foreignObject x="-75" y="-20" width="220" height="150" style={{ overflow: 'visible' }}>
        <div className="flex items-center gap-2">
          {/* O Card do Nó */}
          <div 
            className={`px-4 py-2 rounded-lg border shadow-sm font-medium text-sm text-center min-w-[150px] cursor-pointer hover:shadow-md transition-shadow ${depthClass}`}
            onClick={toggleNode}
          >
            {nodeDatum.name}
          </div>
          
          {/* Botão de Expandir/Recolher */}
          {(hasChildren || nodeDatum._children) && (
            <button
              onClick={toggleNode}
              className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 shadow-sm border border-slate-300 flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </foreignObject>
    </g>
  );
};

export function StrategyMindMap({ fontes, aiTreeData }: Props) {
  const [translate, setTranslate] = useState({ x: 200, y: 300 });

  // Constrói os dados do mapa mental baseado nas fontes
  const getTreeData = () => {
    if (aiTreeData) {
      return aiTreeData;
    }

    if (!fontes || fontes.length === 0) {
      return {
        name: 'Planejamento Estratégico',
        attributes: {},
        children: [{ name: 'Sem fontes. Adicione ao lado ou gere com IA.' }]
      };
    }

    return {
      name: 'Planejamento Estratégico',
      attributes: {},
      children: fontes.map(fonte => ({
        name: fonte.titulo,
        children: fonte.descricao ? [{ name: fonte.descricao.substring(0, 50) + (fonte.descricao.length > 50 ? '...' : '') }] : []
      }))
    };
  };

  const treeData = getTreeData();

  return (
    <div className="w-full h-full bg-slate-50 relative" ref={(containerElem) => {
      if (containerElem) {
        // Inicializa o translate (ex: para centralizar melhor ao abrir)
      }
    }}>
      <Tree
        data={treeData}
        orientation="horizontal"
        pathFunc="curve"
        translate={translate}
        nodeSize={{ x: 250, y: 80 }}
        separation={{ siblings: 1, nonSiblings: 1.2 }}
        renderCustomNodeElement={renderCustomNode}
        zoomable={true}
        collapsible={true}
      />
    </div>
  );
}
