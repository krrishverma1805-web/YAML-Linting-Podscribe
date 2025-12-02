import type { Stage, LintContext } from '../types/index.js';

export class Pipeline {
    private stages: Stage[] = [];

    addStage(stage: Stage): void {
        this.stages.push(stage);
    }

    async run(initialContext: LintContext): Promise<LintContext> {
        let context = initialContext;

        for (const stage of this.stages) {
            try {
                // console.log(`Running stage: ${stage.name}`);
                context = await stage.run(context);
            } catch (error: any) {
                console.error(`[Pipeline] Stage ${stage.name} failed:`, error);
                context.results.errors.push({
                    message: `Internal Error in ${stage.name}: ${error.message}`,
                    severity: 'error'
                });
                context.results.valid = false;
                // Decide if we should stop or continue. Usually stop on pipeline error.
                break;
            }
        }

        return context;
    }
}
