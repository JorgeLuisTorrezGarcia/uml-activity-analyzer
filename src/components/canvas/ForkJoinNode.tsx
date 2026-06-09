import React from 'react';
import { Rect, Group, Text } from 'react-konva';
import { DiagramNode, PortPosition } from '../../types/diagram';
import { NodePorts } from './NodePorts';

/* ══════════════════════════════════════════════════
   ForkJoinNode — Barra de sincronización UML
   Sobre fondo blanco — paleta retro-vintage
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

/* La barra Fork/Join en UML es una barra negra gruesa — 
   sobre fondo blanco usamos el purple oscuro para máximo contraste */
const BAR_FILL         = 'rgb(60, 35, 65)';      // purple muy oscuro
const BAR_FILL_HOVER   = 'rgb(80, 48, 85)';
const BAR_SELECTED     = 'rgb(116, 69, 119)';
const SELECTED_STROKE  = 'rgb(116, 69, 119)';
const LABEL_COLOR      = 'rgba(26, 15, 30, 0.55)';

export const ForkJoinNode: React.FC<NodeProps> = ({
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

  const fillColor = node.color && node.color !== '#1e293b' && node.color !== 'black'
    ? node.color
    : isSelected
    ? BAR_SELECTED
    : isHovered
    ? BAR_FILL_HOVER
    : BAR_FILL;

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
      {/* Sombra ligera */}
      <Rect
        width={node.width}
        height={node.height}
        cornerRadius={3}
        fill="rgba(116,69,119,0.15)"
        x={2} y={3}
      />

      {/* Barra principal */}
      <Rect
        width={node.width}
        height={node.height}
        fill={fillColor}
        cornerRadius={3}
        stroke={isSelected ? SELECTED_STROKE : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        shadowColor={isSelected ? SELECTED_STROKE : 'transparent'}
        shadowBlur={isSelected ? 12 : 0}
        shadowOpacity={0.5}
      />

      {/* Label de tipo (Fork o Join) — pequeño, encima de la barra */}
      <Text
        text={node.type === 'fork' ? 'FORK' : 'JOIN'}
        width={node.width}
        height={node.height}
        align="center"
        verticalAlign="middle"
        fill="rgba(240,233,182,0.5)"
        fontSize={9}
        fontStyle="bold"
        fontFamily="'Space Mono', monospace"
        letterSpacing={2}
      />

      {/* Etiqueta personalizada encima del nodo */}
      {node.label && (
        <Text
          text={node.label}
          width={node.width}
          y={-20}
          align="center"
          fill={LABEL_COLOR}
          fontSize={11}
          fontFamily="'DM Sans', system-ui, sans-serif"
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
