import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dagre from 'dagre';
import {
  DiagramNode, DiagramArrow, SwimLane, DiagramState,
  NodeType, PortPosition, Waypoint
} from '../types/diagram';

// ============================================================
// Default node dimensions per type
// ============================================================
const NODE_DEFAULTS: Record<NodeType, { width: number; height: number; label: string }> = {
  activity: { width: 140, height: 50, label: 'Nueva Actividad' },
  decision: { width: 70,  height: 70, label: '¿Condición?' },
  start:    { width: 30,  height: 30, label: '' },
  end:      { width: 30,  height: 30, label: '' },
  fork:     { width: 160, height: 10, label: '' },
  join:     { width: 160, height: 10, label: '' },
};

// ============================================================
// Store interface
// ============================================================
interface DiagramStore {
  state: DiagramState;
  selectedIds: string[];
  activeConfigNodeId: string | null;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;

  // Node actions
  addNode: (type: NodeType, laneId: string, x: number, y: number) => string;
  updateNode: (id: string, updates: Partial<DiagramNode>) => void;
  deleteNode: (id: string) => void;
  bringToFront: (id: string) => void;

  // Lane actions
  addLane: (title: string) => void;
  updateLane: (id: string, updates: Partial<SwimLane>) => void;
  deleteLane: (id: string) => void;

  // Arrow/connector actions
  addArrow: (fromId: string, toId: string, fromPort: PortPosition, toPort: PortPosition) => string;
  updateArrow: (id: string, updates: Partial<DiagramArrow>) => void;
  updateWaypoints: (arrowId: string, waypoints: Waypoint[]) => void;
  deleteArrow: (id: string) => void;

  // Selection
  setSelectedIds: (ids: string[]) => void;
  setActiveConfigNodeId: (id: string | null) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  // Persistence
  setState: (state: DiagramState) => void;
  reset: () => void;

  // Auto-layout
  autoLayout: () => void;
}

// ============================================================
// Initial state
// ============================================================
const LANE_WIDTH = 280;

const initialLanes: SwimLane[] = [
  { id: 'lane-1', title: 'Cliente',       color: '#3b82f6', order: 0, width: LANE_WIDTH },
  { id: 'lane-2', title: 'Sistema',       color: '#10b981', order: 1, width: LANE_WIDTH },
  { id: 'lane-3', title: 'Base de Datos', color: '#f59e0b', order: 2, width: LANE_WIDTH },
];

const initialState: DiagramState = {
  id: uuidv4(),
  name: 'Nuevo Diagrama',
  lanes: initialLanes,
  nodes: [],
  arrows: [],
};

// ============================================================
// Store
// ============================================================
export const useDiagramStore = create<DiagramStore>((set, get) => ({
  state: initialState,
  selectedIds: [],
  activeConfigNodeId: null,
  isLeftPanelOpen: true,
  isRightPanelOpen: true,

  // ── Nodes ─────────────────────────────────────────────────
  addNode: (type, laneId, x, y) => {
    const id = uuidv4();
    const defaults = NODE_DEFAULTS[type];
    const maxZ = Math.max(0, ...get().state.nodes.map(n => n.zIndex ?? 0));

    const newNode: DiagramNode = {
      id,
      type,
      laneId,
      x,
      y,
      width:  defaults.width,
      height: defaults.height,
      label:  defaults.label,
      zIndex: maxZ + 1,
    };

    set(s => ({ state: { ...s.state, nodes: [...s.state.nodes, newNode] } }));
    return id;
  },

  updateNode: (id, updates) =>
    set(s => ({
      state: {
        ...s.state,
        nodes: s.state.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
      }
    })),

  deleteNode: (id) =>
    set(s => ({
      state: {
        ...s.state,
        nodes:  s.state.nodes.filter(n => n.id !== id),
        arrows: s.state.arrows.filter(a => a.fromId !== id && a.toId !== id),
      },
      selectedIds: s.selectedIds.filter(sid => sid !== id),
    })),

  bringToFront: (id) => {
    const maxZ = Math.max(0, ...get().state.nodes.map(n => n.zIndex ?? 0));
    get().updateNode(id, { zIndex: maxZ + 1 });
  },

  // ── Lanes ─────────────────────────────────────────────────
  addLane: (title) => {
    const newLane: SwimLane = {
      id:    uuidv4(),
      title,
      color: '#6366f1',
      order: get().state.lanes.length,
      width: LANE_WIDTH,
    };
    set(s => ({ state: { ...s.state, lanes: [...s.state.lanes, newLane] } }));
  },

  updateLane: (id, updates) =>
    set(s => ({
      state: {
        ...s.state,
        lanes: s.state.lanes.map(l => l.id === id ? { ...l, ...updates } : l),
      }
    })),

  deleteLane: (id) =>
    set(s => ({
      state: {
        ...s.state,
        lanes:  s.state.lanes.filter(l => l.id !== id),
        nodes:  s.state.nodes.filter(n => n.laneId !== id),
      }
    })),

  // ── Arrows ────────────────────────────────────────────────
  addArrow: (fromId, toId, fromPort, toPort) => {
    const id = uuidv4();
    
    // Auto-label para Decision nodes
    let defaultLabel = '';
    const fromNode = get().state.nodes.find(n => n.id === fromId);
    if (fromNode?.type === 'decision') {
      const existingOutArrows = get().state.arrows.filter(a => a.fromId === fromId).length;
      if (existingOutArrows === 0) defaultLabel = 'Sí';
      else if (existingOutArrows === 1) defaultLabel = 'No';
    }

    const newArrow: DiagramArrow = {
      id,
      fromId,
      toId,
      fromPort,
      toPort,
      label: defaultLabel,
      waypoints: [],
    };
    set(s => ({ state: { ...s.state, arrows: [...s.state.arrows, newArrow] } }));
    return id;
  },

  updateArrow: (id, updates) =>
    set(s => ({
      state: {
        ...s.state,
        arrows: s.state.arrows.map(a => a.id === id ? { ...a, ...updates } : a),
      }
    })),

  updateWaypoints: (arrowId, waypoints) =>
    set(s => ({
      state: {
        ...s.state,
        arrows: s.state.arrows.map(a =>
          a.id === arrowId ? { ...a, waypoints } : a
        ),
      }
    })),

  deleteArrow: (id) =>
    set(s => ({
      state: { ...s.state, arrows: s.state.arrows.filter(a => a.id !== id) },
      selectedIds: s.selectedIds.filter(sid => sid !== id),
    })),

  // ── Selection ─────────────────────────────────────────────
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setActiveConfigNodeId: (id) => set({ activeConfigNodeId: id }),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),

  // ── Persistence ───────────────────────────────────────────
  setState: (state) => set({ state }),
  reset: () => set({ state: { ...initialState, id: uuidv4() }, selectedIds: [] }),

  // ── Auto-layout (Dagre, vertical, lane-aware) ─────────────
  autoLayout: () => {
    const { nodes, arrows, lanes } = get().state;
    const g = new dagre.graphlib.Graph();

    g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 90, marginx: 20, marginy: 20 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(n => g.setNode(n.id, { width: n.width, height: n.height }));
    arrows.forEach(a => {
      if (g.hasNode(a.fromId) && g.hasNode(a.toId)) {
        g.setEdge(a.fromId, a.toId);
      }
    });

    dagre.layout(g);

    // Lane X centers (offset 80 for toolbar)
    const TOOLBAR_W = 80;
    const laneCenters: Record<string, number> = {};
    let cx = TOOLBAR_W;
    [...lanes].sort((a, b) => a.order - b.order).forEach(lane => {
      laneCenters[lane.id] = cx + lane.width / 2;
      cx += lane.width;
    });

    const newNodes = nodes.map(n => {
      const gn = g.node(n.id);
      const laneCenter = n.laneId && laneCenters[n.laneId];
      return {
        ...n,
        x: laneCenter ? laneCenter - n.width / 2 : gn.x - n.width / 2 + TOOLBAR_W,
        y: gn.y - n.height / 2 + 60, // 60px header offset
        zIndex: n.zIndex,
      };
    });

    const newArrows = arrows.map(a => ({ ...a, waypoints: [] }));

    set(s => ({ state: { ...s.state, nodes: newNodes, arrows: newArrows } }));
  },
}));
