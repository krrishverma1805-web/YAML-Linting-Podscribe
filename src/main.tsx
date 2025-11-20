// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';           // ✅ KEEP - your main CSS
import App from './App.tsx';     // ✅ KEEP - your App component

// Configure Monaco workers BEFORE importing monaco-editor
(self as any).MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'yaml') {
      return new Worker(new URL('./yaml.worker.ts', import.meta.url), {
        type: 'module',
      });
    }
    return new Worker(new URL('./editor.worker.ts', import.meta.url), {
      type: 'module',
    });
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
