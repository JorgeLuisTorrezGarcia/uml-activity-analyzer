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
          const tokenLocal = localStorage.getItem('token');
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const res = await fetch(`${apiBase}/execute/instance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenLocal}`
            },
            body: JSON.stringify({ 
              diagramId: dbDiagramId,
              activeTokens: JSON.stringify([{
                 tokenId: "temp-id",
                 currentNodeId: startNode.id,
                 laneId: startNode.laneId || null
              }])
            })
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
          startExecution(startNode.id);
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
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--bg-elevated)',
      padding: '12px 24px',
      borderRadius: '32px',
      border: '1px solid var(--border-default)',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: 100,
      fontFamily: 'var(--font-body)'
    }}>
      
      {/* Selector de Modo */}
      <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
        <button 
          onClick={() => mode !== 'edit' && toggleMode()}
          style={{
            background: mode === 'edit' ? 'var(--clr-purple-mist)' : 'transparent',
            color: mode === 'edit' ? 'var(--clr-purple-light)' : 'var(--txt-secondary)',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            transition: 'all 0.2s',
            fontFamily: 'var(--font-body)'
          }}>
          Editor
        </button>
        <button 
          onClick={() => mode !== 'play' && toggleMode()}
          style={{
            background: mode === 'play' ? 'var(--clr-teal-mist)' : 'transparent',
            color: mode === 'play' ? 'var(--clr-teal)' : 'var(--txt-secondary)',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            transition: 'all 0.2s',
            fontFamily: 'var(--font-body)'
          }}>
          Simulador Activo
        </button>
      </div>

      <div style={{ width: '1px', background: 'var(--border-default)', height: '24px' }}></div>

      {/* Control de Ejecución */}
      <button 
        onClick={handlePlayPause}
        disabled={mode !== 'play' || isLoading}
        style={{
          background: mode === 'play' ? (isRunning ? 'rgba(220,120,120,0.15)' : 'var(--clr-sage-mist)') : 'var(--bg-surface)',
          color: mode === 'play' ? (isRunning ? 'rgb(220,120,120)' : 'var(--clr-sage)') : 'var(--txt-muted)',
          border: '1px solid',
          borderColor: mode === 'play' ? (isRunning ? 'rgba(220,120,120,0.4)' : 'rgba(172, 207, 163, 0.4)') : 'var(--border-subtle)',
          padding: '10px 20px',
          borderRadius: '24px',
          cursor: (mode === 'play' && !isLoading) ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          opacity: isLoading ? 0.7 : 1,
          transition: 'all 0.2s',
          fontFamily: 'var(--font-body)'
        }}
      >
        {isLoading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" /></svg>
            Iniciando...
          </>
        ) : isRunning ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            Detener
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Lanzar Token
          </>
        )}
      </button>

    </div>
  );
};
