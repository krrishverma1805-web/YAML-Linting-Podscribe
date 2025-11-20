import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';

function App() {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [markers, setMarkers] = useState<monaco.editor.IMarkerData[]>([]);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const model = monaco.editor.createModel(
      `# Kubernetes YAML
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  containers:
    - name: web
      image: nginx
`,
      'yaml'
    );

    editorRef.current = monaco.editor.create(editorContainerRef.current, {
      model,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbersMinChars: 4,
      padding: { top: 16, bottom: 16 },
      renderLineHighlight: 'line',
    });

    // Configure monaco-yaml with Kubernetes schema
    configureMonacoYaml(monaco, {
      enableSchemaRequest: true,
      validate: true,
      hover: true,
      completion: true,
      isKubernetes: true,
      schemas: [
        {
          fileMatch: ['*.yaml', '*.yml'],
          uri: 'https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.30.0-standalone-strict/all.json',
        },
      ],
    });

    const sub = monaco.editor.onDidChangeMarkers((uris) => {
      const uri = model.uri.toString();
      if (!uris.some((u) => u.toString() === uri)) return;
      const next = monaco.editor.getModelMarkers({ resource: model.uri });
      setMarkers(next);
    });

    const initial = monaco.editor.getModelMarkers({ resource: model.uri });
    setMarkers(initial);

    return () => {
      sub.dispose();
      editorRef.current?.dispose();
      model.dispose();
    };
  }, []);

  const errors = markers.filter((m) => m.severity === monaco.MarkerSeverity.Error);
  const warnings = markers.filter(
    (m) => m.severity === monaco.MarkerSeverity.Warning
  );

  return (
    <div
  style={{
    position: 'fixed',
    inset: 0,
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gridTemplateRows: '1fr 200px',
    background: '#1E1E1E',
    color: '#D4D4D4',
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  }}
>
      {/* Left sidebar */}
      <aside
        style={{
          gridRow: '1 / 3',
          background: '#252526',
          borderRight: '1px solid #3E3E42',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 16px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.5,
              color: '#CCCCCC',
            }}
          >
            K8s YAML Lint
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: '#858585',
            }}
          >
            In-browser validation
          </p>
        </div>

        <div
          style={{
            padding: '12px',
            background: '#2D2D30',
            borderRadius: 4,
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#858585' }}>Errors</span>
            <span
              style={{
                color: errors.length === 0 ? '#4EC9B0' : '#F48771',
                fontWeight: 500,
              }}
            >
              {errors.length}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#858585' }}>Warnings</span>
            <span
              style={{
                color: warnings.length === 0 ? '#4EC9B0' : '#CE9178',
                fontWeight: 500,
              }}
            >
              {warnings.length}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#858585' }}>Total</span>
            <span style={{ color: '#CCCCCC', fontWeight: 500 }}>
              {markers.length}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: '#858585' }}>
          <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}>
            Paste your Kubernetes manifests into the editor. YAML syntax and
            schema errors appear below.
          </p>
          <p style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
            No data leaves your browser.
          </p>
        </div>
      </aside>

      {/* Main editor */}
      <main
        style={{
          background: '#1E1E1E',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 32,
            background: '#252526',
            borderBottom: '1px solid #3E3E42',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            fontSize: 12,
            color: '#CCCCCC',
          }}
        >
          manifest.yaml
        </div>
        <div
          ref={editorContainerRef}
          style={{
            position: 'absolute',
            top: 32,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </main>

      {/* Bottom problems panel */}
      <footer
        style={{
          background: '#252526',
          borderTop: '1px solid #3E3E42',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 32,
            borderBottom: '1px solid #3E3E42',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            fontSize: 11,
            fontWeight: 500,
            color: '#CCCCCC',
            letterSpacing: 0.3,
          }}
        >
          PROBLEMS
        </div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 12px',
            fontSize: 12,
          }}
        >
          {markers.length === 0 && (
            <div style={{ color: '#858585', padding: '4px 0' }}>
              No problems detected.
            </div>
          )}

          {markers.map((m, i) => (
            <div
              key={i}
              style={{
                padding: '6px 0',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                cursor: 'pointer',
                borderBottom:
                  i < markers.length - 1 ? '1px solid #2D2D30' : 'none',
              }}
              onClick={() => {
                if (!editorRef.current) return;
                editorRef.current.revealLineInCenter(m.startLineNumber);
                editorRef.current.setPosition({
                  lineNumber: m.startLineNumber,
                  column: m.startColumn,
                });
                editorRef.current.focus();
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: '#2D2D30',
                  color: '#858585',
                  fontFamily: 'monospace',
                }}
              >
                {m.startLineNumber}:{m.startColumn}
              </span>
              <span
                style={{
                  flex: 1,
                  color:
                    m.severity === monaco.MarkerSeverity.Error
                      ? '#F48771'
                      : '#CE9178',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.message}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
