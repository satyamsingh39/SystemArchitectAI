// src/models/graph.ts
import { z } from "zod";
import { ArchitectureComponentSchema } from "./component";
import { ArchitectureConnectionSchema } from "./connection";
import { ArchitectureConstraintSchema } from "./constraint";
import { TrafficFlowSchema } from "./trafficFlow";
import { ArchitectureDecisionSchema } from "./decision";
import { ArchitectureMetadataSchema } from "./metadata";
import { SystemRequirementsSchema } from "./requirements"; // added import

export const ArchitectureGraphSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  components: z.array(ArchitectureComponentSchema),
  connections: z.array(ArchitectureConnectionSchema),
  constraints: z.array(ArchitectureConstraintSchema),
  trafficFlows: z.array(TrafficFlowSchema),
  decisions: z.array(ArchitectureDecisionSchema),
  metadata: ArchitectureMetadataSchema,
  // optional system requirements attached to the graph
  requirements: SystemRequirementsSchema.optional(),
});

export type ArchitectureGraph = z.infer<typeof ArchitectureGraphSchema>;

