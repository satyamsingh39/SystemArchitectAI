import { z } from 'zod';
import {
  ArchitectureComponentSchema,
  ArchitectureConnectionSchema,
  ArchitectureConstraintSchema,
  TrafficFlowSchema,
  ArchitectureDecisionSchema,
} from '@systemarchitect/architecture-schema';

export const ArchitectureProposalSchema = z.object({
  components: z.array(ArchitectureComponentSchema),
  connections: z.array(ArchitectureConnectionSchema),
  constraints: z.array(ArchitectureConstraintSchema),
  trafficFlows: z.array(TrafficFlowSchema),
  decisions: z.array(ArchitectureDecisionSchema),
  explanation: z.string(),
});

export type ArchitectureProposal = z.infer<typeof ArchitectureProposalSchema>;
