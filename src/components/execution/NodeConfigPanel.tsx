import React, { useState, useEffect } from 'react';
import { useDiagramStore } from '../../store/diagramStore';

export const NodeConfigPanel: React.FC = () => {
  const { state, activeConfigNodeId, updateNode, setActiveConfigNodeId } = useDiagramStore();

  const [jsonTemplate, setJsonTemplate] = useState('');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const activeNode = state.nodes.find(n => n.id === activeConfigNodeId);

  useEffect(() => {
    if (activeNode) {
      if (activeNode.executionConfig && activeNode.executionConfig.jsonTemplate) {
        setJsonTemplate(activeNode.executionConfig.jsonTemplate);
      } else {
        // Valor por defecto según mockup
        const defaultName = activeNode.label || activeNode.type;
        const defaultJson = `{\n  "${defaultName}": [\n    {\n      "": ""\n    }\n  ]\n}`;
        setJsonTemplate(defaultJson);
      }
      setExpandedNodeId(null);
    }
  }, [activeConfigNodeId, activeNode]);

  if (!activeNode) return null;

  const handleSaveJson = (val: string) => {
    setJsonTemplate(val);
    updateNode(activeNode.id, { 
      executionConfig: { type: 'manual', jsonTemplate: val } 
    });
  };

  // Buscar nodos entrantes
  const incomingArrows = state.arrows.filter(a => a.toId === activeNode.id);
  const incomingNodes = incomingArrows.map(a => state.nodes.find(n => n.id === a.fromId)).filter(Boolean);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 280, 
      width: '320px',
      height: '100%',
      backgroundColor: '#1e293b', // Color oscuro estilo n8n
      borderLeft: '1px solid #334155',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 140,
      color: '#f8fafc'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#e2e8f0', fontWeight: 600 }}>Configuración de {activeNode.type === 'decision' ? 'Decisión' : 'Actividad'}</h3>
        <button onClick={() => setActiveConfigNodeId(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>×</button>
      </div>

      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* ENTRADA */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontStyle: 'italic', color: '#f8fafc' }}>Entrada</h4>
          {incomingNodes.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No hay nodos conectados a la entrada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incomingNodes.map(n => {
                if (!n) return null;
                const isExpanded = expandedNodeId === n.id;
                const incomingJson = n.executionConfig?.jsonTemplate || '{\n  // Sin datos de salida configurados\n}';
                
                return (
                  <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '14px', cursor: 'pointer' }}
                      onClick={() => setExpandedNodeId(isExpanded ? null : n.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      {n.label || n.type}
                    </div>
                    {isExpanded && (
                      <pre style={{ margin: '4px 0 0 22px', padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#94a3b8', border: '1px solid #334155', whiteSpace: 'pre-wrap' }}>
                        {incomingJson}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LINEA SEPARADORA BLANCA MOCKUP */}
        <hr style={{ border: 'none', borderTop: '2px solid white', margin: 0 }} />

        {/* SALIDA */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' }}>Salida</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8' }}>Define el JSON esperado (incluso si está vacío)</p>
          
          <textarea 
            className="saas-input"
            style={{ 
              flex: 1, 
              minHeight: '200px', 
              fontFamily: 'monospace', 
              fontSize: '13px', 
              background: '#0f172a',
              resize: 'vertical',
              padding: '12px'
            }}
            value={jsonTemplate}
            onChange={(e) => handleSaveJson(e.target.value)}
            placeholder='{&#10;  "variable": "valor"&#10;}'
          />
        </div>

      </div>
    </div>
  );
};
