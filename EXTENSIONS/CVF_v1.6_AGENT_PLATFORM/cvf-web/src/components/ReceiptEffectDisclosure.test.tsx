// Text Encoding Exception: localized Vietnamese assertions follow the existing UI copy owner.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { boundDisclosureOf, makeBoundConfig, type BoundDisclosure } from '@/lib/artifacts-bound-receipt-contract';
import { ReceiptEffectDisclosure, jobCapabilityOf, parseBoundDisclosure } from './ReceiptEffectDisclosure';

const config = makeBoundConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store', authReference: 'bundle-1',
  authScope: 'two-hop', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100', instanceId: '123e4567-e89b-42d3-a456-426614174000',
  storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 })!;
const valid = JSON.parse(JSON.stringify(boundDisclosureOf(config))) as BoundDisclosure;
const alter = (patch: Record<string, unknown>) => ({ ...valid, ...patch });

describe('strict disclosure validation', () => {
  it('accepts exactly the nonsecret shape and returns a rebuilt copy', () => {
    const parsed = parseBoundDisclosure(valid);
    expect(parsed).toEqual(valid);
    expect(parsed).not.toBe(valid);
    expect(parseBoundDisclosure(JSON.parse(JSON.stringify(valid)))).toEqual(valid);
  });
  it('refuses every extra, missing, altered or unsafe field', () => {
    const bad: Array<[string, unknown]> = [
      ['null', null], ['string', 'x'], ['array', []], ['extra key', alter({ extra: 1 })], ['key reference', alter({ keyReference: 'k' })], ['effect', alter({ effectBoundary: 'LOCAL_SYNTHETIC' })],
      ['mode', alter({ mode: 'ACTIVATED' })], ['access', alter({ access: 'PUBLIC' })], ['retention', alter({ retention: 'EXPIRES_IN_1_DAY' })], ['attempt limit', alter({ attemptLimit: 2 })],
      ['cost', alter({ cost: 'FREE' })], ['risk', alter({ requestedRisk: 'R2' })], ['digest case', alter({ configDigest: 'AB'.repeat(32) })], ['digest length', alter({ configDigest: 'ab' })],
      ['sent reordered', alter({ sent: [...valid.sent].reverse() })], ['sent short', alter({ sent: valid.sent.slice(1) })], ['sent extra', alter({ sent: [...valid.sent, 'COOKIES'] })],
      ['destination extra', alter({ destination: { ...valid.destination, token: 't' } })], ['destination path', alter({ destination: { ...valid.destination, engineOrigin: 'http://engine.invalid:8100/x' } })],
      ['destination script', alter({ destination: { ...valid.destination, endpointId: '<script>' } })], ['destination blank', alter({ destination: { ...valid.destination, storeId: '' } })],
      ['non-ascii label', alter({ policyRevision: `rev${String.fromCharCode(0xe9)}` })], ['userinfo origin', alter({ destination: { ...valid.destination, engineOrigin: 'http://u@engine.invalid:8100' } })],
    ];
    for (const [name, value] of bad) expect(parseBoundDisclosure(value), name).toBeNull();
    const missing = { ...valid } as Record<string, unknown>;
    delete missing.cost;
    expect(parseBoundDisclosure(missing)).toBeNull();
  });
});

describe('capability mapping never labels a missing or malformed bound case as local synthetic', () => {
  it('keeps the existing behaviours for absent, local and unrecognised boundaries', () => {
    expect(jobCapabilityOf({ jobDecisions: true })).toEqual({ enabled: true, boundary: null });
    expect(jobCapabilityOf({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' })).toEqual({ enabled: true, boundary: { kind: 'LOCAL_SYNTHETIC' } });
    for (const unknown of ['local_synthetic', 'PROVIDER_LIVE', 42, null]) expect(jobCapabilityOf({ jobDecisions: true, effectBoundary: unknown })).toEqual({ enabled: true, boundary: null });
    for (const off of [false, 'true', 1, undefined, null]) {
      expect(jobCapabilityOf({ jobDecisions: off, effectBoundary: 'LOCAL_SYNTHETIC' })).toEqual({ enabled: false, boundary: null });
      expect(jobCapabilityOf({ jobDecisions: off, effectBoundary: 'BOUND_ENGINE_RECEIPT', boundDisclosure: valid })).toEqual({ enabled: false, boundary: null });
    }
  });
  it('selects the bound case only with a valid disclosure and otherwise disables the controls', () => {
    expect(jobCapabilityOf({ jobDecisions: true, effectBoundary: 'BOUND_ENGINE_RECEIPT', boundDisclosure: valid })).toEqual({ enabled: true, boundary: { kind: 'BOUND_ENGINE_RECEIPT', disclosure: valid } });
    for (const bad of [undefined, null, {}, alter({ cost: 'FREE' }), alter({ extra: 1 }), 'disclosure']) {
      expect(jobCapabilityOf({ jobDecisions: true, effectBoundary: 'BOUND_ENGINE_RECEIPT', boundDisclosure: bad })).toEqual({ enabled: false, boundary: null });
    }
    // A local capability that carries a bound disclosure does not become the bound case.
    expect(jobCapabilityOf({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC', boundDisclosure: valid })).toEqual({ enabled: true, boundary: { kind: 'LOCAL_SYNTHETIC' } });
  });
});

describe('EN and VI disclosure content (D12)', () => {
  it('names destination, data sent, access, retention, attempts, cost, Stop, unknown handling and the risk distinction in English', () => {
    const { container } = render(<ReceiptEffectDisclosure disclosure={valid} language="en" />);
    const section = screen.getByTestId('bound-receipt-disclosure');
    expect(section.getAttribute('aria-label')).toBe('Offline bound governance receipt (not activated)');
    expect(section.getAttribute('data-mode')).toBe('OFFLINE_BOUND_RECEIPT_NOT_ACTIVATED');
    const part = (id: string) => within(screen.getByTestId(`bound-disclosure-${id}`)).getByText(/./, { selector: 'dd' }).textContent ?? '';
    expect(part('destination')).toBe('fixture-endpoint - http://engine.invalid:8100 - fixture-store');
    expect(part('sent')).toBe('the first 500 characters of the source text; the artifact ID; the attempt ID; your user, organization and team IDs');
    expect(part('access')).toMatch(/only through your own owner scope/);
    expect(part('retention')).toMatch(/without expiry.*nothing is deleted automatically/);
    expect(part('attempts')).toBe('1 - One attempt per operation. There is no automatic retry.');
    expect(part('cost')).toBe('Unknown and not authorized. No paid effect is permitted.');
    expect(part('stop')).toMatch(/cannot cancel the remote request.*zero billing/);
    expect(part('unknown')).toMatch(/never sent again automatically.*not acceptance of the HTML/);
    expect(part('risk')).toMatch(/^R1 - Requested class R1.*engine reports its own computed risk separately/);
    expect(container.textContent).not.toMatch(/LOCAL_SYNTHETIC|local test job|production approved|accepted/i);
    expect(container.querySelectorAll('button, input, a, select, textarea')).toHaveLength(0);
  });
  it('shows the same fields in Vietnamese and never leaks the configuration digest or a secret', () => {
    const { container } = render(<ReceiptEffectDisclosure disclosure={valid} language="vi" />);
    expect(screen.getByTestId('bound-receipt-disclosure').getAttribute('aria-label')).toBe('Biên nhận quản trị ràng buộc ngoại tuyến (chưa kích hoạt)');
    expect(container.textContent).toContain('Đích đã cấu hình');
    expect(container.textContent).toContain('500 ký tự đầu của văn bản nguồn');
    expect(container.textContent).toContain('Chưa rõ và chưa được cho phép');
    expect(container.textContent).toContain('Dừng chỉ kết thúc việc chờ trên thiết bị này');
    expect(container.textContent).toContain('không bao giờ tự động gửi lại');
    expect(container.textContent).toContain('Hạng R1');
    for (const id of ['destination', 'sent', 'access', 'retention', 'attempts', 'cost', 'stop', 'unknown', 'risk']) expect(screen.getByTestId(`bound-disclosure-${id}`)).toBeTruthy();
    expect(container.textContent).not.toContain(valid.configDigest);
    expect(container.textContent).not.toMatch(/key|secret|token|password/i);
  });
  it('treats an unrecognised language as English', () => {
    render(<ReceiptEffectDisclosure disclosure={valid} language={'fr' as 'en'} />);
    expect(screen.getByTestId('bound-receipt-disclosure').getAttribute('aria-label')).toBe('Offline bound governance receipt (not activated)');
  });
});
