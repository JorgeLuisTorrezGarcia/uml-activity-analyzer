import React from 'react';
import { useExecutionStore } from '../../store/executionStore';
import { useDiagramStore } from '../../store/diagramStore';

export const ExecutionControls: React.FC = () => {
  const { mode, toggleMode, startExecution, stopExecution, tokens } = useExecutionStore();
  const state = useDiagramStore(s => s.state);
  
  const isRunning = tokens.length > 0;

  const handlePlayPause = () => {
    if (isRunning) {
      // Pause o Stop
      stopExecution();
    } else {
      // Intentar encontrar un nodo 'start'
      const startNode = state.nodes.find(n => n.type === 'start');
      if (startNode) {
        startExecution(startNode.id);
      } else {
        alert('Este diagrama no tiene un nodo de tipo "Start (Inicio)". Agrega uno para iniciar la ejecución.');
      }
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1e293b',
      padding: '10px 20px',
      borderRadius: '30px',
      border: '1px solid #334155',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      zIndex: 100
    }}>
      
      {/* Selector de Modo */}
      <div style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: '20px' }}>
        <button 
          onClick={() => mode !== 'edit' && toggleMode()}
          style={{
            background: mode === 'edit' ? '#3b82f6' : 'transparent',
            color: 'white',
            border: 'none',
            padding: '6px 16px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500
          }}>
          Editor
        </button>
        <button 
          onClick={() => mode !== 'play' && toggleMode()}
          style={{
            background: mode === 'play' ? '#10b981' : 'transparent',
            color: 'white',
            border: 'none',
            padding: '6px 16px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500
          }}>
          Simulador Activo
        </button>
      </div>

      <div style={{ width: '1px', background: '#334155', height: '20px' }}></div>

      {/* Control de Ejecución (sólo visible si está en modo play) */}
      <button 
        onClick={handlePlayPause}
        disabled={mode !== 'play'}
        style={{
          background: mode === 'play' ? (isRunning ? '#ef4444' : '#22c55e') : '#475569',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: mode === 'play' ? 'pointer' : 'not-allowed',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {isRunning ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            Detener
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Lanzar Token
          </>
        )}
      </button>

    </div>
  );
};
