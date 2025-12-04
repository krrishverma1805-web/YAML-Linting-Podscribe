const { YAMLSyntaxFixer } = require('./src/utils/yaml-syntax-fixer');

const brokenYaml = `apiVersion: v1
kind: Pod
metadata:
  name: broken-app
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
      protocol: TCP
      name: http
  - name: sidecar
    image: busybox`;

console.log("=== INPUT ===");
console.log(brokenYaml);

const fixer = new YAMLSyntaxFixer();
const result = fixer.fix(brokenYaml, 2);

console.log("\n=== OUTPUT ===");
console.log(result.content);

console.log("\n=== VALIDATION ===");
// Simple check if output structure looks right
const lines = result.content.split('\n');
lines.forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
});
