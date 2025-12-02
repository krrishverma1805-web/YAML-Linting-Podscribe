import { useState, useEffect, useCallback, useMemo } from 'react';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Layout } from './components/Layout';
import { CodeEditor, type EditorMarker } from './components/CodeEditor';
import { LinterOutput } from './components/LinterOutput';
import { Documentation } from './components/Documentation';
import { IndentationValidator, type ValidationError as IndentError } from './stages/indentation-validator';

// Default example - Valid Kubernetes Deployment
const DEFAULT_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
`;

/**
 * Main App Component
 */
function App() {
  const [yamlCode, setYamlCode] = useState<string>(DEFAULT_YAML);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [indentationErrors, setIndentationErrors] = useState<IndentError[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [showDocs, setShowDocs] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  const indentationValidator = useMemo(() => new IndentationValidator(), []);

  // Update theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Validate YAML against backend
  const validateYaml = useCallback(async (code: string) => {
    if (!code.trim()) {
      setIsValid(null);
      setErrors([]);
      setWarnings([]);
      setIndentationErrors([]);
      setDocumentCount(0);
      return;
    }

    setLoading(true);
    try {
      // 1. Run Client-side Indentation Validation
      const indentResult = indentationValidator.validate(code, { style: 'auto' });
      setIndentationErrors(indentResult.errors);

      // 2. Run Server-side Validation
      const response = await fetch('http://localhost:3001/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ yaml: code }),
      });

      const data = await response.json();

      setIsValid(data.valid && indentResult.valid);
      setErrors(data.errors || []);
      setWarnings(data.warnings || []);
      setDocumentCount(data.documentCount || 0);

    } catch (error) {
      console.error('Validation error:', error);
      setIsValid(false);
      setErrors([{
        message: 'Failed to connect to validation server',
        details: 'Please ensure the backend server is running on port 3001',
        severity: 'error'
      }]);
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  }, [indentationValidator]);

  // Debounced validation (500ms delay)
  useEffect(() => {
    if (!showDocs) {
      const timer = setTimeout(() => {
        validateYaml(yamlCode);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [yamlCode, validateYaml, showDocs]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setYamlCode(value);
    }
  };

  const handleFixIndentation = () => {
    const result = indentationValidator.fix(yamlCode, { style: 'auto', fixTrailingSpaces: true, mode: 'indentation' });
    if (result.fixedCount > 0) {
      setYamlCode(result.content);
      // Re-validate immediately
      validateYaml(result.content);
    }
  };

  const handleFixSyntax = () => {
    const result = indentationValidator.fix(yamlCode, { style: 'auto', fixTrailingSpaces: true, mode: 'syntax' });
    if (result.fixedCount > 0) {
      setYamlCode(result.content);
      // Re-validate immediately
      validateYaml(result.content);
    }
  };

  // Convert errors to Monaco markers
  const markers: EditorMarker[] = useMemo(() => {
    const allMarkers: EditorMarker[] = [];

    // Indentation Errors
    indentationErrors.forEach(err => {
      allMarkers.push({
        startLineNumber: err.line,
        startColumn: err.column,
        endLineNumber: err.line,
        endColumn: 1000, // Highlight full line
        message: err.message,
        severity: 8 // MarkerSeverity.Error
      });
    });

    // Backend Errors
    errors.forEach(err => {
      if (err.line) {
        allMarkers.push({
          startLineNumber: err.line,
          startColumn: err.column || 1,
          endLineNumber: err.line,
          endColumn: 1000,
          message: err.message,
          severity: 8 // MarkerSeverity.Error
        });
      }
    });

    // Backend Warnings
    warnings.forEach(warn => {
      if (warn.line) {
        allMarkers.push({
          startLineNumber: warn.line,
          startColumn: warn.column || 1,
          endLineNumber: warn.line,
          endColumn: 1000,
          message: warn.message,
          severity: 4 // MarkerSeverity.Warning
        });
      }
    });

    return allMarkers;
  }, [errors, warnings, indentationErrors]);

  // Export YAML to file
  const handleExport = () => {
    const blob = new Blob([yamlCode], { type: 'text/yaml;charset=utf-8' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    saveAs(blob, `k8s-manifest-${timestamp}.yaml`);
  };

  // Import YAML from file
  const handleImport = (content: string) => {
    setYamlCode(content);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlCode);
      console.log('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Layout
      onExport={handleExport}
      onImport={handleImport}
      onCopy={handleCopy}
      showDocs={showDocs}
      onToggleView={setShowDocs}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {/* Content */}
      {showDocs ? (
        <Documentation />
      ) : (
        <div className="flex w-full h-full">
          {/* Editor Pane - 50% width */}
          <div className="w-1/2 h-full">
            <CodeEditor
              value={yamlCode}
              onChange={handleEditorChange}
              markers={markers}
              theme={theme}
            />
          </div>

          {/* Output Pane - 50% width */}
          <div className="w-1/2 h-full">
            <LinterOutput
              isValid={isValid}
              errors={errors}
              warnings={warnings}
              indentationErrors={indentationErrors}
              loading={loading}
              documentCount={documentCount}
              onFixIndentation={handleFixIndentation}
              onFixSyntax={handleFixSyntax}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
