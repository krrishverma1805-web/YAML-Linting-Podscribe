import type { Stage, LintContext } from '../types/index.js';
import fs from 'fs';
// import path from 'path';
import yaml from 'js-yaml';
import { glob } from 'glob';

export class PolicyStage implements Stage {
    name = 'Stage 7: Policy-as-Code Evaluation';

    async run(context: LintContext): Promise<LintContext> {
        const policyDir = context.config.policyDir;
        if (!policyDir || !fs.existsSync(policyDir)) {
            // console.log(`[${this.name}] No policy directory specified or found. Skipping.`);
            return context;
        }

        const policyFiles = await glob(`${policyDir}/*.yaml`);
        console.log(`[${this.name}] Loaded ${policyFiles.length} policies.`);

        for (const policyFile of policyFiles) {
            try {
                const policyContent = fs.readFileSync(policyFile, 'utf8');
                const policy = yaml.load(policyContent) as any;

                if (policy && policy.kind === 'ClusterPolicy') {
                    this.evaluatePolicy(policy, context);
                }
            } catch (e: any) {
                console.warn(`Failed to load policy ${policyFile}: ${e.message}`);
            }
        }

        return context;
    }

    private evaluatePolicy(policy: any, context: LintContext) {
        // Simple Kyverno-like simulation
        // Supports 'validate' rules with 'pattern'

        if (!policy.spec?.rules) return;

        for (const rule of policy.spec.rules) {
            if (!rule.validate) continue;

            const match = rule.match?.resources;
            if (!match) continue;

            for (const doc of context.resources) {
                if (this.matches(doc, match)) {
                    // Validate
                    if (rule.validate.pattern) {
                        if (!this.validatePattern(doc, rule.validate.pattern)) {
                            context.results.errors.push({
                                message: `Policy Violation: ${rule.name} - ${rule.validate.message || 'Validation failed'}`,
                                severity: 'error',
                                ruleId: `policy-${policy.metadata.name}-${rule.name}`,
                                field: 'spec' // Simplified
                            });
                            context.results.valid = false;
                        }
                    }
                }
            }
        }
    }

    private matches(doc: any, match: any): boolean {
        if (match.kinds && !match.kinds.includes(doc.kind)) return false;
        // Add more matching logic (namespaces, labels)
        return true;
    }

    private validatePattern(doc: any, pattern: any): boolean {
        // Recursive check if pattern exists in doc
        for (const key in pattern) {
            if (pattern[key] === '*') return true; // Wildcard

            if (typeof pattern[key] === 'object' && pattern[key] !== null) {
                if (!doc[key] || typeof doc[key] !== 'object') return false;
                if (!this.validatePattern(doc[key], pattern[key])) return false;
            } else {
                if (doc[key] !== pattern[key]) return false;
            }
        }
        return true;
    }
}
