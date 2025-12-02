import type { Stage, LintContext } from '../types/index.js';
import yaml from 'js-yaml';

export class ParseStage implements Stage {
    name = 'Stage 2: YAML Structural Parse';

    async run(context: LintContext): Promise<LintContext> {
        const rawYamls = (context as any).rawYamls as string[] || [];
        const parsedResources: any[] = [];

        for (const content of rawYamls) {
            try {
                yaml.loadAll(content, (doc) => {
                    if (doc) {
                        parsedResources.push(doc);
                    }
                });
            } catch (error: any) {
                context.results.errors.push({
                    message: `YAML Parse Error: ${error.message}`,
                    severity: 'error',
                    line: error.mark?.line,
                    file: 'input' // TODO: Track filenames better
                });
                context.results.valid = false;
            }
        }

        context.resources = parsedResources;
        context.results.resourceCount = parsedResources.length;

        console.log(`[${this.name}] Parsed ${parsedResources.length} resources.`);

        return context;
    }
}
