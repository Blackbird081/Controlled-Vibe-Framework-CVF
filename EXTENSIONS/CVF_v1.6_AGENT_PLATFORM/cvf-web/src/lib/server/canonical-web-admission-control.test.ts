import { describe, it, expect } from 'vitest';
import { initialControl, ownerKey, validControls } from './canonical-web-admission-control';
import type { LineageIdentity } from './canonical-web-lineage';
const identity: LineageIdentity = { tenantId: 'org', owner: { kind: 'session', orgId:'org', teamId:'team', userId:'user' } };
describe('owner control validation', () => {
    it('binds canonical owner tuple without storing it', () => {
        const c = initialControl(identity);
        expect(c.ownerKey).toMatch(/^[a-f0-9]{64}$/);
        expect(ownerKey({ ...identity, owner: { kind:'session', orgId:'org', teamId:'team', userId:'other' } })).not.toBe(c.ownerKey);
        expect(JSON.stringify(c)).not.toContain('user');
        expect(validControls([c])).toBe(true);
    });
    it('rejects duplicate, malformed, oversize and over-capacity controls', () => {
        const c = initialControl(identity);
        expect(validControls([c,c])).toBe(false);
        expect(validControls([{...c,state:'MAYBE'}])).toBe(false);
        expect(validControls([{...c,extra:'x'}])).toBe(false);
        expect(validControls(Array(33).fill(c))).toBe(false);
    });
});
it('accepts the maximum legal projection shape for all 32 owners within the metadata bound', () => {
    const max = { canonicalId:'c'.repeat(100), contractRevision:'r'.repeat(80), sourceRevision:'s'.repeat(80), state:'FINALIZED' as const, active:false,
      recordingStatus:'CONFIRMED' as const, providerContact:'POSSIBLE_OR_OBSERVED' as const, continuationHold:false, pendingOrdinals:0,
      terminalDisposition:'VALIDATION_FAILED', gaps:['VALIDATION_NOT_RECORDED','GUARD_NOT_RECORDED','SOT3_NOT_RECORDED','AUDIT_NOT_RECORDED',...Array.from({length:4},(_,i)=>'x'.repeat(63)+i)], updatedAt:'2026-11-13T00:00:00.000Z' };
    const controls=Array.from({length:32},(_,i)=>({...initialControl({ ...identity, owner:{kind:'session',orgId:'org',teamId:'team',userId:`u${i}`} }),state:'STOPPED' as const,revision:Number.MAX_SAFE_INTEGER,updatedAt:'2026-11-13T00:00:00.000Z',execution:max}));
    expect(Buffer.byteLength(JSON.stringify(controls[0]))).toBeGreaterThan(1024);
    expect(Buffer.byteLength(JSON.stringify(controls[0]))).toBeLessThanOrEqual(1440);
    expect(validControls(controls)).toBe(true);
    expect(Buffer.byteLength(JSON.stringify({schema:'cvf.webLineageMeta.v1',tenantId:'x'.repeat(64),configRevision:1000000,activeSlots:100,archiveSlots:100,slotBytes:16384,activeUsed:100,archiveUsed:100,activeBytes:1638400,archiveBytes:1638400,admissionControls:controls}))).toBeLessThanOrEqual(49152);
});
