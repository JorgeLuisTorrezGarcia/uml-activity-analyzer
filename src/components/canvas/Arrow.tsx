import React from 'react';
import { Arrow as KonvaArrow, Text, Group, Circle } from 'react-konva';
import { DiagramArrow, DiagramNode, buildOrthogonalPath } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';

/* ══════════════════════════════════════════════════
   Arrow — Conexiones
   Sobre fondo blanco — paleta retro-vintage
   ══════════════════════════════════════════════════ */

interface ArrowProps {
  arrow: DiagramArrow;
  fromNode?: DiagramNode;
  toNode?: DiagramNode;
  isSelected: boolean;
  onSelect: (e: any) => void;
}

const ARROW_COLOR = 'rgba(116, 69, 119, 0.6)'; // Purple semi-transparente
const ARROW_SELECTED = 'rgb(116, 69, 119)';     // Purple sólido
const TEXT_COLOR = 'rgb(80, 45, 82)';          // Purple muy oscuro

export const Arrow: React.FC<ArrowProps> = ({
  arrow,
  fromNode,
  toNode,
  isSelected,
  onSelect,
}) => {
  if (!fromNode || !toNode) return null;

  const points = buildOrthogonalPath(
    fromNode,
    toNode,
    arrow.fromPort || 'bottom',
    arrow.toPort || 'top',
    arrow.waypoints || []
  );

  const anchorPoints: { x: number; y: number; originalIndex: number }[] = [];
  for (let i = 2; i < points.length - 2; i += 2) {
    anchorPoints.push({ x: points[i], y: points[i + 1], originalIndex: i });
  }

  const handleDragAnchor = (e: any, index: number) => {
    e.cancelBubble = true;
    
    let currentWaypoints = arrow.waypoints && arrow.waypoints.length > 0 
      ? [...arrow.waypoints] 
      : anchorPoints.map((p, idx) => ({ id: `wp-${idx}`, x: p.x, y: p.y }));

    const wpIndex = (index / 2) - 1;
    if (currentWaypoints[wpIndex]) {
      currentWaypoints[wpIndex].x = e.target.x();
      currentWaypoints[wpIndex].y = e.target.y();
      useDiagramStore.getState().updateWaypoints(arrow.id, currentWaypoints);
    }
  };

  const handleDragEndAnchor = () => {};

  const midIndex = Math.floor(points.length / 4) * 2;
  const mx = points[midIndex] || 0;
  const my = points[midIndex + 1] || 0;

  return (
    <Group onClick={onSelect} onTap={onSelect}>
      <KonvaArrow
        id={arrow.id}
        points={points}
        stroke={isSelected ? ARROW_SELECTED : ARROW_COLOR}
        fill={isSelected ? ARROW_SELECTED : ARROW_COLOR}
        strokeWidth={isSelected ? 2.5 : 2}
        pointerLength={10}
        pointerWidth={10}
        hitStrokeWidth={15}
        lineJoin="round"
      />
      <Text
        text={arrow.label || '...'}
        x={mx + 5}
        y={my - 15}
        fill={arrow.label ? TEXT_COLOR : "transparent"}
        fontSize={12}
        fontFamily="'DM Sans', system-ui, sans-serif"
        fontWeight={600}
        onMouseEnter={(e) => {
          if (!arrow.label) (e.target as any).fill('rgba(116, 69, 119, 0.3)');
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          if (!arrow.label) (e.target as any).fill('transparent');
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
        onDblClick={(e) => {
          e.cancelBubble = true;
          const newLabel = prompt("Etiqueta de la conexión (Ej. 'Sí', 'No'):", arrow.label || '');
          if (newLabel !== null) {
            useDiagramStore.getState().updateArrow(arrow.id, { label: newLabel });
          }
        }}
      />
      
      {isSelected && anchorPoints.map((pt, i) => (
        <Circle
          key={i}
          x={pt.x}
          y={pt.y}
          radius={6}
          fill="rgb(240, 233, 182)"
          stroke={ARROW_SELECTED}
          strokeWidth={1.5}
          draggable
          onDragMove={(e) => handleDragAnchor(e, pt.originalIndex)}
          onDragEnd={handleDragEndAnchor}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'move';
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
        />
      ))}
    </Group>
  );
};
