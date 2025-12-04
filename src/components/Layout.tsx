import React, { useState } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    onExport: () => void;
    onImport: (content: string) => void;
    onCopy: () => void;
    currentView: 'linter' | 'docs' | 'fixer';
    onViewChange: (view: 'linter' | 'docs' | 'fixer') => void;
    theme?: 'light' | 'dark';
    onToggleTheme?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    onExport,
    onImport,
    onCopy,
    currentView,
    onViewChange,
    theme = 'light',
    onToggleTheme
}) => {
    const [showImportDialog, setShowImportDialog] = useState(false);

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                onImport(content);
                setShowImportDialog(false);
            };
            reader.readAsText(file);
            // Reset input so the same file can be selected again
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)]">
            {/* Header with View Switcher */}
            <header className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] shadow-sm z-20 transition-colors duration-200">
                <div className="max-w-screen-2xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {/* View Switcher */}
                            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-0.5 flex space-x-0.5 border border-[var(--color-border)]">
                                <button
                                    onClick={() => onViewChange('linter')}
                                    className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentView === 'linter'
                                        ? 'bg-[var(--color-blue)] text-white shadow-sm'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                                        }`}
                                >
                                    Linter
                                </button>
                                <button
                                    onClick={() => onViewChange('fixer')}
                                    className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentView === 'fixer'
                                        ? 'bg-[var(--color-blue)] text-white shadow-sm'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                                        }`}
                                >
                                    YAML Fixer
                                </button>
                                <button
                                    onClick={() => onViewChange('docs')}
                                    className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentView === 'docs'
                                        ? 'bg-[var(--color-blue)] text-white shadow-sm'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                                        }`}
                                >
                                    Documentation
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                            {/* Theme Toggle */}
                            {onToggleTheme && (
                                <button
                                    onClick={onToggleTheme}
                                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border)]"
                                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                                >
                                    {theme === 'light' ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Copy Button */}
                            <button
                                onClick={onCopy}
                                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border)]"
                                title="Copy to clipboard"
                            >
                                <div className="flex items-center space-x-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>Copy</span>
                                </div>
                            </button>

                            {/* Import Button */}
                            <button
                                onClick={() => setShowImportDialog(true)}
                                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border)]"
                                title="Import YAML file"
                            >
                                <div className="flex items-center space-x-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Import</span>
                                </div>
                            </button>

                            {/* Export Button */}
                            <button
                                onClick={onExport}
                                className="px-5 py-2 text-sm font-semibold text-white bg-[var(--color-blue)] hover:bg-[var(--color-blue-dark)] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center space-x-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Export</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-[var(--color-bg-card)] border-t border-[var(--color-border)] px-6 py-2.5 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-[var(--color-green)] rounded-full"></div>
                            <span className="text-[var(--color-text-secondary)] font-medium">
                                Connected
                            </span>
                        </div>
                        <div className="h-3 w-px bg-[var(--color-border)]"></div>
                        <span className="text-[var(--color-text-tertiary)]">
                            Real-time validation • 500ms debounce
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-[var(--color-text-tertiary)]">
                            Kubernetes API v1.29
                        </span>
                        <div className="h-3 w-px bg-[var(--color-border)]"></div>
                        <span className="text-[var(--color-text-tertiary)]">
                            Enhanced Validation Engine v2.0
                        </span>
                    </div>
                </div>
            </footer>

            {/* Import Dialog */}
            {showImportDialog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-[var(--color-bg-card)] p-6 max-w-lg w-full mx-4 shadow-xl border border-[var(--color-border)] rounded-lg animate-scale-in">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                                    Import YAML File
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Select a Kubernetes manifest file (.yaml or .yml)
                                </p>
                            </div>
                            <button
                                onClick={() => setShowImportDialog(false)}
                                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-3">
                            <label className="block">
                                <input
                                    type="file"
                                    accept=".yaml,.yml"
                                    onChange={handleFileImport}
                                    className="block w-full text-sm text-[var(--color-text-secondary)]
                    file:mr-3 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-[var(--color-blue)]
                    file:text-white
                    hover:file:bg-[var(--color-blue-dark)]
                    file:transition-all
                    file:cursor-pointer
                    cursor-pointer
                    border border-dashed border-[var(--color-border)]
                    rounded-lg p-4
                    hover:border-[var(--color-blue)]/30
                    transition-colors
                    bg-[var(--color-bg-secondary)]"
                                />
                            </label>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setShowImportDialog(false)}
                                    className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-secondary)]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
