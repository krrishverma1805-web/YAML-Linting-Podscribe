import { YAMLFixer } from '../src/core/yaml-fixer.js';
import * as fs from 'fs';
import * as path from 'path';

// Simple assertion helper
const assert = (condition: boolean, message: string) => {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
};

const fixer = new YAMLFixer();

console.log('Running YAML Fixer Tests...\n');

const runTest = (name: string, input: string, expectedOutput: string | RegExp, options?: any) => {
    try {
        const result = fixer.fix(input, options);
        const normalizedOutput = result.content.trim();
        const normalizedExpected = typeof expectedOutput === 'string' ? expectedOutput.trim() : '';

        if (typeof expectedOutput === 'string') {
            if (normalizedOutput !== normalizedExpected) {
                console.error(`[FAIL] ${name}`);
                console.error('Expected:\n' + normalizedExpected);
                console.error('Actual:\n' + normalizedOutput);
                console.error('Changes:', result.changes.length);
                return false;
            }
        } else {
            if (!expectedOutput.test(normalizedOutput)) {
                console.error(`[FAIL] ${name}`);
                console.error('Output did not match regex');
                console.error('Actual:\n' + normalizedOutput);
                return false;
            }
        }
        console.log(`[PASS] ${name} (${result.changes.length} fixes)`);
        return true;
    } catch (e) {
        console.error(`[ERROR] ${name}:`, e);
        return false;
    }
};

// TEST CASES
const tests = [
    // ==========================================
    // BASIC SYNTAX FIXES
    // ==========================================
    {
        name: '1. Basic Indentation (Tabs to Spaces)',
        input: 'spec:\n\treplicas: 1',
        expected: 'spec:\n  replicas: 1'
    },
    {
        name: '2. Trailing Whitespace',
        input: 'spec:   \n  replicas: 1  ',
        expected: 'spec:\n  replicas: 1'
    },
    {
        name: '3. Colon Spacing',
        input: 'key:value',
        expected: 'key: value'
    },
    {
        name: '4. List Spacing',
        input: '-item',
        expected: '- item'
    },
    {
        name: '5. Unclosed Double Quotes',
        input: 'name: "foo',
        expected: 'name: "foo"'
    },
    {
        name: '6. Unclosed Single Quotes',
        input: "name: 'foo",
        expected: "name: 'foo'"
    },

    // ==========================================
    // MISSING COLON DETECTION
    // ==========================================
    {
        name: '7. Missing Colon - apiVersion v1',
        input: 'apiVersion v1',
        expected: 'apiVersion: v1'
    },
    {
        name: '8. Missing Colon - name app',
        input: 'name app',
        expected: 'name: app'
    },
    {
        name: '9. Missing Colon - kind Service',
        input: 'kind Service',
        expected: 'kind: Service'
    },
    {
        name: '10. Missing Colon - restartPolicy Always',
        input: 'restartPolicy Always',
        expected: 'restartPolicy: Always'
    },
    {
        name: '11. Missing Colon - containerPort 80',
        input: 'containerPort 80',
        expected: 'containerPort: 80'
    },
    {
        name: '12. Missing Colon - path config.yaml',
        input: 'path config.yaml',
        expected: 'path: config.yaml'
    },
    {
        name: '13. Missing Colon - Single Word (spec)',
        input: 'spec\n  replicas: 1',
        expected: 'spec:\n  replicas: 1'
    },

    // ==========================================
    // MISSING SPACE DETECTION
    // ==========================================
    {
        name: '14. Missing Space After Colon - protocol:TCP',
        input: 'protocol:TCP',
        expected: 'protocol: TCP'
    },
    {
        name: '15. Missing Space After Colon - type:LoadBalancer',
        input: 'type:LoadBalancer',
        expected: 'type: LoadBalancer'
    },
    {
        name: '16. Missing Space After List Marker - -effect: NoSchedule',
        input: '-effect: NoSchedule',
        expected: '- effect: NoSchedule'
    },

    // ==========================================
    // LIST ITEM FIXES
    // ==========================================
    {
        name: '17. List Item Missing Colon - name nginx',
        input: '- name nginx',
        expected: '- name: nginx'
    },
    {
        name: '18. List Item Missing Colon - containerPort 80',
        input: '- containerPort 80',
        expected: '- containerPort: 80'
    },

    // ==========================================
    // COMMON TYPO NORMALIZATION
    // ==========================================
    {
        name: '19. Typo Fix - met -> metadata',
        input: 'met:\n  name: foo',
        expected: 'metadata:\n  name: foo'
    },
    {
        name: '20. Typo Fix - meta -> metadata',
        input: 'meta:\n  name: foo',
        expected: 'metadata:\n  name: foo'
    },
    {
        name: '21. Typo Fix - metdata -> metadata',
        input: 'metdata:\n  name: foo',
        expected: 'metadata:\n  name: foo'
    },
    {
        name: '22. Typo Fix - contianers -> containers',
        input: 'contianers:\n  - name: app',
        expected: 'containers:\n  - name: app'
    },
    {
        name: '23. Typo Fix - volumns -> volumes',
        input: 'volumns:\n  - name: data',
        expected: 'volumes:\n  - name: data'
    },
    {
        name: '24. Typo Fix - specf -> spec',
        input: 'specf:\n  replicas: 1',
        expected: 'spec:\n  replicas: 1'
    },

    // ==========================================
    // SEMANTIC FIXES
    // ==========================================
    {
        name: '25. Numeric Coercion - String to Number',
        input: 'replicas: "3"',
        expected: 'replicas: 3'
    },
    {
        name: '26. Numeric Coercion - Word to Number',
        input: 'replicas: three',
        expected: 'replicas: 3'
    },
    {
        name: '27. Numeric Field - containerPort',
        input: 'containerPort: "80"',
        expected: 'containerPort: 80'
    },

    // ==========================================
    // COMPLEX SCENARIOS
    // ==========================================
    {
        name: '28. Mixed Issues',
        input: 'apiVersion v1\nkind: Deployment\nmet\n  name: broken-app',
        expected: 'apiVersion: v1\nkind: Deployment\nmetadata:\n  name: broken-app'
    },
    {
        name: '29. Multiple Missing Colons',
        input: 'apiVersion v1\nkind Service\nmetadata\n  name my-service',
        expected: 'apiVersion: v1\nkind: Service\nmetadata:\n  name: my-service'
    },
    {
        name: '30. List with Multiple Issues',
        input: 'ports:\n-containerPort 80\nprotocol:TCP',
        expected: 'ports:\n- containerPort: 80\n  protocol: TCP'
    },

    // ==========================================
    // EDGE CASES
    // ==========================================
    {
        name: '31. URL Handling (No Colon Space)',
        input: 'url: http://example.com',
        expected: 'url: http://example.com'
    },
    {
        name: '32. Comment Handling',
        input: 'spec: # comment\n  replicas: 1',
        expected: 'spec: # comment\n  replicas: 1'
    },
    {
        name: '33. Empty Lines',
        input: 'spec:\n\n  replicas: 1',
        expected: 'spec:\n\n  replicas: 1'
    },
    {
        name: '34. Document Separator',
        input: '---\napiVersion: v1',
        expected: '---\napiVersion: v1'
    },
    {
        name: '35. Anchor/Alias',
        input: 'common: &base\n  app: foo\nused: *base',
        expected: 'common: &base\n  app: foo\nused: *base'
    }
];

// Run all tests
let passed = 0;
tests.forEach(t => {
    if (runTest(t.name, t.input, t.expected)) passed++;
});

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passed}/${tests.length} passed (${Math.round(passed / tests.length * 100)}%)`);

// ==========================================
// SEVERELY BROKEN YAML TEST
// ==========================================
console.log('\n' + '='.repeat(60));
console.log('Testing Severely Broken Deployment + Service YAML...\n');

const brokenYamlPath = path.join(__dirname, 'fixtures', 'broken-deployment-service.yaml');
if (fs.existsSync(brokenYamlPath)) {
    const brokenYaml = fs.readFileSync(brokenYamlPath, 'utf-8');

    console.log('Original (Broken) YAML:');
    console.log('-'.repeat(60));
    console.log(brokenYaml);
    console.log('-'.repeat(60));

    const fixResult = fixer.fix(brokenYaml);

    console.log('\nFixed YAML:');
    console.log('-'.repeat(60));
    console.log(fixResult.content);
    console.log('-'.repeat(60));

    console.log(`\nTotal Fixes Applied: ${fixResult.fixedCount}`);
    console.log('\nDetailed Changes:');
    fixResult.changes.forEach((change, idx) => {
        console.log(`${idx + 1}. Line ${change.line} [${change.type}] ${change.severity.toUpperCase()}: ${change.reason}`);
        if (change.original && change.fixed) {
            console.log(`   - Original: "${change.original.trim()}"`);
            console.log(`   + Fixed:    "${change.fixed.trim()}"`);
        }
    });

    // Test aggressive mode
    console.log('\n' + '='.repeat(60));
    console.log('Testing Aggressive Mode (Structural Fixes)...\n');

    const aggressiveResult = fixer.fix(brokenYaml, { aggressive: true });

    console.log('Fixed YAML (Aggressive Mode):');
    console.log('-'.repeat(60));
    console.log(aggressiveResult.content);
    console.log('-'.repeat(60));

    console.log(`\nTotal Fixes Applied: ${aggressiveResult.fixedCount}`);
    console.log('\nStructural Changes:');
    aggressiveResult.changes.filter(c => c.type === 'STRUCTURE').forEach(change => {
        console.log(`- ${change.reason}`);
    });
} else {
    console.log(`[WARNING] Broken YAML fixture not found at: ${brokenYamlPath}`);
}

console.log('\n' + '='.repeat(60));

if (passed === tests.length) {
    console.log('ALL TESTS PASSED! 🚀');
    process.exit(0);
} else {
    console.log('SOME TESTS FAILED.');
    process.exit(1);
}
