import { z } from "zod";

export const ArchitectureDecisionStatusSchema = z.enum([
  "proposed",
  "accepted",
  "superseded",
  "rejected",
]);

export const ArchitectureDecisionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  context: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternatives: z.array(z.string()).optional(),
  status: ArchitectureDecisionStatusSchema,
});

export type ArchitectureDecisionStatus = z.infer<typeof ArchitectureDecisionStatusSchema>;
export type ArchitectureDecision = z.infer<typeof ArchitectureDecisionSchema>;
