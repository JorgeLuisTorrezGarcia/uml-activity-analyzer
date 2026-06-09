import React, { useState } from 'react';
import { useDiagramStore } from '../../store/diagramStore';
import { NodeType } from '../../types/diagram';

/* ═══════════════════════════════════════════════════
   Toolbar — Elementos UML Activity Diagram
   Paleta Retro Vintage Pastel
   ═══════════════════════════════════════════════════ */

/* ── Definición de formas UML ── */
const UML_NODES: {
  type: NodeType;
  label: string;
  desc: string;
  color: string;
  borderColor: string;
  preview: React.ReactNode;
}[] = [
  {
    type: 'start',
    label: 'Inicio',
    desc: 'Nodo inicial del flujo',
    color: 'rgba(116,69,119,0.18)',
    borderColor: 'rgba(116,69,119,0.5)',
    preview: (
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="12" fill="rgb(116,69,119)" />
      </svg>
    ),
  },
  {
    type: 'end',
    label: 'Fin',
    desc: 'Nodo final del flujo',
    color: 'rgba(116,69,119,0.12)',
    borderColor: 'rgba(116,69,119,0.4)',
    preview: (
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="13" fill="none" stroke="rgb(116,69,119)" strokeWidth="2" />
        <circle cx="18" cy="18" r="8"  fill="rgb(116,69,119)" />
      </svg>
    ),
  },
  {
    type: 'activity',
    label: 'Actividad',
    desc: 'Acción o tarea del proceso',
    color: 'rgba(132,197,177,0.15)',
    borderColor: 'rgba(132,197,177,0.5)',
    preview: (
      <svg width="50" height="28" viewBox="0 0 50 28">
        <rect x="2" y="4" width="46" height="20" rx="7" fill="none" stroke="rgb(90,155,135)" strokeWidth="1.8" />
        <line x1="10" y1="14" x2="40" y2="14" stroke="rgb(90,155,135)" strokeWidth="1.2" opacity="0.5" />
      </svg>
    ),
  },
  {
    type: 'decision',
    label: 'Decisión',
    desc: 'Condición de bifurcación',
    color: 'rgba(172,207,163,0.15)',
    borderColor: 'rgba(172,207,163,0.5)',
    preview: (
      <svg width="40" height="36" viewBox="0 0 40 36">
        <path d="M20 4 L36 18 L20 32 L4 18 Z" fill="none" stroke="rgb(130,165,120)" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    type: 'fork',
    label: 'Fork / Join',
    desc: 'Flujo paralelo (barra negra)',
    color: 'rgba(240,233,182,0.10)',
    borderColor: 'rgba(240,233,182,0.35)',
    preview: (
      <svg width="50" height="16" viewBox="0 0 50 16">
        <rect x="2" y="5" width="46" height="6" rx="2" fill="rgb(200,190,130)" />
      </svg>
    ),
  },
];

/* ── Botón de herramienta de forma UML ── */
const UmlNodeButton: React.FC<{
  type: NodeType;
  label: string;
  desc: string;
  color: string;
  borderColor: string;
  preview: React.ReactNode;
  onClick: () => void;
}> = ({ label, desc, color, borderColor, preview, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={desc}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        background: hovered ? color.replace('0.15', '0.28').replace('0.18', '0.32').replace('0.12', '0.25').replace('0.10', '0.20') : color,
        border: `1px solid ${hovered ? borderColor : borderColor.replace('0.5', '0.3').replace('0.4', '0.25').replace('0.35', '0.2')}`,
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateX(3px)' : 'none',
        boxShadow: hovered ? `0 4px 14px rgba(0,0,0,0.25), 0 0 0 1px ${borderColor}` : 'none',
        textAlign: 'left',
      }}
    >
      {/* Icono preview */}
      <div style={{
        width: '48px', height: '36px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '7px',
        border: `1px solid ${borderColor.replace('0.5','0.2').replace('0.4','0.15').replace('0.35','0.12')}`
      }}>
        {preview}
      </div>
      {/* Texto */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: '12px',
          color: 'rgb(240, 233, 182)',
          lineHeight: 1.2,
          marginBottom: '2px'
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '9px',
          color: 'rgba(240,233,182,0.4)',
          letterSpacing: '0.3px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {desc}
        </div>
      </div>
      {/* Flecha hover */}
      <div style={{
        marginLeft: 'auto', flexShrink: 0,
        color: borderColor.replace('0.5','1').replace('0.4','1').replace('0.35','1'),
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s',
        fontSize: '14px'
      }}>
        +
      </div>
    </button>
  );
};

/* ── Botón de acción ancho ── */
const ActionButton: React.FC<{
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  children?: React.ReactNode;
  isLabel?: boolean;
}> = ({ onClick, icon, label, danger, children, isLabel }) => {
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: hovered
      ? danger ? 'rgba(180,60,60,0.18)' : 'rgba(116,69,119,0.22)'
      : danger ? 'rgba(180,60,60,0.08)' : 'rgba(116,69,119,0.10)',
    border: `1px solid ${hovered
      ? danger ? 'rgba(180,60,60,0.5)' : 'rgba(116,69,119,0.55)'
      : danger ? 'rgba(180,60,60,0.25)' : 'rgba(116,69,119,0.25)'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    color: hovered
      ? danger ? 'rgb(220,120,120)' : 'rgb(240,233,182)'
      : danger ? 'rgba(200,100,100,0.8)' : 'rgba(240,233,182,0.65)',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transform: hovered ? 'translateY(-1px)' : 'none',
    boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
    textAlign: 'left',
  };

  if (isLabel) {
    return (
      <label
        style={{ ...style, display: 'flex', alignItems: 'center', gap: '8px' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}
        {icon}
        {label}
      </label>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={style}
    >
      {icon}
      {label}
    </button>
  );
};

/* ── Separador de sección ── */
const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    margin: '14px 0 8px',
    color: 'rgb(132, 197, 177)',
    fontSize: '9px', fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '1.8px', textTransform: 'uppercase'
  }}>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(132,197,177,0.35), transparent)' }} />
    {label}
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(132,197,177,0.35))' }} />
  </div>
);

/* ════════════════════════════════════════
   Componente principal
   ════════════════════════════════════════ */
export const Toolbar: React.FC = () => {
  const { addNode, addLane, state, clearNodes, autoLayout } = useDiagramStore();

  const handleAddNode = (type: NodeType) => {
    const laneId = state.lanes[0]?.id;
    if (!laneId) return;
    addNode(type, laneId, 180, 100);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `diagrama-${state.name}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        useDiagramStore.getState().setState(JSON.parse(ev.target?.result as string));
      } catch {
        alert('Error al importar el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

      {/* ══ SECCIÓN: NODOS UML ══ */}
      <SectionDivider label="Nodos UML" />

      {UML_NODES.map(node => (
        <UmlNodeButton
          key={node.type}
          {...node}
          onClick={() => handleAddNode(node.type)}
        />
      ))}

      {/* ══ SECCIÓN: CALLES ══ */}
      <SectionDivider label="Swimlanes" />

      <ActionButton
        onClick={() => addLane('Nueva Calle')}
        label="Agregar Calle"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5V19M5 12H19" />
          </svg>
        }
      />

      <ActionButton
        onClick={autoLayout}
        label="Auto-organizar"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 3v18M5 10l7 7 7-7" />
          </svg>
        }
      />

      {/* ══ SECCIÓN: ARCHIVO ══ */}
      <SectionDivider label="Archivo" />

      <ActionButton
        onClick={handleExportJSON}
        label="Exportar JSON"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        }
      />

      <ActionButton
        isLabel
        label="Importar JSON"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        }
      >
        <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
      </ActionButton>

      {/* ══ SECCIÓN: PELIGRO ══ */}
      <SectionDivider label="Zona Roja" />

      <ActionButton
        onClick={clearNodes}
        label="Limpiar Tablero"
        danger
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        }
      />

      {/* ══ Tip de arrastre ══ */}
      <div style={{
        marginTop: '16px',
        padding: '10px 12px',
        background: 'rgba(116,69,119,0.08)',
        border: '1px solid rgba(116,69,119,0.18)',
        borderRadius: '8px',
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: 'rgba(240,233,182,0.35)',
        lineHeight: 1.5,
        letterSpacing: '0.2px'
      }}>
        <div style={{ marginBottom: '4px', color: 'rgba(132,197,177,0.6)', fontWeight: 700 }}>CONSEJOS</div>
        ✦ Clic en un nodo para seleccionar<br />
        ✦ Del para eliminar seleccionado<br />
        ✦ Scroll para hacer zoom<br />
        ✦ Arrastra el canvas para mover
      </div>
    </div>
  );
};
