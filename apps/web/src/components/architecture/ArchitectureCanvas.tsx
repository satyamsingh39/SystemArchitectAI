// src/components/architecture/ArchitectureCanvas.tsx
import React, { useCallback } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Edge,
  EdgeChange,
  OnConnect,
  Node,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useArchitectureStore } from '../../store/architectureStore';
import { graphToFlow, componentToNode } from '../../adapters/reactFlowAdapter';
import { ArchitectureConnection, ArchitectureComponent } from '@systemarchitect/architecture-schema';

export const ArchitectureCanvas: React.FC = () => {
  const {
    graph,
    selectedComponentId,
    selectedConnectionId,
    selectComponent,
    selectConnection,
    addConnection,
    updateComponent,
    removeComponent,
    removeConnection,
  } = useArchitectureStore();

  const { nodes, edges } = graphToFlow(graph);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Only handle position changes (drag stop). React Flow provides type "position".
      changes.forEach((change) => {
        if (change.type === 'position' && change.id) {
          const node = nodes.find((n) => n.id === change.id);
          if (node && change.position) {
            const { x, y } = change.position;
            // Update component position via store
            updateComponent(change.id, {
              position: { x, y },
            } as Partial<ArchitectureComponent>);
          }
        }
      });
    },
    [nodes, updateComponent]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Handle delete edge actions
      changes.forEach((change) => {
        if (change.type === 'remove' && change.id) {
          removeConnection(change.id);
        }
      });
    },
    [removeConnection]
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
      // Construct a valid ArchitectureConnection using schema fields
      const newConn: ArchitectureConnection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        source: params.source,
        target: params.target,
        type: 'default', // adapt if needed; schema expects a type string
        // other optional fields can be omitted
      };
      addConnection(newConn);
    },
    [addConnection]
  );

  const onSelectionChange = useCallback(
    (selection: { nodes: Node[]; edges: Edge[] }) => {
      // React Flow returns selected nodes/edges arrays
      if (selection && 'nodes' in selection && 'edges' in selection) {
        const selNodes = selection.nodes;
        const selEdges = selection.edges;
        if (selNodes.length === 1 && selEdges.length === 0) {
          selectComponent(selNodes[0].id);
        } else if (selEdges.length === 1 && selNodes.length === 0) {
          selectConnection(selEdges[0].id);
        } else if (selNodes.length === 0 && selEdges.length === 0) {
          // clear selection
          selectComponent(undefined);
          selectConnection(undefined);
        }
      }
    },
    [selectComponent, selectConnection]
  );

  // Deleting nodes via UI (e.g., pressing Delete) triggers onNodesChange with type 'remove'
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      deleted.forEach((n) => {
        removeComponent(n.id);
      });
    },
    [removeComponent]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodesDelete={onNodesDelete}
        fitView
        selectNodesOnDrag={false}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
