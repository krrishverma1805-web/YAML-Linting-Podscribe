import React from 'react';

interface ValidationError {
    message: string;
    field?: string;
    line?: number | null;
    column?: number | null;
    details?: string;
    severity?: 'error' | 'warning';
    kind?: string;
    document?: number;
    code?: string;
    fixable?: boolean;
}

interface LinterOutputProps {
    isValid: boolean | null;
    errors: ValidationError[];
    warnings: ValidationError[];
    indentationErrors?: ValidationError[];
    loading: boolean;
    documentCount?: number;
    onFixIndentation?: () => void;
    onFixSyntax?: () => void;
}

/**
 * LinterOutput Component - Modern validation results display
 * Features: Glassmorphism cards, smooth animations, clear hierarchy
 */
export const LinterOutput: React.FC<LinterOutputProps> = ({
    isValid,
    errors,
    warnings,
    indentationErrors = [],
    loading,
    documentCount = 0,
    onFixIndentation,
    onFixSyntax
}) => {
    // Loading state
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[var(--color-bg-card)] p-8">
                <div className="relative w-12 h-12 mb-4">
                    <div className="absolute inset-0 border-3 border-[var(--color-blue)]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-3 border-transparent border-t-[var(--color-blue)] rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                    Validating manifest...
                </p>
            </div>
        );
    }

    const hasIndentationErrors = indentationErrors.length > 0;
    const totalIssues = errors.length + warnings.length + indentationErrors.length;

    // Empty state
    if (isValid === null && totalIssues === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[var(--color-bg-card)] p-8 text-center">
                <div className="w-16 h-16 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                    Ready to validate
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
                    Start typing or paste your Kubernetes YAML manifest
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[var(--color-bg-card)]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">
                            Validation Results
                        </h2>
                        {documentCount > 0 && (
                            <p className="text-xs font-medium text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-blue)]"></span>
                                {documentCount} document{documentCount > 1 ? 's' : ''} analyzed
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Fix Buttons Group */}
                        {(hasIndentationErrors || onFixSyntax) && (
                            <div className="flex items-center bg-[var(--color-bg-secondary)] p-1 rounded-lg border border-[var(--color-border)] shadow-sm">
                                {/* Fix Indentation Button */}
                                {hasIndentationErrors && onFixIndentation && (
                                    <button
                                        onClick={onFixIndentation}
                                        className="px-3 py-1.5 text-xs font-semibold text-[var(--color-blue)] hover:bg-[var(--color-bg-primary)] rounded-md transition-all flex items-center gap-1.5 hover:shadow-sm"
                                        title="Fix indentation issues (tabs, alignment)"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                        Fix Indentation
                                    </button>
                                )}

                                {/* Divider if both exist */}
                                {hasIndentationErrors && onFixSyntax && (
                                    <div className="w-px h-4 bg-[var(--color-border)] mx-1"></div>
                                )}

                                {/* Fix Syntax Button */}
                                {onFixSyntax && (
                                    <button
                                        onClick={onFixSyntax}
                                        className="px-3 py-1.5 text-xs font-semibold text-[var(--color-purple)] hover:bg-[var(--color-bg-primary)] rounded-md transition-all flex items-center gap-1.5 hover:shadow-sm"
                                        title="Fix syntax issues (trailing spaces, colons)"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Fix Syntax
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Status Badge */}
                        {totalIssues === 0 && isValid ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-green)]/10 border border-[var(--color-green)]/20 rounded-full shadow-sm">
                                <div className="w-2 h-2 bg-[var(--color-green)] rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-[var(--color-green)] tracking-wide">VALID</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-red)]/10 border border-[var(--color-red)]/20 rounded-full shadow-sm">
                                <div className="w-2 h-2 bg-[var(--color-red)] rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-[var(--color-red)] tracking-wide">
                                    {totalIssues} ISSUE{totalIssues > 1 ? 'S' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Success State */}
                {totalIssues === 0 && isValid && (
                    <div className="animate-scale-in flex flex-col items-center justify-center h-full text-center p-8 opacity-80">
                        <div className="w-20 h-20 bg-[var(--color-green)]/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--color-green)]/20">
                            <svg className="w-10 h-10 text-[var(--color-green)]" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                            All Checks Passed
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] max-w-md leading-relaxed">
                            Your Kubernetes manifest is syntactically correct and adheres to best practices. You're good to go!
                        </p>
                    </div>
                )}

                {/* Indentation Errors */}
                {hasIndentationErrors && (
                    <div className="space-y-3 animate-slide-in">
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-[var(--color-blue)]/10 text-[var(--color-blue)]">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                            </span>
                            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Indentation Issues</h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-full border border-[var(--color-border)]">
                                {indentationErrors.length}
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {indentationErrors.map((error, index) => (
                                <div
                                    key={`indent-${index}`}
                                    className="group relative bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-blue)]/40 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-blue)] rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                            <span className="text-xs font-mono font-bold text-[var(--color-text-secondary)]">Line</span>
                                            <span className="text-lg font-mono font-bold text-[var(--color-blue)]">{error.line}</span>
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                                {error.message}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                                                    Col {error.column}
                                                </span>
                                                {error.fixable && (
                                                    <span className="text-[10px] font-bold text-[var(--color-blue)] bg-[var(--color-blue)]/10 px-2 py-0.5 rounded border border-[var(--color-blue)]/20 uppercase tracking-wider">
                                                        Auto-fixable
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Schema Errors */}
                {errors.length > 0 && (
                    <div className="space-y-3 animate-slide-in" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-[var(--color-red)]/10 text-[var(--color-red)]">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </span>
                            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Validation Errors</h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-full border border-[var(--color-border)]">
                                {errors.length}
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {errors.map((error, index) => (
                                <div
                                    key={`error-${index}`}
                                    className="group relative bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-red)]/40 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-red)] rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                            <span className="text-xs font-mono font-bold text-[var(--color-text-secondary)]">Line</span>
                                            <span className="text-lg font-mono font-bold text-[var(--color-red)]">{error.line || '-'}</span>
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                                                {error.message}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {error.field && (
                                                    <span className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded border border-[var(--color-border)]">
                                                        {error.field}
                                                    </span>
                                                )}
                                                {error.kind && (
                                                    <span className="text-xs font-medium text-[var(--color-text-tertiary)] flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)]"></span>
                                                        {error.kind}
                                                    </span>
                                                )}
                                            </div>
                                            {error.details && (
                                                <div className="mt-3 text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)]/50 p-3 rounded border border-[var(--color-border)]/50 break-all">
                                                    {error.details}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className="space-y-3 animate-slide-in" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-[var(--color-orange)]/10 text-[var(--color-orange)]">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </span>
                            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Best Practice Warnings</h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-full border border-[var(--color-border)]">
                                {warnings.length}
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {warnings.map((warning, index) => (
                                <div
                                    key={`warning-${index}`}
                                    className="group relative bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-orange)]/40 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-orange)] rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                            <span className="text-xs font-mono font-bold text-[var(--color-text-secondary)]">Line</span>
                                            <span className="text-lg font-mono font-bold text-[var(--color-orange)]">{warning.line || '-'}</span>
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                                                {warning.message}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {warning.field && (
                                                    <span className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded border border-[var(--color-border)]">
                                                        {warning.field}
                                                    </span>
                                                )}
                                                {warning.kind && (
                                                    <span className="text-xs font-medium text-[var(--color-text-tertiary)] flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)]"></span>
                                                        {warning.kind}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
