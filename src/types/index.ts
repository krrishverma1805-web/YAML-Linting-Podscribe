export type Severity = 'error' | 'warning' | 'info';

export interface LintError {
    ruleId?: string;
    message: string;
    severity: Severity;
    file?: string;
    line?: number;
    column?: number;
    field?: string;
    remediation?: string;
}

export interface LintResult {
    valid: boolean;
    errors: LintError[];
    warnings: LintError[];
    resourceCount: number;
    resources?: any[]; // Normalized resources
}

export interface LintContext {
    config: LintConfig;
    files: string[];
    resources: any[];
    schemas: Map<string, any>; // Cache for schemas
    graph: any; // Dependency graph (placeholder)
    results: LintResult;
}

export interface LintConfig {
    k8sVersion: string;
    environment: 'dev' | 'staging' | 'prod';
    policyDir?: string;
    crdDir?: string;
    skipServerValidation: boolean;
    outputFormat: 'json' | 'sarif' | 'text';
    severityThreshold: 'error' | 'warning';
}

export interface Stage {
    name: string;
    run(context: LintContext): Promise<LintContext>;
}
