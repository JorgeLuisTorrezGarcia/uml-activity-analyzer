import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useDiagramStore } from '../store/diagramStore';
import { DiagramState } from '../types/diagram';
import { useAuthStore } from '../store/authStore';

export const useSocket = (roomId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { setState } = useDiagramStore();

  useEffect(() => {
    const token = useAuthStore.getState().token;
    const socket = io('http://localhost:3001', {
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
