#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
// import path from 'path';
import { loadConfig, mergeConfig } from './core/config.js';
import { Pipeline } from './core/pipeline.js';
import { Reporter } from './core/reporter.js';
import { ContextStage } from './stages/stage0-context.js';
import { RenderStage } from './stages/stage1-render.js';
import { ParseStage } from './stages/stage2-parse.js';
import { SchemaStage } from './stages/stage3-schema.js';
import { GraphStage } from './stages/stage4-graph.js';
import { StaticChecksStage } from './stages/stage5-checks.js';
import { AdmissionStage } from './stages/stage6-admission.js';
import { PolicyStage } from './stages/stage7-policy.js';
import { ServerStage } from './stages/stage8-server.js';
// import type { LintConfig } from './types/index.js';

const program = new Command();

program
    .name('k8s-lint')
    .description('Production-grade Kubernetes YAML linting tool')
    .version('1.0.0');

program
    .command('scan')
    .argument('<path>', 'Path to file or directory to scan')
    .option('--k8s-version <version>', 'Kubernetes version to validate against')
    .option('--env <env>', 'Environment context (dev/staging/prod)')
    .option('--policy-dir <dir>', 'Directory containing policy files')
    .option('--crd-dir <dir>', 'Directory containing CRD schemas')
    .option('--output <format>', 'Output format (text/json/sarif)', 'text')
    .option('--severity-threshold <threshold>', 'Minimum severity to report (warning/error)', 'warning')
    .option('--skip-server-validation', 'Skip server-side validation (dry-run)', false)
    .action(async (scanPath, options) => {
        try {
            // 1. Load Config
            const fileConfig = loadConfig();
            const config = mergeConfig(options, fileConfig);

            // 2. Initialize Pipeline
            const pipeline = new Pipeline();

            // 3. Add Stages
            pipeline.addStage(new ContextStage(config, [scanPath]));
            pipeline.addStage(new RenderStage());
            pipeline.addStage(new ParseStage());
            pipeline.addStage(new SchemaStage());
            pipeline.addStage(new GraphStage());
            pipeline.addStage(new StaticChecksStage());
            pipeline.addStage(new AdmissionStage());
            pipeline.addStage(new PolicyStage());
            pipeline.addStage(new ServerStage());

            // 4. Run Pipeline
            // Initial context is minimal, Stage 0 will populate it
            const initialContext: any = { results: { valid: true, errors: [], warnings: [] } };
            const finalContext = await pipeline.run(initialContext);

            // 5. Report Results
            const reporter = new Reporter(config.outputFormat);
            reporter.report(finalContext.results);

        } catch (error) {
            console.error(chalk.red('Fatal Error:'), error);
            process.exit(1);
        }
    });

// Indentation Commands
const indentCmd = program
    .command('indent')
    .description('Manage YAML indentation');

indentCmd
    .command('check')
    .argument('<path>', 'Path to file or directory to check')
    .option('--style <style>', 'Indentation style (2, 4, or auto)', 'auto')
    .action(async (checkPath, options) => {
        try {
            const { IndentationValidator } = await import('./stages/indentation-validator.js');
            const fs = await import('fs');
            const glob = await import('glob');

            const validator = new IndentationValidator();
            let files: string[] = [];

            if (fs.statSync(checkPath).isDirectory()) {
                files = glob.sync(`${checkPath}/**/*.{yaml,yml}`);
            } else {
                files = [checkPath];
            }

            let hasErrors = false;

            for (const file of files) {
                const content = fs.readFileSync(file, 'utf-8');
                const result = validator.validate(content, { style: options.style as any });

                if (!result.valid) {
                    hasErrors = true;
                    console.log(chalk.bold.underline(file));
                    for (const error of result.errors) {
                        const color = error.severity === 'error' ? chalk.red : chalk.yellow;
                        console.log(`  ${color(error.severity.toUpperCase())} Line ${error.line}:${error.column} - ${error.message}`);
                    }
                    console.log('');
                }
            }

            if (hasErrors) {
                process.exit(1);
            } else {
                console.log(chalk.green('All files have correct indentation!'));
            }
        } catch (error) {
            console.error(chalk.red('Error:'), error);
            process.exit(1);
        }
    });

indentCmd
    .command('fix')
    .argument('<path>', 'Path to file or directory to fix')
    .option('--style <style>', 'Indentation style (2, 4, or auto)', 'auto')
    .option('--dry-run', 'Preview changes without modifying files')
    .option('--diff', 'Show unified diff')
    .option('--fix-trailing-spaces', 'Remove trailing whitespace', true)
    .action(async (fixPath, options) => {
        try {
            const { IndentationValidator } = await import('./stages/indentation-validator.js');
            const fs = await import('fs');
            const glob = await import('glob');

            const validator = new IndentationValidator();
            let files: string[] = [];

            if (fs.statSync(fixPath).isDirectory()) {
                files = glob.sync(`${fixPath}/**/*.{yaml,yml}`);
            } else {
                files = [fixPath];
            }

            for (const file of files) {
                const content = fs.readFileSync(file, 'utf-8');
                const result = validator.fix(content, {
                    style: options.style as any,
                    fixTrailingSpaces: options.fixTrailingSpaces
                });

                if (result.fixedCount > 0) {
                    console.log(chalk.bold(file));
                    console.log(chalk.blue(`  Fixed ${result.fixedCount} indentation issues.`));

                    if (options.diff) {
                        console.log(chalk.gray('  Changes:'));
                        for (const change of result.changes) {
                            console.log(chalk.red(`  - Line ${change.line}: ${change.original.trimEnd()}`));
                            console.log(chalk.green(`  + Line ${change.line}: ${change.fixed.trimEnd()}`));
                        }
                    }

                    if (!options.dryRun) {
                        fs.writeFileSync(file, result.content);
                        console.log(chalk.green('  Saved changes.'));
                    } else {
                        console.log(chalk.yellow('  Dry run - no changes saved.'));
                    }
                    console.log('');
                }
            }
        } catch (error) {
            console.error(chalk.red('Error:'), error);
            process.exit(1);
        }
    });

program.parse();
