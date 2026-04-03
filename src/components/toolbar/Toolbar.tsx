import React from 'react';
import { useDiagramStore } from '../../store/diagramStore';
import { NodeType } from '../../types/diagram';

export const Toolbar: React.FC = () => {
  const { addNode, addLane, state, reset, autoLayout } = useDiagramStore();

  const handleAddNode = (type: NodeType) => {
    // Add to the first lane by default
    const laneId = state.lanes[0]?.id;
    if (!laneId) return;
    
    addNode(type, laneId, 180, 100);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `diagrama-${state.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const newState = JSON.parse(content);
          useDiagramStore.getState().setState(newState);
        } catch (err) {
          alert('Error al importar el archivo JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="toolbar">
      {/* Node Addition */}
      <button className="tool-button" onClick={() => handleAddNode('activity')} title="Actividad">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="12" rx="4" />
        </svg>
      </button>
      
      <button className="tool-button" onClick={() => handleAddNode('decision')} title="Decisión">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3L21 12L12 21L3 12L12 3Z" />
        </svg>
      </button>
      
      <button className="tool-button" onClick={() => handleAddNode('start')} title="Inicio">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" fill="currentColor" />
        </svg>
      </button>

      <button className="tool-button" onClick={() => handleAddNode('end')} title="Fin">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      </button>

      <button className="tool-button" onClick={() => handleAddNode('fork')} title="Fork/Join">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="11" width="16" height="2" fill="currentColor" />
        </svg>
      </button>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', gridColumn: 'span 3', margin: '4px 0' }} />

      {/* Lane Addition */}
      <button className="tool-button" onClick={() => addLane('Nueva Calle')} title="Agregar Calle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5V19M5 12H19" />
        </svg>
      </button>

      <button className="tool-button" onClick={autoLayout} title="Auto-layout Vertical">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18M5 10l7 7 7-7" />
        </svg>
      </button>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', gridColumn: 'span 3', margin: '4px 0' }} />

      {/* Persistence */}
      <button className="tool-button wide" onClick={handleExportJSON} title="Exportar JSON">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Exportar JSON
      </button>

      <label className="tool-button wide" title="Importar JSON" style={{ width: 'auto' }}>
        <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Importar JSON
      </label>

      <button className="tool-button wide" onClick={reset} title="Limpiar Todo" style={{ color: '#ef4444' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Limpiar Tablero
      </button>
    </div>
  );
};
