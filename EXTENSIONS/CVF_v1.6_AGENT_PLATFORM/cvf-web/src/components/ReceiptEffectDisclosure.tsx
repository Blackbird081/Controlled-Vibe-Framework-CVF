'use client';
import type { BoundDisclosure } from '@/lib/artifacts-bound-receipt-contract';

/** Capability boundary the job controls consume. Only an exactly validated disclosure can ever select the bound case. */
export type EffectBoundary = { kind: 'LOCAL_SYNTHETIC' } | { kind: 'BOUND_ENGINE_RECEIPT'; disclosure: BoundDisclosure };

const SENT = ['EXCERPT_500_UTF16_UNITS', 'ARTIFACT_ID', 'ATTEMPT_ID', 'OWNER_USER_ORG_TEAM'];
const rec = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max && /^[A-Za-z0-9._-]+$/.test(v);

/** Strict validation of the nonsecret disclosure. Any extra, missing or altered field makes it unusable. */
export function parseBoundDisclosure(v: unknown): BoundDisclosure | null {
  if (!rec(v) || !keys(v, ['effectBoundary', 'mode', 'destination', 'sent', 'access', 'retention', 'attemptLimit', 'cost', 'requestedRisk', 'policyRevision', 'configDigest'])
    || v.effectBoundary !== 'BOUND_ENGINE_RECEIPT' || v.mode !== 'OFFLINE_BOUND_RECEIPT_NOT_ACTIVATED' || !rec(v.destination)
    || !keys(v.destination, ['endpointId', 'engineOrigin', 'storeId']) || !text(v.destination.endpointId, 100) || !text(v.destination.storeId, 100)
    || typeof v.destination.engineOrigin !== 'string' || v.destination.engineOrigin.length > 200 || !/^https?:\/\/[A-Za-z0-9.:[\]-]+$/.test(v.destination.engineOrigin)
    || !Array.isArray(v.sent) || JSON.stringify(v.sent) !== JSON.stringify(SENT) || v.access !== 'OWNER_SCOPED_ENGINE_LEDGER'
    || v.retention !== 'NO_EXPIRY_DEVELOPMENT_BOUND_NO_GC' || v.attemptLimit !== 1 || v.cost !== 'UNKNOWN_NOT_AUTHORIZED' || v.requestedRisk !== 'R1'
    || !text(v.policyRevision, 100) || typeof v.configDigest !== 'string' || !/^[a-f0-9]{64}$/.test(v.configDigest)) return null;
  return { effectBoundary: 'BOUND_ENGINE_RECEIPT', mode: 'OFFLINE_BOUND_RECEIPT_NOT_ACTIVATED',
    destination: { endpointId: v.destination.endpointId, engineOrigin: v.destination.engineOrigin, storeId: v.destination.storeId },
    sent: [...SENT], access: 'OWNER_SCOPED_ENGINE_LEDGER', retention: 'NO_EXPIRY_DEVELOPMENT_BOUND_NO_GC', attemptLimit: 1, cost: 'UNKNOWN_NOT_AUTHORIZED',
    requestedRisk: 'R1', policyRevision: v.policyRevision, configDigest: v.configDigest };
}

/**
 * Maps the capability response to what the controls may do. A malformed bound capability disables the job controls and is never labelled
 * LOCAL_SYNTHETIC. Other unrecognised boundary values keep the existing behaviour: enabled, with no selected-profile disclosure.
 */
export function jobCapabilityOf(value: { jobDecisions?: unknown; effectBoundary?: unknown; boundDisclosure?: unknown }): { enabled: boolean; boundary: EffectBoundary | null } {
  if (value.jobDecisions !== true) return { enabled: false, boundary: null };
  if (value.effectBoundary === 'BOUND_ENGINE_RECEIPT') {
    const disclosure = parseBoundDisclosure(value.boundDisclosure);
    return disclosure ? { enabled: true, boundary: { kind: 'BOUND_ENGINE_RECEIPT', disclosure } } : { enabled: false, boundary: null };
  }
  return { enabled: true, boundary: value.effectBoundary === 'LOCAL_SYNTHETIC' ? { kind: 'LOCAL_SYNTHETIC' } : null };
}

// Text Encoding Exception: localized Vietnamese user-facing copy follows the existing UI language owner.
const COPY = {
  en: {
    title: 'Offline bound governance receipt (not activated)',
    intro: 'Build can ask one configured test destination for a governance receipt. This is an offline fixture: no real endpoint, provider or production data is used.',
    destination: 'Configured destination', sent: 'Sent to the destination', access: 'Access', retention: 'Retention', attempts: 'Attempt limit', cost: 'Cost',
    stop: 'Stop', unknown: 'If the result is unclear', risk: 'Risk class',
    sentItems: { EXCERPT_500_UTF16_UNITS: 'the first 500 characters of the source text', ARTIFACT_ID: 'the artifact ID', ATTEMPT_ID: 'the attempt ID',
      OWNER_USER_ORG_TEAM: 'your user, organization and team IDs' },
    accessValue: 'Records can be read only through your own owner scope in the engine ledger.',
    retentionValue: 'Kept without expiry in this development fixture; nothing is deleted automatically.',
    attemptsValue: 'One attempt per operation. There is no automatic retry.',
    costValue: 'Unknown and not authorized. No paid effect is permitted.',
    stopValue: 'Stop only ends waiting on this device. It cannot cancel the remote request, remove ledger records or guarantee zero billing.',
    unknownValue: 'The operation is marked unknown and is never sent again automatically. A receipt is governance evidence, not acceptance of the HTML.',
    riskValue: 'Requested class R1 is what this build asks for. The engine reports its own computed risk separately.',
  },
  vi: {
    title: 'Biên nhận quản trị ràng buộc ngoại tuyến (chưa kích hoạt)',
    intro: 'Tạo HTML có thể hỏi một đích thử nghiệm đã cấu hình để lấy biên nhận quản trị. Đây là bản mô phỏng ngoại tuyến: không dùng đầu cuối, nhà cung cấp hay dữ liệu sản xuất thật.',
    destination: 'Đích đã cấu hình', sent: 'Dữ liệu gửi đi', access: 'Quyền truy cập', retention: 'Lưu giữ', attempts: 'Giới hạn lượt', cost: 'Chi phí',
    stop: 'Dừng', unknown: 'Khi kết quả chưa rõ', risk: 'Hạng rủi ro',
    sentItems: { EXCERPT_500_UTF16_UNITS: '500 ký tự đầu của văn bản nguồn', ARTIFACT_ID: 'mã sản phẩm', ATTEMPT_ID: 'mã lượt thử',
      OWNER_USER_ORG_TEAM: 'mã người dùng, tổ chức và nhóm của bạn' },
    accessValue: 'Bản ghi chỉ đọc được trong phạm vi chủ sở hữu của chính bạn trong sổ cái của engine.',
    retentionValue: 'Giữ không hết hạn trong bản mô phỏng phát triển này; không có gì bị xóa tự động.',
    attemptsValue: 'Một lượt cho mỗi thao tác. Không tự động thử lại.',
    costValue: 'Chưa rõ và chưa được cho phép. Không cho phép tác vụ có phí.',
    stopValue: 'Dừng chỉ kết thúc việc chờ trên thiết bị này. Không thể hủy yêu cầu từ xa, xóa bản ghi sổ cái hay bảo đảm không tính phí.',
    unknownValue: 'Thao tác được đánh dấu chưa rõ và không bao giờ tự động gửi lại. Biên nhận là bằng chứng quản trị, không phải sự chấp nhận HTML.',
    riskValue: 'Hạng R1 là mức bản dựng này yêu cầu. Engine báo mức rủi ro tự tính riêng.',
  },
} as const;

/** Rendered before the Build control. Disclosure alone grants no permission and implies no business or person acceptance. */
export function ReceiptEffectDisclosure({ disclosure, language }: { disclosure: BoundDisclosure; language: 'en' | 'vi' }) {
  const copy = COPY[language === 'vi' ? 'vi' : 'en'];
  const rows: Array<[string, string, string]> = [
    ['destination', copy.destination, `${disclosure.destination.endpointId} - ${disclosure.destination.engineOrigin} - ${disclosure.destination.storeId}`],
    ['sent', copy.sent, disclosure.sent.map(code => copy.sentItems[code as keyof typeof copy.sentItems] ?? code).join('; ')],
    ['access', copy.access, copy.accessValue], ['retention', copy.retention, copy.retentionValue],
    ['attempts', copy.attempts, `${disclosure.attemptLimit} - ${copy.attemptsValue}`], ['cost', copy.cost, copy.costValue],
    ['stop', copy.stop, copy.stopValue], ['unknown', copy.unknown, copy.unknownValue], ['risk', copy.risk, `${disclosure.requestedRisk} - ${copy.riskValue}`],
  ];
  return <section data-testid="bound-receipt-disclosure" data-mode={disclosure.mode} aria-label={copy.title} className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-xs text-gray-900 dark:border-amber-500 dark:bg-gray-800 dark:text-gray-100">
    <p className="text-sm font-semibold">{copy.title}</p>
    <p className="mt-1 leading-5">{copy.intro}</p>
    <dl className="mt-2 space-y-1">
      {rows.map(([id, label, value]) => <div key={id} data-testid={`bound-disclosure-${id}`}>
        <dt className="inline font-semibold">{label}: </dt><dd className="inline">{value}</dd></div>)}
    </dl>
  </section>;
}
