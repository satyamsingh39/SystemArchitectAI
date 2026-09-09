// src/store/architectureStore.ts
import { create } from 'zustand';
import { architectureEngine } from '../integrations/architecture-engine';
import type {
  ArchitectureComponent,
  ArchitectureConnection,
  ArchitectureGraph,
  SystemRequirements,
  FunctionalRequirement,
  ArchitectureVersion,
} from '@systemarchitect/architecture-schema';

export interface ArchitectureStore {
  // Core graph state
  graph: ArchitectureGraph;
  selectedComponentId?: string;
  selectedConnectionId?: string;
  error?: string;

  // Persistence metadata
  currentProjectId: string | null;
  currentVersionId: string | null;
  projectList: { projectId: string; name: string }[];
  versionList: { versionId: string; version: string; message?: string; created_at: string }[];
  persistenceError?: string;
  loading: boolean;

  // UI actions
  selectComponent: (id?: string) => void;
  selectConnection: (id?: string) => void;
  clearError: () => void;

  // Architecture actions (existing)
  addComponent: (component: ArchitectureComponent) => void;
  updateComponent: (componentId: string, updates: Partial<ArchitectureComponent>) => void;
  removeComponent: (componentId: string) => void;

  addConnection: (connection: ArchitectureConnection) => void;
  updateConnection: (connectionId: string, updates: Partial<ArchitectureConnection>) => void;
  removeConnection: (connectionId: string) => void;

  updateRequirements: (requirements: SystemRequirements) => void;
  addFunctionalRequirement: (requirement: FunctionalRequirement) => void;
  removeFunctionalRequirement: (id: string) => void;
  addConstraint: (constraint: string) => void;
  removeConstraint: (index: number) => void;

  // Persistence actions
  createProject: (name: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  loadVersion: (versionId: string) => Promise<void>;
  saveCurrentVersion: (message?: string) => Promise<void>;
  restoreVersion: (versionId: string, message?: string) => Promise<void>;
  refreshVersionHistory: (projectId: string) => Promise<void>;
}

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
  graph: architectureEngine.getGraph(),
  selectedComponentId: undefined,
  selectedConnectionId: undefined,
  error: undefined,

  // Persistence defaults
  currentProjectId: null,
  currentVersionId: null,
  projectList: [],
  versionList: [],
  persistenceError: undefined,
  loading: false,

  // UI actions
  selectComponent: (id) => set({ selectedComponentId: id, selectedConnectionId: undefined, error: undefined }),
  selectConnection: (id) => set({ selectedConnectionId: id, selectedComponentId: undefined, error: undefined }),
  clearError: () => set({ error: undefined, persistenceError: undefined }),

  // Architecture actions – unchanged from original
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

  updateRequirements: (requirements) => {
    const result = architectureEngine.updateRequirements(requirements);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },
  addFunctionalRequirement: (requirement) => {
    const result = architectureEngine.addFunctionalRequirement(requirement);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },
  removeFunctionalRequirement: (id) => {
    const result = architectureEngine.removeFunctionalRequirement(id);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },
  addConstraint: (constraint) => {
    const result = architectureEngine.addConstraint(constraint);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },
  removeConstraint: (index) => {
    const result = architectureEngine.removeConstraint(index);
    if (result.success) {
      set({ graph: result.data.graph, error: undefined });
    } else {
      set({ error: result.error.message });
    }
  },

  // Persistence actions implementation
  createProject: async (name) => {
    set({ loading: true, persistenceError: undefined });
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const { projectId, versionId } = await res.json();
      set({ currentProjectId: projectId, currentVersionId: versionId });
      await get().loadVersion(versionId);
      await get().refreshVersionHistory(projectId);
      const projRes = await fetch('/api/projects');
      const projects = await projRes.json();
      set({ projectList: projects.map((p: any) => ({ projectId: p.id, name: p.name })) });
    } catch (e: any) {
      set({ persistenceError: e.message });
    } finally {
      set({ loading: false });
    }
  },

  loadProject: async (projectId) => {
    set({ loading: true, persistenceError: undefined });
    try {
      const projRes = await fetch(`/api/projects/${projectId}`);
      if (!projRes.ok) throw new Error('Project not found');
      const project = await projRes.json();
      const versionId = project.current_version_id;
      set({ currentProjectId: projectId, currentVersionId: versionId });
      await get().loadVersion(versionId);
      await get().refreshVersionHistory(projectId);
      const listRes = await fetch('/api/projects');
      const projects = await listRes.json();
      set({ projectList: projects.map((p: any) => ({ projectId: p.id, name: p.name })) });
    } catch (e: any) {
      set({ persistenceError: e.message });
    } finally {
      set({ loading: false });
    }
  },

  loadVersion: async (versionId) => {
    const { currentProjectId } = get();
    if (!currentProjectId) {
      set({ persistenceError: 'No project selected' });
      return;
    }
    set({ loading: true, persistenceError: undefined });
    try {
      const res = await fetch(`/api/projects/${currentProjectId}/versions/${versionId}`);
      if (!res.ok) throw new Error('Version not found');
      const { graph } = await res.json();
      // Reinitialize the ArchitectureEngine with the persisted graph (validated server‑side)
      reinitializeEngine(graph);
      set({ graph: architectureEngine.getGraph(), currentVersionId: versionId });
    } catch (e: any) {
      set({ persistenceError: e.message });
    } finally {
      set({ loading: false });
    }
  },

  saveCurrentVersion: async (message) => {
    const { currentProjectId, currentVersionId, graph } = get();
    if (!currentProjectId || !currentVersionId) {
      set({ persistenceError: 'No project loaded' });
      return;
    }
    set({ loading: true, persistenceError: undefined });
    try {
      const res = await fetch(`/api/projects/${currentProjectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph, message, expectedCurrentVersionId: currentVersionId }),
      });
      if (res.status === 409) {
        const err = await res.json();
        throw new Error(err.error || 'Version conflict');
      }
      if (!res.ok) throw new Error('Failed to save version');
      const { versionId, newVersion } = await res.json();
      set({ currentVersionId: versionId });
      await get().refreshVersionHistory(get().currentProjectId!);
    } catch (e: any) {
      set({ persistenceError: e.message });
    } finally {
      set({ loading: false });
    }
  },

  restoreVersion: async (versionId, message) => {
    const { currentProjectId, currentVersionId } = get();
    if (!currentProjectId || !currentVersionId) {
      set({ persistenceError: 'No project loaded' });
      return;
    }
    set({ loading: true, persistenceError: undefined });
    try {
      const res = await fetch(`/api/projects/${currentProjectId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, expectedCurrentVersionId: currentVersionId }),
      });
      if (res.status === 409) {
        const err = await res.json();
        throw new Error(err.error || 'Version conflict');
      }
      if (!res.ok) throw new Error('Failed to restore version');
      const { versionId: newId } = await res.json();
      await get().loadVersion(newId);
    } catch (e: any) {
      set({ persistenceError: e.message });
    } finally {
      set({ loading: false });
    }
  },

  refreshVersionHistory: async (projectId) => {
    set({ loading: true, persistenceError: undefined });
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      if (!res.ok) throw new Error('Failed to list versions');
      const versions = await res.json();
      set({ versionList: versions.map((v: any) => ({ versionId: v.id, version: v.version, message: v.message, created_at: v.created_at })) });
    } catch (e: any) {
      set({ persistenceError: e.message });
    } finally {
      set({ loading: false });
    }
  },
}));
