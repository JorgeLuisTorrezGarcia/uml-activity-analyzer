// ============================================================
// types/diagram.ts — Tipos extendibles para cualquier tipo de diagrama
// ============================================================

// Node types — Activity Diagram (extensible para Class, Sequence, etc.)
export type NodeType = 'activity' | 'decision' | 'start' | 'end' | 'fork' | 'join';

// Port positions on a node perimeter
export type PortPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface Port {
  id: string;
  nodeId: string;
  position: PortPosition;
  // Offset from node origin, normalized [0-1]
  offsetX: number;
  offsetY: number;
}

export type ExecutionType = 'manual' | 'automatic' | 'ai';

export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';

export interface FormField {
  id: string;          // UUID del campo
  name: string;        // Se usará como llave en el JSON (ej. "nivel_aprobacion")
  label: string;       // Etiqueta visible al usuario (ej. "¿Cuál es el nivel?")
  type: FormFieldType;
  options?: string[];  // Solo si type === 'select'
  required: boolean;
}

export interface NodeExecutionConfig {
  type: ExecutionType;
  // Template JSON string que se mostrará en salida
  jsonTemplate?: string;
  // Campos visuales drag & drop para el creador de formularios
  formSchema?: FormField[];
  // Para análisis de botella de cuello (ms)
  slaLimit?: number;
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  laneId: string;
  executionConfig?: NodeExecutionConfig;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color?: string;
  zIndex?: number;
}

// A waypoint is an intermediate point on a connector that the user can drag
export interface Waypoint {
  id: string;
  x: number;
  y: number;
}

export interface DiagramArrow {
  id: string;
  fromId: string;           // source node id
  toId: string;             // target node id
  fromPort: PortPosition;   // which port on source
  toPort: PortPosition;     // which port on target
  waypoints: Waypoint[];    // intermediate user-movable points
  label?: string;
}

export interface SwimLane {
  id: string;
  title: string;
  color: string;
  order: number;
  width: number;
}

export interface DiagramState {
  id: string;
  name: string;
  lanes: SwimLane[];
  nodes: DiagramNode[];
  arrows: DiagramArrow[];
}

export interface UserCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

// ============================================================
// Utility: compute the absolute position of a port on a node
// ============================================================
export function getPortPosition(node: DiagramNode, port: PortPosition): { x: number; y: number } {
  const { x, y, width, height } = node;
  const cx = x + width / 2;
  const cy = y + height / 2;

  switch (port) {
    case 'top':          return { x: cx,        y: y };
    case 'bottom':       return { x: cx,        y: y + height };
    case 'left':         return { x: x,         y: cy };
    case 'right':        return { x: x + width, y: cy };
    case 'top-left':     return { x: x,         y: y };
    case 'top-right':    return { x: x + width, y: y };
    case 'bottom-left':  return { x: x,         y: y + height };
    case 'bottom-right': return { x: x + width, y: y + height };
    default:             return { x: cx,        y: cy };
  }
}

// Find the nearest port on a node given an approaching point
export function getNearestPort(node: DiagramNode, fromX: number, fromY: number): PortPosition {
  const ports: PortPosition[] = ['top', 'bottom', 'left', 'right'];
  let nearest: PortPosition = 'bottom';
  let minDist = Infinity;

  for (const port of ports) {
    const pos = getPortPosition(node, port);
    const dist = Math.hypot(fromX - pos.x, fromY - pos.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = port;
    }
  }
  return nearest;
}

// Build orthogonal polyline between two ports, injecting user waypoints
export function buildOrthogonalPath(
  fromNode: DiagramNode,
  toNode: DiagramNode,
  fromPort: PortPosition,
  toPort: PortPosition,
  waypoints: Waypoint[]
): number[] {
  const from = getPortPosition(fromNode, fromPort);
  const to   = getPortPosition(toNode, toPort);

  if (waypoints.length === 0) {
    // Auto-route: single elbow
    return makeElbow(from, to, fromPort, toPort);
  }

  // User has set waypoints — chain them with orthogonal segments
  const pts: number[] = [from.x, from.y];
  for (const wp of waypoints) {
    pts.push(wp.x, wp.y);
  }
  pts.push(to.x, to.y);
  return pts;
}

function makeElbow(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromPort: PortPosition,
  toPort: PortPosition
): number[] {
  const gapFrom = 20; // stub length from source
  const gapTo   = 20; // stub length into target

  // Direction vectors for each port
  const dirMap: Record<PortPosition, [number, number]> = {
    'top':          [0, -1],
    'bottom':       [0,  1],
    'left':         [-1, 0],
    'right':        [1,  0],
    'top-left':     [-1, -1],
    'top-right':    [1, -1],
    'bottom-left':  [-1, 1],
    'bottom-right': [1,  1],
  };

  const [fdx, fdy] = dirMap[fromPort] ?? [0, 1];
  const [tdx, tdy] = dirMap[toPort]   ?? [0, -1];

  const fx2 = from.x + fdx * gapFrom;
  const fy2 = from.y + fdy * gapFrom;
  const tx2 = to.x   + tdx * gapTo;
  const ty2 = to.y   + tdy * gapTo;

  // midpoint elbow
  const isFromHorizontal = fdx !== 0 && fdy === 0;
  let mx: number, my: number;
  let mx2: number, my2: number;

  if (isFromHorizontal) {
    mx = tx2; my = fy2;
    mx2 = mx; my2 = my;
  } else {
    mx = fx2; my = ty2;
    mx2 = mx; my2 = my;
  }

  return [from.x, from.y, fx2, fy2, mx, my, mx2, my2, tx2, ty2, to.x, to.y];
}
