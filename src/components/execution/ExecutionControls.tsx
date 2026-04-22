import React from 'react';
import { useParams } from 'react-router-dom';
import { useExecutionStore } from '../../store/executionStore';
import { useDiagramStore } from '../../store/diagramStore';

export const ExecutionControls: React.FC = () => {
  const { id: dbDiagramId } = useParams<{ id: string }>();
  const { mode, toggleMode, startExecution, stopExecution, tokens } = useExecutionStore();
  const state = useDiagramStore(s => s.state);
  
  const isRunning = tokens.length > 0;

  const [isLoading, setIsLoading] = React.useState(false);

  const handlePlayPause = async () => {
    if (isRunning) {
      stopExecution();
    } else {
      const startNode = state.nodes.find(n => n.type === 'start');
      if (startNode) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('token');
          // Intenta registrar la instancia en backend
          const res = await fetch('http://localhost:3001/api/execute/instance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ diagramId: dbDiagramId })
          });
          
          if (!res.ok) {
             const errData = await res.json();
             alert(`Error al iniciar simulador: ${errData.error || 'Fallo desconocido'}. ${errData.error === 'Diagrama no encontrado' ? 'Asegúrate de haber guardado el diagrama en la nube antes de ejecutarlo.' : ''}`);
             setIsLoading(false);
             return;
          }

          const data = await res.json();
          if (data && data.id) {
            startExecution(startNode.id, data.id);
          } else {
            startExecution(startNode.id); // fallback
          }
        } catch (e) {
          console.warn("Ejecución local, Backend BPM no conectado o sin conexión");
          startExecution(startNode.id); // Fallback absoluto (offline)
        }
        setIsLoading(false);
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
        disabled={mode !== 'play' || isLoading}
        style={{
          background: mode === 'play' ? (isRunning ? '#ef4444' : '#22c55e') : '#475569',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: (mode === 'play' && !isLoading) ? 'pointer' : 'not-allowed',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" /></svg>
            Iniciando...
          </>
        ) : isRunning ? (
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
