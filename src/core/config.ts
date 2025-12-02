import fs from 'fs';
// import path from 'path';
import yaml from 'js-yaml';
import type { LintConfig } from '../types/index.js';

const DEFAULT_CONFIG: LintConfig = {
    k8sVersion: '1.29.0',
    environment: 'dev',
    skipServerValidation: false,
    outputFormat: 'text',
    severityThreshold: 'warning',
};

export function loadConfig(configPath?: string): Partial<LintConfig> {
    if (!configPath) {
        // Try default locations
        const defaults = ['.k8s-lint.yaml', '.k8s-lint.yml', 'k8s-lint.yaml'];
        for (const p of defaults) {
            if (fs.existsSync(p)) {
                configPath = p;
                break;
            }
        }
    }

    if (configPath && fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const parsed = yaml.load(content) as Partial<LintConfig>;
            return parsed;
        } catch (error) {
            console.error(`Error loading config from ${configPath}:`, error);
            return {};
        }
    }

    return {};
}

export function mergeConfig(cliOptions: Partial<LintConfig>, fileConfig: Partial<LintConfig>): LintConfig {
    return {
        ...DEFAULT_CONFIG,
        ...fileConfig,
        ...cliOptions,
    };
}
