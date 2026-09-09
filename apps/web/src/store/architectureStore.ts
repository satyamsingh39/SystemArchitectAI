// src/store/architectureStore.ts
import { create } from 'zustand';
import { architectureEngine } from '../integrations/architecture-engine';
import type { ArchitectureComponent, ArchitectureConnection, ArchitectureGraph } from '@systemarchitect/architecture-schema';

export interface ArchitectureStore {
  graph: ArchitectureGraph;
  selectedComponentId?: string;
  selectedConnectionId?: string;
  error?: string;

  selectComponent: (id?: string) => void;
  selectConnection: (id?: string) => void;
  clearError: () => void;

  addComponent: (component: ArchitectureComponent) => void;
  updateComponent: (componentId: string, updates: Partial<ArchitectureComponent>) => void;
  removeComponent: (componentId: string) => void;

  addConnection: (connection: ArchitectureConnection) => void;
  updateConnection: (connectionId: string, updates: Partial<ArchitectureConnection>) => void;
  removeConnection: (connectionId: string) => void;
}

export const useArchitectureStore = create<ArchitectureStore>((set) => ({
  graph: architectureEngine.getGraph(),
  selectedComponentId: undefined,
  selectedConnectionId: undefined,
  error: undefined,

  selectComponent: (id) => set({ selectedComponentId: id, selectedConnectionId: undefined, error: undefined }),
  selectConnection: (id) => set({ selectedConnectionId: id, selectedComponentId: undefined, error: undefined }),
  clearError: () => set({ error: undefined }),

  addComponent: (component) => {
    const result = architectureEngine.addComponent(component);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },

  updateComponent: (componentId, updates) => {
    const result = architectureEngine.updateComponent(componentId, updates);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },

  removeComponent: (componentId) => {
    const result = architectureEngine.removeComponent(componentId);
    if (result.success) {
      set({ graph: result.data.graph, selectedComponentId: undefined, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },

  addConnection: (connection) => {
    const result = architectureEngine.addConnection(connection);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },

  updateConnection: (connectionId, updates) => {
    const result = architectureEngine.updateConnection(connectionId, updates);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },

  removeConnection: (connectionId) => {
    const result = architectureEngine.removeConnection(connectionId);
    if (result.success) {
      set({ graph: result.data.graph, selectedConnectionId: undefined, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },
}));
