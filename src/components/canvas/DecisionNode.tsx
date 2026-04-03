import React from 'react';
import { Group, RegularPolygon, Text } from 'react-konva';
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

export const DecisionNode: React.FC<NodeProps> = ({
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
      <RegularPolygon
        sides={4}
        x={node.width / 2}
        y={node.height / 2}
        radius={node.width / 2}
        fill={node.color || '#1e293b'}
        stroke={isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'}
        strokeWidth={isSelected ? 2 : 1}
        rotation={0}
      />
      <Text
        text={node.label}
        width={node.width}
        height={node.height}
        x={0}
        y={0}
        align="center"
        verticalAlign="middle"
        fill="white"
        fontSize={12}
        padding={5}
      />

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
