/**
 * CVF TypeScript SDK - Contract Loader
 */

import { parse as parseYaml } from 'yaml';
import { readFileSync, existsSync } from 'fs';
import type { SkillContract } from './types';

/**
 * Load a contract from YAML file
 */
export function loadContract(path: string): SkillContract {
    if (!existsSync(path)) {
        throw new Error(`Contract file not found: ${path}`);
    }

    const content = readFileSync(path, 'utf-8');
    return parseYaml(content) as SkillContract;
}

/**
 * Parse contract from YAML string
 */
export function parseContract(yamlContent: string): SkillContract {
    return parseYaml(yamlContent) as SkillContract;
}

/**
 * Load multiple contracts from a directory
 */
export function loadContractsFromDir(dirPath: string): SkillContract[] {
    const { readdirSync, statSync } = require('fs');
    const { join } = require('path');

    const contracts: SkillContract[] = [];

    function walkDir(dir: string) {
        const files = readdirSync(dir);
        for (const file of files) {
            const fullPath = join(dir, file);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else if (file.endsWith('.contract.yaml') || file.endsWith('.contract.yml')) {
                try {
                    contracts.push(loadContract(fullPath));
                } catch (e) {
                    console.warn(`Failed to load contract: ${fullPath}`, e);
                }
            }
        }
    }

    walkDir(dirPath);
    return contracts;
}
