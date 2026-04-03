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
  return (
    <Group x={x} y={0}>
      {/* Dynamic Background Rect */}
      <Rect
        width={lane.width}
        height={height}
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
        points={[lane.width, 0, lane.width, height]}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={1}
      />
    </Group>
  );
};
