import { z } from "zod";

export const FunctionalRequirementPrioritySchema = z.enum(["must", "should", "could"]);

export const FunctionalRequirementSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  priority: FunctionalRequirementPrioritySchema,
});

export const SystemRequirementsScaleSchema = z.object({
  users: z.number().nonnegative().optional(),
  concurrentUsers: z.number().nonnegative().optional(),
  requestsPerSecond: z.number().nonnegative().optional(),
  dailyRequests: z.number().nonnegative().optional(),
});

export const SystemRequirementsPerformanceSchema = z.object({
  p50LatencyMs: z.number().nonnegative().optional(),
  p95LatencyMs: z.number().nonnegative().optional(),
  p99LatencyMs: z.number().nonnegative().optional(),
});

export const SystemRequirementsConsistencySchema = z.enum(["strong", "eventual", "mixed"]);

export const SystemRequirementsSchema = z.object({
  functional: z.array(FunctionalRequirementSchema),
  scale: SystemRequirementsScaleSchema.optional().default({}),
  performance: SystemRequirementsPerformanceSchema.optional().default({}),
  availability: z.number().min(0).max(100).optional(),
  consistency: SystemRequirementsConsistencySchema.optional(),
  constraints: z.array(z.string()).optional().default([]),
});

export type FunctionalRequirementPriority = z.infer<typeof FunctionalRequirementPrioritySchema>;
export type FunctionalRequirement = z.infer<typeof FunctionalRequirementSchema>;
export type SystemRequirementsScale = z.infer<typeof SystemRequirementsScaleSchema>;
export type SystemRequirementsPerformance = z.infer<typeof SystemRequirementsPerformanceSchema>;
export type SystemRequirementsConsistency = z.infer<typeof SystemRequirementsConsistencySchema>;
export type SystemRequirements = z.infer<typeof SystemRequirementsSchema>;
