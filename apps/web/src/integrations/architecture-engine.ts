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

export const architectureEngine = new ArchitectureEngine(initialGraph);
