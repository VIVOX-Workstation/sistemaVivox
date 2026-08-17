import React, { useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import type { FonteContexto } from '../types';
import { RotateCcw, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

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
    .filter(w => w.length > 4 && !ignore.includes(w));
}

function buildBrainGraph(treeData: any): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  
  const rootId = 'root-node';

  const traverse = (node: any, parentId: string | null = null, depth: number = 0) => {
    const id = depth === 0 ? rootId : Math.random().toString(36).substring(2, 11);
    
    // Paleta Vivox Gold & Luxury (Núcleo Diamante, Pilares Dourados, Subnós Âmbar)
    let color = '#D8CBB8';
    let val = 2.8;
    
    if (depth === 0) {
      color = '#FAF7F2'; // Núcleo central diamante branco
      val = 6.5;
    } else if (depth === 1) {
      color = '#C7A15F'; // Dourado Vivox
      val = 4.5;
    } else if (depth === 2) {
      color = '#8A6828'; // Ouro envelhecido
      val = 3.2;
    }

    nodes.push({ id, name: node.name || 'Pilar Estratégico', val, color });

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
        name: 'Estratégia Vivox',
        children: [
          {
            name: 'Posicionamento High-Ticket',
            children: [{ name: 'Autoridade Médica' }, { name: 'Percepção de Valor' }, { name: 'Identidade Visual Nobre' }]
          },
          {
            name: 'Aquisição & Tráfego',
            children: [{ name: 'Captação de Pacientes' }, { name: 'Google Search & SEO' }, { name: 'Landing Pages de Alta Conversão' }]
          },
          {
            name: 'Retenção & LTV',
            children: [{ name: 'Acompanhamento Baby' }, { name: 'Experiência do Paciente' }, { name: 'Pós-Consulta Humanizado' }]
          },
          {
            name: 'Presença Digital & Conteúdo',
            children: [{ name: 'Reels Educativos' }, { name: 'Bastidores & Rotina' }, { name: 'Prova Social & Depoimentos' }]
          }
        ]
      };
    } else {
      baseData = {
        name: 'Matriz Estratégica',
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
      fgRef.current.d3Force('charge').strength(-380).distanceMax(850);
      fgRef.current.d3Force('link').distance((link: any) => link.isCrossLink ? 180 : 90);
    }
  }, [graphData]);

  const handleResetCamera = () => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 250 }, { x: 0, y: 0, z: 0 }, 1000);
    }
  };

  const handleZoom = (factor: number) => {
    if (fgRef.current) {
      const currentPos = fgRef.current.cameraPosition();
      fgRef.current.cameraPosition(
        { x: currentPos.x * factor, y: currentPos.y * factor, z: currentPos.z * factor },
        undefined,
        500
      );
    }
  };

  // Criação de nós premium Vivox (cristal dourado translúcido com emissive glow)
  const renderPremiumNode = (node: any) => {
    const geometry = new THREE.SphereGeometry(node.val, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.92,
    });
    return new THREE.Mesh(geometry, material);
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[480px] bg-[#0E0C09] relative overflow-hidden rounded-[11px] border border-[#2B261F] shadow-inner cursor-grab active:cursor-grabbing">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#0E0C09"
          
          // Nó premium cristalino com luz âmbar/dourada
          nodeThreeObject={renderPremiumNode}
          
          // Tooltip HTML elegante com estética Vivox
          nodeLabel={(node: any) => `
            <div style="background: rgba(20, 18, 14, 0.95); backdrop-filter: blur(8px); border: 1px solid #C7A15F; color: #FAF7F2; padding: 8px 14px; border-radius: 8px; font-family: Inter, system-ui, sans-serif; font-size: 12px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.6); max-width: 260px;">
              <span style="color: #C7A15F; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 2px;">Pilar Estratégico</span>
              ${node.name}
            </div>
          `}
          
          // Conexões douradas brilhantes
          linkColor={(link: any) => link.isCrossLink ? 'rgba(199, 161, 95, 0.25)' : 'rgba(199, 161, 95, 0.55)'}
          linkWidth={(link: any) => link.isCrossLink ? 1.2 : 2.2}
          
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={1.8}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleColor={() => '#FAF7F2'}

          d3VelocityDecay={0.25}
          cooldownTicks={180}
        />
      )}
      
      {/* HUD Top Left: Contador de Nós & Sinapses */}
      <div className="absolute top-4 left-4 bg-[#14120E]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#3D3325] text-xs font-bold text-[#F6F0E7] flex items-center gap-2 pointer-events-none shadow-md">
        <span className="w-2 h-2 rounded-full bg-[#C7A15F] animate-ping" />
        <span className="text-[#C7A15F]">{graphData.nodes.length} NÓS ESTRATÉGICOS</span>
        <span className="text-[#847663]">•</span>
        <span className="text-[#A89880]">{graphData.links.length} SINAPSES ATIVAS</span>
      </div>

      {/* HUD Top Right: Controles de Câmera */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#14120E]/90 backdrop-blur-md p-1 rounded-lg border border-[#3D3325] shadow-md">
        <button
          onClick={() => handleZoom(0.8)}
          className="p-1.5 text-[#A89880] hover:text-[#FAF7F2] hover:bg-[#24201A] rounded transition-colors cursor-pointer"
          title="Aproximar (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(1.2)}
          className="p-1.5 text-[#A89880] hover:text-[#FAF7F2] hover:bg-[#24201A] rounded transition-colors cursor-pointer"
          title="Afastar (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-1.5 text-[#C7A15F] hover:text-[#FAF7F2] hover:bg-[#24201A] rounded transition-colors cursor-pointer"
          title="Resetar Câmera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Dica de controle no rodapé */}
      <div className="absolute bottom-3 left-4 text-[10px] text-[#A89880] font-mono tracking-wider uppercase pointer-events-none flex items-center gap-2">
        <Sparkles className="w-3 h-3 text-[#C7A15F]" />
        Arraste com o mouse para orbitar • Role o scroll para zoom
      </div>
    </div>
  );
}
