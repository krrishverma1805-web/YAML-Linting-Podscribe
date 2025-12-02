import fs from 'fs';
import path from 'path';
import https from 'https';
import { homedir } from 'os';
import os from 'os'; // Added os import for os.homedir()

const CACHE_DIR = path.join(homedir(), '.k8s-lint', 'schemas');

export class SchemaLoader {
    private k8sVersion: string;
    private cacheDir: string;

    constructor(k8sVersion: string) {
        this.k8sVersion = k8sVersion;
        this.cacheDir = path.join(os.homedir(), '.k8s-yaml-lint', 'schemas');
        // The original code had a mkdirSync call.
        // The instruction provided a syntactically incorrect snippet.
        // Assuming the intent was to create the new cacheDir if it doesn't exist.
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    async getSchema(kind: string, apiVersion: string): Promise<any> {
        // Normalize version (v1.29.0 -> v1.29.0-standalone-strict)
        // The repo structure is v1.29.0-standalone-strict/kind-group-version.json
        // e.g. pod-v1.json

        // Mapping apiVersion to filename part
        // apiVersion: v1 -> v1
        // apiVersion: apps/v1 -> apps-v1
        const versionPart = apiVersion.replace('/', '-');
        const fileName = `${kind.toLowerCase()}-${versionPart}.json`;
        const cachePath = path.join(CACHE_DIR, this.k8sVersion, fileName);

        if (fs.existsSync(cachePath)) {
            return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }

        // Fetch from GitHub
        // https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.29.0-standalone-strict/pod-v1.json
        // Note: The repo has changed structure over time. Let's try a standard one.
        // We'll use 'master' or a specific tag.

        // Construct URL
        // We need to handle the 'v' prefix in k8sVersion if present or not.
        const version = this.k8sVersion.startsWith('v') ? this.k8sVersion : `v${this.k8sVersion}`;
        const url = `https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/${version}-standalone-strict/${fileName}`;

        try {
            const schema = await this.fetchJson(url);

            // Cache it
            const versionDir = path.join(CACHE_DIR, this.k8sVersion);
            if (!fs.existsSync(versionDir)) {
                fs.mkdirSync(versionDir, { recursive: true });
            }
            fs.writeFileSync(cachePath, JSON.stringify(schema, null, 2));

            return schema;
        } catch (error) {
            // console.warn(`Failed to fetch schema for ${kind} ${apiVersion}: ${error.message}`);
            return null;
        }
    }

    private fetchJson(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Status ${res.statusCode}`));
                    return;
                }
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    }
}
