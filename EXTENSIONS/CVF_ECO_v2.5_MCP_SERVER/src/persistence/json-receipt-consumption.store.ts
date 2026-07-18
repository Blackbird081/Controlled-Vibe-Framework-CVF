/**
 * Delta-T2 atomic receipt-consumption marker store.
 *
 * The store reads preflight audits through the existing persistence boundary
 * and claims one marker file per receipt with create-exclusive semantics.
 * Marker payloads contain no raw action descriptions or target paths.
 */

import { mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';
import type { GuardAuditEntry } from '../guards/types.js';

export const RECEIPT_CONSUMPTION_DIR = 'receipt-consumptions';
export const RECEIPT_ID_PATTERN = /^delta-preflight-[0-9]+-[a-z0-9]{0,8}$/;

export interface ReceiptAuditReader {
  getAuditEntries(options?: {
    requestId?: string;
    limit?: number;
    offset?: number;
  }): Promise<GuardAuditEntry[]>;
}

export interface ReceiptConsumptionMarker {
  contractVersion: string;
  preflightContractVersion: string;
  receiptId: string;
  consumptionId: string;
  consumedAt: string;
  actionClass: string;
  bindingHash: string;
  actionExecutionProved: false;
  externalInterceptionProved: false;
}

export interface ReceiptConsumptionStore {
  getPreflightAuditEntries(receiptId: string): Promise<GuardAuditEntry[]>;
  claimReceipt(marker: ReceiptConsumptionMarker): Promise<boolean>;
}

export interface JsonReceiptConsumptionStoreOptions {
  dataDir: string;
  auditReader: ReceiptAuditReader;
}

function isAlreadyExists(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'EEXIST'
  );
}

export class JsonReceiptConsumptionStore implements ReceiptConsumptionStore {
  private readonly markerDir: string;

  constructor(private readonly options: JsonReceiptConsumptionStoreOptions) {
    this.markerDir = join(options.dataDir, RECEIPT_CONSUMPTION_DIR);
  }

  async getPreflightAuditEntries(receiptId: string): Promise<GuardAuditEntry[]> {
    return this.options.auditReader.getAuditEntries({ requestId: receiptId });
  }

  markerPath(receiptId: string): string {
    if (!RECEIPT_ID_PATTERN.test(receiptId)) {
      throw new Error('Invalid Delta receipt id.');
    }
    return join(this.markerDir, `${receiptId}.json`);
  }

  async claimReceipt(marker: ReceiptConsumptionMarker): Promise<boolean> {
    const markerPath = this.markerPath(marker.receiptId);
    await mkdir(this.markerDir, { recursive: true });

    let handle;
    try {
      handle = await open(markerPath, 'wx', 0o600);
    } catch (error) {
      if (isAlreadyExists(error)) return false;
      throw error;
    }

    try {
      await handle.writeFile(JSON.stringify(marker, null, 2), 'utf-8');
      await handle.sync();
      return true;
    } finally {
      await handle.close();
    }
  }
}
