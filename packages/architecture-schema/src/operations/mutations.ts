// src/operations/mutations.ts
import { ArchitectureComponentSchema, ArchitectureConnectionSchema } from "../models";
import { ArchitectureComponent, ArchitectureConnection, ArchitectureGraph } from "../models";
import { z } from "zod";

// Helper to ensure unique IDs
const ensureUniqueId = (items: { id: string }[], id: string) => {
  if (items.some((item) => item.id === id)) {
    throw new Error(`Duplicate id ${id}`);
  }
};

export const addComponent = (graph: ArchitectureGraph, component: ArchitectureComponent): ArchitectureGraph => {
  ensureUniqueId(graph.components, component.id);
  return { ...graph, components: [...graph.components, component] };
};

export const removeComponent = (graph: ArchitectureGraph, componentId: string): ArchitectureGraph => {
  const newComponents = graph.components.filter((c) => c.id !== componentId);
  const newConnections = graph.connections.filter(
    (conn) => conn.source !== componentId && conn.target !== componentId
  );
  return { ...graph, components: newComponents, connections: newConnections };
};

export const updateComponent = (
  graph: ArchitectureGraph,
  componentId: string,
  updates: Partial<ArchitectureComponent>
): ArchitectureGraph => {
  const index = graph.components.findIndex((c) => c.id === componentId);
  if (index === -1) throw new Error(`Component ${componentId} not found`);
  const updated = { ...graph.components[index], ...updates };
  const newComponents = [...graph.components];
  newComponents[index] = updated;
  return { ...graph, components: newComponents };
};

export const addConnection = (graph: ArchitectureGraph, connection: ArchitectureConnection): ArchitectureGraph => {
  ensureUniqueId(graph.connections, connection.id);
  // verify referenced components exist
  if (!graph.components.some((c) => c.id === connection.source))
    throw new Error(`Source component ${connection.source} does not exist`);
  if (!graph.components.some((c) => c.id === connection.target))
    throw new Error(`Target component ${connection.target} does not exist`);
  return { ...graph, connections: [...graph.connections, connection] };
};

export const removeConnection = (graph: ArchitectureGraph, connectionId: string): ArchitectureGraph => {
  const newConnections = graph.connections.filter((c) => c.id !== connectionId);
  return { ...graph, connections: newConnections };
};

export const updateConnection = (
  graph: ArchitectureGraph,
  connectionId: string,
  updates: Partial<ArchitectureConnection>
): ArchitectureGraph => {
  const index = graph.connections.findIndex((c) => c.id === connectionId);
  if (index === -1) throw new Error(`Connection ${connectionId} not found`);
  const updated = { ...graph.connections[index], ...updates };
  const newConnections = [...graph.connections];
  newConnections[index] = updated;
  return { ...graph, connections: newConnections };
};
