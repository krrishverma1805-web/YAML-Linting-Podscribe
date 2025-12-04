/**
 * TypeScript API client for YAML Fixer
 */

export interface FixOptions {
    aggressive?: boolean;
    indentSize?: number;
}

export interface FixChange {
    type: 'INDENT' | 'KEY_FIX' | 'COLON' | 'LIST' | 'QUOTE' | 'STRUCTURE' | 'NUMERIC' | 'DUPLICATE' | 'ANCHOR';
    line: number;
    original: string;
    fixed: string;
    reason: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface ValidationError {
    line: number;
    column?: number;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    code: string;
    fixable: boolean;
}

export interface FixResponse {
    success: boolean;
    fixed: string;
    errors: ValidationError[];
    changes: FixChange[];
    fixedCount: number;
    phase?: string;
    error?: string;
}

export interface ValidateResponse {
    valid: boolean;
    errors: ValidationError[];
    structuralIssues: any[];
    error?: string;
}

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:3001`
    : 'http://localhost:3001';

/**
 * Fix broken YAML content
 */
export async function fixYaml(content: string, options: FixOptions = {}): Promise<FixResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/yaml/fix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, options }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('YAML Fixer API Error:', error);
        throw error;
    }
}

/**
 * Validate YAML content without fixing
 */
export async function validateYaml(content: string): Promise<ValidateResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/yaml/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('YAML Validator API Error:', error);
        throw error;
    }
}
