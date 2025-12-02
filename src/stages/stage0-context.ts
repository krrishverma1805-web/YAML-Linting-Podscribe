import type { Stage, LintContext, LintConfig } from '../types/index.js';

export class ContextStage implements Stage {
    name = 'Stage 0: Environment Context Detection';

    private config: LintConfig;
    private files: string[];

    constructor(config: LintConfig, files: string[]) {
        this.config = config;
        this.files = files;
    }

    async run(context: LintContext): Promise<LintContext> {
        // In a real pipeline, this might be where we do more complex setup
        // But since we pass config in constructor or init, this stage might just validate it
        // or set up the initial state.

        console.log(`[${this.name}] Initializing context for environment: ${this.config.environment}`);
        console.log(`[${this.name}] Kubernetes Version: ${this.config.k8sVersion}`);

        // Initialize empty results
        context.results = {
            valid: true,
            errors: [],
            warnings: [],
            resourceCount: 0,
            resources: []
        };

        context.files = this.files;
        context.config = this.config;
        context.schemas = new Map();

        return context;
    }
}
