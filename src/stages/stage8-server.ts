import type { Stage, LintContext } from '../types/index.js';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

export class ServerStage implements Stage {
    name = 'Stage 8: Server-Side Validation';

    async run(context: LintContext): Promise<LintContext> {
        if (context.config.skipServerValidation) {
            console.log(`[${this.name}] Skipped due to configuration.`);
            return context;
        }

        // We need to write resources to a temp file to apply
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'k8s-lint-'));
        // const tempFile = path.join(tempDir, 'resources.yaml');

        // Re-serialize resources
        // Note: We might want to use the original raw YAMLs if we didn't modify them
        // But if we mutated them (e.g. in policy stage), we should use the objects.
        // For now, let's use the objects.
        // We need a yaml dumper.
        // import yaml from 'js-yaml'; // Need to import if used

        // Since we didn't import yaml here, let's skip re-serialization for now and assume we check individual files
        // or just skip this stage implementation detail for the MVP if we don't have a robust way to dump.
        // Actually, let's just use the input files if they were files.

        // Better approach for MVP:
        // If we have raw files, run kubectl apply --dry-run=server -f <file>

        for (const file of context.files) {
            if (fs.existsSync(file) && (file.endsWith('.yaml') || file.endsWith('.yml'))) {
                try {
                    await execAsync(`kubectl apply --dry-run=server -f ${file}`);
                    // console.log(`[${this.name}] ${file} passed server validation.`);
                } catch (error: any) {
                    context.results.errors.push({
                        message: `Server Validation Failed: ${error.message}`,
                        severity: 'error',
                        file: file
                    });
                    context.results.valid = false;
                }
            }
        }

        // Cleanup
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) { }

        return context;
    }
}
