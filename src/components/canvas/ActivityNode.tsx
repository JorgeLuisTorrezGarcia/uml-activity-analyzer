import React from 'react';
import { Rect, Text, Group } from 'react-konva';
import { DiagramNode, PortPosition } from '../../types/diagram';
import { NodePorts } from './NodePorts';

interface NodeProps {
  node: DiagramNode;
  isSelected: boolean;
  isConnecting: boolean;
  activePort: PortPosition | null;
  isExecutionActive?: boolean;
  executionStatus?: string;
  onSelect: (e: any) => void;
  onDblClick?: (e: any) => void;
  onConnectStart: (port: PortPosition) => void;
  onConnectEnd: (port: PortPosition) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}

export const ActivityNode: React.FC<NodeProps> = ({
  node,
  isSelected,
  isConnecting,
  activePort,
  isExecutionActive,
  onSelect,
  onDblClick,
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
      onDblClick={onDblClick}
      onTap={onSelect}
      onDblTap={onDblClick}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Rect
        width={node.width}
        height={node.height}
        fill={node.color || '#1e293b'}
        cornerRadius={node.type === 'activity' ? 25 : 0}
        stroke={isExecutionActive ? '#22c55e' : (isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)')}
        strokeWidth={isExecutionActive ? 4 : (isSelected ? 2 : 1)}
        shadowColor={isExecutionActive ? '#22c55e' : 'transparent'}
        shadowBlur={isExecutionActive ? 15 : 0}
        shadowOpacity={0.8}
      />
      <Text
        text={node.label}
        width={node.width}
        height={node.height}
        align="center"
        verticalAlign="middle"
        fill="white"
        fontSize={14}
        padding={10}
        fillAfterStrokeEnabled
      />

      {/* Puertos de Conexión (visibles al hacer hover o conectar) */}
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
