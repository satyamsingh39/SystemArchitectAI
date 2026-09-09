import { ArchitectureEngine } from '@systemarchitect/architecture-engine';
import { ArchitectureGraph } from '@systemarchitect/architecture-schema';

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
    author: '',
    created: new Date().toISOString(),
    description: '',
    version: '1.0.0',
  },
};

export const architectureEngine = new ArchitectureEngine(initialGraph);
