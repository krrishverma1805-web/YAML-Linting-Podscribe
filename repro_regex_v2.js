
const regex = /^(\s*[^\s:]+):(?!\s)(\S.*)/;

const testCases = [
    { input: "key:value", expected: "key: value" },
    { input: "app.kubernetes.io/name:value", expected: "app.kubernetes.io/name: value" }, // Complex key
    { input: "apiVersion:v1", expected: "apiVersion: v1" },
    { input: "\"quoted-key\":value", expected: "\"quoted-key\": value" }, // Quoted key
    { input: "https://example.com", expected: null }, // URL check should catch this
    { input: "http://example.com", expected: null },
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
