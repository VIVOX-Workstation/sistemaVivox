import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';

interface VideoPlayerProps {
  titulo: string;
  duracao: string;
  videoUrl?: string;
  onConcluir?: () => void;
  concluida?: boolean;
}

export function VideoPlayer({ titulo, duracao, videoUrl, onConcluir, concluida }: VideoPlayerProps) {
  const [tocando, setTocando] = useState(false);
  const [mutado, setMutado] = useState(false);
  const [progresso, setProgresso] = useState(35); // porcentagem simulada inicial
  const [usarEmbed, setUsarEmbed] = useState(false);

  const togglePlay = () => setTocando(t => !t);
  const toggleMute = () => setMutado(m => !m);

  return (
    <div className="vxd-player-container">
      {usarEmbed && videoUrl ? (
        <div className="vxd-player-embed">
          <iframe
            src={videoUrl}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="vxd-iframe"
          />
        </div>
      ) : (
        <div className="vxd-player-simulado" onClick={togglePlay}>
          {/* Fundo dinâmico simulando aula em vídeo com estética moderna */}
          <div className="vxd-player-canvas">
            <div className="vxd-player-bg-glow" />
            <div className="vxd-player-watermark">VIVOX • EDUCAÇÃO CORPORATIVA</div>
            
            <div className="vxd-player-center-content">
              <button
                type="button"
                className={`vxd-player-play-btn ${tocando ? 'vxd-player-playing' : ''}`}
                aria-label={tocando ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                onClick={e => {
                  e.stopPropagation();
                  togglePlay();
                }}
              >
                {tocando ? <Pause className="vxd-icon-lg" /> : <Play className="vxd-icon-lg" />}
              </button>
              <div className="vxd-player-video-tag">{titulo}</div>
              <span className="vxd-player-status-badge">
                {tocando ? '▶ Reproduzindo em HD 1080p' : '⏸ Clique para reproduzir'}
              </span>
            </div>
          </div>

          {/* Barra de controles inferior */}
          <div className="vxd-player-controls" onClick={e => e.stopPropagation()}>
            <div
              className="vxd-player-progress-bar"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newPercent = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
                setProgresso(newPercent);
              }}
            >
              <div className="vxd-player-progress-fill" style={{ width: `${progresso}%` }} />
            </div>

            <div className="vxd-player-buttons-row">
              <div className="vxd-player-left-group">
                <button type="button" className="vxd-btn-ctrl" onClick={togglePlay} aria-label="Play/Pause">
                  {tocando ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  type="button"
                  className="vxd-btn-ctrl"
                  onClick={() => setProgresso(0)}
                  title="Reiniciar aula"
                  aria-label="Reiniciar"
                >
                  <RotateCcw size={16} />
                </button>
                <button type="button" className="vxd-btn-ctrl" onClick={toggleMute} aria-label="Áudio">
                  {mutado ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <span className="vxd-player-time">
                  {Math.floor((progresso / 100) * 14)}:
                  {String(Math.floor(((progresso / 100) * 840) % 60)).padStart(2, '0')} / {duracao}
                </span>
              </div>

              <div className="vxd-player-right-group">
                {videoUrl && (
                  <button
                    type="button"
                    className="vxd-btn-tag"
                    onClick={() => setUsarEmbed(true)}
                    title="Alternar para player do YouTube"
                  >
                    Abrir no YouTube
                  </button>
                )}
                <button
                  type="button"
                  className="vxd-btn-ctrl"
                  onClick={() => {
                    const el = document.querySelector('.vxd-player-container');
                    if (el && document.fullscreenElement) {
                      document.exitFullscreen();
                    } else if (el) {
                      el.requestFullscreen?.();
                    }
                  }}
                  title="Tela cheia"
                  aria-label="Tela cheia"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de ação logo abaixo do player */}
      <div className="vxd-player-meta-bar">
        <div className="vxd-player-meta-info">
          <h3>{titulo}</h3>
          <span className="vxd-player-duration-pill">Duração: {duracao}</span>
        </div>
        {onConcluir && (
          <button
            type="button"
            className={`vxd-btn ${concluida ? 'vxd-btn-success' : 'vxd-btn-primary'}`}
            onClick={onConcluir}
          >
            {concluida ? '✓ Aula Concluída' : 'Marcar como Concluída'}
          </button>
        )}
      </div>
    </div>
  );
}
