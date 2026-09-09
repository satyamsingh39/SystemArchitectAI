// src/components/architecture/ComponentInspector.tsx
import React, { useEffect, useState } from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import type { ArchitectureComponent, ArchitectureComponentType } from '@systemarchitect/architecture-schema';

// Component types list – same as in ComponentCreationDialog
const COMPONENT_TYPES: ArchitectureComponentType[] = [
  'client',
  'gateway',
  'load_balancer',
  'service',
  'database',
  'cache',
  'queue',
  'object_storage',
  'search',
  'worker',
  'cdn',
  'auth',
  'external_service',
];

export const ComponentInspector: React.FC = () => {
  const { selectedComponentId, graph, updateComponent, selectComponent } = useArchitectureStore();

  const component = selectedComponentId
    ? graph.components.find((c) => c.id === selectedComponentId)
    : undefined;

  const [name, setName] = useState('');
  const [type, setType] = useState<ArchitectureComponentType>('service');
  const [technology, setTechnology] = useState('');

  // Initialize fields when component changes
  useEffect(() => {
    if (component) {
      setName(component.name ?? '');
      setType(component.type as ArchitectureComponentType);
      setTechnology(component.technology ?? '');
    }
  }, [component]);

  if (!component) {
    return (
      <div style={{ padding: '8px' }}>
        <em>Select a component to inspect.</em>
      </div>
    );
  }

  const handleSave = () => {
    const updates: Partial<ArchitectureComponent> = { name, type };
    if (technology) {
      updates.technology = technology;
    } else {
      updates.technology = undefined;
    }
    updateComponent(component.id, updates);
    // keep selection
    selectComponent(component.id);
  };

  const handleDeselect = () => {
    selectComponent(undefined);
  };

  return (
    <div
      style={{
        width: '250px',
        padding: '12px',
        borderLeft: '1px solid #ddd',
        backgroundColor: '#fafafa',
        overflowY: 'auto',
      }}
    >
      <h3>Component Inspector</h3>
      <div style={{ marginBottom: '8px' }}>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <label>Type:</label>
        <select value={type} onChange={(e) => setType(e.target.value as ArchitectureComponentType)} style={{ width: '100%' }}>
          {COMPONENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <label>Technology (optional):</label>
        <input
          type="text"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleSave}>Save</button>
        <button onClick={handleDeselect}>Close</button>
      </div>
    </div>
  );
};
