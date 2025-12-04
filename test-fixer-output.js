import { YAMLFixer } from './dist/core/yaml-fixer.js';
import * as fs from 'fs';

const fixer = new YAMLFixer();
const content = fs.readFileSync('tests/fixtures/broken-deployment-service.yaml', 'utf-8');

console.log('=== ORIGINAL ===');
console.log(content);
console.log('\n=== PHASE 1 FIX ===');
const result = fixer.fix(content);
console.log(result.content);
console.log(`\nFixed ${result.fixedCount} issues`);

console.log('\n=== AGGRESSIVE MODE ===');
const aggressiveResult = fixer.fix(content, { aggressive: true });
console.log(aggressiveResult.content);
console.log(`\nFixed ${aggressiveResult.fixedCount} issues`);
