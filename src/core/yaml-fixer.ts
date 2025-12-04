/**
 * Industry-Grade YAML Fixer for Kubernetes Configurations
 * 
 * Three-Phase Architecture:
 * 1. Line-by-Line Syntax Normalization (always runs, even on broken YAML)
 * 2. YAML Parsing & Validation (only after Phase 1)
 * 3. Semantic & Structural Fixes (only if parsing succeeds)
 * 
 * This design ensures broken YAML can be progressively repaired without crashing.
 */

import * as yaml from 'js-yaml';
import type {
    ValidationOptions,
    ValidationResult,
    FixResult,
    StructuralFixResult,
    ValidationError,
    StructuralIssue,
    FixChange
} from '../types/yaml-validator.types.js';

// ==========================================
// CONSTANTS & KNOWLEDGE BASE
// ==========================================

/**
 * Common typos and their correct forms
 */
const KEY_ALIASES: Record<string, string> = {
    'met': 'metadata',
    'meta': 'metadata',
    'metdata': 'metadata',
    'metadata_': 'metadata',
    'metadta': 'metadata',
    'specf': 'spec',
    'spec_': 'spec',
    'sepc': 'spec',
    'spc': 'spec',
    'contianers': 'containers',
    'containers_': 'containers',
    'conteiners': 'containers',
    'containres': 'containers',
    'volumns': 'volumes',
    'volums': 'volumes',
    'volumes_': 'volumes',
    'volumnes': 'volumes',
    'envs': 'env',
    'env_': 'env',
    'enviroment': 'env',
    'environment': 'env',
    'labels_': 'labels',
    'lables': 'labels',
    'labes': 'labels',
    'annotations_': 'annotations',
    'annotaions': 'annotations',
    'image_': 'image',
    'img': 'image',
    'ports_': 'ports',
    'port_': 'ports',
    'selector_': 'selector',
    'selecter': 'selector',
    'replicas_': 'replicas',
    'replica': 'replicas',
    'namespace_': 'namespace',
    'namespce': 'namespace',
    'namesapce': 'namespace'
};

/**
 * Known Kubernetes keys that should have colons
 */
const KNOWN_K8S_KEYS = new Set([
    'apiVersion', 'kind', 'metadata', 'spec', 'status',
    'name', 'namespace', 'labels', 'annotations',
    'replicas', 'selector', 'template', 'strategy',
    'containers', 'initContainers', 'volumes', 'volumeMounts',
    'image', 'imagePullPolicy', 'command', 'args', 'env', 'envFrom',
    'ports', 'containerPort', 'hostPort', 'protocol',
    'resources', 'limits', 'requests', 'cpu', 'memory',
    'restartPolicy', 'nodeSelector', 'affinity', 'tolerations',
    'serviceAccountName', 'securityContext', 'hostNetwork',
    'type', 'clusterIP', 'externalIPs', 'loadBalancerIP',
    'port', 'targetPort', 'nodePort',
    'path', 'pathType', 'backend', 'serviceName', 'servicePort',
    'data', 'stringData', 'binaryData',
    'rules', 'verbs', 'apiGroups', 'resources',
    'effect', 'key', 'operator', 'value', 'tolerationSeconds'
]);

/**
 * Fields that should contain numeric values
 */
const NUMERIC_FIELDS = new Set([
    'replicas', 'containerPort', 'port', 'targetPort', 'nodePort',
    'hostPort', 'timeoutSeconds', 'periodSeconds', 'successThreshold',
    'failureThreshold', 'initialDelaySeconds', 'terminationGracePeriodSeconds',
    'activeDeadlineSeconds', 'progressDeadlineSeconds', 'revisionHistoryLimit',
    'minReadySeconds', 'weight', 'priority'
]);

/**
 * Fields that should be under metadata
 */
const METADATA_FIELDS = new Set(['name', 'namespace', 'labels', 'annotations', 'generateName']);

/**
 * Fields that should be under spec (for Deployments)
 */
const SPEC_FIELDS = new Set(['replicas', 'selector', 'template', 'strategy', 'minReadySeconds', 'progressDeadlineSeconds', 'revisionHistoryLimit']);

/**
 * Fields that should be under spec.template.spec (for pod specs)
 */
const POD_SPEC_FIELDS = new Set(['containers', 'initContainers', 'volumes', 'restartPolicy', 'nodeSelector', 'affinity', 'tolerations', 'serviceAccountName', 'securityContext', 'hostNetwork', 'dnsPolicy', 'imagePullSecrets']);

// ==========================================
// MAIN YAML FIXER CLASS
// ==========================================

export class YAMLFixer {
    private indentSize: number = 2;

    constructor(indentSize: number = 2) {
        this.indentSize = indentSize;
    }

    /**
     * PHASE 1: Line-by-Line Syntax Normalization
     * This phase ALWAYS runs, even on completely broken YAML
     */
    private phase1_syntaxNormalization(content: string): { lines: string[], changes: FixChange[] } {
        const lines = content.split('\n');
        const normalizedLines: string[] = [];
        const changes: FixChange[] = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const original = line;
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                normalizedLines.push(line);
                continue;
            }

            // 1. Convert tabs to spaces
            if (line.includes('\t')) {
                line = line.replace(/\t/g, ' '.repeat(this.indentSize));
                changes.push({
                    type: 'INDENT',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Converted tabs to spaces',
                    severity: 'warning'
                });
            }

            // 2. Remove trailing whitespace
            const trimmedRight = line.trimRight();
            if (trimmedRight !== line) {
                line = trimmedRight;
            }

            const currentTrimmed = line.trim();

            // 3. Fix missing colons for known K8s keys
            // Pattern: "apiVersion v1" -> "apiVersion: v1"
            // Pattern: "name app" -> "name: app"
            if (!currentTrimmed.includes(':') && !currentTrimmed.startsWith('-') && !currentTrimmed.startsWith('#')) {
                const parts = currentTrimmed.split(/\s+/);
                if (parts.length >= 1) {
                    const potentialKey = parts[0];
                    const correctKey = KEY_ALIASES[potentialKey.toLowerCase()] || KEY_ALIASES[potentialKey] || potentialKey;

                    if (KNOWN_K8S_KEYS.has(correctKey) || KNOWN_K8S_KEYS.has(potentialKey)) {
                        const indent = line.match(/^(\s*)/)?.[1] || '';
                        if (parts.length === 1) {
                            // Single word: "spec" -> "spec:"
                            line = `${indent}${correctKey}:`;
                            changes.push({
                                type: 'COLON',
                                line: i + 1,
                                original,
                                fixed: line,
                                reason: `Added missing colon to "${correctKey}"`,
                                severity: 'critical'
                            });
                        } else {
                            // Multiple words: "name app" -> "name: app"
                            const rest = parts.slice(1).join(' ');
                            line = `${indent}${correctKey}: ${rest}`;
                            changes.push({
                                type: 'COLON',
                                line: i + 1,
                                original,
                                fixed: line,
                                reason: `Added missing colon to "${correctKey}"`,
                                severity: 'critical'
                            });
                        }
                    }
                }
            }

            const updatedTrimmed = line.trim();

            // 4. Fix missing space after colon
            // Pattern: "protocol:TCP" -> "protocol: TCP"
            // Avoid URLs like "http://"
            if (updatedTrimmed.includes(':') && !updatedTrimmed.includes('://')) {
                const colonSpaceFix = line.replace(/^(\s*)([^:\s]+):(?!\s)([^#\s].*)/, '$1$2: $3');
                if (colonSpaceFix !== line) {
                    changes.push({
                        type: 'COLON',
                        line: i + 1,
                        original: line,
                        fixed: colonSpaceFix,
                        reason: 'Added space after colon',
                        severity: 'info'
                    });
                    line = colonSpaceFix;
                }
            }

            // 5. Fix list item spacing
            // Pattern: "-item" -> "- item"
            // Pattern: "-effect: NoSchedule" -> "- effect: NoSchedule"
            // Skip document separators (---)
            if (updatedTrimmed.startsWith('-') && updatedTrimmed.length > 1 && updatedTrimmed[1] !== ' ' && updatedTrimmed[1] !== '-') {
                const indent = line.match(/^(\s*)/)?.[1] || '';
                const content = updatedTrimmed.substring(1);
                line = `${indent}- ${content}`;
                changes.push({
                    type: 'LIST',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Added space after list marker',
                    severity: 'info'
                });
            }

            // 6. Fix list items with missing colons
            // Pattern: "- name nginx" -> "- name: nginx"
            const listItemMatch = line.match(/^(\s*)-\s+([a-zA-Z0-9_-]+)\s+(.+)$/);
            if (listItemMatch && !listItemMatch[0].includes(':')) {
                const [, indent, key, value] = listItemMatch;
                const correctKey = KEY_ALIASES[key.toLowerCase()] || KEY_ALIASES[key] || key;
                if (KNOWN_K8S_KEYS.has(correctKey) || KNOWN_K8S_KEYS.has(key)) {
                    line = `${indent}- ${correctKey}: ${value}`;
                    changes.push({
                        type: 'COLON',
                        line: i + 1,
                        original,
                        fixed: line,
                        reason: `Added missing colon in list item "${correctKey}"`,
                        severity: 'critical'
                    });
                }
            }

            // 7. Fix common key typos
            const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):/);
            if (keyMatch) {
                const [, indent, key] = keyMatch;
                const lowerKey = key.toLowerCase();
                const correctKey = KEY_ALIASES[lowerKey] || KEY_ALIASES[key];
                if (correctKey && correctKey !== key) {
                    line = line.replace(`${indent}${key}:`, `${indent}${correctKey}:`);
                    changes.push({
                        type: 'KEY_FIX',
                        line: i + 1,
                        original,
                        fixed: line,
                        reason: `Fixed typo "${key}" -> "${correctKey}"`,
                        severity: 'warning'
                    });
                }
            }

            // 8. Close unclosed quotes
            const doubleQuotes = (line.match(/"/g) || []).length;
            const singleQuotes = (line.match(/'/g) || []).length;
            if (doubleQuotes % 2 !== 0) {
                line += '"';
                changes.push({
                    type: 'QUOTE',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Closed unclosed double quote',
                    severity: 'critical'
                });
            }
            if (singleQuotes % 2 !== 0) {
                line += "'";
                changes.push({
                    type: 'QUOTE',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Closed unclosed single quote',
                    severity: 'critical'
                });
            }

            normalizedLines.push(line);
        }

        return { lines: normalizedLines, changes };
    }

    /**
     * PHASE 2: YAML Parsing & Validation
     * Only runs after Phase 1 completes
     */
    private phase2_parseValidation(content: string): { valid: boolean, errors: ValidationError[], parsed?: any } {
        const errors: ValidationError[] = [];

        try {
            // Handle both single and multi-document YAML
            const documents = yaml.loadAll(content);
            const parsed = documents.length === 1 ? documents[0] : documents;
            return { valid: true, errors: [], parsed };
        } catch (e: any) {
            errors.push({
                line: e.mark ? e.mark.line + 1 : 0,
                column: e.mark ? e.mark.column + 1 : 0,
                message: e.message,
                severity: 'critical',
                code: 'YAML_PARSE_ERROR',
                fixable: false
            });
            return { valid: false, errors };
        }
    }

    /**
     * PHASE 3: Semantic & Structural Fixes
     * Only runs if Phase 2 parsing succeeds
     */
    private phase3_semanticFixes(lines: string[], _parsed: any, _aggressive: boolean): { lines: string[], changes: FixChange[] } {
        const fixedLines: string[] = [];
        const changes: FixChange[] = [];
        const seenKeys = new Map<number, Set<string>>(); // indent level -> set of keys

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const original = line;
            const trimmed = line.trim();
            const indent = line.match(/^(\s*)/)?.[1].length || 0;

            if (!trimmed || trimmed.startsWith('#')) {
                fixedLines.push(line);
                continue;
            }

            // 1. Convert string numbers to integers for numeric fields
            const keyMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
            if (keyMatch) {
                const [, key, value] = keyMatch;

                if (NUMERIC_FIELDS.has(key)) {
                    const cleanValue = value.replace(/['"]/g, '').trim();

                    // Handle numeric strings
                    if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
                        if (value.includes('"') || value.includes("'")) {
                            line = `${' '.repeat(indent)}${key}: ${cleanValue}`;
                            changes.push({
                                type: 'NUMERIC',
                                line: i + 1,
                                original,
                                fixed: line,
                                reason: `Converted string "${value}" to number`,
                                severity: 'info'
                            });
                        }
                    }
                    // Handle word numbers (e.g., "three" -> 3)
                    else if (cleanValue.toLowerCase() === 'three') {
                        line = `${' '.repeat(indent)}${key}: 3`;
                        changes.push({
                            type: 'NUMERIC',
                            line: i + 1,
                            original,
                            fixed: line,
                            reason: `Converted word "${value}" to number`,
                            severity: 'warning'
                        });
                    }
                }

                // 2. Detect duplicate keys at the same indent level
                if (!seenKeys.has(indent)) {
                    seenKeys.set(indent, new Set());
                }
                const keysAtLevel = seenKeys.get(indent)!;
                if (keysAtLevel.has(key)) {
                    changes.push({
                        type: 'DUPLICATE',
                        line: i + 1,
                        original,
                        fixed: original,
                        reason: `Duplicate key "${key}" detected at same nesting level`,
                        severity: 'error'
                    });
                }
                keysAtLevel.add(key);

                // Clear deeper levels when we dedent
                const deeperLevels = Array.from(seenKeys.keys()).filter(l => l > indent);
                deeperLevels.forEach(l => seenKeys.delete(l));
            }

            fixedLines.push(line);
        }

        return { lines: fixedLines, changes };
    }

    /**
     * PHASE 3B: Structural Reorganization (Aggressive Mode)
     * Moves misplaced fields to their correct locations
     */
    private phase3b_structuralFixes(parsed: any): { content: string, explanation: string } {
        let explanation = '';

        // Handle multi-document YAML
        if (Array.isArray(parsed)) {
            const fixedDocs = parsed.map(doc => {
                const result = this.fixSingleDocument(doc);
                if (result.explanation) {
                    explanation += result.explanation + ' ';
                }
                return result.doc;
            });

            const dumped = fixedDocs.map(doc =>
                yaml.dump(doc, { indent: this.indentSize, lineWidth: -1, noRefs: true, sortKeys: false })
            ).join('---\n');

            return { content: dumped, explanation: explanation.trim() || 'No structural changes needed' };
        }

        // Single document
        const result = this.fixSingleDocument(parsed);
        const dumped = yaml.dump(result.doc, {
            indent: this.indentSize,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });

        return { content: dumped, explanation: result.explanation || 'No structural changes needed' };
    }

    /**
     * Fix a single YAML document's structure
     */
    private fixSingleDocument(parsed: any): { doc: any, explanation: string } {
        let explanation = '';

        if (!parsed || typeof parsed !== 'object') {
            return { doc: parsed, explanation: '' };
        }

        // 1. Move metadata fields from root to metadata
        METADATA_FIELDS.forEach(field => {
            if (parsed[field] !== undefined) {
                if (!parsed.metadata) parsed.metadata = {};
                parsed.metadata[field] = parsed[field];
                delete parsed[field];
                explanation += `Moved "${field}" to "metadata.${field}". `;
            }
        });

        // 2. Move spec fields from root to spec (for Deployments)
        if (parsed.kind === 'Deployment' || parsed.kind === 'StatefulSet' || parsed.kind === 'DaemonSet') {
            SPEC_FIELDS.forEach(field => {
                if (parsed[field] !== undefined) {
                    if (!parsed.spec) parsed.spec = {};
                    parsed.spec[field] = parsed[field];
                    delete parsed[field];
                    explanation += `Moved "${field}" to "spec.${field}". `;
                }
            });

            // 3. Ensure spec.template.metadata and spec.template.spec exist
            if (parsed.spec && !parsed.spec.template) {
                parsed.spec.template = { metadata: {}, spec: {} };
                explanation += 'Created "spec.template.metadata" and "spec.template.spec" structure. ';
            } else if (parsed.spec && parsed.spec.template) {
                if (!parsed.spec.template.metadata) {
                    parsed.spec.template.metadata = {};
                    explanation += 'Created "spec.template.metadata". ';
                }
                if (!parsed.spec.template.spec) {
                    parsed.spec.template.spec = {};
                    explanation += 'Created "spec.template.spec". ';
                }
            }

            // 4. Move pod spec fields from root or spec to spec.template.spec
            POD_SPEC_FIELDS.forEach(field => {
                if (parsed[field] !== undefined) {
                    if (!parsed.spec) parsed.spec = {};
                    if (!parsed.spec.template) parsed.spec.template = { metadata: {}, spec: {} };
                    if (!parsed.spec.template.spec) parsed.spec.template.spec = {};
                    parsed.spec.template.spec[field] = parsed[field];
                    delete parsed[field];
                    explanation += `Moved "${field}" from root to "spec.template.spec.${field}". `;
                } else if (parsed.spec && parsed.spec[field] !== undefined && field !== 'selector') {
                    if (!parsed.spec.template) parsed.spec.template = { metadata: {}, spec: {} };
                    if (!parsed.spec.template.spec) parsed.spec.template.spec = {};
                    parsed.spec.template.spec[field] = parsed.spec[field];
                    delete parsed.spec[field];
                    explanation += `Moved "${field}" from "spec" to "spec.template.spec.${field}". `;
                }
            });
        }

        // 5. For Services, move type and ports to spec if at root
        if (parsed.kind === 'Service') {
            if (parsed.type !== undefined) {
                if (!parsed.spec) parsed.spec = {};
                parsed.spec.type = parsed.type;
                delete parsed.type;
                explanation += 'Moved "type" to "spec.type". ';
            }
            if (parsed.ports !== undefined) {
                if (!parsed.spec) parsed.spec = {};
                parsed.spec.ports = parsed.ports;
                delete parsed.ports;
                explanation += 'Moved "ports" to "spec.ports". ';
            }
        }

        return { doc: parsed, explanation: explanation.trim() };
    }

    /**
     * Main Fix Method - Orchestrates all three phases
     */
    public fix(content: string, options: ValidationOptions = {}): FixResult {
        const aggressive = options.aggressive || false;
        const allChanges: FixChange[] = [];

        console.log('[YAML FIXER] Starting three-phase fix pipeline...');

        // PHASE 1: Syntax Normalization (always runs)
        console.log('[PHASE 1] Line-by-line syntax normalization...');
        const phase1Result = this.phase1_syntaxNormalization(content);
        allChanges.push(...phase1Result.changes);
        let fixedContent = phase1Result.lines.join('\n');

        console.log(`[PHASE 1] Complete. Fixed ${phase1Result.changes.length} syntax issues.`);

        // PHASE 2: Parse Validation
        console.log('[PHASE 2] YAML parsing and validation...');
        const phase2Result = this.phase2_parseValidation(fixedContent);

        if (!phase2Result.valid) {
            console.log('[PHASE 2] Parsing failed. Returning Phase 1 results only.');
            return {
                content: fixedContent,
                fixedCount: allChanges.length,
                changes: allChanges,
                errors: phase2Result.errors
            };
        }

        console.log('[PHASE 2] Parsing successful.');

        // PHASE 3: Semantic Fixes
        console.log('[PHASE 3] Semantic and structural fixes...');
        const phase3Result = this.phase3_semanticFixes(phase1Result.lines, phase2Result.parsed, aggressive);
        allChanges.push(...phase3Result.changes);
        fixedContent = phase3Result.lines.join('\n');

        console.log(`[PHASE 3] Complete. Applied ${phase3Result.changes.length} semantic fixes.`);

        // PHASE 3B: Structural Reorganization (only in aggressive mode)
        if (aggressive) {
            console.log('[PHASE 3B] Aggressive structural reorganization...');
            const structuralResult = this.phase3b_structuralFixes(phase2Result.parsed);
            fixedContent = structuralResult.content;
            if (structuralResult.explanation && structuralResult.explanation !== 'No structural changes needed') {
                allChanges.push({
                    type: 'STRUCTURE',
                    line: 0,
                    original: '',
                    fixed: '',
                    reason: structuralResult.explanation,
                    severity: 'warning'
                });
            }
            console.log(`[PHASE 3B] Complete. ${structuralResult.explanation}`);
        }

        console.log(`[YAML FIXER] Pipeline complete. Total fixes: ${allChanges.length}`);

        return {
            content: fixedContent,
            fixedCount: allChanges.length,
            changes: allChanges,
            errors: []
        };
    }

    /**
     * Validate Method - Reports issues without fixing
     */
    public validate(content: string, _options: ValidationOptions = {}): ValidationResult {
        const errors: ValidationError[] = [];
        const structuralIssues: StructuralIssue[] = [];

        // Run Phase 1 to detect syntax issues
        const phase1Result = this.phase1_syntaxNormalization(content);
        phase1Result.changes.forEach(change => {
            errors.push({
                line: change.line,
                message: change.reason,
                severity: change.severity,
                code: change.type,
                fixable: true
            });
        });

        // Run Phase 2 to detect parsing issues
        const phase2Result = this.phase2_parseValidation(content);
        errors.push(...phase2Result.errors);

        return {
            valid: errors.length === 0 && structuralIssues.length === 0,
            errors,
            structuralIssues
        };
    }

    /**
     * Legacy method for structural fixes (kept for compatibility)
     */
    public fixStructural(content: string, _k8sKind: string = 'Deployment'): StructuralFixResult {
        try {
            const parsed = yaml.load(content) as any;
            if (!parsed) {
                return { content, restructuredLines: [], explanation: 'Empty document' };
            }

            const result = this.phase3b_structuralFixes(parsed);
            return {
                content: result.content,
                restructuredLines: [],
                explanation: result.explanation
            };
        } catch (e) {
            return {
                content,
                restructuredLines: [],
                explanation: 'Failed to restructure: ' + (e as Error).message
            };
        }
    }
}
