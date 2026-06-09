import React from 'react';
import { Rect, Text, Group } from 'react-konva';
import { DiagramNode, PortPosition } from '../../types/diagram';
import { NodePorts } from './NodePorts';

/* ══════════════════════════════════════════════════
   ActivityNode — Fondo blanco canvas
   Paleta: purple · teal · sobre blanco
   ══════════════════════════════════════════════════ */

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

/* Colores para fondo blanco */
const ACTIVITY_FILL    = 'rgb(132, 197, 177)';   // teal pastel
const ACTIVITY_STROKE  = 'rgb(90, 155, 135)';    // teal oscuro
const SELECTED_STROKE  = 'rgb(116, 69, 119)';    // purple
const ACTIVE_STROKE    = 'rgb(172, 207, 163)';   // sage
const TEXT_COLOR       = 'rgb(26, 15, 30)';      // dark para contraste

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

  /* Color de relleno: custom > default teal */
  const fillColor = node.color && node.color !== '#1e293b'
    ? node.color
    : ACTIVITY_FILL;

  const strokeColor = isExecutionActive
    ? ACTIVE_STROKE
    : isSelected
    ? SELECTED_STROKE
    : isHovered
    ? 'rgb(100, 165, 145)'
    : ACTIVITY_STROKE;

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
      {/* Sombra decorativa */}
      <Rect
        width={node.width}
        height={node.height}
        cornerRadius={node.type === 'activity' ? 26 : 0}
        fill="rgba(116,69,119,0.12)"
        x={3} y={4}
      />

      {/* Rectángulo principal */}
      <Rect
        width={node.width}
        height={node.height}
        fill={fillColor}
        cornerRadius={node.type === 'activity' ? 26 : 0}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : isExecutionActive ? 3 : 1.5}
        shadowColor={isExecutionActive ? ACTIVE_STROKE : isSelected ? SELECTED_STROKE : 'transparent'}
        shadowBlur={isExecutionActive ? 14 : isSelected ? 8 : 0}
        shadowOpacity={0.5}
      />

      {/* Texto */}
      <Text
        text={node.label}
        width={node.width}
        height={node.height}
        align="center"
        verticalAlign="middle"
        fill={TEXT_COLOR}
        fontSize={13}
        fontStyle="600"
        fontFamily="'DM Sans', system-ui, sans-serif"
        padding={10}
        fillAfterStrokeEnabled
      />

      {/* Indicador de ejecución activa */}
      {isExecutionActive && (
        <Rect
          width={8} height={8}
          x={node.width - 14} y={6}
          cornerRadius={4}
          fill="rgb(172, 207, 163)"
        />
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
