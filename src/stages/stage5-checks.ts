import type { Stage, LintContext } from '../types/index.js';

export class StaticChecksStage implements Stage {
    name = 'Stage 5: Context-Aware Static Checks';

    async run(context: LintContext): Promise<LintContext> {
        const isProd = context.config.environment === 'prod';

        for (const doc of context.resources) {
            if (!doc.kind) continue;

            // Check Pod specs (Pod, Deployment, etc.)
            const podSpec = this.getPodSpec(doc);
            if (podSpec) {
                this.checkProbes(podSpec, doc, context, isProd);
            }
        }

        return context;
    }

    private getPodSpec(doc: any): any {
        if (doc.kind === 'Pod') return doc.spec;
        if (doc.kind === 'Deployment' || doc.kind === 'StatefulSet' || doc.kind === 'DaemonSet' || doc.kind === 'Job') {
            return doc.spec?.template?.spec;
        }
        if (doc.kind === 'CronJob') {
            return doc.spec?.jobTemplate?.spec?.template?.spec;
        }
        return null;
    }

    private checkProbes(spec: any, _doc: any, context: LintContext, isProd: boolean) {
        if (!spec.containers) return;

        spec.containers.forEach((container: any, idx: number) => {
            // 1. no-latest-tag
            if (container.image && (container.image.endsWith(':latest') || !container.image.includes(':'))) {
                context.results.warnings.push({
                    message: `Container '${container.name}' uses 'latest' tag or missing tag`,
                    severity: isProd ? 'error' : 'warning',
                    ruleId: 'no-latest-tag',
                    field: `containers[${idx}].image`
                });
            }

            // 2. unset-cpu-requests
            if (!container.resources?.requests?.cpu) {
                context.results.warnings.push({
                    message: `Container '${container.name}' missing CPU requests`,
                    severity: isProd ? 'error' : 'warning',
                    ruleId: 'unset-cpu-requests',
                    field: `containers[${idx}].resources.requests.cpu`
                });
            }

            // 3. privileged-container
            if (container.securityContext?.privileged) {
                context.results.errors.push({
                    message: `Container '${container.name}' is privileged`,
                    severity: 'error',
                    ruleId: 'privileged-container',
                    field: `containers[${idx}].securityContext.privileged`
                });
            }

            // 4. missing-probes
            if (!container.livenessProbe && !container.readinessProbe) {
                context.results.warnings.push({
                    message: `Container '${container.name}' missing liveness/readiness probes`,
                    severity: isProd ? 'error' : 'warning',
                    ruleId: 'missing-probes',
                    field: `containers[${idx}]`
                });
            }
        });

        // 5. run-as-root
        const runAsNonRoot = spec.securityContext?.runAsNonRoot || spec.containers.some((c: any) => c.securityContext?.runAsNonRoot);
        if (!runAsNonRoot) {
            context.results.warnings.push({
                message: `Pod/Container should set runAsNonRoot: true`,
                severity: isProd ? 'error' : 'warning',
                ruleId: 'run-as-root',
                field: 'spec.securityContext'
            });
        }
    }
}
