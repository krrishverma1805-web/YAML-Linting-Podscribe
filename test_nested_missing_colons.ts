
import { MultiPassFixer } from './src/semantic/intelligent-fixer.ts';

const input = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  lab3ls
    app web
    tier front-end
spec:
  containers:
  - name: nginx
    image: nginx
    env
      name DEBUG
      value "true"
`;

async function run() {
    console.log("=== INPUT ===");
    console.log(input);

    const fixer = new MultiPassFixer();
    const result = await fixer.fix(input);

    console.log("\n=== OUTPUT ===");
    console.log(result.content);

    console.log("\n=== CHANGES ===");
    result.changes.forEach(c => console.log(`[${c.type}] Line ${c.line}: ${c.reason}`));
}

run().catch(console.error);
