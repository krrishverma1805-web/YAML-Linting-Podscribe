import type { Stage, LintContext } from '../types/index.js';
import { SchemaLoader } from '../core/schema-loader.js';
import Ajv from 'ajv';

import addFormats from 'ajv-formats';

export class SchemaStage implements Stage {
    name = 'Stage 3: Kubernetes Schema Validation';

    async run(context: LintContext): Promise<LintContext> {
        const loader = new SchemaLoader(context.config.k8sVersion);
        // @ts-ignore
        const ajv = new Ajv({ strict: false, allErrors: true });

        // Handle ESM/CJS interop for ajv-formats
        // @ts-ignore
        if (typeof addFormats === 'function') {
            (addFormats as any)(ajv);
            // @ts-ignore
        } else if (typeof addFormats.default === 'function') {
            // @ts-ignore
            (addFormats as any).default(ajv);
        } else {
            console.warn('Could not load ajv-formats');
        }

        // Add Kubernetes specific formats that ajv-formats doesn't cover
        ajv.addFormat('int32', { type: 'number', validate: () => true });
        ajv.addFormat('int64', { type: 'number', validate: () => true });
        ajv.addFormat('float', { type: 'number', validate: () => true });
        ajv.addFormat('double', { type: 'number', validate: () => true });
        ajv.addFormat('byte', { type: 'string', validate: () => true });

        // Cache compiled validators
        const validators = new Map<string, any>();

        for (const doc of context.resources) {
            if (!doc.kind || !doc.apiVersion) continue;

            const key = `${doc.kind}-${doc.apiVersion}`;
            let validate = validators.get(key);

            if (!validate) {
                const schema = await loader.getSchema(doc.kind, doc.apiVersion);
                if (schema) {
                    try {
                        validate = ajv.compile(schema);
                        validators.set(key, validate);
                    } catch (e: any) {
                        console.warn(`[${this.name}] Failed to compile schema for ${key}: ${e.message}`);
                    }
                } else {
                    // Schema not found - maybe warn?
                    // console.warn(`[${this.name}] Schema not found for ${key}`);
                }
            }

            if (validate) {
                const valid = validate(doc);
                if (!valid) {
                    validate.errors.forEach((err: any) => {
                        context.results.errors.push({
                            message: `Schema Error: ${err.message} (${err.instancePath})`,
                            severity: 'error',
                            field: err.instancePath,
                            ruleId: 'schema-validation'
                        });
                    });
                    context.results.valid = false;
                }
            }
        }

        return context;
    }
}
