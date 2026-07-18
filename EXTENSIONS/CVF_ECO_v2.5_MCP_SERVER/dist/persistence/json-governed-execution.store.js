/** Delta-T3 durable governed-execution receipt store. */
import { mkdir, open, readFile } from 'node:fs/promises';
import { join } from 'node:path';
export const GOVERNED_EXECUTION_DIR = 'governed-executions';
export const GOVERNED_EXECUTION_RECEIPT_CONTRACT = 'cvf.delta.governedExecutionReceipt.v1';
export const CONSUMPTION_ID_PATTERN = /^delta-consumption-[0-9]+-[a-z0-9]{0,8}$/;
function isAlreadyExists(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'EEXIST');
}
export class JsonGovernedExecutionStore {
    receiptDir;
    constructor(dataDir) {
        this.receiptDir = join(dataDir, GOVERNED_EXECUTION_DIR);
    }
    receiptPath(consumptionId) {
        if (!CONSUMPTION_ID_PATTERN.test(consumptionId)) {
            throw new Error('Invalid Delta consumption id.');
        }
        return join(this.receiptDir, `${consumptionId}.json`);
    }
    async beginExecution(receipt) {
        if (receipt.contractVersion !== GOVERNED_EXECUTION_RECEIPT_CONTRACT ||
            receipt.status !== 'ADMITTED' ||
            receipt.executionStarted ||
            receipt.executionCompleted ||
            receipt.externalInterceptionProved !== false) {
            throw new Error('Invalid governed execution intent.');
        }
        await mkdir(this.receiptDir, { recursive: true });
        const path = this.receiptPath(receipt.consumptionId);
        let handle;
        try {
            handle = await open(path, 'wx', 0o600);
        }
        catch (error) {
            if (isAlreadyExists(error))
                return false;
            throw error;
        }
        try {
            await handle.writeFile(JSON.stringify(receipt, null, 2), 'utf-8');
            await handle.sync();
            return true;
        }
        finally {
            await handle.close();
        }
    }
    async finalizeExecution(consumptionId, finalization) {
        const path = this.receiptPath(consumptionId);
        const handle = await open(path, 'r+', 0o600);
        try {
            const current = JSON.parse(await handle.readFile('utf-8'));
            if (current.contractVersion !== GOVERNED_EXECUTION_RECEIPT_CONTRACT ||
                current.consumptionId !== consumptionId ||
                current.status !== 'ADMITTED') {
                throw new Error('Governed execution receipt is not finalizable.');
            }
            const finalized = {
                ...current,
                ...finalization,
                externalInterceptionProved: false,
            };
            await handle.truncate(0);
            await handle.write(JSON.stringify(finalized, null, 2), 0, 'utf-8');
            await handle.sync();
            return finalized;
        }
        finally {
            await handle.close();
        }
    }
    async readExecution(consumptionId) {
        return JSON.parse(await readFile(this.receiptPath(consumptionId), 'utf-8'));
    }
}
//# sourceMappingURL=json-governed-execution.store.js.map