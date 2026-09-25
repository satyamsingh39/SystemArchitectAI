import type { ArchitectureGraph } from '@systemarchitect/architecture-schema';

export const initialGraph: ArchitectureGraph = {
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


