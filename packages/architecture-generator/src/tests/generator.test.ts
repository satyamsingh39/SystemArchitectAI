import { describe, it, expect, vi } from 'vitest';
import { createArchitectureGenerator } from '../generator';

vi.mock('ai', () => ({
  jsonSchema: vi.fn().mockImplementation((s) => s),
  generateObject: vi.fn().mockResolvedValue({
    object: {
      components: [
        { id: 'c1', type: 'client', name: 'Web', position: { x: 0, y: 0 }, properties: {} },
        { id: 'c2', type: 'service', name: 'API', position: { x: 0, y: 0 }, properties: {} }
      ],
      connections: [
        { id: 'conn1', source: 'c1', target: 'c2', type: 'sync' }
      ],
      constraints: [],
      trafficFlows: [],
      decisions: [],
      explanation: 'A simple web to API setup.'
    }
  }),
  Output: {
    json: () => ({})
  }
}));

describe('ArchitectureGenerator', () => {
  it('should generate an architecture proposal', async () => {
    const generator = createArchitectureGenerator({
      provider: 'openai',
      apiKey: 'test-key'
    });

    const proposal = await generator.generate({
      functional: [{ id: 'req1', description: 'Serve web traffic' }],
      constraints: []
    });

    expect(proposal).toBeDefined();
    expect(proposal.components).toHaveLength(2);
    expect(proposal.connections).toHaveLength(1);
    expect(proposal.explanation).toBe('A simple web to API setup.');
  });

  it('should throw for unsupported provider', () => {
    expect(() => {
      createArchitectureGenerator({ provider: 'unsupported' as 'openai' });
    }).toThrow('Unsupported provider: unsupported');
  });
});
