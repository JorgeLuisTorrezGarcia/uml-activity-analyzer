import React from 'react';
import { useDiagramStore } from '../../store/diagramStore';

export const PropertiesPanel: React.FC = () => {
  const { selectedIds, state, updateNode, deleteNode } = useDiagramStore();
  
  const selectedNode = state.nodes.find(n => n.id === selectedIds[0]);

  if (!selectedNode) {
    return (
      <div className="properties-panel fade-in">
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#94a3b8' }}>PROPIEDADES</h3>
        <p style={{ fontSize: '12px', color: '#64748b' }}>Selecciona un elemento para editarlo</p>
      </div>
    );
  }

  return (
    <div className="properties-panel fade-in">
      <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#3b82f6' }}>EDITAR ELEMENTO</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#94a3b8' }}>ETIQUETA</label>
          <input
            type="text"
            value={selectedNode.label}
            onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,23,42,0.5)',
              color: 'white',
              fontSize: '13px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#94a3b8' }}>COLOR</label>
          <input
            type="color"
            value={selectedNode.color || '#1e293b'}
            onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
            style={{
              width: '100%',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent'
            }}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => deleteNode(selectedNode.id)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            ELIMINAR
          </button>
        </div>
      </div>
    </div>
  );
};
