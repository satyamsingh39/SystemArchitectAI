import type { ArchitectureGenerator, ArchitectureGeneratorConfig } from './types';
import { OpenAIArchitectureGenerator } from './provider/openai';

export function createArchitectureGenerator(config: ArchitectureGeneratorConfig): ArchitectureGenerator {
  if (config.provider === 'openai') {
    return new OpenAIArchitectureGenerator(config.apiKey, config.model);
  }
  
  throw new Error(`Unsupported provider: ${config.provider}`);
}
