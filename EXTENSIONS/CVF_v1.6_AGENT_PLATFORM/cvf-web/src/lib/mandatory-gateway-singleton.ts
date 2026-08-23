/**
 * Mandatory Gateway Singleton
 * ============================
 * Shared MandatoryGateway instance for the cvf-web execute route.
 * Configured for no-bypass, fail-closed enforcement backed by the
 * canonical shared guard engine.
 *
 * @module lib/mandatory-gateway-singleton
 */

import { createMandatoryGateway, type MandatoryGateway } from 'cvf-guard-contract';
import { getSharedGuardEngine } from '@/lib/guard-engine-singleton';

let _gateway: MandatoryGateway | null = null;

/**
 * Get the shared mandatory gateway instance.
 * Creates it on first call, reuses thereafter.
 */
export function getSharedMandatoryGateway(): MandatoryGateway {
  if (!_gateway) {
    _gateway = createMandatoryGateway(getSharedGuardEngine(), {
      enforceAll: true,
      hardBlock: true,
      hardEscalate: true,
      bypassActions: [],
      defaultControlMode: 'governed',
    });
  }
  return _gateway;
}

/**
 * Reset the shared gateway (for testing only).
 */
export function resetSharedMandatoryGateway(): void {
  _gateway = null;
}
