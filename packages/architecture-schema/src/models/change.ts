import { z } from "zod";
import { ArchitectureComponentSchema } from "./component";
import { ArchitectureConnectionSchema } from "./connection";
import { ArchitectureConstraintSchema } from "./constraint";

export const AddComponentChangeSchema = z.object({
  type: z.literal("addComponent"),
  component: ArchitectureComponentSchema,
});

export const RemoveComponentChangeSchema = z.object({
  type: z.literal("removeComponent"),
  componentId: z.string().min(1),
});

export const UpdateComponentChangeSchema = z.object({
  type: z.literal("updateComponent"),
  componentId: z.string().min(1),
  updates: ArchitectureComponentSchema.partial(),
});

export const AddConnectionChangeSchema = z.object({
  type: z.literal("addConnection"),
  connection: ArchitectureConnectionSchema,
});

export const RemoveConnectionChangeSchema = z.object({
  type: z.literal("removeConnection"),
  connectionId: z.string().min(1),
});

export const UpdateConnectionChangeSchema = z.object({
  type: z.literal("updateConnection"),
  connectionId: z.string().min(1),
  updates: ArchitectureConnectionSchema.partial(),
});

export const ConstraintChangeSchema = z.object({
  type: z.literal("constraintChange"),
  constraint: ArchitectureConstraintSchema,
  action: z.enum(["add", "remove", "update"]),
});

export const ArchitectureChangeSchema = z.discriminatedUnion("type", [
  AddComponentChangeSchema,
  RemoveComponentChangeSchema,
  UpdateComponentChangeSchema,
  AddConnectionChangeSchema,
  RemoveConnectionChangeSchema,
  UpdateConnectionChangeSchema,
  ConstraintChangeSchema,
]);

export type AddComponentChange = z.infer<typeof AddComponentChangeSchema>;
export type RemoveComponentChange = z.infer<typeof RemoveComponentChangeSchema>;
export type UpdateComponentChange = z.infer<typeof UpdateComponentChangeSchema>;
export type AddConnectionChange = z.infer<typeof AddConnectionChangeSchema>;
export type RemoveConnectionChange = z.infer<typeof RemoveConnectionChangeSchema>;
export type UpdateConnectionChange = z.infer<typeof UpdateConnectionChangeSchema>;
export type ConstraintChange = z.infer<typeof ConstraintChangeSchema>;
export type ArchitectureChange = z.infer<typeof ArchitectureChangeSchema>;
