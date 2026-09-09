// src/adapters/reactFlowAdapter.ts
import { ArchitectureGraph, ArchitectureComponent, ArchitectureConnection } from '@systemarchitect/architecture-schema';
import type { Node, Edge } from 'reactflow';

// Convert ArchitectureComponent to a React Flow node
export function componentToNode(component: ArchitectureComponent): Node {
  return {
    id: component.id,
    type: 'default',
    data: { label: component.name, type: component.type },
    position: { x: component.position.x, y: component.position.y },
    // Store the full component for easy access if needed
    // but avoid any type casting
    // data can hold any serializable value; we keep minimal info
  };
}

// Convert ArchitectureConnection to a React Flow edge
export function connectionToEdge(connection: ArchitectureConnection): Edge {
  return {
    id: connection.id,
    source: connection.source,
    target: connection.target,
    // Optionally add label or type information
    data: { label: connection.type },
  };
}

// Convert the entire graph to nodes and edges for React Flow
export function graphToFlow(graph: ArchitectureGraph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.components.map(componentToNode);
  const edges: Edge[] = graph.connections.map(connectionToEdge);
  return { nodes, edges };
}
