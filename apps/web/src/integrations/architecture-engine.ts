import { ArchitectureEngine } from '@systemarchitect/architecture-engine';
import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';

// Initial empty ArchitectureGraph
const initialGraph: ArchitectureGraph = {
  id: 'root',
  version: '1',
  components: [],
  connections: [],
  constraints: [],
  trafficFlows: [],
  decisions: [],
  metadata: {
    name: 'Initial Architecture',
    description: 'Default initial architecture graph',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Export a mutable engine instance
export let architectureEngine = new ArchitectureEngine(initialGraph);

/**
 * Reinitialize the ArchitectureEngine with a given graph.
 * Used when loading a persisted version.
 */
export function reinitializeEngine(graph: ArchitectureGraph): void {
  architectureEngine = new ArchitectureEngine(graph);
}
