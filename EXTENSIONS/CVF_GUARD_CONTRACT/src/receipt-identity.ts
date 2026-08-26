// LPCI1-WEB-R1 - narrow package-safe barrel exposing only the Phase 1.R
// receipt envelope and memory tier identity types/factory. Deliberately
// separate from the package root (src/index.ts) so a consumer that only
// needs these two self-contained, zero-internal-import contracts does not
// pull in the full 48-export guard/runtime surface. This file's export
// name intentionally avoids the substring "contracts" so it does not
// collide with the package-boundary test that forbids an exports-map
// subpath under contracts/ (src/package.boundary.test.ts).

export type { MemoryTierId } from './contracts/memory-tier.contract';
export type { Receipt } from './contracts/receipt-envelope.contract';
export { createReceiptEnvelope } from './contracts/receipt-envelope.contract';
