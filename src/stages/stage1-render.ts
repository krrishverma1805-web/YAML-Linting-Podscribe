import type { Stage, LintContext } from '../types/index.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export class RenderStage implements Stage {
    name = 'Stage 1: Helm/Kustomize Rendering';

    async run(context: LintContext): Promise<LintContext> {
        const files = context.files;
        const renderedYamls: string[] = [];

        for (const file of files) {
            if (fs.lstatSync(file).isDirectory()) {
                // Check for Helm
                if (fs.existsSync(path.join(file, 'Chart.yaml'))) {
                    console.log(`[${this.name}] Detected Helm chart at ${file}`);
                    try {
                        const { stdout } = await execAsync(`helm template ${file}`);
                        renderedYamls.push(stdout);
                    } catch (error: any) {
                        context.results.errors.push({
                            message: `Rendering failed: ${error.message}`,
                            severity: 'error',
                            ruleId: 'helm-render'
                        });
                        context.results.valid = false;
                    }
                    continue;
                }

                // Check for Kustomize
                if (fs.existsSync(path.join(file, 'kustomization.yaml'))) {
                    console.log(`[${this.name}] Detected Kustomize overlay at ${file}`);
                    try {
                        const { stdout } = await execAsync(`kustomize build ${file}`);
                        renderedYamls.push(stdout);
                    } catch (error: any) {
                        context.results.errors.push({
                            message: `Rendering failed: ${error.message}`,
                            severity: 'error',
                            ruleId: 'kustomize-build'
                        });
                        context.results.valid = false;
                    }
                    continue;
                }

                // Regular directory - read all yaml files
                // For now, just warn or skip, or implement recursive read. 
                // Let's assume the user passes specific files or we expand dirs in Stage 0.
                // But for this stage, if it's not a package, we might just pass it through if Stage 0 expanded it.
                // If Stage 0 didn't expand, we should probably do it here or in Stage 0.
                // Let's assume Stage 0 handles file expansion for non-renderable dirs, 
                // OR we just handle single files here.
            } else {
                // It's a file
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    renderedYamls.push(fs.readFileSync(file, 'utf8'));
                }
            }
        }

        // Store raw content for next stage
        // We'll attach it to context. 
        // Since LintContext doesn't have a raw field, we'll add it or just parse immediately in Stage 2.
        // But Stage 2 expects to run on the context. 
        // Let's add a temporary property to context or just pass it via a specialized property.
        // Actually, let's store it in `context.resources` as raw strings first? No, resources implies objects.
        // Let's add `rawYamls` to context type or just cast it.
        (context as any).rawYamls = renderedYamls;

        return context;
    }
}
