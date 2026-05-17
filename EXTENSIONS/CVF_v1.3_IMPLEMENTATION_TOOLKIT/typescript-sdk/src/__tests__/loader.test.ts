import { describe, it, expect } from 'vitest';
import { loadContract, parseContract, loadContractsFromDir } from '../loader';
import { contractYaml } from './fixtures';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('loader', () => {
    it('parses contract from yaml string', () => {
        const contract = parseContract(contractYaml());
        expect(contract.capability_id).toBe('CODE_REVIEW_v1');
    });

    it('throws when contract file is missing', () => {
        expect(() => loadContract('non-existent.contract.yaml')).toThrow(/not found/i);
    });

    it('loads contracts from directory', () => {
        const baseDir = mkdtempSync(join(tmpdir(), 'cvf-ts-sdk-'));
        const nestedDir = join(baseDir, 'nested');
        mkdirSync(nestedDir, { recursive: true });
        const filePath = join(nestedDir, 'sample.contract.yaml');
        writeFileSync(filePath, contractYaml());

        const contracts = loadContractsFromDir(baseDir);
        expect(contracts.length).toBe(1);
        expect(contracts[0].capability_id).toBe('CODE_REVIEW_v1');
    });
});
