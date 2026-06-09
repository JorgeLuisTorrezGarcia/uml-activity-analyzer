import React from 'react';
import { Group, Line, Text } from 'react-konva';
import { DiagramNode, PortPosition } from '../../types/diagram';
import { NodePorts } from './NodePorts';

/* ══════════════════════════════════════════════════
   DecisionNode — Rombo UML sobre fondo blanco
   Usa Line para dibujar un rombo limpio
   ══════════════════════════════════════════════════ */

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

const DECISION_FILL   = 'rgb(172, 207, 163)';  // sage green
const DECISION_STROKE = 'rgb(120, 165, 110)';  // sage oscuro
const SELECTED_STROKE = 'rgb(116, 69, 119)';   // purple
const TEXT_COLOR      = 'rgb(26, 15, 30)';

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

  const w = node.width;
  const h = node.height;
  const cx = w / 2;
  const cy = h / 2;

  /* Puntos del rombo: top · right · bottom · left (cerrado) */
  const points = [
    cx, 0,       // top
    w,  cy,      // right
    cx, h,       // bottom
    0,  cy,      // left
    cx, 0,       // close
  ];

  /* Sombra (rombo offset) */
  const shadowPoints = [
    cx + 3, 4,
    w + 3,  cy + 4,
    cx + 3, h + 4,
    3,      cy + 4,
    cx + 3, 4,
  ];

  const strokeColor = isSelected
    ? SELECTED_STROKE
    : isHovered
    ? 'rgb(140, 185, 130)'
    : DECISION_STROKE;

  const fillColor = node.color && node.color !== '#1e293b'
    ? node.color
    : DECISION_FILL;

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
      {/* Sombra decorativa */}
      <Line
        points={shadowPoints}
        closed
        fill="rgba(116,69,119,0.10)"
        stroke="transparent"
        strokeWidth={0}
      />

      {/* Rombo principal */}
      <Line
        points={points}
        closed
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : 1.8}
        shadowColor={isSelected ? SELECTED_STROKE : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.45}
      />

      {/* Etiqueta centrada */}
      <Text
        text={node.label}
        width={w}
        height={h}
        x={0} y={0}
        align="center"
        verticalAlign="middle"
        fill={TEXT_COLOR}
        fontSize={11}
        fontStyle="700"
        fontFamily="'DM Sans', system-ui, sans-serif"
        padding={14}
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
