import type { Stage, LintContext } from '../types/index.js';

export class AdmissionStage implements Stage {
    name = 'Stage 6: Admission Controller Simulation';

    async run(context: LintContext): Promise<LintContext> {
        // Simulate Pod Security Standards (PSS)
        // Baseline policy checks

        for (const doc of context.resources) {
            if (!doc.kind) continue;

            const podSpec = this.getPodSpec(doc);
            if (podSpec) {
                this.checkPSS(podSpec, doc, context);
            }
        }

        return context;
    }

    private getPodSpec(doc: any): any {
        if (doc.kind === 'Pod') return doc.spec;
        if (doc.kind === 'Deployment' || doc.kind === 'StatefulSet' || doc.kind === 'DaemonSet' || doc.kind === 'Job') {
            return doc.spec?.template?.spec;
        }
        return null;
    }

    private checkPSS(spec: any, _doc: any, context: LintContext) {
        // Host Namespaces
        if (spec.hostNetwork) {
            context.results.warnings.push({
                message: `PSS Violation: HostNetwork is not allowed in Baseline policy`,
                severity: 'warning',
                ruleId: 'pss-host-network',
                field: 'spec.hostNetwork'
            });
        }
        if (spec.hostPID) {
            context.results.warnings.push({
                message: `PSS Violation: HostPID is not allowed in Baseline policy`,
                severity: 'warning',
                ruleId: 'pss-host-pid',
                field: 'spec.hostPID'
            });
        }
        if (spec.hostIPC) {
            context.results.warnings.push({
                message: `PSS Violation: HostIPC is not allowed in Baseline policy`,
                severity: 'warning',
                ruleId: 'pss-host-ipc',
                field: 'spec.hostIPC'
            });
        }

        // Privileged containers (Restricted)
        if (spec.containers) {
            spec.containers.forEach((c: any, idx: number) => {
                if (c.securityContext?.privileged) {
                    context.results.errors.push({
                        message: `PSS Violation: Privileged containers are disallowed`,
                        severity: 'error',
                        ruleId: 'pss-privileged',
                        field: `containers[${idx}].securityContext.privileged`
                    });
                }

                // Capabilities
                if (c.securityContext?.capabilities?.add?.includes('SYS_ADMIN')) {
                    context.results.errors.push({
                        message: `PSS Violation: SYS_ADMIN capability is disallowed`,
                        severity: 'error',
                        ruleId: 'pss-capabilities',
                        field: `containers[${idx}].securityContext.capabilities`
                    });
                }
            });
        }
    }
}
