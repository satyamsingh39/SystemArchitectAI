import type { SystemRequirements } from '@systemarchitect/architecture-schema';
import type { ArchitectureProposal } from './schemas/proposal';

export interface ArchitectureGenerator {
  generate(requirements: SystemRequirements): Promise<ArchitectureProposal>;
}

export interface ArchitectureGeneratorConfig {
  provider: 'openai';
  model?: string;
  apiKey?: string;
}
