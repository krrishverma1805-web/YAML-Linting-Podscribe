import * as yaml from 'js-yaml';

const content = `apiVersion: v1
kind: Deployment
metadata:
  name: broken-app
  namespace: default
spec:
  replicas: three
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: nginx
          image nginx:latest
          containerPort: 80
          protocol: TCP
      restartPolicy: Always
---
kind: Service
metadata:
  name: broken-svc
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 80`;

try {
    const parsed = yaml.load(content);
    console.log('Parsed successfully!');
    console.log(JSON.stringify(parsed, null, 2));
} catch (e) {
    console.log('Parse error:', e.message);
}
