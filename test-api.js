import fetch from 'node-fetch';

const BROKEN_YAML = `apiVersion v1
kind Deployment
metadata
  name test-app
spec
  replicas three`;

async function testApi() {
    try {
        console.log('Testing /api/yaml/fix endpoint...');
        const response = await fetch('http://localhost:3001/api/yaml/fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: BROKEN_YAML,
                options: { aggressive: false }
            })
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log('Success:', data.success);
        console.log('Fixed Count:', data.fixedCount);
        console.log('Fixed Content:\n', data.fixed);
    } catch (error) {
        console.error('Connection failed:', error.message);
    }
}

testApi();
