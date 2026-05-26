import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useDiagramStore } from '../store/diagramStore';
import { DiagramState } from '../types/diagram';
import { useAuthStore } from '../store/authStore';
import { useExecutionStore } from '../store/executionStore';

export const useSocket = (roomId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { setState } = useDiagramStore();

  useEffect(() => {
    const token = useAuthStore.getState().token;
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: { token }
    });
    
    socketRef.current = socket;

    socket.emit('join-room', roomId);

    socket.on('initial-state', (initialState: DiagramState) => {
      setState(initialState);
    });

    socket.on('state-updated', (updatedState: DiagramState) => {
      setState(updatedState);
    });

    socket.on('error', (msg: string) => {
      console.error('Socket Error:', msg);
      alert(msg);
    });

    socket.on('node-moved', ({ id, x, y }: { id: string, x: number, y: number }) => {
      useDiagramStore.getState().updateNode(id, { x, y });
    });

    // =============================================
    // MOTOR BPM COLABORATIVO: sincronizar tokens
    // =============================================
    socket.on('instance_updated', ({ instanceId, activeTokens }: { instanceId: string, activeTokens: any[] }) => {
      const execStore = useExecutionStore.getState();
      // Solo sincronizar si estamos en modo play y la instancia coincide
      const currentToken = execStore.tokens.find(t => t.id === instanceId || t.status === 'running');
      if (currentToken && activeTokens && activeTokens.length > 0) {
        const remoteToken = activeTokens[0];
        // Si el nodo activo es diferente al local (lo movió otro usuario), sincronizamos
        if (remoteToken.currentNodeId && remoteToken.currentNodeId !== currentToken.currentNodeId) {
          execStore.moveToken(currentToken.id, remoteToken.currentNodeId, {});
        }
      }
    });

    socket.on('instance_started', ({ instanceId, activeTokens }: { instanceId: string, activeTokens: any[] }) => {
      const mode = useExecutionStore.getState().mode;
      // Si el modo play está activo y otro usuario lanzó una instancia, notificar
      if (mode === 'play' && activeTokens?.length > 0) {
        console.info('Instancia colaborativa iniciada:', instanceId);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, setState]);

  const broadcastUpdate = (newState: DiagramState) => {
    if (socketRef.current) {
      socketRef.current.emit('update-state', { roomId, state: newState });
    }
  };

  const broadcastMove = (id: string, x: number, y: number) => {
    if (socketRef.current) {
      socketRef.current.emit('node-moved', { roomId, id, x, y });
    }
  };

  return { socket: socketRef.current, broadcastUpdate, broadcastMove };
};
