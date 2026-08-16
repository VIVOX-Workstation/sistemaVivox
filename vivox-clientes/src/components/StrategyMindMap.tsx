import React, { useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import type { FonteContexto } from '../types';

interface Props {
  fontes: FonteContexto[];
  aiTreeData?: any;
}

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  isCrossLink?: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const ignore = ['de', 'e', 'ou', 'para', 'com', 'sem', 'em', 'no', 'na', 'os', 'as', 'do', 'da', 'dos', 'das', 'um', 'uma', 'plano', 'sobre', 'que', 'como', 'mais', 'pelo', 'pela'];
  return text.toLowerCase()
    .replace(/[^\w\sà-ú]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 5 && !ignore.includes(w));
}

function buildBrainGraph(treeData: any): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  
  const rootId = 'root-node';

  const traverse = (node: any, parentId: string | null = null, depth: number = 0) => {
    const id = depth === 0 ? rootId : Math.random().toString(36).substring(2, 11);
    
    // Cores Sci-Fi / Data Science (sem arco-íris cartoon)
    // Usaremos tons de azul, gelo e branco para um visual bem analítico e sério
    let color = '#38bdf8'; // sky-400
    let val = 2.5; // Bolinhas menores, mais focadas nas conexões
    
    if (depth === 0) {
      color = '#ffffff'; // Núcleo central branco brilhante
      val = 6;
    } else if (depth === 1) {
      color = '#0ea5e9'; // sky-500
      val = 4;
    } else if (depth === 2) {
      color = '#0369a1'; // sky-700
    }

    nodes.push({ id, name: node.name || 'Sem Nome', val, color });

    if (parentId) {
      links.push({ source: parentId, target: id, isCrossLink: false });
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => traverse(child, id, depth + 1));
    }
  };

  if (treeData) {
    traverse(treeData);
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      
      if (nodeA.id === rootId || nodeB.id === rootId) continue;

      const wordsA = extractKeywords(nodeA.name);
      const wordsB = extractKeywords(nodeB.name);
      const commonWords = wordsA.filter(w => wordsB.includes(w));
      
      if (commonWords.length > 0) {
         links.push({ source: nodeA.id, target: nodeB.id, isCrossLink: true });
         nodeA.val += 0.3;
         nodeB.val += 0.3;
      }
    }
  }

  return { nodes, links };
}

export function StrategyMindMap({ fontes, aiTreeData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const graphData = useMemo(() => {
    let baseData;
    if (aiTreeData) {
      baseData = aiTreeData;
    } else if (!fontes || fontes.length === 0) {
      baseData = {
        name: 'Planejamento Estratégico',
        children: [{ name: 'Nenhuma informação ainda. Comece a planejar!' }]
      };
    } else {
      baseData = {
        name: 'Planejamento Estratégico',
        children: fontes.map(f => ({
          name: f.titulo,
          children: f.descricao ? [{ name: f.descricao }] : []
        }))
      };
    }
    return buildBrainGraph(baseData);
  }, [fontes, aiTreeData]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-350).distanceMax(800);
      fgRef.current.d3Force('link').distance((link: any) => link.isCrossLink ? 200 : 100);
    }
  }, [graphData]);

  // Criação de nós premium (vidro translúcido/cristal glow)
  const renderPremiumNode = (node: any) => {
    const geometry = new THREE.SphereGeometry(node.val, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    return new THREE.Mesh(geometry, material);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#080d17] relative overflow-hidden rounded-lg shadow-inner cursor-grab active:cursor-grabbing">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          
          // Nó premium com textura de vidro/cristal brilhante
          nodeThreeObject={renderPremiumNode}
          
          // Tooltip 3D customizado em HTML
          nodeLabel={(node: any) => `
            <div style="background: rgba(15,23,42,0.85); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); color: #f8fafc; padding: 6px 12px; border-radius: 6px; font-family: Inter, sans-serif; font-size: 13px; font-weight: 500; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
              ${node.name}
            </div>
          `}
          
          // Conexões mais visíveis, opacas e limpas (sem partículas)
          linkColor={(link: any) => link.isCrossLink ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)'}
          linkWidth={(link: any) => link.isCrossLink ? 1 : 2}
          
          // Removido o linkDirectionalParticles para um visual mais sóbrio e adulto
          linkDirectionalParticles={0}

          d3VelocityDecay={0.2}
          cooldownTicks={150}
        />
      )}
      
      {/* HUD Dark Mode */}
      <div className="absolute top-4 left-4 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 text-xs font-medium text-slate-300 pointer-events-none">
        {graphData.nodes.length} NÓS • {graphData.links.length} SINAPSES
      </div>
      
      {/* Dica de controle */}
      <div className="absolute bottom-4 left-4 text-[10px] text-slate-500/70 font-medium tracking-wide uppercase pointer-events-none">
        Arraste para rotacionar • Scroll para Zoom
      </div>
    </div>
  );
}
