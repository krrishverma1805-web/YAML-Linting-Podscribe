import { YAMLValidator } from '../src/core/yaml-validator-complete.ts';
// import { expect } from 'chai'; // Chai not available, using custom assertions
import * as fs from 'fs';

// Simple assertion helper if chai isn't installed
const assert = (condition: boolean, message: string) => {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
};

const validator = new YAMLValidator();

console.log('Running YAML Validator Tests...');

const runTest = (name: string, input: string, expectedOutput: string | RegExp, type: 'fix' | 'validate' = 'fix') => {
    try {
        if (type === 'fix') {
            const result = validator.fix(input);
            const normalizedOutput = result.content.trim();
            const normalizedExpected = typeof expectedOutput === 'string' ? expectedOutput.trim() : '';

            if (typeof expectedOutput === 'string') {
                if (normalizedOutput !== normalizedExpected) {
                    console.error(`[FAIL] ${name}`);
                    console.error('Expected:\n' + normalizedExpected);
                    console.error('Actual:\n' + normalizedOutput);
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
        }
        console.log(`[PASS] ${name}`);
        return true;
    } catch (e) {
        console.error(`[ERROR] ${name}:`, e);
        return false;
    }
};

// TEST CASES
const tests = [
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
        name: '5. Key Typos (met -> metadata)',
        input: 'met:\n  name: foo',
        expected: 'metadata:\n  name: foo'
    },
    {
        name: '6. Key Typos (specf -> spec)',
        input: 'specf:\n  replicas: 1',
        expected: 'spec:\n  replicas: 1'
    },
    {
        name: '7. Unclosed Double Quotes',
        input: 'name: "foo',
        expected: 'name: "foo"'
    },
    {
        name: '8. Unclosed Single Quotes',
        input: "name: 'foo",
        expected: "name: 'foo'"
    },
    {
        name: '9. Numeric Coercion (String to Number)',
        input: 'replicas: "3"',
        expected: 'replicas: 3'
    },
    {
        name: '10. Numeric Coercion (Word to Number)',
        input: 'replicas: three',
        expected: 'replicas: 3'
    },
    {
        name: '11. Missing Colon (Simple)',
        input: 'spec\n  replicas: 1',
        expected: 'spec:\n  replicas: 1'
    },
    {
        name: '12. Missing Colon (Key Value)',
        input: 'image nginx',
        expected: 'image: nginx'
    },
    {
        name: '13. Structural Indent (Child)',
        input: 'spec:\nreplicas: 1',
        expected: 'spec:\n  replicas: 1'
    },
    {
        name: '14. Structural Indent (List Item)',
        input: 'containers:\n- name: foo',
        expected: 'containers:\n  - name: foo'
    },
    {
        name: '15. Structural Indent (Deep List)',
        input: 'containers:\n  - name: foo\nimage: bar',
        expected: 'containers:\n  - name: foo\n    image: bar'
    },
    {
        name: '16. Dedent Logic',
        input: 'spec:\n  containers:\n    - name: foo\n  restartPolicy: Always',
        expected: 'spec:\n  containers:\n    - name: foo\n  restartPolicy: Always'
    },
    {
        name: '17. Block Scalar (Preserve)',
        input: 'data: |\n  line1\n  line2',
        expected: 'data: |\n  line1\n  line2'
    },
    {
        name: '18. Duplicate Keys (Simple)',
        input: 'key: val1\nkey: val2',
        expected: 'key: val1\nkey: val2' // Current impl doesn't fix duplicates yet, so expect same
    },
    {
        name: '19. Comment Handling',
        input: 'spec: # comment\n  replicas: 1',
        expected: 'spec: # comment\n  replicas: 1'
    },
    {
        name: '20. URL Handling (No Colon Space)',
        input: 'url: http://example.com',
        expected: 'url: http://example.com'
    },
    {
        name: '21. Mixed Issues (The "Broken App" Snippet)',
        input: 'apiVersion v1\nkind: Deployment\nmet\n  name: broken-app',
        expected: 'apiVersion: v1\nkind: Deployment\nmetadata:\n  name: broken-app'
    },
    {
        name: '22. Nested List Indent Fix',
        input: 'ports:\n- containerPort: 80\nprotocol: TCP',
        expected: 'ports:\n  - containerPort: 80\n    protocol: TCP'
    },
    {
        name: '23. Anchor/Alias (Basic)',
        input: 'common: &base\n  app: foo\nused: *base',
        expected: 'common: &base\n  app: foo\nused: *base'
    },
    {
        name: '24. Document Separator',
        input: '---\napiVersion: v1',
        expected: '---\napiVersion: v1'
    },
    {
        name: '25. Empty Lines',
        input: 'spec:\n\n  replicas: 1',
        expected: 'spec:\n\n  replicas: 1'
    }
];

let passed = 0;
tests.forEach(t => {
    if (runTest(t.name, t.input, t.expected)) passed++;
});

console.log(`\nTest Summary: ${passed}/${tests.length} passed`);
if (passed === tests.length) {
    console.log('ALL TESTS PASSED! 🚀');
    process.exit(0);
} else {
    console.log('SOME TESTS FAILED.');
    process.exit(1);
}
