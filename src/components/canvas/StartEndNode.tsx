import React from 'react';
import { Circle, Group, Ring, Rect } from 'react-konva';
import { DiagramNode, PortPosition } from '../../types/diagram';
import { NodePorts } from './NodePorts';

/* ══════════════════════════════════════════════════
   StartEndNode — Nodos inicio/fin UML
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

/* Start: círculo sólido purple */
const START_FILL     = 'rgb(116, 69, 119)';
const START_STROKE_S = 'rgb(116, 69, 119)';   // selected stroke (purple glow)

/* End: bullseye purple + anillo */
const END_FILL       = 'rgb(80, 45, 82)';
const END_RING       = 'rgb(116, 69, 119)';

const SELECTED_GLOW  = 'rgb(116, 69, 119)';

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
  const cx = node.width / 2;
  const cy = node.height / 2;

  return (
    <Group
      id={node.id}
      x={node.x}
      y={node.y}
      draggable
      onClick={e => { e.cancelBubble = true; onSelect(e); }}
      onTap={e => { e.cancelBubble = true; onSelect(e); }}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hitbox invisible */}
      <Rect width={node.width} height={node.height} fill="transparent" />

      {/* ── INICIO: Círculo sólido purple ── */}
      {node.type === 'start' && (
        <>
          {/* Halo decorativo */}
          <Circle
            x={cx} y={cy} radius={30}
            fill="rgba(116,69,119,0.12)"
          />
          <Circle
            x={cx} y={cy} radius={24}
            fill={node.color && node.color !== '#1e293b' ? node.color : START_FILL}
            stroke={isSelected ? SELECTED_GLOW : isHovered ? 'rgba(116,69,119,0.7)' : 'transparent'}
            strokeWidth={isSelected ? 3 : 2}
            shadowColor={SELECTED_GLOW}
            shadowBlur={isSelected ? 14 : isHovered ? 8 : 0}
            shadowOpacity={0.55}
          />
          {/* Punto interno para distinción visual */}
          <Circle x={cx} y={cy} radius={10} fill="rgba(240,233,182,0.35)" />
        </>
      )}

      {/* ── FIN: Bullseye ── */}
      {node.type === 'end' && (
        <>
          {/* Halo */}
          <Circle
            x={cx} y={cy} radius={30}
            fill="rgba(116,69,119,0.10)"
          />
          {/* Anillo exterior */}
          <Ring
            x={cx} y={cy}
            innerRadius={19}
            outerRadius={26}
            fill={END_RING}
            stroke={isSelected ? SELECTED_GLOW : isHovered ? 'rgba(116,69,119,0.6)' : 'rgba(116,69,119,0.3)'}
            strokeWidth={isSelected ? 2.5 : 1.5}
            shadowColor={SELECTED_GLOW}
            shadowBlur={isSelected ? 14 : isHovered ? 6 : 0}
            shadowOpacity={0.5}
          />
          {/* Círculo central */}
          <Circle
            x={cx} y={cy} radius={12}
            fill={node.color && node.color !== '#1e293b' ? node.color : END_FILL}
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
