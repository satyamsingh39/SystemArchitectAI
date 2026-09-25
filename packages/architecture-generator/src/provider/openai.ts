import { generateObject, jsonSchema } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import type { SystemRequirements } from '@systemarchitect/architecture-schema';
import type { ArchitectureGenerator } from '../types';
import { ArchitectureProposalSchema, type ArchitectureProposal } from '../schemas/proposal';

const AIScalingSchema = z.object({
  strategy: z.enum(["none", "horizontal", "vertical"]),
  minInstances: z.number().nonnegative().optional(),
  maxInstances: z.number().nonnegative().optional(),
});

const AIComponentSchema = z.object({
  id: z.string(),
  type: z.enum([
    "client", "gateway", "load_balancer", "service", "database",
    "cache", "queue", "object_storage", "search", "worker", "cdn",
    "auth", "external_service"
  ]),
  name: z.string(),
  technology: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).default({}),
  capacity: z.object({
    requestsPerSecond: z.number().nonnegative().optional(),
    concurrentConnections: z.number().nonnegative().optional(),
    storageGB: z.number().nonnegative().optional(),
  }).optional(),
  scaling: AIScalingSchema.optional(),
  reliability: z.object({
    replicas: z.number().nonnegative().optional(),
    availabilityTarget: z.number().min(0).max(100).optional(),
  }).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const AIConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  protocol: z.string().optional(),
  type: z.enum(["sync", "async", "data"]),
  requestRate: z.number().nonnegative().optional(),
  payloadSizeKB: z.number().nonnegative().optional(),
  latencyMs: z.number().nonnegative().optional(),
  failurePolicy: z.object({
    retry: z.boolean().optional(),
    maxRetries: z.number().nonnegative().optional(),
    timeoutMs: z.number().nonnegative().optional(),
    fallback: z.string().optional(),
  }).optional(),
});

const AIConstraintSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  targetIds: z.array(z.string()).optional(),
});

const AITrafficFlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: z.string(),
  destination: z.string(),
  path: z.array(z.string()),
  requestRate: z.number().nonnegative().optional(),
  payloadSizeKB: z.number().nonnegative().optional(),
});

const AIDecisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  context: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternatives: z.array(z.string()).optional(),
  status: z.enum(["proposed", "accepted", "superseded", "rejected"]),
});

const SimpleProposalSchema = z.object({
  components: z.array(z.unknown()),
  connections: z.array(z.unknown()),
  constraints: z.array(z.unknown()),
  trafficFlows: z.array(z.unknown()),
  decisions: z.array(z.unknown()),
  explanation: z.string(),
});
const SimpleProposalJsonSchema = {
  type: "object",
  properties: {
    components: { type: "array" },
    connections: { type: "array" },
    constraints: { type: "array" },
    trafficFlows: { type: "array" },
    decisions: { type: "array" },
    explanation: { type: "string" },
  },
  required: ["components", "connections", "constraints", "trafficFlows", "decisions", "explanation"],
  additionalProperties: false,
} as const;




export class OpenAIArchitectureGenerator implements ArchitectureGenerator {
  private openai: ReturnType<typeof createOpenAI>;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gpt-4o') {
    this.openai = createOpenAI({
      apiKey: apiKey || process.env.AI_API_KEY || '',
    });
    this.modelName = modelName;
  }

  async generate(requirements: SystemRequirements): Promise<ArchitectureProposal> {
    const prompt = `
You are an expert system architect. Generate a system architecture proposal based on the following requirements:
${JSON.stringify(requirements, null, 2)}

Provide a detailed architecture with components, connections, traffic flows, constraints, decisions, and an explanation.
Ensure all components have unique IDs, and connections reference valid component IDs.
`;

type SimpleProposal = {
  components: unknown[];
  connections: unknown[];
  constraints: unknown[];
  trafficFlows: unknown[];
  decisions: unknown[];
  explanation: string;
};

    const { object } = await generateObject({
      model: this.openai(this.modelName),
      schema: jsonSchema(SimpleProposalJsonSchema),
      prompt,
    });
    
    // Validate against canonical schema
    const parsed = ArchitectureProposalSchema.parse(object);
    return parsed;
  }
}



