// src/components/architecture/ComponentCreationDialog.tsx
import React, { useState } from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import type { ArchitectureComponent, ArchitectureComponentType } from '@systemarchitect/architecture-schema';

// List of component types based on ArchitectureComponentTypeSchema
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

interface Props {
  onClose: () => void;
}

export const ComponentCreationDialog: React.FC<Props> = ({ onClose }) => {
  const { graph, addComponent } = useArchitectureStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<ArchitectureComponentType>('service');
  const [technology, setTechnology] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const index = graph.components.length;
    const x = 100 + (index % 4) * 300;
    const y = 100 + Math.floor(index / 4) * 200;
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const componentData: Partial<ArchitectureComponent> = {
      id,
      name: name || `Component ${index + 1}`,
      type,
      position: { x, y },
      properties: {},
    };
    if (technology) {
      componentData.technology = technology;
    }
    const newComponent = componentData as ArchitectureComponent;
    addComponent(newComponent);
    onClose();
  };

  // Simple modal styling – absolute overlay
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '300px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Create Component</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value as ArchitectureComponentType)} style={{ width: '100%' }}>
            {COMPONENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Technology (optional):</label>
          <input
            type="text"
            value={technology}
            onChange={(e) => setTechnology(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ marginRight: '8px' }}>
            Cancel
          </button>
          <button type="submit">Create</button>
        </div>
      </form>
    </div>
  );
};
