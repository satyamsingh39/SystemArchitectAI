// src/components/architecture/ArchitectureCanvas.tsx
import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
} from 'reactflow';
import type {
  Edge,
  EdgeChange,
  OnConnect,
  Node,
  NodeChange,
  OnNodesChange,
  NodeDragHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useArchitectureStore } from '../../store/architectureStore';
import { graphToFlow } from '../../adapters/reactFlowAdapter';
import type { ArchitectureConnection } from '@systemarchitect/architecture-schema';
import { ComponentCreationDialog } from './ComponentCreationDialog';
import { ComponentInspector } from './ComponentInspector';
import { RequirementsPanel } from './RequirementsPanel';
import { EvaluationPanel } from './EvaluationPanel';
import { ErrorBanner } from './ErrorBanner';

export const ArchitectureCanvas: React.FC = () => {
  const {
    graph,
    selectedComponentId,
    selectComponent,
    selectConnection,
    addConnection,
    updateComponent,
    removeComponent,
    removeConnection,
  } = useArchitectureStore();

  const [showCreationDialog, setShowCreationDialog] = useState(false);
  const [showRequirementsPanel, setShowRequirementsPanel] = useState(false);
  const [showEvaluationPanel, setShowEvaluationPanel] = useState(false);

  const { nodes, edges } = graphToFlow(graph);

  const onNodesChange = useCallback<OnNodesChange>(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove' && change.id) {
          removeComponent(change.id);
        }
      });
    },
    [removeComponent]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      updateComponent(node.id, {
        position: { x: node.position.x, y: node.position.y },
      });
    },
    [updateComponent]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectComponent(node.id);
    },
    [selectComponent]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      selectConnection(edge.id);
    },
    [selectConnection]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params.source || !params.target) return;
      const sourceExists = graph.components.some((c) => c.id === params.source);
      const targetExists = graph.components.some((c) => c.id === params.target);
      if (!sourceExists || !targetExists) return;
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newConn: ArchitectureConnection = {
        id,
        source: params.source,
        target: params.target,
        type: 'sync',
      };
      addConnection(newConn);
    },
    [addConnection, graph.components]
  );

  const onSelectionChange = useCallback(
    (selection: { nodes: Node[]; edges: Edge[] }) => {
      if (selection && 'nodes' in selection && 'edges' in selection) {
        const selNodes = selection.nodes;
        const selEdges = selection.edges;
        if (selNodes.length === 1 && selEdges.length === 0) {
          selectComponent(selNodes[0].id);
        } else if (selEdges.length === 1 && selNodes.length === 0) {
          selectConnection(selEdges[0].id);
        } else if (selNodes.length === 0 && selEdges.length === 0) {
          selectComponent(undefined);
          selectConnection(undefined);
        }
      }
    },
    [selectComponent, selectConnection]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove' && change.id) {
          removeConnection(change.id);
        }
      });
    },
    [removeConnection]
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ErrorBanner />
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCreationDialog(true)}>
              Add Component
            </button>
            <button onClick={() => { setShowRequirementsPanel((prev) => !prev); setShowEvaluationPanel(false); }}>
              {showRequirementsPanel ? 'Hide Requirements' : 'System Requirements'}
            </button>
            <button onClick={() => { setShowEvaluationPanel((prev) => !prev); setShowRequirementsPanel(false); }}>
              {showEvaluationPanel ? 'Hide Evaluation' : 'Evaluate Architecture'}
            </button>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            fitView
            selectNodesOnDrag={false}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        {selectedComponentId && <ComponentInspector />}
        {showRequirementsPanel && <RequirementsPanel onClose={() => setShowRequirementsPanel(false)} />}
        {showEvaluationPanel && <EvaluationPanel onClose={() => setShowEvaluationPanel(false)} />}
      </div>
      {showCreationDialog && (
        <ComponentCreationDialog onClose={() => setShowCreationDialog(false)} />
      )}
    </div>
  );
};
