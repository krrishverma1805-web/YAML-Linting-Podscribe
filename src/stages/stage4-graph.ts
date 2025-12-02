import type { Stage, LintContext } from '../types/index.js';

export class GraphStage implements Stage {
    name = 'Stage 4: Semantic Graph Analysis';

    async run(context: LintContext): Promise<LintContext> {
        const resources = context.resources;
        const services = resources.filter(r => r.kind === 'Service');
        const pods = resources.filter(r => r.kind === 'Pod' || r.kind === 'Deployment' || r.kind === 'StatefulSet' || r.kind === 'DaemonSet');
        const pvcs = resources.filter(r => r.kind === 'PersistentVolumeClaim');
        // const storageClasses = resources.filter(r => r.kind === 'StorageClass');
        const serviceAccounts = resources.filter(r => r.kind === 'ServiceAccount');

        // 1. Check Service Selectors
        for (const svc of services) {
            if (!svc.spec?.selector) continue;

            const selector = svc.spec.selector;
            let matched = false;

            for (const pod of pods) {
                const podLabels = pod.metadata?.labels || (pod.spec?.template?.metadata?.labels);
                if (!podLabels) continue;

                // Check if all selector labels exist in pod labels
                const isMatch = Object.entries(selector).every(([key, val]) => podLabels[key] === val);
                if (isMatch) {
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                context.results.warnings.push({
                    message: `Service ${svc.metadata.name} selector does not match any workloads in this scan`,
                    severity: 'warning',
                    ruleId: 'orphaned-service',
                    file: 'unknown' // We need to track file source better
                });
            }
        }

        // 2. Check PVC StorageClass
        for (const pvc of pvcs) {
            const scName = pvc.spec?.storageClassName;
            if (scName) {
                // const scExists = context.resources.some(r => r.kind === 'StorageClass' && r.metadata?.name === scName);
                // Note: StorageClasses might be cluster-wide and not in the scan. 
                // So we only warn if we are scanning a full cluster dump or if we are sure.
                // For now, let's skip unless we have a flag or if we are in strict mode.
            }
        }

        // 3. Check ServiceAccount
        for (const pod of pods) {
            const saName = pod.spec?.serviceAccountName || pod.spec?.template?.spec?.serviceAccountName;
            if (saName && saName !== 'default') {
                const saExists = serviceAccounts.some(sa => sa.metadata.name === saName);
                if (!saExists) {
                    // Again, SA might exist in the cluster but not in the scan.
                    // But usually for a helm chart, it should be there.
                    context.results.warnings.push({
                        message: `ServiceAccount ${saName} referenced by ${pod.metadata.name} not found in scan`,
                        severity: 'warning',
                        ruleId: 'missing-service-account'
                    });
                }
            }
        }

        return context;
    }
}
