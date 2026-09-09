import { z } from "zod";

export const ArchitectureConnectionFailurePolicySchema = z.object({
  retry: z.boolean().optional(),
  maxRetries: z.number().nonnegative().optional(),
  timeoutMs: z.number().nonnegative().optional(),
  fallback: z.string().optional(),
});

export const ArchitectureConnectionSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  protocol: z.string().optional(),
  type: z.enum(["sync", "async", "data"]),
  requestRate: z.number().nonnegative().optional(),
  payloadSizeKB: z.number().nonnegative().optional(),
  latencyMs: z.number().nonnegative().optional(),
  failurePolicy: ArchitectureConnectionFailurePolicySchema.optional(),
});

export type ArchitectureConnectionFailurePolicy = z.infer<typeof ArchitectureConnectionFailurePolicySchema>;
export type ArchitectureConnection = z.infer<typeof ArchitectureConnectionSchema>;
