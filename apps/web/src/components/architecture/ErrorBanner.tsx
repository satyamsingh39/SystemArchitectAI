// src/components/architecture/ErrorBanner.tsx
import React from 'react';
import { useArchitectureStore } from '../../store/architectureStore';

export const ErrorBanner: React.FC = () => {
  const { error, clearError } = useArchitectureStore();

  if (!error) return null;

  return (
    <div style={{
      backgroundColor: '#ffebee',
      color: '#b71c1c',
      padding: '8px 16px',
      borderBottom: '1px solid #f44336',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span>{error}</span>
      <button
        onClick={clearError}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#b71c1c',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
};
