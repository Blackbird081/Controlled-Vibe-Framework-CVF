'use client';

// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import { useCallback, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Clipboard,
  Download,
  FileCode2,
  Loader2,
  Printer,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import { useHtmlBuildAttempts, type HtmlJobReference, type SupersededOutcome } from './useHtmlBuildAttempts';
import { ARTIFACT_DISCLOSURE_GROUPS } from './ReceiptEffectDisclosure';
export { PilotArtifactSourceSummary } from './ReceiptEffectDisclosure';

export type ArtifactMemoryClass = 'POINTER_RECORD' | 'FULL_RECORD';

export interface ArtifactExportRequest {
  title: string;
  sourcePath: string;
  sourceContent: string;
  memoryClass: ArtifactMemoryClass;
  status: string;
  claimBoundary: string;
  receiptAnchor: string;
}

export interface ArtifactVerificationItem {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface GovernanceReceipt {
  receiptId: string;
  decision: string;
  evaluatedAt: string;
  riskLevel: string;
}

export interface ArtifactExportResult {
  html: string;
  filename: string;
  receiptAnchor: string;
  verification: ArtifactVerificationItem[];
  generatedAt: string;
  governanceReceipt?: GovernanceReceipt;
  governanceReceiptStatus?: 'PRESENT' | 'NOT_CONFIGURED' | 'TIMED_OUT' | 'UNAVAILABLE' | 'INVALID_RESPONSE';
  governanceReceiptAttemptId?: string;
  governanceState?: 'DRAFT_UNACCEPTED' | 'RECEIPT_ALLOW_REVIEW_REQUIRED';
}

interface ArtifactExportPanelProps {
  initialRequest?: Partial<ArtifactExportRequest>;
  initialResult?: ArtifactExportResult | null;
  exportEndpoint?: string;
  onGenerated?: (result: ArtifactExportResult) => void;
  prepareJob?: (request: ArtifactExportRequest) => Promise<HtmlJobReference>;
  renderRecovery?: (snapshot: DisplayedResult | null, versionState: 'current' | 'stale' | 'unknown' | null) => ReactNode;
  profileDisclosure?: 'LOCAL_SYNTHETIC';
}

export interface DisplayedResult {
  result: ArtifactExportResult;
  // Full request snapshot taken at submit; null when provenance is unknown (initialResult).
  submitted: ArtifactExportRequest | null;
  attempt: number | null;
  job?: HtmlJobReference;
}

const REQUEST_FIELDS: ReadonlyArray<keyof ArtifactExportRequest> = [
  'title',
  'sourcePath',
  'sourceContent',
  'memoryClass',
  'status',
  'claimBoundary',
  'receiptAnchor',
];

const DEFAULT_REQUEST: ArtifactExportRequest = {
  title: 'CVF HTML Review Packet',
  sourcePath: 'docs/reviews/example.md',
  sourceContent: [
    '# Review Packet',
    '',
    'Record type: Complete review record',
    '',
    'Review status: Draft',
    '',
    '## Review Boundary',
    '',
    'This packet helps review and handoff. It is not final proof by itself.',
  ].join('\n'),
  memoryClass: 'FULL_RECORD',
  status: 'DRAFT',
  claimBoundary: 'HTML review packet only. Not final proof by itself.',
  receiptAnchor: 'receipt-local-preview',
};

const LABELS = {
  en: {
    title: 'Review Packet Export',
    subtitle: 'Build a self-contained HTML review packet with a visible receipt reference.',
    boundary: 'HTML only. PDF, PNG, PPTX, and final proof are handled separately.',
    candidate: 'Candidate',
    sourceTitle: 'Review Source',
    outputTitle: 'HTML Review Packet',
    verificationTitle: 'Readiness Checks',
    titleLabel: 'Title',
    pathLabel: 'Source reference',
    memoryLabel: 'Record type',
    statusLabel: 'Review status',
    receiptLabel: 'Receipt reference',
    boundaryLabel: 'Review boundary',
    contentLabel: 'Source notes',
    generate: 'Build HTML',
    generating: 'Generating',
    copy: 'Copy HTML',
    copied: 'Copied',
    download: 'Download HTML',
    print: 'Print preview',
    noOutput: 'Build an HTML review packet to preview it here.',
    noChecks: 'Readiness checks will appear after the packet is built.',
    failed: 'Export failed',
    genericFailure: 'This build could not be confirmed. Check the details before deciding what to do next.',
    completeGoalCriteria: 'Enter the goal and all criteria before building.',
    pendingOperationRecovery: 'A pending operation could not be recorded. Reconcile it before another write.',
    technicalDetail: 'Technical detail',
    stop: 'Stop locally',
    stoppedUnknown: 'Stopped locally. Remote completion and cost are unknown. This exact request cannot be sent again in this session.',
    sourceHint: 'Paste approved source text. The packet should make review easier without changing the meaning.',
    previewTitle: 'Preview',
    fullRecord: 'Complete record',
    pointerRecord: 'Reference record',
    disclosureTitle: 'Before you build',
    disclosureGroupTitles: {
      output: 'Output and inputs',
      destination: 'Data destination and access',
      cost: 'Cost',
      save: 'Save and review status',
      decline: 'Decline and Stop limits',
    },
    genericDisclosure: {
      output: 'Build uses the source fields below to make one HTML review packet.',
      destination: "Building this packet may send a short excerpt of your text to a review-checking service. Whether that happens, and where the data goes, depends on this deployment's setup and is not shown here. Who can access that data is also unknown here.",
      cost: 'Cost is unknown here. Do not assume it is free.',
      save: 'The built packet is a draft that is unverified and unaccepted. Saving a draft, if offered, is a separate step that you choose.',
      decline: 'You can decline before Build: do not click Build, or ask an operator about the setup first. Stop only acts on this page; it cannot prove that a remote task stopped or what it cost.',
    },
    selectedDisclosure: {
      output: 'Build uses the source fields below to make one HTML review packet. The server response reports a local test profile for this session: HTML is rendered on this device.',
      destination: 'This profile does not show where data goes or who can access it, and it does not grant any access or permission. HTML export configuration is resolved separately, so a later export may use a different profile.',
      cost: 'This profile does not establish a price. Cost is not shown here; do not assume it is zero.',
      save: 'A draft is saved to local test storage only when you choose Save; no review receipt is requested. The draft remains unverified and unaccepted, even after a separate local test review by the same user; that review is not trusted evidence or business acceptance.',
      decline: 'You can decline before Build: do not click Build, or ask an operator first. Opening or closing the panel does not start a build. Stop only acts on this page; it does not confirm that a remote task stopped or determine cost.',
    },
    receiptAbsentNote: 'No review-checking receipt was returned this time. This does not necessarily mean nothing was sent — see the note above.',
    receiptTimedOutNote: 'The review check timed out. No receipt was received, but the service may still have processed the request. Ask an operator to check the attempt ID before trying again.',
    receiptUnavailableNote: 'The review check was unavailable. No receipt was received; the request may still have reached the service. Check the attempt ID before trying again.',
    receiptInvalidNote: 'The review response could not be verified. This packet remains draft and has no accepted receipt.',
    receiptNotConfiguredNote: 'This deployment has no review-check address configured. No review receipt was requested.',
    draftNote: 'DRAFT / UNACCEPTED. This HTML is a review preview, not an accepted artifact.',
    deniedNote: 'Review check did not approve this packet. It remains draft and unaccepted.',
    evaluatedNote: 'Governance evaluation returned ALLOW. This is not artifact approval; the packet remains draft and unaccepted.',
    allowNote: 'Review receipt: approved. Final artifact acceptance is still required.',
    approvedChecksNote: 'Review receipt: approved. Presentation checks still need attention; this packet remains draft and unaccepted.',
    secretRefusalRecovery: 'This text looks like it may contain a private key or token. Remove that value and try again.',
    missingFieldRecovery: 'Some required fields are empty. Check the form, fill in the missing fields, and try again.',
    versionCurrent: 'Built from the form as submitted for build #{n}. It still matches the current form.',
    versionStale: 'Earlier version (build #{n}). The form has changed since this packet was built. The preview, receipt, checks, copy, download and print below all refer to that earlier version. Build again to match the current form.',
    versionUnknown: 'Earlier result with unknown source. It was not built from this form session, so it may not match the current form.',
    versionTagCurrent: 'Build #{n} · matches form',
    versionTagStale: 'Build #{n} · earlier version',
    versionTagUnknown: 'Source unknown',
    supersededPending: 'Build #{n} was replaced by a newer build. Its response, if one arrives, will not be shown or used.',
    supersededSuccessId: 'Build #{n} was replaced by a newer build and its response was not shown. The response carried ID {id}. This page cannot establish a governance result for it.',
    supersededSuccessNoId: 'Build #{n} was replaced by a newer build and its response was not shown. The response carried no ID, so no governance result could be established for it.',
    supersededFailure: 'Build #{n} was replaced by a newer build and its request failed. No governance result could be established for it.',
    errorBuild: 'Build #{n}',
    errorPreviewKnown: 'The preview still shows build #{n}, not this build.',
    errorPreviewUnknown: 'The preview still shows an earlier result of unknown source, not this build.',
    printBlocked: 'Print preview did not open. Allow pop-ups for this site and try again. Nothing was printed.',
    previewUnavailable: 'Preview unavailable: this packet could not be shown safely here. Copy, Download and Print still use the full HTML.',
  },
  vi: {
    title: 'Xuất gói rà soát',
    subtitle: 'Tạo gói HTML tự chứa, có receipt rõ ràng để người xem biết nguồn và ranh giới.',
    boundary: 'Chỉ HTML. PDF, PNG, PPTX và bằng chứng cuối cùng được xử lý riêng.',
    candidate: 'Bản nháp chờ rà soát',
    sourceTitle: 'Nguồn rà soát',
    outputTitle: 'Gói HTML',
    verificationTitle: 'Kiểm tra sẵn sàng',
    titleLabel: 'Tiêu đề',
    pathLabel: 'Nguồn tham chiếu',
    memoryLabel: 'Loại bản ghi',
    statusLabel: 'Trạng thái rà soát',
    receiptLabel: 'Mã receipt',
    boundaryLabel: 'Ranh giới rà soát',
    contentLabel: 'Ghi chú nguồn',
    generate: 'Tạo HTML',
    generating: 'Đang tạo',
    copy: 'Sao chép HTML',
    copied: 'Đã sao chép',
    download: 'Tải HTML',
    print: 'Xem bản in',
    noOutput: 'Tạo gói HTML để xem trước tại đây.',
    noChecks: 'Các kiểm tra sẵn sàng sẽ hiện sau khi tạo.',
    failed: 'Xuất thất bại',
    genericFailure: 'Chưa xác nhận được kết quả tạo. Hãy xem chi tiết trước khi quyết định bước tiếp theo.',
    completeGoalCriteria: 'Hãy nhập mục tiêu và đầy đủ tiêu chí trước khi tạo HTML.',
    pendingOperationRecovery: 'Chưa ghi nhận được thao tác đang chờ. Hãy đối soát thao tác đó trước khi ghi thêm.',
    technicalDetail: 'Chi tiết kỹ thuật',
    stop: 'Dừng tại đây',
    stoppedUnknown: 'Đã dừng tại đây. Thao tác từ xa có thể vẫn tiếp tục và chi phí chưa rõ. Không thể gửi lại đúng yêu cầu này trong phiên hiện tại.',
    sourceHint: 'Dán nội dung đã được duyệt. Gói này giúp review dễ hơn mà không đổi ý nghĩa.',
    previewTitle: 'Xem trước',
    fullRecord: 'Bản đầy đủ',
    pointerRecord: 'Bản tham chiếu',
    disclosureTitle: 'Trước khi tạo',
    disclosureGroupTitles: {
      output: 'Kết quả và đầu vào',
      destination: 'Nơi dữ liệu đi và quyền truy cập',
      cost: 'Chi phí',
      save: 'Trạng thái lưu và rà soát',
      decline: 'Từ chối và giới hạn của Dừng',
    },
    genericDisclosure: {
      output: 'Tạo HTML dùng các trường nguồn bên dưới để tạo một gói HTML rà soát.',
      destination: 'Việc tạo gói này có thể gửi một đoạn ngắn nội dung của bạn đến một dịch vụ kiểm tra rà soát. Việc này có xảy ra hay không, và dữ liệu đi đâu, phụ thuộc vào cấu hình triển khai và không hiển thị ở đây. Ai được truy cập dữ liệu đó cũng chưa rõ ở đây.',
      cost: 'Chi phí chưa rõ ở đây. Đừng mặc định là miễn phí.',
      save: 'Gói đã tạo là bản nháp, chưa được xác minh và chưa được chấp nhận. Việc lưu bản nháp, nếu có, là một bước riêng do bạn chọn.',
      decline: 'Bạn có thể từ chối trước khi tạo: không bấm Tạo HTML, hoặc hỏi người vận hành về cấu hình trước. Dừng chỉ tác động trên trang này; không chứng minh được thao tác từ xa đã dừng hay chi phí là bao nhiêu.',
    },
    selectedDisclosure: {
      output: 'Tạo HTML dùng các trường nguồn bên dưới để tạo một gói HTML rà soát. Phản hồi máy chủ cho biết phiên này dùng chế độ thử nghiệm cục bộ: HTML được tạo trên máy này.',
      destination: 'Chế độ này không cho biết dữ liệu đi đâu hay ai được truy cập, và không cấp quyền truy cập nào. Cấu hình tạo HTML được xác định riêng; lần tạo sau có thể dùng chế độ khác.',
      cost: 'Chế độ này không xác lập giá. Chi phí không hiển thị ở đây; đừng mặc định là bằng không.',
      save: 'Bản nháp chỉ được lưu vào kho thử nghiệm cục bộ khi bạn chọn Lưu; không có yêu cầu lấy biên nhận kiểm tra. Bản nháp vẫn chưa được xác minh và chưa được chấp nhận, kể cả sau một lượt rà soát thử nghiệm cục bộ riêng của cùng người dùng; lượt rà soát này không phải bằng chứng đáng tin cậy hay sự chấp nhận trong nghiệp vụ.',
      decline: 'Bạn có thể từ chối trước khi tạo: không bấm Tạo HTML, hoặc hỏi người vận hành trước. Mở hay đóng bảng không bắt đầu lượt tạo. Dừng chỉ tác động trên trang này; không xác nhận thao tác từ xa đã dừng và chi phí vẫn chưa rõ.',
    },
    receiptAbsentNote: 'Lần này không có biên nhận kiểm tra rà soát nào được trả về. Điều này không chắc có nghĩa là không có gì được gửi — xem ghi chú ở trên.',
    receiptTimedOutNote: 'Kiểm tra rà soát đã hết thời gian chờ. Chưa nhận được receipt, nhưng dịch vụ có thể vẫn đã xử lý yêu cầu. Hãy nhờ người vận hành kiểm tra mã lần thử trước khi thử lại.',
    receiptUnavailableNote: 'Dịch vụ kiểm tra rà soát không sẵn sàng. Chưa nhận được receipt; yêu cầu vẫn có thể đã tới dịch vụ. Hãy kiểm tra mã lần thử trước khi thử lại.',
    receiptInvalidNote: 'Không xác minh được phản hồi kiểm tra. Gói này vẫn là bản nháp và chưa có receipt được chấp nhận.',
    receiptNotConfiguredNote: 'Bản triển khai này chưa cấu hình địa chỉ kiểm tra rà soát. Chưa gửi yêu cầu lấy receipt.',
    draftNote: 'BẢN NHÁP / CHƯA ĐƯỢC CHẤP NHẬN. HTML này chỉ để xem xét.',
    deniedNote: 'Kiểm tra chưa phê duyệt gói này. Gói vẫn là bản nháp, chưa được chấp nhận.',
    evaluatedNote: 'Đánh giá governance trả ALLOW. Đây không phải phê duyệt artifact; gói vẫn là bản nháp, chưa được chấp nhận.',
    allowNote: 'Biên nhận rà soát: đã duyệt. Vẫn cần nghiệm thu artifact cuối cùng.',
    approvedChecksNote: 'Biên nhận rà soát: đã duyệt. Kiểm tra trình bày vẫn cần xử lý; gói này là bản nháp, chưa được chấp nhận.',
    secretRefusalRecovery: 'Nội dung này có vẻ chứa khóa riêng tư hoặc mã token. Hãy xóa giá trị đó rồi thử lại.',
    missingFieldRecovery: 'Một số trường bắt buộc còn trống. Hãy kiểm tra biểu mẫu, điền các trường còn thiếu rồi thử lại.',
    versionCurrent: 'Được tạo từ biểu mẫu đã gửi ở lần tạo #{n}. Kết quả vẫn khớp với biểu mẫu hiện tại.',
    versionStale: 'Phiên bản cũ (lần tạo #{n}). Biểu mẫu đã thay đổi kể từ khi gói này được tạo. Bản xem trước, receipt, kiểm tra, sao chép, tải và in bên dưới đều thuộc phiên bản cũ đó. Hãy tạo lại để khớp với biểu mẫu hiện tại.',
    versionUnknown: 'Kết quả cũ không rõ nguồn. Kết quả này không được tạo từ phiên biểu mẫu hiện tại nên có thể không khớp với biểu mẫu.',
    versionTagCurrent: 'Lần tạo #{n} · khớp biểu mẫu',
    versionTagStale: 'Lần tạo #{n} · phiên bản cũ',
    versionTagUnknown: 'Không rõ nguồn',
    supersededPending: 'Lần tạo #{n} đã bị thay bằng lần tạo mới hơn. Nếu có phản hồi, phản hồi đó sẽ không được hiển thị hay sử dụng.',
    supersededSuccessId: 'Lần tạo #{n} đã bị thay bằng lần tạo mới hơn và phản hồi của nó không được hiển thị. Phản hồi mang mã {id}. Trang này không xác lập được kết quả governance cho lần tạo đó.',
    supersededSuccessNoId: 'Lần tạo #{n} đã bị thay bằng lần tạo mới hơn và phản hồi của nó không được hiển thị. Phản hồi không có mã nào, nên không xác lập được kết quả governance cho lần tạo đó.',
    supersededFailure: 'Lần tạo #{n} đã bị thay bằng lần tạo mới hơn và yêu cầu của nó bị lỗi. Không xác lập được kết quả governance cho lần tạo đó.',
    errorBuild: 'Lần tạo #{n}',
    errorPreviewKnown: 'Bản xem trước vẫn là lần tạo #{n}, không phải lần tạo này.',
    errorPreviewUnknown: 'Bản xem trước vẫn là kết quả cũ không rõ nguồn, không phải lần tạo này.',
    printBlocked: 'Không mở được bản xem để in. Hãy cho phép cửa sổ bật lên cho trang này rồi thử lại. Chưa in gì cả.',
    previewUnavailable: 'Không hiển thị được bản xem trước một cách an toàn. Sao chép, tải và in vẫn dùng toàn bộ HTML.',
  },
};

// Print frame layout width in CSS px: the frame is laid out at its own width, so the height
// measured at this width is the height it prints at.
const PRINT_FRAME_WIDTH = 700;
// Applied to the print popup and inherited by its srcdoc frames: no script, no connection and
// no network resource loads (the exported packet is self-contained; data: images still work).
const PRINT_FRAME_POLICY = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; frame-src about:; base-uri 'none'; form-action 'none'";

// Preview-only resource policy. The sandboxed Preview frame already blocks scripts, but an
// empty sandbox still loads passive resources (images, stylesheets, fonts, nested frames), so
// the derived Preview document denies every network and data: resource and keeps only inline
// styles. Data and blob images are blocked on purpose (unlike Print): Preview shows the text
// and inline-styled layout, not embedded media. Not a sanitizer; CSP does not cover navigation,
// which containPreviewNavigation removes from the derived document before the frame exists.
export const PREVIEW_FRAME_POLICY = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";
const PREVIEW_POLICY_META = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_FRAME_POLICY}">`;
// Only the plain doctype is split on: anything else gets the policy first, because a
// payload-controlled doctype (quoted ids, comments) could otherwise swallow the policy tag.
const LEADING_PLAIN_DOCTYPE = /^[\t\n\f\r ]*<!doctype html>/i;

// Derived Preview document: the policy meta is the first element the parser sees, ahead of
// any payload resource markup (before a head, duplicate heads, payload-supplied policy).
// result.html itself is never altered; Copy, Download and Print keep using it verbatim.
export function buildPreviewDocument(html: string): string {
  const doctype = LEADING_PLAIN_DOCTYPE.exec(html);
  if (!doctype) return PREVIEW_POLICY_META + html;
  return html.slice(0, doctype[0].length) + PREVIEW_POLICY_META + html.slice(doctype[0].length);
}

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';
const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';
const MAX_CONTAINMENT_ROUNDS = 4;

// Template contents are walked too: the frame parser attaches declarative shadow roots, DOMParser does not.
function collectElements(root: ParentNode): Element[] {
  const found: Element[] = [];
  const pending: ParentNode[] = [root];
  while (pending.length > 0) {
    const scope = pending.pop()!;
    for (const element of Array.from(scope.querySelectorAll('*'))) {
      found.push(element);
      if (element.namespaceURI === HTML_NS && element.localName === 'template') {
        pending.push((element as HTMLTemplateElement).content);
      }
    }
  }
  return found;
}

// Links, image-map areas, SVG href, SVG animate/set (can add an href without script), meta refresh and base.
function removeNavigationConstructs(doc: Document): number {
  let removed = 0;
  for (const element of collectElements(doc)) {
    const namespace = element.namespaceURI;
    const name = element.localName;
    if (name === 'a' || name === 'area' || namespace === MATHML_NS) {
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.localName.toLowerCase() === 'href') {
          element.removeAttribute(attribute.name);
          removed += 1;
        }
      }
    }
    if (
      (namespace === SVG_NS && (name === 'animate' || name === 'set'))
      || (namespace === HTML_NS && name === 'base')
      || (namespace === HTML_NS && name === 'meta' && (element.getAttribute('http-equiv') ?? '').trim().toLowerCase() === 'refresh')
    ) {
      element.remove();
      removed += 1;
    }
  }
  return removed;
}

// Preview-only presentation containment: no activatable navigation construct reaches the frame, so
// no destination request can start. Returns the verified document, or null when it cannot be made
// safe (or DOMParser is unavailable), so the caller can fail closed. result.html is never passed back.
export function containPreviewNavigation(html: string): string | null {
  if (typeof DOMParser === 'undefined') return null;
  let current = html;
  for (let round = 0; round < MAX_CONTAINMENT_ROUNDS; round += 1) {
    const doc = new DOMParser().parseFromString(current, 'text/html');
    if (removeNavigationConstructs(doc) === 0) return current;
    current = (doc.compatMode === 'CSS1Compat' ? '<!doctype html>' : '') + doc.documentElement.outerHTML;
  }
  return null;
}

function unavailablePreviewDocument(message: string): string {
  const text = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><html><body style="margin:0;padding:16px;font:14px/1.5 system-ui,sans-serif;color:#374151"><p>${text}</p></body></html>`;
}

function normalizeRequest(input?: Partial<ArtifactExportRequest>): ArtifactExportRequest {
  return { ...DEFAULT_REQUEST, ...input };
}

function sameRequest(a: ArtifactExportRequest, b: ArtifactExportRequest): boolean {
  return REQUEST_FIELDS.every(field => a[field] === b[field]);
}

function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function writeText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Use the legacy clipboard path below.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:rgb(var(--cvf-accent-rgb))]';
const FIELD_CLASS = `mt-1 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition focus-visible:border-[color:rgb(var(--cvf-accent-rgb))] ${FOCUS_RING} dark:border-gray-700 dark:bg-gray-950 dark:text-white`;

function FieldLabel({ children, htmlFor }: { children: string; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </label>
  );
}

function recoveryMessageFor(rawError: string, labels: typeof LABELS['en']): string | null {
  if (rawError === 'Complete the goal and criteria first.') return labels.completeGoalCriteria;
  if (rawError === 'Resolve the pending operation before another write.') return labels.pendingOperationRecovery;
  if (
    rawError === 'Potential secret-like value detected in artifact export fields.'
    || rawError === 'Potential secret-like value detected in source content.'
  ) {
    return labels.secretRefusalRecovery;
  }
  if (rawError === 'Missing required artifact export fields.') {
    return labels.missingFieldRecovery;
  }
  return null;
}

function StatusPill({ children, tone }: { children: ReactNode; tone: 'info' | 'success' | 'warning' }) {
  const className = tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
      : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function ArtifactExportPanel({
  initialRequest,
  initialResult = null,
  exportEndpoint = '/api/artifacts/export',
  onGenerated,
  prepareJob,
  renderRecovery,
  profileDisclosure,
}: ArtifactExportPanelProps) {
  const { language } = useLanguage();
  const labels = LABELS[language === 'vi' ? 'vi' : 'en'];
  const fieldId = useId();
  const [request, setRequest] = useState<ArtifactExportRequest>(() => normalizeRequest(initialRequest));
  const { displayed, pendingAttempt, attemptError, superseded, stoppedUnknown, generate, stop } = useHtmlBuildAttempts({
    initialResult, exportEndpoint, prepareJob, onGenerated, sameRequest,
  });
  const [copied, setCopied] = useState(false);
  const [printBlocked, setPrintBlocked] = useState(false);
  const loading = pendingAttempt !== null;
  const result = displayed?.result ?? null;
  const error = attemptError?.message ?? null;
  const friendlyError = error ? recoveryMessageFor(error, labels) ?? labels.genericFailure : null;
  const disclosureText = profileDisclosure === 'LOCAL_SYNTHETIC'
    ? labels.selectedDisclosure
    : labels.genericDisclosure;
  const versionState: 'current' | 'stale' | 'unknown' | null = !displayed
    ? null
    : !displayed.submitted
      ? 'unknown'
      : sameRequest(displayed.submitted, request)
        ? 'current'
        : 'stale';
  const fillAttempt = (text: string) => text.replace('{n}', String(displayed?.attempt ?? 0));
  const versionNotice = versionState === 'stale' ? fillAttempt(labels.versionStale)
    : versionState === 'unknown' ? labels.versionUnknown
      : versionState === 'current' ? fillAttempt(labels.versionCurrent)
        : null;
  const versionTag = versionState === 'stale' ? fillAttempt(labels.versionTagStale)
    : versionState === 'unknown' ? labels.versionTagUnknown
      : versionState === 'current' ? fillAttempt(labels.versionTagCurrent)
        : null;
  const supersededText = (item: SupersededOutcome) => {
    const template = item.status === 'pending' ? labels.supersededPending
      : item.status === 'failure' ? labels.supersededFailure
        : item.id ? labels.supersededSuccessId : labels.supersededSuccessNoId;
    return template.replace('{n}', String(item.attempt)).replace('{id}', item.id ?? '');
  };
  const errorPreviewNote = !attemptError || !displayed ? null
    : displayed.attempt ? labels.errorPreviewKnown.replace('{n}', String(displayed.attempt))
      : labels.errorPreviewUnknown;
  const noticeId = 'artifact-version-notice';
  const describedBy = versionState && versionState !== 'current' ? noticeId : undefined;

  const passedChecks = useMemo(
    () => result?.verification.filter(item => item.passed).length ?? 0,
    [result],
  );

  const unavailableNotice = labels.previewUnavailable;
  const previewDocument = useMemo(
    () => (result ? buildPreviewDocument(containPreviewNavigation(result.html) ?? unavailablePreviewDocument(unavailableNotice)) : null),
    [result, unavailableNotice],
  );

  const updateRequest = useCallback(
    (field: keyof ArtifactExportRequest, value: string) => {
      setRequest(current => ({
        ...current,
        [field]: field === 'memoryClass' && value === 'POINTER_RECORD' ? 'POINTER_RECORD' : value,
      } as ArtifactExportRequest));
    },
    [],
  );

  const handleGenerate = useCallback(() => generate(request), [generate, request]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const ok = await writeText(result.html);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadHtml(result.filename, result.html);
  }, [result]);

  const handlePrint = useCallback(() => {
    if (!result) return;
    // The popup is an app-origin about:blank, so result.html must never be written into
    // it or run with app authority. The popup receives a fixed shell instead:
    //  - a CSP meta first, inherited by the srcdoc frames below: no script, no fetch, no
    //    network load, so even a same-origin frame cannot reach storage, cookies or app
    //    endpoints;
    //  - a hidden measuring frame (sandbox allow-same-origin: no scripts) that only lets
    //    this code read the document height at the print width;
    //  - the printed frame: empty sandbox (no scripts, opaque origin) sized to the
    //    measured height, because a replaced element prints only its own box and a fixed
    //    height would clip long documents.
    // `noopener` is not used because it makes window.open return null; the opener is
    // detached before anything is inserted instead. Any failure closes the window and
    // never prints a partial document.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setPrintBlocked(true);
      return;
    }
    const abort = () => {
      printWindow.close();
      setPrintBlocked(true);
    };
    try {
      printWindow.opener = null;
      if (printWindow.opener !== null) throw new Error('opener not detached');
      const doc = printWindow.document;
      doc.title = result.filename;
      const policy = doc.createElement('meta');
      policy.httpEquiv = 'Content-Security-Policy';
      policy.content = PRINT_FRAME_POLICY;
      doc.head.appendChild(policy);
      doc.body.style.margin = '0';

      const view = doc.createElement('iframe');
      view.setAttribute('sandbox', '');
      view.setAttribute('title', 'Print preview');
      view.style.cssText = `display:block;border:0;width:${PRINT_FRAME_WIDTH}px;height:0`;

      const probe = doc.createElement('iframe');
      probe.setAttribute('sandbox', 'allow-same-origin');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = `position:absolute;left:-10000px;top:0;border:0;visibility:hidden;width:${PRINT_FRAME_WIDTH}px;height:100px`;
      probe.addEventListener('load', () => {
        try {
          const probeDoc = probe.contentDocument;
          const height = probeDoc ? Math.ceil(Math.max(probeDoc.documentElement.scrollHeight, probeDoc.body?.scrollHeight ?? 0)) : 0;
          if (!(height > 0)) throw new Error('print height not measured');
          view.style.height = `${height + 2}px`;
          probe.remove();
          // Insert only now, with srcdoc already set, so the first load is the content and
          // print() never runs against an empty frame.
          view.addEventListener('load', () => {
            try {
              printWindow.focus();
              printWindow.print();
            } catch {
              abort();
            }
          }, { once: true });
          view.srcdoc = result.html;
          doc.body.appendChild(view);
        } catch {
          abort();
        }
      }, { once: true });

      probe.srcdoc = result.html;
      doc.body.appendChild(probe);
      setPrintBlocked(false);
    } catch {
      abort();
    }
  }, [result]);

  return (
    <section className="space-y-5 text-gray-900 dark:text-gray-100" data-testid="artifact-export-panel">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusPill tone="info">HTML</StatusPill>
              <StatusPill tone="warning">{labels.candidate}</StatusPill>
            </div>
            <h2 className="text-2xl font-bold tracking-normal text-gray-950 dark:text-white">
              {labels.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              {labels.subtitle}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
            {labels.boundary}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{labels.sourceTitle}</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`${fieldId}-title`}>{labels.titleLabel}</FieldLabel>
              <input
                id={`${fieldId}-title`}
                aria-label={labels.titleLabel}
                value={request.title}
                onChange={event => updateRequest('title', event.target.value)}
                className={`${FIELD_CLASS} text-sm`}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`${fieldId}-path`}>{labels.pathLabel}</FieldLabel>
              <input
                id={`${fieldId}-path`}
                aria-label={labels.pathLabel}
                value={request.sourcePath}
                onChange={event => updateRequest('sourcePath', event.target.value)}
                className={`${FIELD_CLASS} font-mono text-xs`}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${fieldId}-memory`}>{labels.memoryLabel}</FieldLabel>
              <select
                id={`${fieldId}-memory`}
                aria-label={labels.memoryLabel}
                value={request.memoryClass}
                onChange={event => updateRequest('memoryClass', event.target.value)}
                className={`${FIELD_CLASS} text-sm`}
              >
                <option value="FULL_RECORD">{labels.fullRecord}</option>
                <option value="POINTER_RECORD">{labels.pointerRecord}</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor={`${fieldId}-status`}>{labels.statusLabel}</FieldLabel>
              <input
                id={`${fieldId}-status`}
                aria-label={labels.statusLabel}
                value={request.status}
                onChange={event => updateRequest('status', event.target.value)}
                className={`${FIELD_CLASS} text-sm`}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`${fieldId}-receipt`}>{labels.receiptLabel}</FieldLabel>
              <input
                id={`${fieldId}-receipt`}
                aria-label={labels.receiptLabel}
                value={request.receiptAnchor}
                onChange={event => updateRequest('receiptAnchor', event.target.value)}
                className={`${FIELD_CLASS} font-mono text-xs`}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`${fieldId}-boundary`}>{labels.boundaryLabel}</FieldLabel>
              <textarea
                id={`${fieldId}-boundary`}
                aria-label={labels.boundaryLabel}
                value={request.claimBoundary}
                onChange={event => updateRequest('claimBoundary', event.target.value)}
                rows={3}
                className={`${FIELD_CLASS} resize-none text-sm leading-6`}
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-end justify-between gap-3">
                <FieldLabel htmlFor={`${fieldId}-content`}>{labels.contentLabel}</FieldLabel>
                <span className="text-[11px] text-gray-500 dark:text-gray-500">{labels.sourceHint}</span>
              </div>
              <textarea
                id={`${fieldId}-content`}
                aria-label={labels.contentLabel}
                value={request.sourceContent}
                onChange={event => updateRequest('sourceContent', event.target.value)}
                onFocus={event => {
                  const field = event.currentTarget;
                  requestAnimationFrame(() => {
                    if (field.isConnected && field.getBoundingClientRect().height + 8 <= window.innerHeight) {
                      field.scrollIntoView({ block: 'center', inline: 'nearest' });
                    }
                  });
                }}
                rows={12}
                className={`${FIELD_CLASS} resize-y font-mono text-xs leading-5`}
              />
            </div>
          </div>

          <div
            data-testid="pre-generate-disclosure"
            data-disclosure={profileDisclosure === 'LOCAL_SYNTHETIC' ? 'selected-profile' : 'generic'}
            role="group"
            aria-labelledby={`${fieldId}-disclosure-title`}
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <p id={`${fieldId}-disclosure-title`} className="font-semibold">{labels.disclosureTitle}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {ARTIFACT_DISCLOSURE_GROUPS.map(group => (
                <div key={group} data-disclosure-group={group} className={group === 'save' ? 'sm:col-span-2' : undefined}>
                  <h4 className="font-semibold">{labels.disclosureGroupTitles[group]}</h4>
                  <p className="mt-0.5">{disclosureText[group]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!request.sourceContent.trim() || !request.receiptAnchor.trim()}
              aria-busy={loading}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {loading ? labels.generating : labels.generate}
            </button>
            {loading && <button type="button" onClick={stop} data-testid="stop-html-build"
              className="inline-flex min-h-11 items-center rounded-lg border border-amber-500 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">{labels.stop}</button>}
            {stoppedUnknown && <p role="status" data-testid="stopped-unknown" className="w-full text-xs text-amber-800 dark:text-amber-200">
              {labels.stoppedUnknown}
            </p>}
            {superseded.length > 0 && (
              <div role="status" data-testid="superseded-attempts" className="flex w-full flex-col gap-2">
                {superseded.map(item => (
                  <p
                    key={item.attempt}
                    data-testid="superseded-attempt-notice"
                    data-attempt={item.attempt}
                    data-status={item.status}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                  >
                    {supersededText(item)}
                  </p>
                ))}
              </div>
            )}
            {error && (
              <div className="inline-flex min-h-11 flex-col gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="font-semibold">{labels.failed}</span>
                  {attemptError && (
                    <span data-testid="export-error-build" className="font-mono">{labels.errorBuild.replace('{n}', String(attemptError.attempt))}</span>
                  )}
                </div>
                <span data-testid="export-error-recovery">{friendlyError}</span>
                {errorPreviewNote && (
                  <span data-testid="export-error-preview-note">{errorPreviewNote}</span>
                )}
                <details className="text-red-600/80 dark:text-red-300/80">
                  <summary>{labels.technicalDetail}</summary>
                  <span data-testid="export-error-detail" className="font-mono">{error}</span>
                </details>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{labels.outputTitle}</h3>
                </div>
                {result ? (
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p className="break-all font-mono">#{result.receiptAnchor}</p>
                    <p>{new Date(result.generatedAt).toLocaleString()}</p>
                    <p data-testid="artifact-draft-state" className="font-semibold text-amber-700 dark:text-amber-300">{labels.draftNote}</p>
                    {result.governanceReceipt?.decision === 'APPROVED' && result.governanceState === 'RECEIPT_ALLOW_REVIEW_REQUIRED' ? (
                      <div
                        data-testid="governance-receipt-badge"
                        className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {labels.allowNote}
                      </div>
                    ) : result.governanceReceipt?.decision === 'APPROVED' ? (
                      <p data-testid="governance-approved-checks-note" className="mt-1 text-amber-700 dark:text-amber-300">{labels.approvedChecksNote}</p>
                    ) : result.governanceReceipt?.decision === 'ALLOW' ? (
                      <p data-testid="governance-receipt-evaluated-note" className="mt-1 text-amber-700 dark:text-amber-300">{labels.evaluatedNote}</p>
                    ) : result.governanceReceipt ? (
                      <p data-testid="governance-receipt-denied-note" className="mt-1 text-red-700 dark:text-red-300">{labels.deniedNote}</p>
                    ) : (
                      <p data-testid="governance-receipt-absent-note" className="mt-1 text-amber-700 dark:text-amber-300">
                        {result.governanceReceiptStatus === 'TIMED_OUT' ? labels.receiptTimedOutNote
                          : result.governanceReceiptStatus === 'UNAVAILABLE' ? labels.receiptUnavailableNote
                            : result.governanceReceiptStatus === 'INVALID_RESPONSE' ? labels.receiptInvalidNote
                              : result.governanceReceiptStatus === 'NOT_CONFIGURED' ? labels.receiptNotConfiguredNote
                                : labels.receiptAbsentNote}
                      </p>
                    )}
                    {!result.governanceReceipt && result.governanceReceiptAttemptId && (
                      <p data-testid="governance-receipt-attempt-id" className="break-all font-mono">
                        {result.governanceReceiptAttemptId}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{labels.noOutput}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  disabled={!result}
                  aria-describedby={describedBy}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Clipboard className="h-4 w-4" aria-hidden="true" />
                  {copied ? labels.copied : labels.copy}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!result}
                  aria-describedby={describedBy}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {labels.download}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!result}
                  aria-describedby={describedBy}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  {labels.print}
                </button>
              </div>
            </div>

            {printBlocked && (
              <p
                role="status"
                data-testid="artifact-print-blocked"
                className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              >
                {labels.printBlocked}
              </p>
            )}

            {versionNotice && (
              <p
                id={noticeId}
                role="status"
                data-testid="artifact-version-notice"
                data-version-state={versionState ?? undefined}
                className={`mt-4 rounded-lg border px-3 py-2 text-xs leading-5 ${versionState === 'current'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'}`}
              >
                {versionNotice}
              </p>
            )}

            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {labels.previewTitle}
                {versionTag && <span data-testid="artifact-version-tag" className="ml-2 font-normal">· {versionTag}</span>}
              </div>
              {previewDocument !== null ? (
                <iframe
                  title={labels.previewTitle}
                  srcDoc={previewDocument}
                  sandbox=""
                  className="h-[430px] w-full bg-white"
                />
              ) : (
                <div className="flex h-[430px] items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {labels.noOutput}
                </div>
              )}
            </div>
            {renderRecovery?.(displayed, versionState)}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{labels.verificationTitle}</h3>
              {result && <StatusPill tone="success">{passedChecks}/{result.verification.length}</StatusPill>}
            </div>
            {!result && <p className="text-sm text-gray-500 dark:text-gray-400">{labels.noChecks}</p>}
            {result && (
              <div className="space-y-3">
                {result.verification.map(item => (
                  <div
                    key={item.label}
                    className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
                  >
                    {item.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                      {item.detail && <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{item.detail}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ArtifactExportPanel;
