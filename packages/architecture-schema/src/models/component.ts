import { z } from "zod";

export const ArchitectureComponentTypeSchema = z.enum([
  "client",
  "gateway",
  "load_balancer",
  "service",
  "database",
  "cache",
  "queue",
  "object_storage",
  "search",
  "worker",
  "cdn",
  "auth",
  "external_service",
]);

export const ArchitectureComponentCapacitySchema = z.object({
  requestsPerSecond: z.number().nonnegative().optional(),
  concurrentConnections: z.number().nonnegative().optional(),
  storageGB: z.number().nonnegative().optional(),
});

export const ArchitectureComponentScalingSchema = z
  .object({
    strategy: z.enum(["none", "horizontal", "vertical"]),
    minInstances: z.number().nonnegative().optional(),
    maxInstances: z.number().nonnegative().optional(),
  })
  .refine(
    (data) => {
      if (data.minInstances !== undefined && data.maxInstances !== undefined) {
        return data.minInstances <= data.maxInstances;
      }
      return true;
    },
    {
      message: "minInstances must be less than or equal to maxInstances",
      path: ["maxInstances"],
    }
  );

export const ArchitectureComponentReliabilitySchema = z.object({
  replicas: z.number().nonnegative().optional(),
  availabilityTarget: z.number().min(0).max(100).optional(),
});

export const ArchitectureComponentPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const ArchitectureComponentSchema = z.object({
  id: z.string().min(1),
  type: ArchitectureComponentTypeSchema,
  name: z.string().min(1),
  technology: z.string().optional(),
  properties: z.record(z.string(), z.unknown()),
  capacity: ArchitectureComponentCapacitySchema.optional(),
  scaling: ArchitectureComponentScalingSchema.optional(),
  reliability: ArchitectureComponentReliabilitySchema.optional(),
  position: ArchitectureComponentPositionSchema,
});

export type ArchitectureComponentType = z.infer<typeof ArchitectureComponentTypeSchema>;
export type ArchitectureComponentCapacity = z.infer<typeof ArchitectureComponentCapacitySchema>;
export type ArchitectureComponentScaling = z.infer<typeof ArchitectureComponentScalingSchema>;
export type ArchitectureComponentReliability = z.infer<typeof ArchitectureComponentReliabilitySchema>;
export type ArchitectureComponentPosition = z.infer<typeof ArchitectureComponentPositionSchema>;
export type ArchitectureComponent = z.infer<typeof ArchitectureComponentSchema>;
