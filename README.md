# Kubernetes YAML Linting Tool

A production-grade Kubernetes YAML linting tool backend with a 9-stage validation pipeline.

## Features

- **Sequential Pipeline**: 9 stages of validation.
- **Context-Aware**: Validates against specific Kubernetes versions and environments (dev/prod).
- **Schema Validation**: Validates against official Kubernetes OpenAPI schemas.
- **Semantic Analysis**: Checks for broken references (Service -> Pod, PVC -> StorageClass).
- **Policy-as-Code**: Supports custom policies (Kyverno-style).
- **Security Checks**: Detects privileged containers, missing probes, root users, etc.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Scan a file or directory
node dist/cli.js scan <path> [flags]

# Examples
node dist/cli.js scan ./deployments --env prod
node dist/cli.js scan ./chart --k8s-version 1.28.0
```

## Flags

- `--k8s-version <version>`: Kubernetes version to validate against (default: 1.29.0)
- `--env <env>`: Environment context (dev/staging/prod) (default: dev)
- `--policy-dir <dir>`: Directory containing policy files
- `--output <format>`: Output format (text/json/sarif) (default: text)
- `--skip-server-validation`: Skip server-side validation (dry-run)

## Indentation Validator

The tool includes a powerful indentation validator and auto-fixer.

```bash
# Check indentation
node dist/cli.js indent check <path> [flags]

# Fix indentation automatically
node dist/cli.js indent fix <path> [flags]
```

### Indentation Flags

- `--style <2|4|auto>`: Indentation style (default: auto-detect)
- `--dry-run`: Preview changes without modifying files (fix mode only)
- `--diff`: Show unified diff of changes (fix mode only)
- `--fix-trailing-spaces`: Remove trailing whitespace (default: true)

## Architecture

1. **Context Detection**: Loads config and environment.
2. **Rendering**: Renders Helm charts and Kustomize overlays.
3. **Parsing**: Validates YAML syntax.
4. **Schema Validation**: Validates against K8s schemas.
5. **Graph Analysis**: Checks cross-resource references.
6. **Static Checks**: Checks best practices and security.
7. **Admission Simulation**: Simulates PSS and other admission controls.
8. **Policy Evaluation**: Checks custom policies.
9. **Server Validation**: Runs `kubectl apply --dry-run=server`.
