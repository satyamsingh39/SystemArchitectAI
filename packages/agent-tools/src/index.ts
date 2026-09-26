import { ArchitectureEngine } from '@systemarchitect/architecture-engine';
import { ArchitectureGraph, ArchitectureComponent, ArchitectureConnection, SystemRequirements } from '@systemarchitect/architecture-schema';
import { z } from 'zod';
import { VersionService, VersionRepo } from '@systemarchitect/persistence';

// Zod schemas for tool inputs
export const GetInputSchema = z.object({});
export type GetInput = z.infer<typeof GetInputSchema>;

export const AddComponentInputSchema = z.object({
  component: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }).passthrough(),
});
export type AddComponentInput = z.infer<typeof AddComponentInputSchema>;

export const UpdateComponentInputSchema = z.object({
  componentId: z.string(),
  updates: z.object({}).passthrough(),
});
export type UpdateComponentInput = z.infer<typeof UpdateComponentInputSchema>;

export const RemoveComponentInputSchema = z.object({
  componentId: z.string(),
});
export type RemoveComponentInput = z.infer<typeof RemoveComponentInputSchema>;

export const AddConnectionInputSchema = z.object({
  connection: z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string(),
  }).passthrough(),
});
export type AddConnectionInput = z.infer<typeof AddConnectionInputSchema>;

export const UpdateConnectionInputSchema = z.object({
  connectionId: z.string(),
  updates: z.object({}).passthrough(),
});
export type UpdateConnectionInput = z.infer<typeof UpdateConnectionInputSchema>;

export const RemoveConnectionInputSchema = z.object({
  connectionId: z.string(),
});
export type RemoveConnectionInput = z.infer<typeof RemoveConnectionInputSchema>;

export const ValidateInputSchema = z.object({});
export type ValidateInput = z.infer<typeof ValidateInputSchema>;

export const GetRequirementsInputSchema = z.object({});
export type GetRequirementsInput = z.infer<typeof GetRequirementsInputSchema>;

export const UpdateRequirementsInputSchema = z.object({
  requirements: z.object({}).passthrough(),
});
export type UpdateRequirementsInput = z.infer<typeof UpdateRequirementsInputSchema>;

export const CreateDecisionInputSchema = z.object({
  decision: z.object({
    id: z.string(),
    description: z.string(),
  }).passthrough(),
});
export type CreateDecisionInput = z.infer<typeof CreateDecisionInputSchema>;

// Helper to load latest graph for a project
async function loadLatestGraph(projectId: string): Promise<ArchitectureGraph> {
  const latest = await VersionRepo.getCurrentByProject(projectId);
  if (!latest) throw new Error('No version found');
  return latest.graph;
}

export async function architectureGet(projectId: string, _input: GetInput): Promise<ArchitectureGraph> {
  return await loadLatestGraph(projectId);
}

export async function architectureAddComponent(projectId: string, input: AddComponentInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const result = engine.addComponent(input.component as ArchitectureComponent);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}

export async function architectureUpdateComponent(projectId: string, input: UpdateComponentInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const result = engine.updateComponent(input.componentId, input.updates as Partial<ArchitectureComponent>);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}

export async function architectureRemoveComponent(projectId: string, input: RemoveComponentInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const result = engine.removeComponent(input.componentId);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}

export async function architectureAddConnection(projectId: string, input: AddConnectionInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const result = engine.addConnection(input.connection as ArchitectureConnection);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}

export async function architectureUpdateConnection(projectId: string, input: UpdateConnectionInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const result = engine.updateConnection(input.connectionId, input.updates as Partial<ArchitectureConnection>);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}

export async function architectureRemoveConnection(projectId: string, input: RemoveConnectionInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const result = engine.removeConnection(input.connectionId);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}

export async function architectureValidate(projectId: string, _input: ValidateInput): Promise<boolean> {
  const graph = await loadLatestGraph(projectId);
  try {
    new ArchitectureEngine(graph);
    return true;
  } catch {
    return false;
  }
}

export async function requirementsGet(projectId: string, _input: GetRequirementsInput): Promise<SystemRequirements | undefined> {
  const graph = await loadLatestGraph(projectId);
  return graph.requirements;
}

export async function requirementsUpdate(projectId: string, input: UpdateRequirementsInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const result = engine.updateRequirements(input.requirements as SystemRequirements);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}

export async function decisionCreate(projectId: string, input: CreateDecisionInput): Promise<ArchitectureGraph> {
  const graph = await loadLatestGraph(projectId);
  const engine = new ArchitectureEngine(graph);
  const decisionComponent: ArchitectureComponent = {
    id: input.decision.id,
    name: input.decision.description,
    type: 'decision',
    ...input.decision,
  } as ArchitectureComponent;
  const result = engine.addComponent(decisionComponent);
  if (!result.success) throw result.error;
  await VersionService.createVersion(projectId, result.data.graph, null, graph.version);
  return result.data.graph;
}
