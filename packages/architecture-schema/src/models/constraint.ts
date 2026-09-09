import { z } from "zod";

export const ArchitectureConstraintSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1), // e.g., "maximum_latency", "required_technology"
  description: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).optional(),
  targetIds: z.array(z.string()).optional(), // optional target component/connection IDs this constraint applies to
});

export type ArchitectureConstraint = z.infer<typeof ArchitectureConstraintSchema>;
