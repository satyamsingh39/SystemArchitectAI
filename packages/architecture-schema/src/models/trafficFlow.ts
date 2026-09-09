import { z } from "zod";

export const TrafficFlowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  path: z.array(z.string()).min(2), // array of component IDs forming the path
  requestRate: z.number().nonnegative().optional(),
  payloadSizeKB: z.number().nonnegative().optional(),
});

export type TrafficFlow = z.infer<typeof TrafficFlowSchema>;
