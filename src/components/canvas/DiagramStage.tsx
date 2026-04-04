import React, { useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { useDiagramStore } from '../../store/diagramStore';
import { SwimLane } from './SwimLane';
import { ActivityNode } from './ActivityNode';
import { DecisionNode } from './DecisionNode';
import { StartEndNode } from './StartEndNode';
import { ForkJoinNode } from './ForkJoinNode';
import { Arrow } from './Arrow';
import { useSocket } from '../../hooks/useSocket';
import { useExecutionStore } from '../../store/executionStore';

export const DiagramStage: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { state, selectedIds, setSelectedIds, setActiveConfigNodeId, updateNode, addArrow, bringToFront } = useDiagramStore();
  const executionStore = useExecutionStore();
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });

  React.useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard Delete Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en el panel de propiedades u otros inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const store = useDiagramStore.getState();
        store.selectedIds.forEach(id => {
          if (store.state.nodes.some(n => n.id === id)) store.deleteNode(id);
          if (store.state.arrows.some(a => a.id === id)) store.deleteArrow(id);
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // (no transformer ref needed anymore)
  
  // Connection state
  const [connectingFrom, setConnectingFrom] = React.useState<{ nodeId: string, port: any } | null>(null);
  
  // Real-time sync
  const { broadcastUpdate, broadcastMove } = useSocket(roomId);

  // Selection state updates are handled by the store now.

  const handleStageMouseDown = (e: any) => {
    // Selection cancellation on empty canvas
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
      setActiveConfigNodeId(null);
      setConnectingFrom(null);
      return;
    }
  };

  const handleNodeClick = (id: string) => {
    // We handle connection in onConnectEnd now, so this just selects and brings to front
    setSelectedIds([id]);
    bringToFront(id);
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();

    // Sync CSS Grid
    const grid = document.getElementById('grid-container');
    if (grid) {
      grid.style.backgroundPosition = `${newPos.x}px ${newPos.y}px`;
      grid.style.backgroundSize = `${100 * newScale}px ${100 * newScale}px, ${100 * newScale}px ${100 * newScale}px, ${20 * newScale}px ${20 * newScale}px, ${20 * newScale}px ${20 * newScale}px`;
    }
  };

  const handleStageDrag = (e: any) => {
    if (e.target === e.target.getStage()) {
      const grid = document.getElementById('grid-container');
      if (grid) {
        grid.style.backgroundPosition = `${e.target.x()}px ${e.target.y()}px`;
      }
    }
  };

  const handleNodeDragMove = (id: string, e: any) => {
    const x = e.target.x();
    const y = e.target.y();
    
    // Update local state for immediate feedback
    updateNode(id, { x, y });
    
    // Broadcast move to others (Socket.io will handle the rest)
    broadcastMove(id, x, y);
  };

  const handleNodeDragEnd = (id: string, e: any) => {
    const x = e.target.x();
    const y = e.target.y();
    
    // Determine which lane it was dropped in
    const lanes = useDiagramStore.getState().state.lanes;
    let currentX = 80; // Margin offset
    let assignedLaneId = lanes[0]?.id;
    for (const lane of [...lanes].sort((a, b) => a.order - b.order)) {
      if (x + 60 >= currentX && x + 60 < currentX + lane.width) {
         assignedLaneId = lane.id;
         break;
      }
      currentX += lane.width;
    }

    updateNode(id, {
      x,
      y,
      laneId: assignedLaneId,
    });
    broadcastUpdate(useDiagramStore.getState().state);
  };

  // Deprecated transform end logic since we removed generic Transformer
  // (We'll use custom handles if resize is needed later)

  return (
    <div className="canvas-container-inner" ref={containerRef}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable
        onDragMove={handleStageDrag}
        onMouseDown={handleStageMouseDown}
        onWheel={handleWheel}
        ref={stageRef}
      >
        {/* Layer 1: Swimlanes (Static/Background-ish) */}
        <Layer>
          {state.lanes.sort((a, b) => a.order - b.order).map((lane, i, arr) => {
            const x = 80 + arr.slice(0, i).reduce((sum, l) => sum + l.width, 0);
            return (
              <SwimLane
                key={lane.id}
                lane={lane}
                x={x}
                height={window.innerHeight}
              />
            );
          })}
        </Layer>

        {/* Layer 2: Connections (Arrows) */}
        <Layer>
          {state.arrows.map(arrow => {
            const fromNode = state.nodes.find(n => n.id === arrow.fromId);
            const toNode = state.nodes.find(n => n.id === arrow.toId);
            return (
              <Arrow
                key={arrow.id}
                arrow={arrow}
                fromNode={fromNode}
                toNode={toNode}
                isSelected={selectedIds.includes(arrow.id)}
                onSelect={() => setSelectedIds([arrow.id])}
              />
            );
          })}
        </Layer>

        {/* Layer 3: Nodes & UI */}
        <Layer>
          {[...state.nodes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(node => {
            
            // Lógica de Ejecución (Shadow Node)
            const activeToken = executionStore.tokens.find(t => t.currentNodeId === node.id);
            const isExecutionActive = !!activeToken;
            const executionStatus = activeToken?.status;

            const handleNodeDoubleClick = (e: any) => {
              if (executionStore.mode === 'play') {
                if (isExecutionActive) {
                   // Reservado. Delegado a DynamicFormPanel que observa el store.
                }
              } else if (executionStore.mode === 'edit') {
                // Modo Edición: Abrir configurador de lógica
                setActiveConfigNodeId(node.id);
              }
            };

            const commonProps = {
              node,
              isSelected: selectedIds.includes(node.id),
              isConnecting: connectingFrom !== null,
              activePort: connectingFrom?.nodeId === node.id ? connectingFrom.port : null,
              isExecutionActive,
              executionStatus,
              onSelect: () => handleNodeClick(node.id),
              onDblClick: handleNodeDoubleClick,
              onConnectStart: (port: any) => setConnectingFrom({ nodeId: node.id, port }),
              onConnectEnd: (port: any) => {
                if (connectingFrom && connectingFrom.nodeId !== node.id) {
                  addArrow(connectingFrom.nodeId, node.id, connectingFrom.port, port);
                  broadcastUpdate(useDiagramStore.getState().state);
                }
                setConnectingFrom(null);
              },
              onDragMove: (e: any) => handleNodeDragMove(node.id, e),
              onDragEnd: (e: any) => handleNodeDragEnd(node.id, e),
            };

            switch (node.type) {
              case 'activity':
                return <ActivityNode key={node.id} {...commonProps} />;
              case 'decision':
                return <DecisionNode key={node.id} {...commonProps} />;
              case 'start':
              case 'end':
                return (
                  <StartEndNode 
                    key={node.id} 
                    node={node}
                    isSelected={selectedIds.includes(node.id)}
                    isConnecting={connectingFrom !== null}
                    activePort={connectingFrom?.nodeId === node.id ? connectingFrom.port : null}
                    onSelect={() => handleNodeClick(node.id)}
                    onConnectStart={(port: any) => setConnectingFrom({ nodeId: node.id, port })}
                    onConnectEnd={(port: any) => {
                      if (connectingFrom && connectingFrom.nodeId !== node.id) {
                        addArrow(connectingFrom.nodeId, node.id, connectingFrom.port, port);
                        broadcastUpdate(useDiagramStore.getState().state);
                      }
                      setConnectingFrom(null);
                    }}
                    onDragMove={(e: any) => handleNodeDragMove(node.id, e)}
                    onDragEnd={(e: any) => handleNodeDragEnd(node.id, e)}
                  />
                );
              case 'fork':
              case 'join':
                return <ForkJoinNode key={node.id} {...commonProps} />;
              default:
                return null;
            }
          })}
          
        </Layer>
      </Stage>
    </div>
  );
};
