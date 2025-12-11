import React, { useRef, useEffect } from 'react';
import Editor, { DiffEditor, type OnMount } from '@monaco-editor/react';

export interface EditorMarker {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    message: string;
    severity: number; // monaco.MarkerSeverity
}

interface CodeEditorProps {
    value: string;
    onChange?: (value: string | undefined) => void;
    markers?: EditorMarker[];
    theme?: 'light' | 'dark';
    diffMode?: boolean;
    originalValue?: string;
    modifiedValue?: string;
    readOnly?: boolean;
}

/**
 * CodeEditor Component - Modern Theme Support
 * Features: Custom light/dark themes, smooth integration
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    markers = [],
    theme = 'light',
    diffMode = false,
    originalValue = '',
    modifiedValue = '',
    readOnly = false
}) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Define custom light theme - Material Design 3
        monaco.editor.defineTheme('modern-light', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '79747E', fontStyle: 'italic' },
                { token: 'keyword', foreground: '6750A4', fontStyle: 'bold' },
                { token: 'string', foreground: '34C759' },
                { token: 'number', foreground: 'FF9500' },
                { token: 'type', foreground: '9747FF' },
                { token: 'variable', foreground: 'BA1A1A' },
                { token: 'key', foreground: '6750A4' },
            ],
            colors: {
                'editor.background': '#FFFFFF',
                'editor.foreground': '#1C1B1F',
                'editor.lineHighlightBackground': '#F5F0FF',
                'editor.selectionBackground': '#1A73E830',
                'editorLineNumber.foreground': '#79747E',
                'editorLineNumber.activeForeground': '#1A73E8',
                'editorCursor.foreground': '#1A73E8',
                'editor.selectionHighlightBackground': '#1A73E820',
                'editorIndentGuide.background': '#E0E0E0',
                'editorIndentGuide.activeBackground': '#1A73E830',
                'editorWidget.background': '#FFFFFF',
                'editorWidget.border': '#E0E0E0',
                'editorGutter.background': '#FAFAFA',
                'scrollbar.shadow': '#00000008',
                'scrollbarSlider.background': '#1A73E820',
                'scrollbarSlider.hoverBackground': '#1A73E840',
                'scrollbarSlider.activeBackground': '#1A73E860',
            },
        });

        // Define custom dark theme - Material Design 3
        monaco.editor.defineTheme('modern-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6B6B6B', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'D0BCFF', fontStyle: 'bold' },
                { token: 'string', foreground: '30D158' },
                { token: 'number', foreground: 'FF9F0A' },
                { token: 'type', foreground: 'E8B0FF' },
                { token: 'variable', foreground: 'F2B8B5' },
                { token: 'key', foreground: 'D0BCFF' },
            ],
            colors: {
                'editor.background': '#141414',
                'editor.foreground': '#E6E1E5',
                'editor.lineHighlightBackground': '#1E1E1E',
                'editor.selectionBackground': '#8AB4F830',
                'editorLineNumber.foreground': '#555555',
                'editorLineNumber.activeForeground': '#8AB4F8',
                'editorCursor.foreground': '#8AB4F8',
                'editor.selectionHighlightBackground': '#8AB4F820',
                'editorIndentGuide.background': '#2A2A2A',
                'editorIndentGuide.activeBackground': '#8AB4F830',
                'editorWidget.background': '#1C1B1F',
                'editorWidget.border': '#333333',
                'editorGutter.background': '#141414',
                'scrollbar.shadow': '#00000020',
                'scrollbarSlider.background': '#8AB4F820',
                'scrollbarSlider.hoverBackground': '#8AB4F840',
                'scrollbarSlider.activeBackground': '#8AB4F860',
            },
        });

        monaco.editor.setTheme(theme === 'dark' ? 'modern-dark' : 'modern-light');
    };

    // Update theme when prop changes
    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(theme === 'dark' ? 'modern-dark' : 'modern-light');
        }
    }, [theme]);

    // Apply markers when they change
    useEffect(() => {
        if (monacoRef.current && editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                monacoRef.current.editor.setModelMarkers(model, 'owner', markers);
            }
        }
    }, [markers]);

    return (
        <div className="h-full w-full bg-[var(--color-bg-card)]">
            <div className="h-full">
                {diffMode ? (
                    <DiffEditor
                        height="100%"
                        original={originalValue}
                        modified={modifiedValue}
                        onMount={(editor, monaco) => {
                            // Reuse the same theme setup logic
                            handleEditorDidMount(editor as any, monaco);
                        }}
                        theme={theme === 'dark' ? 'modern-dark' : 'modern-light'}
                        options={{
                            readOnly: true,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace",
                            fontSize: 14,
                            lineHeight: 22,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20, bottom: 20 },
                            renderSideBySide: true,
                            smoothScrolling: true,
                            fontLigatures: true,
                            lineNumbers: 'on',
                            glyphMargin: false,
                            folding: true,
                            renderOverviewRuler: false,
                            scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto',
                                useShadows: false,
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                            },
                        }}
                    />
                ) : (
                    <Editor
                        height="100%"
                        defaultLanguage="yaml"
                        value={value}
                        onChange={onChange}
                        onMount={handleEditorDidMount}
                        theme={theme === 'dark' ? 'modern-dark' : 'modern-light'}
                        options={{
                            readOnly: readOnly,
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace",
                            lineHeight: 22,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20, bottom: 20 },
                            renderLineHighlight: 'all',
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                            cursorSmoothCaretAnimation: 'on',
                            fontLigatures: true,
                            lineNumbers: 'on',
                            glyphMargin: false,
                            folding: true,
                            lineDecorationsWidth: 0,
                            lineNumbersMinChars: 4,
                            renderWhitespace: 'selection',
                            scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto',
                                useShadows: false,
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                            },
                            bracketPairColorization: {
                                enabled: true,
                            },
                        }}
                    />
                )}
            </div>
        </div>
    );
};
