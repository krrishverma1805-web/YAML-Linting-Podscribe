import chalk from 'chalk';
import type { LintResult, LintError } from '../types/index.js';

export class Reporter {
    private format: 'json' | 'sarif' | 'text';

    constructor(format: 'json' | 'sarif' | 'text' = 'text') {
        this.format = format;
    }

    report(result: LintResult): void {
        if (this.format === 'json') {
            console.log(JSON.stringify(result, null, 2));
            return;
        }

        if (this.format === 'sarif') {
            console.log(JSON.stringify(this.toSarif(result), null, 2));
            return;
        }

        this.printText(result);
    }

    private printText(result: LintResult): void {
        console.log(chalk.bold('\nKubernetes YAML Lint Report'));
        console.log('============================\n');

        if (result.valid && result.warnings.length === 0) {
            console.log(chalk.green('✓ All checks passed! No errors or warnings found.'));
            return;
        }

        if (result.errors.length > 0) {
            console.log(chalk.red.bold(`Found ${result.errors.length} Errors:`));
            result.errors.forEach(err => this.printError(err));
            console.log('');
        }

        if (result.warnings.length > 0) {
            console.log(chalk.yellow.bold(`Found ${result.warnings.length} Warnings:`));
            result.warnings.forEach(warn => this.printError(warn));
            console.log('');
        }

        console.log(chalk.dim(`Scanned ${result.resourceCount} resources.`));

        if (!result.valid) {
            console.log(chalk.red.bold('\n✖ Validation Failed'));
            process.exitCode = 2;
            if (result.warnings.length > 0) {
                console.log(chalk.yellow('\n⚠ Validation Passed with Warnings'));
                process.exitCode = 0;
            } else {
                console.log(chalk.green('\n✔ Validation Passed'));
                process.exitCode = 0;
            }
            process.exitCode = 0;
        }
    }

    private printError(err: LintError): void {
        const icon = err.severity === 'error' ? chalk.red('✖') : chalk.yellow('⚠');
        const loc = err.file ? `${err.file}:${err.line || 0}` : 'Global';
        console.log(`  ${icon} [${err.ruleId || 'general'}] ${err.message}`);
        console.log(`    at ${chalk.cyan(loc)}`);
        if (err.remediation) {
            console.log(`    ${chalk.dim('Tip: ' + err.remediation)}`);
        }
    }

    private toSarif(result: LintResult): any {
        // Basic SARIF structure
        return {
            $schema: "https://json.schemastore.org/sarif-2.1.0.json",
            version: "2.1.0",
            runs: [{
                tool: {
                    driver: {
                        name: "k8s-yaml-lint",
                        version: "1.0.0"
                    }
                },
                results: [...result.errors, ...result.warnings].map(err => ({
                    ruleId: err.ruleId || "unknown",
                    level: err.severity === 'error' ? 'error' : 'warning',
                    message: { text: err.message },
                    locations: [{
                        physicalLocation: {
                            artifactLocation: { uri: err.file || "unknown" },
                            region: { startLine: err.line || 1 }
                        }
                    }]
                }))
            }]
        };
    }
}
