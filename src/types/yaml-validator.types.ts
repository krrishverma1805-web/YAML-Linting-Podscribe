export interface ValidationOptions {
    indentSize?: number;
    aggressive?: boolean;
    schema?: string; // e.g., 'Deployment'
}

export interface ValidationError {
    line: number;
    column?: number;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    code: string; // e.g., 'INDENT_ERROR', 'MISSING_COLON'
    fixable: boolean;
}

export interface StructuralIssue {
    line: number;
    message: string;
    expectedParent: string;
    foundParent: string;
    suggestion: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    structuralIssues: StructuralIssue[];
}

export interface FixChange {
    type: 'INDENT' | 'KEY_FIX' | 'COLON' | 'LIST' | 'QUOTE' | 'STRUCTURE' | 'NUMERIC' | 'DUPLICATE' | 'ANCHOR';
    line: number;
    original: string;
    fixed: string;
    reason: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface FixResult {
    content: string;
    fixedCount: number;
    changes: FixChange[];
    errors: ValidationError[]; // Remaining errors
}

export interface StructuralFixResult {
    content: string;
    restructuredLines: number[];
    explanation: string;
}

export interface K8sFieldRule {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    nesting?: string[]; // Allowed parents
    children?: string[]; // Allowed children
    isList?: boolean;
    enum?: string[];
}

export interface K8sSchema {
    kind: string;
    rules: Record<string, K8sFieldRule>;
    rootKeys: string[];
    requiredTrees: string[][]; // e.g. [['spec', 'template', 'spec', 'containers']]
}
