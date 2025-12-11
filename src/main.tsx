// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import App from './App.tsx'

// Monaco Editor Workers
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import yamlWorker from 'monaco-yaml/yaml.worker?worker';

// @ts-expect-error - Monaco global
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'yaml') {
      return new yamlWorker();
    }
    return new editorWorker();
  },
};

// Material Design 3 Theme Configuration - Blue Theme
const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#1A73E8',      // Google Blue
          light: '#D2E3FC',     // Light Blue
          dark: '#174EA6',      // Dark Blue
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#5F6368',      // Google Grey
          light: '#E8EAED',
          dark: '#3C4043',
          contrastText: '#FFFFFF',
        },
        error: {
          main: '#D93025',      // Google Red
          light: '#FCDAD7',
          dark: '#A50E0E',
          contrastText: '#FFFFFF',
        },
        warning: {
          main: '#F29900',      // Google Orange
          light: '#FEF3CD',
          dark: '#B06000',
        },
        success: {
          main: '#1E8E3E',      // Google Green
          light: '#CEEAD6',
          dark: '#0D652D',
        },
        background: {
          default: '#F8F9FA',   // Light Grey
          paper: '#FFFFFF',
        },
        text: {
          primary: '#202124',   // Google Dark Grey
          secondary: '#5F6368',
          disabled: '#9AA0A6',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#8AB4F8',      // Light Blue (dark mode)
          light: '#AECBFA',
          dark: '#669DF6',
          contrastText: '#062E6F',
        },
        secondary: {
          main: '#9AA0A6',      // Grey
          light: '#BDC1C6',
          dark: '#5F6368',
          contrastText: '#202124',
        },
        error: {
          main: '#F28B82',      // Light Red
          light: '#FCDAD7',
          dark: '#C5221F',
          contrastText: '#3C0704',
        },
        warning: {
          main: '#FDD663',      // Light Orange
          light: '#FEF3CD',
          dark: '#E37400',
        },
        success: {
          main: '#81C995',      // Light Green
          light: '#CEEAD6',
          dark: '#137333',
        },
        background: {
          default: '#1F1F1F',   // Dark Grey
          paper: '#1F1F1F',
        },
        text: {
          primary: '#E8EAED',   // Light Grey
          secondary: '#9AA0A6',
          disabled: '#5F6368',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '32px', fontWeight: 400, lineHeight: '40px' },
    h2: { fontSize: '28px', fontWeight: 400, lineHeight: '36px' },
    h3: { fontSize: '24px', fontWeight: 400, lineHeight: '32px' },
    h4: { fontSize: '22px', fontWeight: 500, lineHeight: '28px' },
    h5: { fontSize: '16px', fontWeight: 500, lineHeight: '24px', letterSpacing: '0.15px' },
    h6: { fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0.1px' },
    body1: { fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0.5px' },
    body2: { fontSize: '14px', fontWeight: 400, lineHeight: '20px', letterSpacing: '0.25px' },
    button: { fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0.1px', textTransform: 'none' },
    caption: { fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '0.4px' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
