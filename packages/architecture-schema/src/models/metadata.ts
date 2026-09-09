import { z } from "zod";

export const ArchitectureMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ArchitectureMetadata = z.infer<typeof ArchitectureMetadataSchema>;
