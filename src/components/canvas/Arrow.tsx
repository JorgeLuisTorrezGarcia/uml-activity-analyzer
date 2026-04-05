import React from 'react';
import { Arrow as KonvaArrow, Text, Group, Circle } from 'react-konva';
import { DiagramArrow, DiagramNode, buildOrthogonalPath } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';

interface ArrowProps {
  arrow: DiagramArrow;
  fromNode?: DiagramNode;
  toNode?: DiagramNode;
  isSelected: boolean;
  onSelect: (e: any) => void;
}

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

  // Mapeamos los puntos para renderizar pequeñas anclas si está seleccionado
  const anchorPoints: { x: number; y: number; originalIndex: number }[] = [];
  for (let i = 2; i < points.length - 2; i += 2) {
    anchorPoints.push({ x: points[i], y: points[i + 1], originalIndex: i });
  }

  const handleDragAnchor = (e: any, index: number) => {
    e.cancelBubble = true;
    
    // Si no teníamos waypoints, inicializamos con los calculados
    let currentWaypoints = arrow.waypoints && arrow.waypoints.length > 0 
      ? [...arrow.waypoints] 
      : anchorPoints.map((p, idx) => ({ id: `wp-${idx}`, x: p.x, y: p.y }));

    // Buscamos cuál es el waypoint correspondiente (index / 2 - 1)
    const wpIndex = (index / 2) - 1;
    if (currentWaypoints[wpIndex]) {
      currentWaypoints[wpIndex].x = e.target.x();
      currentWaypoints[wpIndex].y = e.target.y();
      useDiagramStore.getState().updateWaypoints(arrow.id, currentWaypoints);
    }
  };

  const handleDragEndAnchor = () => {
    // Para que sockets u otras optimizaciones detecten el fin
    // En el futuro, enviar broadcast aquí.
  };

  // Punto medio para etiqueta
  const midIndex = Math.floor(points.length / 4) * 2;
  const mx = points[midIndex] || 0;
  const my = points[midIndex + 1] || 0;

  return (
    <Group onClick={onSelect} onTap={onSelect}>
      <KonvaArrow
        id={arrow.id}
        points={points}
        stroke={isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)'}
        fill={isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)'}
        strokeWidth={2}
        pointerLength={10}
        pointerWidth={10}
        hitStrokeWidth={15}
        lineJoin="round"
      />
      <Text
        text={arrow.label || '...'}
        x={mx + 5}
        y={my - 15}
        fill={arrow.label ? "white" : "transparent"}
        fontSize={12}
        onMouseEnter={(e) => {
          if (!arrow.label) (e.target as any).fill('rgba(255,255,255,0.3)');
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
      
      {/* Waypoints arrastrables */}
      {isSelected && anchorPoints.map((pt, i) => (
        <Circle
          key={i}
          x={pt.x}
          y={pt.y}
          radius={6}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={1}
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
