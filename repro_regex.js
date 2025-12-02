
const regex = /^(\s*[\w-]+):(?!\s)(\S.*)/;

const testCases = [
    { input: "key:value", expected: "key: value" },
    { input: "key: value", expected: null }, // Already correct
    { input: "apiVersion:v1", expected: "apiVersion: v1" },
    { input: "image:nginx:1.14.2", expected: "image: nginx:1.14.2" },
    { input: "  key:value", expected: "  key: value" },
    { input: "key:http://example.com", expected: "key: http://example.com" }, // Should match regex but be filtered by logic
    { input: "my-key:value", expected: "my-key: value" },
    { input: "key:", expected: null }, // No value
    { input: "key: ", expected: null }, // Trailing space, correct
    { input: "# comment", expected: null },
];

testCases.forEach(({ input, expected }) => {
    const match = input.match(regex);
    if (match) {
        const keyPart = match[1];
        const valuePart = match[2];

        // Logic from validator
        if (!keyPart.trim().match(/^https?$/)) {
            const fixed = `${keyPart}: ${valuePart}`;
            console.log(`Input: "${input}" -> Fixed: "${fixed}" | Expected: "${expected}" | ${fixed === expected ? 'PASS' : 'FAIL'}`);
        } else {
            console.log(`Input: "${input}" -> Skipped (URL check) | Expected: "${expected}" | ${expected === null ? 'PASS' : 'FAIL'}`);
        }
    } else {
        console.log(`Input: "${input}" -> No Match | Expected: "${expected}" | ${expected === null ? 'PASS' : 'FAIL'}`);
    }
});
