/**
 * Delta-T2 atomic receipt-consumption marker store.
 *
 * The store reads preflight audits through the existing persistence boundary
 * and claims one marker file per receipt with create-exclusive semantics.
 * Marker payloads contain no raw action descriptions or target paths.
 */
import { mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';
export const RECEIPT_CONSUMPTION_DIR = 'receipt-consumptions';
export const RECEIPT_ID_PATTERN = /^delta-preflight-[0-9]+-[a-z0-9]{0,8}$/;
function isAlreadyExists(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'EEXIST');
}
export class JsonReceiptConsumptionStore {
    options;
    markerDir;
    constructor(options) {
        this.options = options;
        this.markerDir = join(options.dataDir, RECEIPT_CONSUMPTION_DIR);
    }
    async getPreflightAuditEntries(receiptId) {
        return this.options.auditReader.getAuditEntries({ requestId: receiptId });
    }
    markerPath(receiptId) {
        if (!RECEIPT_ID_PATTERN.test(receiptId)) {
            throw new Error('Invalid Delta receipt id.');
        }
        return join(this.markerDir, `${receiptId}.json`);
    }
    async claimReceipt(marker) {
        const markerPath = this.markerPath(marker.receiptId);
        await mkdir(this.markerDir, { recursive: true });
        let handle;
        try {
            handle = await open(markerPath, 'wx', 0o600);
        }
        catch (error) {
            if (isAlreadyExists(error))
                return false;
            throw error;
        }
        try {
            await handle.writeFile(JSON.stringify(marker, null, 2), 'utf-8');
            await handle.sync();
            return true;
        }
        finally {
            await handle.close();
        }
    }
}
//# sourceMappingURL=json-receipt-consumption.store.js.map