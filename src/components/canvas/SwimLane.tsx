import React from 'react';
import { Rect, Text, Group, Line } from 'react-konva';
import { SwimLane as SwimLaneType } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';

/* ══════════════════════════════════════════════════
   SwimLane — Calles del diagrama de actividad
   Sobre fondo blanco — paleta retro-vintage
   ══════════════════════════════════════════════════ */

interface SwimLaneProps {
  lane: SwimLaneType;
  x: number;
  height: number;
}

export const SwimLane: React.FC<SwimLaneProps> = ({ lane, x, height }) => {
  const { updateLane } = useDiagramStore();
  const [isEditing, setIsEditing] = React.useState(false);
  
  const laneHeight = (lane as any).height || height;
  
  /* Colores para la calle sobre fondo blanco */
  const HEADER_FILL = lane.color ? lane.color : 'rgba(240, 233, 182, 0.4)'; // Yellow pastel por defecto
  const LANE_BORDER = 'rgba(116, 69, 119, 0.3)'; // Purple suave
  const TEXT_COLOR = 'rgb(116, 69, 119)'; // Purple oscuro para contraste

  return (
    <Group x={x} y={0}>
      {/* Dynamic Background Rect (ahora casi transparente sobre blanco) */}
      <Rect
        width={lane.width}
        height={laneHeight}
        fill="rgba(255, 255, 255, 0.5)"
        stroke={LANE_BORDER}
        strokeWidth={1}
      />
      
      {/* Header Rect */}
      <Rect
        width={lane.width}
        height={40}
        fill={HEADER_FILL}
        stroke={LANE_BORDER}
        strokeWidth={1}
      />
      
      {/* Lane Title (Double click to edit) */}
      {!isEditing ? (
        <Text
          text={lane.title.toUpperCase()}
          width={lane.width}
          height={40}
          align="center"
          verticalAlign="middle"
          fill={TEXT_COLOR}
          fontSize={13}
          fontStyle="bold"
          fontFamily="'DM Sans', system-ui, sans-serif"
          letterSpacing={1.2}
          onDblClick={() => setIsEditing(true)}
        />
      ) : (
        <Group>
          <Rect width={lane.width} height={40} fill="rgba(240, 233, 182, 0.8)" />
          <Text
            text="EDITANDO..."
            width={lane.width}
            height={40}
            align="center"
            verticalAlign="middle"
            fill="rgb(132, 197, 177)" // Teal
            fontSize={11}
            fontFamily="'Space Mono', monospace"
            onClick={() => {
              const newTitle = prompt("Nuevo nombre de la calle:", lane.title);
              if (newTitle) updateLane(lane.id, { title: newTitle });
              setIsEditing(false);
            }}
          />
        </Group>
      )}

      {/* Botón Eliminar Calle (X) */}
      <Group
        x={lane.width - 25}
        y={12}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
        onClick={() => {
          if (window.confirm(`¿Estás seguro de eliminar la calle "${lane.title}" y todos sus nodos?`)) {
            useDiagramStore.getState().deleteLane(lane.id);
          }
        }}
        onTap={() => {
          if (window.confirm(`¿Estás seguro de eliminar la calle "${lane.title}" y todos sus nodos?`)) {
            useDiagramStore.getState().deleteLane(lane.id);
          }
        }}
      >
        <Rect width={16} height={16} fill="rgba(239, 68, 68, 0.15)" cornerRadius={4} />
        <Text text="×" width={16} height={16} align="center" verticalAlign="middle" fill="#ef4444" fontSize={14} fontStyle="bold" />
      </Group>
      
      {/* Right separation line */}
      <Line
        points={[lane.width, 0, lane.width, laneHeight]}
        stroke={LANE_BORDER}
        strokeWidth={1}
      />

      {/* Resize Handle (Right) */}
      <Rect
        x={lane.width - 5}
        y={0}
        width={10}
        height={laneHeight}
        fill="transparent"
        draggable
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'col-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
        onDragMove={(e) => {
          const newWidth = e.target.x() + 5;
          updateLane(lane.id, { width: Math.max(100, newWidth) });
          e.target.x(Math.max(100, newWidth) - 5);
        }}
        onDragEnd={(e) => {
          const newWidth = e.target.x() + 5;
          updateLane(lane.id, { width: Math.max(100, newWidth) });
          e.target.x(Math.max(100, newWidth) - 5);
        }}
      />

      {/* Vertical Resize Handle (Bottom) */}
      <Rect
        x={0}
        y={laneHeight - 5}
        width={lane.width}
        height={10}
        fill="transparent"
        draggable
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'row-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
        onDragMove={(e) => {
          const newHeight = e.target.y() + 5;
          updateLane(lane.id, { height: Math.max(200, newHeight) } as any);
          e.target.y(Math.max(200, newHeight) - 5);
        }}
        onDragEnd={(e) => {
          const newHeight = e.target.y() + 5;
          updateLane(lane.id, { height: Math.max(200, newHeight) } as any);
          e.target.y(Math.max(200, newHeight) - 5);
        }}
      />
    </Group>
  );
};
