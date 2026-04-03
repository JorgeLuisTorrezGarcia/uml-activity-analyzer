import React from 'react';
import { Circle, Group, Ring } from 'react-konva';
import { DiagramNode, PortPosition } from '../../types/diagram';
import { NodePorts } from './NodePorts';

interface NodeProps {
  node: DiagramNode;
  isSelected: boolean;
  isConnecting: boolean;
  activePort: PortPosition | null;
  onSelect: (e: any) => void;
  onConnectStart: (port: PortPosition) => void;
  onConnectEnd: (port: PortPosition) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}

export const StartEndNode: React.FC<NodeProps> = ({
  node,
  isSelected,
  isConnecting,
  activePort,
  onSelect,
  onConnectStart,
  onConnectEnd,
  onDragMove,
  onDragEnd,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Group
      id={node.id}
      x={node.x}
      y={node.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Start Node: Solid Black Circle */}
      {node.type === 'start' && (
        <Circle
          x={node.width / 2}
          y={node.height / 2}
          radius={15}
          fill={node.color || "black"}
          stroke={isSelected ? '#3b82f6' : 'white'}
          strokeWidth={isSelected ? 2 : 1}
        />
      )}
      
      {/* End Node: Bullseye */}
      {node.type === 'end' && (
        <>
          <Ring
            x={node.width / 2}
            y={node.height / 2}
            innerRadius={10}
            outerRadius={15}
            fill="white"
            stroke={isSelected ? '#3b82f6' : 'black'}
            strokeWidth={isSelected ? 2 : 1}
          />
          <Circle
            x={node.width / 2}
            y={node.height / 2}
            radius={8}
            fill={node.color || "black"}
          />
        </>
      )}

      <NodePorts
        node={node}
        visible={isHovered}
        isConnecting={isConnecting}
        activePort={activePort}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
      />
    </Group>
  );
};
