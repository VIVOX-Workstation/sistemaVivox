import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Loader2, Users } from 'lucide-react';
import { api } from '../api/client';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then((mod) => ({ default: mod.Excalidraw }))
);

interface Props {
  itemId: string;
  itemTitulo: string;
}

const WS_URL = import.meta.env.VITE_EXCALIDRAW_WS_URL || 'http://localhost:3002';
const BROADCAST_THROTTLE_MS = 150;
const SAVE_DEBOUNCE_MS = 1500;

export function QuadroColaborativo({ itemId, itemTitulo }: Props) {
  const [initialElements, setInitialElements] = useState<readonly any[] | null>(null);
  const [conectados, setConectados] = useState(1);
  const excalidrawApiRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const aplicandoRemoto = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBroadcast = useRef<readonly any[] | null>(null);

  // Carrega a cena salva do item
  useEffect(() => {
    let cancelado = false;
    setInitialElements(null);
    api
      .get(`/quadros/${itemId}`)
      .then((res) => {
        if (!cancelado) setInitialElements(res.data?.elements || []);
      })
      .catch(() => {
        if (!cancelado) setInitialElements([]);
      });
    return () => {
      cancelado = true;
    };
  }, [itemId]);

  // Conecta na sala de tempo real (excalidraw-room)
  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', itemId);
    });

    socket.on('room-user-change', (ids: string[]) => {
      setConectados(Math.max(1, ids.length));
    });

    socket.on('client-broadcast', (data: ArrayBuffer) => {
      try {
        const texto = new TextDecoder().decode(data);
        const payload = JSON.parse(texto);
        const api = excalidrawApiRef.current;
        if (api && payload?.elements) {
          aplicandoRemoto.current = true;
          api.updateScene({ elements: payload.elements });
          aplicandoRemoto.current = false;
        }
      } catch {
        // ignora payload malformado
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [itemId]);

  const persistir = useCallback(
    (elements: readonly any[]) => {
      api.put(`/quadros/${itemId}`, { elements }).catch(() => {});
    },
    [itemId],
  );

  const enviarBroadcast = useCallback(
    (elements: readonly any[]) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      const bytes = new TextEncoder().encode(JSON.stringify({ elements }));
      socket.emit('server-broadcast', itemId, bytes.buffer, new Uint8Array(0));
    },
    [itemId],
  );

  const handleChange = useCallback(
    (elements: readonly any[]) => {
      if (aplicandoRemoto.current) return;

      pendingBroadcast.current = elements;
      if (!broadcastTimer.current) {
        broadcastTimer.current = setTimeout(() => {
          broadcastTimer.current = null;
          if (pendingBroadcast.current) enviarBroadcast(pendingBroadcast.current);
        }, BROADCAST_THROTTLE_MS);
      }

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persistir(elements), SAVE_DEBOUNCE_MS);
    },
    [enviarBroadcast, persistir],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (broadcastTimer.current) clearTimeout(broadcastTimer.current);
    };
  }, []);

  return (
    <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#247A4A] animate-pulse" />
            <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
              Quadro Colaborativo
            </h3>
            <span className="text-[10px] font-bold bg-[#C7A15F]/20 text-[#8F6F2D] border border-[#C7A15F]/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" />
              {conectados} {conectados === 1 ? 'pessoa' : 'pessoas'} agora
            </span>
          </div>
          <p className="text-xs text-[#8F8271] mt-0.5">
            Quadro e rascunho dedicado para: <strong className="text-[#1E1A16]">{itemTitulo}</strong>
          </p>
        </div>
      </div>

      <div
        className="relative w-full rounded-2xl overflow-hidden border border-[#D8CBB8] bg-white shadow-inner"
        style={{ height: '780px' }}
      >
        {initialElements === null ? (
          <div className="w-full h-full flex items-center justify-center text-[#8F8271] text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando quadro...
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center text-[#8F8271] text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando editor...
              </div>
            }
          >
            <Excalidraw
              excalidrawAPI={(apiInstance: any) => {
                excalidrawApiRef.current = apiInstance;
              }}
              initialData={{ elements: initialElements as any }}
              onChange={(elements: readonly any[]) => handleChange(elements)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
