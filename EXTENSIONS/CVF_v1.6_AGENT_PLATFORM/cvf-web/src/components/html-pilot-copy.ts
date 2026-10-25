// Text Encoding Exception: localized Vietnamese pilot copy follows the existing UI language owner.
/**
 * EN/VI copy for the signed HTML pilot surfaces. IDs, hashes and decision tokens are interpolated verbatim and
 * are never translated; only the words around them are.
 */
export type PilotLanguage = 'en' | 'vi';
export type PilotDecisionToken = 'PENDING_OPERATOR_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED';

/** Stable machine-readable status codes; the visible sentence is localized, the code is not. */
export type PilotStatusCode =
  | 'CREATING' | 'JOB_CREATED' | 'JOB_UNKNOWN' | 'EXISTING_JOB_UNAVAILABLE' | 'JOB_RECOVERED' | 'JOB_NOT_CONFIRMED'
  | 'RENDERING' | 'RENDERED' | 'RENDER_REFUSED' | 'RENDER_STOPPED' | 'SAVE_UNKNOWN' | 'SAVED' | 'VERSION_RESTORED'
  | 'VERSION_UNAVAILABLE' | 'LINKED' | 'LINK_UNKNOWN' | 'VERSIONS_UNAVAILABLE' | 'DECIDED' | 'DECISION_UNKNOWN';

export interface PilotCopy {
  home: { heading: string; intro: string; goalLabel: string; continueLabel: string; blockedHint: string;
    stoppedNotice: string };
  summary: { candidate: (runId: string, receiptId: string) => string; unavailable: string; localRender: string };
  badge: (versionId: string, runId: string, sha: string) => string;
  controls: {
    heading: string; sourceUnavailable: string; sourceLine: (runId: string, root: string, receiptId: string) => string;
    decisionLine: (token: PilotDecisionToken) => string; job: (jobId: string) => string;
    createDraft: string; checkPreviousCreate: string; buildPreview: string; stopWait: string; saveVersion: string;
    checkSaved: (versionId: string) => string; useSaved: string; showVersions: string; restore: (versionId: string) => string;
    download: string; previewTitle: string; linkedLine: (runId: string) => string; reviewedCheckbox: string;
    accept: string; reject: string; actions: string; versionList: string;
  };
  status: {
    CREATING: string; JOB_CREATED: string; JOB_UNKNOWN: (error: string) => string; EXISTING_JOB_UNAVAILABLE: string;
    JOB_RECOVERED: string; JOB_NOT_CONFIRMED: string; RENDERING: string; RENDERED: string;
    RENDER_REFUSED: (error: string) => string; RENDER_STOPPED: string; SAVE_UNKNOWN: (versionId: string) => string;
    SAVED: string; VERSION_RESTORED: string; VERSION_UNAVAILABLE: string; LINKED: string; LINK_UNKNOWN: string;
    VERSIONS_UNAVAILABLE: string; DECIDED: (versionId: string, token: PilotDecisionToken) => string; DECISION_UNKNOWN: string;
  };
}

const VI_DECISION: Record<PilotDecisionToken, string> = {
  PENDING_OPERATOR_ACCEPTANCE: 'Chờ người vận hành nghiệm thu', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối',
};

const en: PilotCopy = {
  home: {
    heading: 'Fictional HTML pilot goal',
    intro: 'Only this fictional goal and CVF static instructions enter the selected provider prompt after the effect disclosure.',
    goalLabel: 'Website goal', continueLabel: 'Continue to effect disclosure',
    blockedHint: 'Sending again is locked after a local stop, so this request is never resent automatically.',
    stoppedNotice: 'Stopped waiting locally. Remote outcome and cost are unknown; this request is never resent automatically.',
  },
  summary: {
    candidate: (runId, receiptId) => `Signed-source candidate: run ${runId}, receipt ${receiptId}.`, unavailable: 'unavailable',
    localRender: 'Local HTML rendering reads this exact output. Saving and product acceptance are separate actions.',
  },
  badge: (versionId, runId, sha) => `Version ${versionId}; source run ${runId}; HTML SHA-256 ${sha}; pending exact-version operator disposition.`,
  controls: {
    heading: 'Build your HTML page', sourceUnavailable: 'Signed pilot source unavailable.',
    sourceLine: (runId, root, receiptId) => `Source run ${runId}; root ${root}; receipt ${receiptId}.`,
    decisionLine: token => `Product decision: ${token}.`, job: jobId => `Job ${jobId}`,
    createDraft: 'Create draft', checkPreviousCreate: 'Check previous create', buildPreview: 'Build HTML preview',
    stopWait: 'Stop local wait', saveVersion: 'Save version', checkSaved: versionId => `Check saved version ${versionId}`,
    useSaved: 'Use saved version', showVersions: 'Show saved versions', restore: versionId => `Restore ${versionId}`,
    download: 'Download exact saved HTML', previewTitle: 'Saved HTML preview',
    linkedLine: runId => `Linked source ${runId}; product acceptance is pending.`,
    reviewedCheckbox: 'I inspected this exact saved version and hash', accept: 'Accept exact version', reject: 'Reject exact version',
    actions: 'HTML page actions', versionList: 'Saved versions',
  },
  status: {
    CREATING: 'Creating one owner-bound job. An unclear write must be reconciled.',
    JOB_CREATED: 'Job created. HTML rendering is a separate local action.',
    JOB_UNKNOWN: error => `Job outcome unknown: ${error}. Reconcile exact ID before continuing.`,
    EXISTING_JOB_UNAVAILABLE: 'Existing job unavailable; no new job was created.',
    JOB_RECOVERED: 'Original job recovered without another write.',
    JOB_NOT_CONFIRMED: 'Original job not confirmed. Keep this ID; do not create another.',
    RENDERING: 'Rendering signed source locally.', RENDERED: 'HTML rendered. Save the exact version to make it durable.',
    RENDER_REFUSED: error => `Render refused: ${error}. No provider request was started.`,
    RENDER_STOPPED: 'Stopped waiting locally. The server render may still finish; a late response cannot publish or save HTML. This action starts no new AI request.',
    SAVE_UNKNOWN: versionId => `Save outcome unknown for ${versionId}. Read-only recovery only; do not create another version.`,
    SAVED: 'Exact version saved. Link it to the original job.',
    VERSION_RESTORED: 'Exact version restored by owner-scoped read; no AI request started.',
    VERSION_UNAVAILABLE: 'Exact version unavailable or unconfirmed.', LINKED: 'Version linked. Product disposition remains pending.',
    LINK_UNKNOWN: 'Link outcome unknown. Recover the exact version and link before any other write.',
    VERSIONS_UNAVAILABLE: 'Saved version list unavailable. No AI request started.',
    DECIDED: (versionId, token) => `Account action recorded for exact version ${versionId}: ${token}.`,
    DECISION_UNKNOWN: 'Disposition outcome unknown. Read the exact version decision; never infer acceptance.',
  },
};

const vi: PilotCopy = {
  home: {
    heading: 'Mục tiêu trang HTML thử nghiệm (nội dung hư cấu)',
    intro: 'Chỉ mục tiêu hư cấu này và chỉ dẫn tĩnh của CVF được gửi tới nhà cung cấp đã chọn, sau khi bạn xem phần công bố tác động.',
    goalLabel: 'Mục tiêu trang web', continueLabel: 'Tiếp tục tới phần công bố tác động',
    blockedHint: 'Việc gửi lại bị khóa sau khi dừng trên thiết bị này, để yêu cầu này không bao giờ tự động gửi lại.',
    stoppedNotice: 'Đã dừng chờ tại đây. Kết quả và chi phí từ xa chưa rõ; không tự gửi lại yêu cầu này.',
  },
  summary: {
    candidate: (runId, receiptId) => `Nguồn đã ký ứng viên: lượt ${runId}, biên nhận ${receiptId}.`, unavailable: 'không có',
    localRender: 'Việc dựng HTML cục bộ đọc đúng kết quả này. Lưu và nghiệm thu sản phẩm là các thao tác riêng.',
  },
  badge: (versionId, runId, sha) => `Phiên bản ${versionId}; lượt nguồn ${runId}; HTML SHA-256 ${sha}; đang chờ người vận hành quyết định đúng phiên bản.`,
  controls: {
    heading: 'Tạo trang HTML của bạn', sourceUnavailable: 'Không có nguồn thử nghiệm đã ký.',
    sourceLine: (runId, root, receiptId) => `Lượt nguồn ${runId}; gốc ${root}; biên nhận ${receiptId}.`,
    decisionLine: token => `Quyết định sản phẩm: ${VI_DECISION[token]} (${token}).`, job: jobId => `Tác vụ ${jobId}`,
    createDraft: 'Tạo bản nháp', checkPreviousCreate: 'Kiểm tra lần tạo trước', buildPreview: 'Tạo bản xem trước HTML',
    stopWait: 'Dừng chờ trên thiết bị này', saveVersion: 'Lưu phiên bản', checkSaved: versionId => `Kiểm tra phiên bản đã lưu ${versionId}`,
    useSaved: 'Dùng phiên bản đã lưu', showVersions: 'Xem các phiên bản đã lưu', restore: versionId => `Khôi phục ${versionId}`,
    download: 'Tải đúng HTML đã lưu', previewTitle: 'Xem trước HTML đã lưu',
    linkedLine: runId => `Đã liên kết nguồn ${runId}; việc nghiệm thu sản phẩm đang chờ.`,
    reviewedCheckbox: 'Tôi đã kiểm tra đúng phiên bản đã lưu này và mã băm của nó',
    accept: 'Chấp nhận đúng phiên bản này', reject: 'Từ chối đúng phiên bản này',
    actions: 'Thao tác với trang HTML', versionList: 'Các phiên bản đã lưu',
  },
  status: {
    CREATING: 'Đang tạo một tác vụ gắn với chủ sở hữu. Nếu kết quả ghi chưa rõ, phải đối soát.',
    JOB_CREATED: 'Đã tạo tác vụ. Dựng HTML là một thao tác cục bộ riêng.',
    JOB_UNKNOWN: error => `Chưa rõ kết quả tạo tác vụ: ${error}. Hãy đối soát đúng mã này trước khi tiếp tục.`,
    EXISTING_JOB_UNAVAILABLE: 'Không mở được tác vụ hiện có; không tạo tác vụ mới.',
    JOB_RECOVERED: 'Đã khôi phục tác vụ gốc mà không ghi thêm.',
    JOB_NOT_CONFIRMED: 'Chưa xác nhận được tác vụ gốc. Giữ nguyên mã này; không tạo tác vụ khác.',
    RENDERING: 'Đang dựng nguồn đã ký ngay trên thiết bị này.', RENDERED: 'Đã dựng HTML. Hãy lưu đúng phiên bản này để giữ lại lâu dài.',
    RENDER_REFUSED: error => `Từ chối dựng: ${error}. Không có yêu cầu nhà cung cấp nào được bắt đầu.`,
    RENDER_STOPPED: 'Đã dừng chờ trên thiết bị này. Máy chủ vẫn có thể dựng xong; phản hồi muộn không thể công bố hay lưu HTML. Thao tác này không bắt đầu yêu cầu AI mới.',
    SAVE_UNKNOWN: versionId => `Chưa rõ kết quả lưu cho ${versionId}. Chỉ được khôi phục chỉ đọc; không tạo phiên bản khác.`,
    SAVED: 'Đã lưu đúng phiên bản. Hãy liên kết nó với tác vụ gốc.',
    VERSION_RESTORED: 'Đã khôi phục đúng phiên bản bằng tra cứu theo chủ sở hữu; không bắt đầu yêu cầu AI nào.',
    VERSION_UNAVAILABLE: 'Không có hoặc chưa xác nhận được đúng phiên bản này.', LINKED: 'Đã liên kết phiên bản. Quyết định sản phẩm vẫn đang chờ.',
    LINK_UNKNOWN: 'Chưa rõ kết quả liên kết. Hãy khôi phục đúng phiên bản và liên kết trước mọi thao tác ghi khác.',
    VERSIONS_UNAVAILABLE: 'Không xem được danh sách phiên bản đã lưu. Không bắt đầu yêu cầu AI nào.',
    DECIDED: (versionId, token) => `Đã ghi hành động của tài khoản cho đúng phiên bản ${versionId}: ${VI_DECISION[token]} (${token}).`,
    DECISION_UNKNOWN: 'Chưa rõ kết quả quyết định. Hãy đọc quyết định của đúng phiên bản; không suy ra là đã chấp nhận.',
  },
};

const BY_LANGUAGE: Record<PilotLanguage, PilotCopy> = { en, vi };

export const pilotLanguageOf = (language: string | undefined): PilotLanguage => language === 'vi' ? 'vi' : 'en';
export const pilotCopy = (language: string | undefined): PilotCopy => BY_LANGUAGE[pilotLanguageOf(language)];

export type PilotStatus =
  | { code: Exclude<PilotStatusCode, 'JOB_UNKNOWN' | 'RENDER_REFUSED' | 'SAVE_UNKNOWN' | 'DECIDED'> }
  | { code: 'JOB_UNKNOWN' | 'RENDER_REFUSED'; error: string }
  | { code: 'SAVE_UNKNOWN'; versionId: string }
  | { code: 'DECIDED'; versionId: string; token: PilotDecisionToken };

/** Resolves a status to its sentence at render time so a language switch never leaves stale text. */
export function renderPilotStatus(copy: PilotCopy, status: PilotStatus): string {
  const t = copy.status;
  switch (status.code) {
    case 'JOB_UNKNOWN': return t.JOB_UNKNOWN(status.error);
    case 'RENDER_REFUSED': return t.RENDER_REFUSED(status.error);
    case 'SAVE_UNKNOWN': return t.SAVE_UNKNOWN(status.versionId);
    case 'DECIDED': return t.DECIDED(status.versionId, status.token);
    default: return t[status.code];
  }
}
