import React from 'react';
import { Rect, Text, Group, Line } from 'react-konva';
import { SwimLane as SwimLaneType } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';

interface SwimLaneProps {
  lane: SwimLaneType;
  x: number;
  height: number;
}

export const SwimLane: React.FC<SwimLaneProps> = ({ lane, x, height }) => {
  const { updateLane } = useDiagramStore();
  const [isEditing, setIsEditing] = React.useState(false);
  
  const laneHeight = (lane as any).height || height;

  return (
    <Group x={x} y={0}>
      {/* Dynamic Background Rect */}
      <Rect
        width={lane.width}
        height={laneHeight}
        fill="rgba(30, 41, 59, 0.3)"
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth={1}
      />
      
      {/* Header Rect */}
      <Rect
        width={lane.width}
        height={40}
        fill={lane.color + '22'} // Semi-transparent
        stroke="rgba(255, 255, 255, 0.1)"
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
          fill="white"
          fontSize={12}
          fontStyle="bold"
          letterSpacing={1.2}
          onDblClick={() => setIsEditing(true)}
        />
      ) : (
        <Group>
          <Rect width={lane.width} height={40} fill="#1e293b" />
          {/* Note: Konva doesn't have an <input>, so we usually use a DOM input portal or just simple prompt for name change here for speed */}
          <Text
            text="EDITANDO..."
            width={lane.width}
            height={40}
            align="center"
            verticalAlign="middle"
            fill="#3b82f6"
            fontSize={10}
            onClick={() => {
              const newTitle = prompt("Nuevo nombre de la calle:", lane.title);
              if (newTitle) updateLane(lane.id, { title: newTitle });
              setIsEditing(false);
            }}
          />
        </Group>
      )}
      
      {/* Right separation line */}
      <Line
        points={[lane.width, 0, lane.width, laneHeight]}
        stroke="rgba(255, 255, 255, 0.1)"
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
          // El 'e.target.x()' aquí YA ESTÁ RELATIVO AL GRUPO, porque el Rect está dentro del Group.
          // Por tanto, la nueva anchura de la calle es simplemente e.target.x() + 5
          const newWidth = e.target.x() + 5;
          updateLane(lane.id, { width: Math.max(100, newWidth) });
          // Mantenemos el handle alineado al borde, que ahora se movió visualmente
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
          // e.target.y() is relative to Group
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
