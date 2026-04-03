import React from 'react';
import { Group, Circle } from 'react-konva';
import { DiagramNode, PortPosition, getPortPosition } from '../../types/diagram';

interface NodePortsProps {
  node: DiagramNode;
  visible: boolean;
  isConnecting: boolean;
  onConnectStart: (port: PortPosition) => void;
  onConnectEnd: (port: PortPosition) => void;
  activePort?: PortPosition | null;
}

const PORTS: PortPosition[] = ['top', 'bottom', 'left', 'right'];

export const NodePorts: React.FC<NodePortsProps> = ({
  node,
  visible,
  isConnecting,
  onConnectStart,
  onConnectEnd,
}) => {
  if (!visible && !isConnecting) return null;

  return (
    <Group>
      {PORTS.map((port) => {
        // Obtenemos coordenadas relativas al centro del nodo.
        // getPortPosition devuelve absolutas, así que le restamos node.x / node.y.
        const pos = getPortPosition(node, port);
        const relX = pos.x - node.x;
        const relY = pos.y - node.y;

        return (
          <Group
            key={port}
            x={relX}
            y={relY}
            onClick={(e) => {
              e.cancelBubble = true;
              if (isConnecting) {
                onConnectEnd(port);
              } else {
                onConnectStart(port);
              }
            }}
            onMouseEnter={() => {
              document.body.style.cursor = 'crosshair';
            }}
            onMouseLeave={() => {
              document.body.style.cursor = 'default';
            }}
          >
            {/* Hit area más grande */}
            <Circle radius={15} fill="transparent" />
            {/* Indicador visual */}
            <Circle
              radius={6}
              fill={isConnecting ? "#10b981" : "#3b82f6"}
              stroke="white"
              strokeWidth={1.5}
            />
          </Group>
        );
      })}
    </Group>
  );
};
