import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type AppMode = 'edit' | 'play';

export interface ProcessToken {
  id: string;
  currentNodeId: string;
  payload: Record<string, any>;
  status: 'running' | 'waiting' | 'completed' | 'error';
  startedAt: number;
}

export interface ExecutionHistoryLog {
  nodeId: string;
  tokenId: string;
  enteredAt: number;
  exitedAt?: number;
}

interface ExecutionStore {
  mode: AppMode;
  tokens: ProcessToken[];
  history: ExecutionHistoryLog[];
  
  // Controls
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  
  // Simulation
  startExecution: (startNodeId: string, customTokenId?: string) => void;
  stopExecution: () => void;
  
  // Operations
  moveToken: (tokenId: string, nextNodeId: string, newPayload?: Record<string, any>) => void;
  updateTokenStatus: (tokenId: string, status: ProcessToken['status']) => void;
  endExecution: (tokenId: string) => void;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  mode: 'edit',
  tokens: [],
  history: [],

  setMode: (mode) => set({ mode }),
  
  toggleMode: () => {
    const currentMode = get().mode;
    if (currentMode === 'play') {
      // Si salimos de play, limpiamos la ejecución
      set({ mode: 'edit', tokens: [], history: [] });
    } else {
      set({ mode: 'play' });
    }
  },

  startExecution: (startNodeId, customTokenId) => {
    const newToken: ProcessToken = {
      id: customTokenId || uuidv4(),
      currentNodeId: startNodeId,
      payload: {},
      status: 'running',
      startedAt: Date.now()
    };

    const newLog: ExecutionHistoryLog = {
      nodeId: startNodeId,
      tokenId: newToken.id,
      enteredAt: Date.now()
    };

    set({ tokens: [newToken], history: [...get().history, newLog] });
  },

  stopExecution: () => set({ tokens: [], history: [], mode: 'edit' }),

  moveToken: (tokenId, nextNodeId, newPayload) => {
    set(state => {
      const now = Date.now();
      
      // Update history for exiting node
      const updatedHistory = state.history.map(log => {
        if (log.tokenId === tokenId && !log.exitedAt) {
          return { ...log, exitedAt: now };
        }
        return log;
      });

      // Add new log for entering novel node
      updatedHistory.push({
        nodeId: nextNodeId,
        tokenId,
        enteredAt: now
      });

      // Update tokens
      const updatedTokens = state.tokens.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            currentNodeId: nextNodeId,
            payload: { ...t.payload, ...newPayload },
            status: 'running' as const
          };
        }
        return t;
      });

      return { tokens: updatedTokens, history: updatedHistory };
    });
  },

  updateTokenStatus: (tokenId, status) => {
    set(state => ({
      tokens: state.tokens.map(t => t.id === tokenId ? { ...t, status } : t)
    }));
  },

  endExecution: (tokenId) => {
    set(state => {
      const updatedTokens = state.tokens.map(t => t.id === tokenId ? { ...t, status: 'completed' as const } : t);
      const updatedHistory = state.history.map(log => {
        if (log.tokenId === tokenId && !log.exitedAt) {
          return { ...log, exitedAt: Date.now() };
        }
        return log;
      });
      return { tokens: updatedTokens, history: updatedHistory };
    });
  }
}));
