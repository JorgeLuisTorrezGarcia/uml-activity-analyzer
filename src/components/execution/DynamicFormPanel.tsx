import React from 'react';
import { useExecutionStore } from '../../store/executionStore';
import { useDiagramStore } from '../../store/diagramStore';

export const DynamicFormPanel: React.FC = () => {
  const { tokens, moveToken, endExecution } = useExecutionStore();
  const state = useDiagramStore(s => s.state);
  
  // Siempre llamar hooks incondicionalmente arriba (Fix Rule of Hooks)
  const [jsonText, setJsonText] = React.useState<string>('');
  const [errorObj, setErrorObj] = React.useState<string>('');

  // Encuentra el token
  const activeToken = tokens.find(t => t.status === 'running');
  const activeNode = state.nodes.find(n => n.id === activeToken?.currentNodeId);

  // Hook effect para restaurar el json template cada que cambia el nodo
  React.useEffect(() => {
    if (activeNode) {
      setJsonText(activeNode.executionConfig?.jsonTemplate || '');
      setErrorObj('');
    }
  }, [activeNode?.id]);

  if (!activeToken || !activeNode) return null;

  const nodeType = activeNode.type;
  
  const handleAdvance = (forcedPathToId?: string) => {
    let parsedPayload = {};
    if (jsonText.trim()) {
      try {
        parsedPayload = JSON.parse(jsonText);
      } catch (e: any) {
        setErrorObj(e.message);
        return;
      }
    }

    // Anexamos el JSON procesado al payload global
    const outgoingData = { timestamp: Date.now(), from: activeNode.id, ...parsedPayload };
    
    // Algoritmo de Avance (Next Node)
    const outgoingArrows = state.arrows.filter(a => a.fromId === activeNode.id);
    
    if (forcedPathToId) { // Venimos de una decisión manual (Si/No)
      moveToken(activeToken.id, forcedPathToId, outgoingData);
    } else if (outgoingArrows.length === 1) {
      moveToken(activeToken.id, outgoingArrows[0].toId, outgoingData);
    } else if (outgoingArrows.length > 1) {
      // Si nos obligan a avanzar sin forzar y es un split que no es manual-decision... fallamos por si acaso al primero
      moveToken(activeToken.id, outgoingArrows[0].toId, outgoingData);
    } else {
      endExecution(activeToken.id);
      alert('¡Ejecución Finalizada Exitosamente!');
    }
  };

  const isDecision = nodeType === 'decision';
  // Extraemos puertos conectados a la decision para mostrarlos como Sí/No
  const decisionArrows = state.arrows.filter(a => a.fromId === activeNode.id);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '320px',
      height: '100%',
      backgroundColor: '#0f172a',
      borderLeft: '1px solid #334155',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 150,
      color: '#f8fafc',
      padding: '24px'
    }}>
      <h2 style={{ fontSize: '18px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
        ⚙️ Acción en Progreso
      </h2>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
        Nodo actual: <strong style={{ color: '#e2e8f0'}}>{activeNode.label || nodeType}</strong>
      </p>

      <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', color: '#60a5fa', margin: 0 }}>Payload Acumulado:</p>
        <pre style={{ margin: '8px 0 0 0', fontSize: '11px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '150px', overflowY: 'auto' }}>
          {JSON.stringify(activeToken.payload, null, 2)}
        </pre>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {!isDecision ? (
          <>
            <p style={{ fontSize: '13px', margin: 0 }}>Inyección JSON (Opcional):</p>
            <textarea 
              className="saas-input"
              style={{ flex: 1, minHeight: '150px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setErrorObj('');
              }}
              placeholder='{&#10; "data": "value"&#10;}'
            />
            {errorObj && <p style={{ color: '#ef4444', fontSize: '11px', margin: 0 }}>JSON Inválido: {errorObj}</p>}
            
            <button className="saas-button" onClick={() => handleAdvance()} style={{ marginTop: 'auto', background: '#3b82f6' }}>
              Inyectar y Avanzar 🚀
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', margin: 0 }}>Decisión Manual Requerida:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {decisionArrows.length > 0 ? decisionArrows.map((arrow, idx) => {
                const isTruePath = arrow.fromPort === 'bottom' || idx === 0;
                return (
                  <button 
                    key={arrow.id}
                    className="saas-button" 
                    onClick={() => handleAdvance(arrow.toId)} 
                    style={{ background: isTruePath ? '#10b981' : '#ef4444' }}
                  >
                    Tomar camino {isTruePath ? 'Verdadero (Sí)' : 'Falso (No)'}
                  </button>
                )
              }) : (
                 <p style={{ fontSize: '12px', color: 'gray' }}>No hay salidas conectadas.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
