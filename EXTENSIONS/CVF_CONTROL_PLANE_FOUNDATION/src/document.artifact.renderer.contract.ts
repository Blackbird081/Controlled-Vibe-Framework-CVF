import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type DocumentArtifactType =
  | "governance-review"
  | "provider-proof"
  | "audit-evidence"
  | "benchmark-summary"
  | "implementation-plan"
  | "release-summary"
  | "policy-decision-record"
  | "general-cvf-document";

export type DocumentArtifactRiskLevel = "low" | "medium" | "high" | "critical" | "unknown";
export type DocumentArtifactApprovalState =
  | "not-required"
  | "pending"
  | "approved"
  | "rejected"
  | "unknown";
export type DocumentArtifactEvidenceState =
  | "live-tested"
  | "evidence-backed"
  | "adapter-ready"
  | "planned"
  | "unsupported"
  | "unknown";
export type DocumentArtifactVerificationStatus =
  | "PASS"
  | "PASS_WITH_WARNINGS"
  | "FAIL"
  | "NOT_RUN";
export type DocumentArtifactComponent =
  | "toc"
  | "metadata-panel"
  | "callout"
  | "risk-box"
  | "decision-card"
  | "timeline"
  | "mermaid-diagram"
  | "comparison-table"
  | "evidence-receipt"
  | "approval-block"
  | "claims-boundary"
  | "source-excerpt"
  | "sandbox-preview-note"
  | "adapter-boundary";
export type DocumentArtifactAdapterOrigin =
  | "claude-code"
  | "codex"
  | "cursor"
  | "copilot"
  | "gemini-cli"
  | "qwen"
  | "opencode"
  | "aider"
  | "unknown";

export interface DocumentArtifactSource {
  sourcePath: string;
  sourceName: string;
  markdown: string;
  sourceHash?: string;
}

export interface DocumentArtifactClaimsBoundary {
  proven: string[];
  notProven: string[];
  evidenceSource: string;
  limitation: string;
}

export interface DocumentArtifactGovernanceInput {
  riskLevel?: DocumentArtifactRiskLevel;
  approvalState?: DocumentArtifactApprovalState;
  evidenceState?: DocumentArtifactEvidenceState;
  failedChecks?: string[];
  dlpWarning?: string | null;
  claimsBoundary?: Partial<DocumentArtifactClaimsBoundary>;
}

export interface DocumentArtifactRenderRequest {
  source: DocumentArtifactSource;
  artifactType?: DocumentArtifactType;
  title?: string;
  owner?: string;
  status?: string;
  language?: "en" | "vi" | "zh" | "ja" | "ko" | "es" | "fr" | "de";
  requestedComponents?: string[];
  adapterOrigin?: DocumentArtifactAdapterOrigin;
  governance?: DocumentArtifactGovernanceInput;
  previewMode?: boolean;
}

export interface DocumentArtifactVerificationCheck {
  checkId: string;
  status: "pass" | "warning" | "fail";
  message: string;
  blocking: boolean;
}

export interface DocumentArtifactMetadata {
  artifactId: string;
  artifactType: DocumentArtifactType;
  sourcePath: string;
  sourceHash: string;
  sourceName: string;
  generatedAt: string;
  rendererModule: "CVF_DOCUMENT_ARTIFACT_RENDERER";
  rendererPolicy: "CVF_ARTIFACT_RENDERING_POLICY";
  cvfRootAuthority: "Controlled Vibe Framework";
  verificationStatus: DocumentArtifactVerificationStatus;
  adapterOrigin: DocumentArtifactAdapterOrigin;
}

export interface GovernedDocumentArtifact {
  metadata: DocumentArtifactMetadata;
  title: string;
  owner: string;
  status: string;
  language: string;
  selectedComponents: DocumentArtifactComponent[];
  claimsBoundary: DocumentArtifactClaimsBoundary;
  riskLevel: DocumentArtifactRiskLevel;
  approvalState: DocumentArtifactApprovalState;
  evidenceState: DocumentArtifactEvidenceState;
  failedChecks: string[];
  html: string;
  outputFilename: string;
  verificationChecks: DocumentArtifactVerificationCheck[];
}

export interface DocumentArtifactRendererContractDependencies {
  now?: () => string;
}

const APPROVED_COMPONENTS: readonly DocumentArtifactComponent[] = [
  "toc",
  "metadata-panel",
  "callout",
  "risk-box",
  "decision-card",
  "timeline",
  "mermaid-diagram",
  "comparison-table",
  "evidence-receipt",
  "approval-block",
  "claims-boundary",
  "source-excerpt",
  "sandbox-preview-note",
  "adapter-boundary",
];

const FORBIDDEN_COMPONENTS = new Set([
  "auto-approval-widget",
  "claim-upgrader",
  "evidence-generator",
  "policy-overrider",
  "provider-parity-badge",
  "hidden-risk-panel",
]);

const RISK_ORDER: Record<DocumentArtifactRiskLevel, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function normalizeText(value: string | undefined, fallback: string): string {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value: string, used: Set<string>): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
  let candidate = base;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

function extractHeadings(markdown: string): Array<{ level: number; text: string; id: string }> {
  const used = new Set<string>();
  return markdown
    .split(/\r?\n/)
    .map((line) => /^(#{1,4})\s+(.+)$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      level: match[1].length,
      text: match[2].trim(),
      id: slugify(match[2].trim(), used),
    }));
}

function renderMarkdownExcerpt(markdown: string): string {
  const headings = extractHeadings(markdown);
  let headingIndex = 0;
  const lines = markdown.split(/\r?\n/);
  return lines
    .map((line) => {
      const heading = /^(#{1,4})\s+(.+)$/.exec(line);
      if (heading) {
        const extracted = headings[headingIndex];
        headingIndex += 1;
        const level = Math.min(heading[1].length + 1, 6);
        return `<h${level} id="${extracted.id}">${escapeHtml(extracted.text)}</h${level}>`;
      }
      if (line.trim().length === 0) {
        return "";
      }
      if (/^\s*[-*]\s+/.test(line)) {
        return `<p class="cvf-list-line">${escapeHtml(line.replace(/^\s*[-*]\s+/, "- "))}</p>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

function inferArtifactType(sourceName: string): DocumentArtifactType {
  const name = sourceName.toLowerCase();
  if (name.includes("provider")) return "provider-proof";
  if (name.includes("audit") || name.includes("receipt")) return "audit-evidence";
  if (name.includes("benchmark") || name.includes("qbs")) return "benchmark-summary";
  if (name.includes("roadmap") || name.includes("plan")) return "implementation-plan";
  if (name.includes("release") || name.includes("closure")) return "release-summary";
  if (name.includes("decision") || name.includes("adr")) return "policy-decision-record";
  if (name.includes("review") || name.includes("governance")) return "governance-review";
  return "general-cvf-document";
}

function outputName(type: DocumentArtifactType, sourceName: string): string {
  const source = sourceName.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-");
  return `${type}-${source}.html`;
}

export class DocumentArtifactRendererContract {
  private readonly now: () => string;

  constructor(dependencies: DocumentArtifactRendererContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  render(request: DocumentArtifactRenderRequest): GovernedDocumentArtifact {
    const sourcePath = normalizeText(request.source.sourcePath, "");
    const sourceName = normalizeText(request.source.sourceName, "");
    const markdown = normalizeText(request.source.markdown, "");
    if (!sourcePath || !sourceName || !markdown) {
      throw new Error("DocumentArtifactRenderer requires sourcePath, sourceName, and markdown");
    }

    const artifactType = request.artifactType ?? inferArtifactType(sourceName);
    const selectedComponents = this.selectComponents(request.requestedComponents ?? []);
    const sourceHash = request.source.sourceHash ?? computeDeterministicHash("cvf-document-artifact-source", markdown);
    const generatedAt = this.now();
    const governance = request.governance ?? {};
    const claimsBoundary: DocumentArtifactClaimsBoundary = {
      proven: governance.claimsBoundary?.proven ?? [],
      notProven: governance.claimsBoundary?.notProven ?? ["No extra evidence is created by rendering."],
      evidenceSource: governance.claimsBoundary?.evidenceSource ?? sourcePath,
      limitation: governance.claimsBoundary?.limitation ?? "Rendering is presentation only.",
    };

    const metadataBase = {
      artifactType,
      sourcePath,
      sourceHash,
      sourceName,
      generatedAt,
      rendererModule: "CVF_DOCUMENT_ARTIFACT_RENDERER" as const,
      rendererPolicy: "CVF_ARTIFACT_RENDERING_POLICY" as const,
      cvfRootAuthority: "Controlled Vibe Framework" as const,
      adapterOrigin: request.adapterOrigin ?? "unknown",
    };

    const artifactId = computeDeterministicHash(
      "cvf-document-artifact-renderer",
      artifactType,
      sourcePath,
      sourceHash,
      generatedAt,
      JSON.stringify(selectedComponents),
    );

    const checks = this.verify({
      artifactType,
      sourcePath,
      markdown,
      selectedComponents,
      requestedComponents: request.requestedComponents ?? [],
      riskLevel: governance.riskLevel ?? "unknown",
      originalRiskLevel: governance.riskLevel ?? "unknown",
      approvalState: governance.approvalState ?? "unknown",
      evidenceState: governance.evidenceState ?? "unknown",
      failedChecks: governance.failedChecks ?? [],
      previewMode: request.previewMode ?? false,
      dlpWarning: governance.dlpWarning ?? null,
      claimsBoundary,
    });
    const verificationStatus = this.summarizeVerification(checks);

    const metadata: DocumentArtifactMetadata = {
      artifactId,
      ...metadataBase,
      verificationStatus,
    };

    const artifact: GovernedDocumentArtifact = {
      metadata,
      title: normalizeText(request.title, sourceName),
      owner: normalizeText(request.owner, "unknown"),
      status: normalizeText(request.status, "unknown"),
      language: request.language ?? "en",
      selectedComponents,
      claimsBoundary,
      riskLevel: governance.riskLevel ?? "unknown",
      approvalState: governance.approvalState ?? "unknown",
      evidenceState: governance.evidenceState ?? "unknown",
      failedChecks: governance.failedChecks ?? [],
      html: "",
      outputFilename: outputName(artifactType, sourceName),
      verificationChecks: checks,
    };
    artifact.html = this.renderHtml(artifact, markdown, request.previewMode ?? false);
    return artifact;
  }

  private selectComponents(requested: string[]): DocumentArtifactComponent[] {
    const mandatory: DocumentArtifactComponent[] = [
      "toc",
      "metadata-panel",
      "claims-boundary",
      "source-excerpt",
      "approval-block",
      "risk-box",
    ];
    const selected = new Set<DocumentArtifactComponent>(mandatory);
    for (const component of requested) {
      if (APPROVED_COMPONENTS.includes(component as DocumentArtifactComponent)) {
        selected.add(component as DocumentArtifactComponent);
      }
    }
    return [...selected].sort();
  }

  private verify(input: {
    artifactType: DocumentArtifactType;
    sourcePath: string;
    markdown: string;
    selectedComponents: DocumentArtifactComponent[];
    requestedComponents: string[];
    riskLevel: DocumentArtifactRiskLevel;
    originalRiskLevel: DocumentArtifactRiskLevel;
    approvalState: DocumentArtifactApprovalState;
    evidenceState: DocumentArtifactEvidenceState;
    failedChecks: string[];
    previewMode: boolean;
    dlpWarning: string | null;
    claimsBoundary: DocumentArtifactClaimsBoundary;
  }): DocumentArtifactVerificationCheck[] {
    const checks: DocumentArtifactVerificationCheck[] = [];
    const add = (checkId: string, ok: boolean, message: string, blocking = true) => {
      checks.push({ checkId, status: ok ? "pass" : "fail", message, blocking });
    };
    add("input.resolved", input.sourcePath.length > 0 && input.markdown.length > 0, "source must resolve");
    add("components.approved", input.requestedComponents.every((c) => !FORBIDDEN_COMPONENTS.has(c)), "no forbidden component may be requested");
    add("components.catalog", input.selectedComponents.every((c) => APPROVED_COMPONENTS.includes(c)), "all components must be catalog-approved");
    add("security.no-external-script", !/<script\b[^>]*\bsrc\s*=/i.test(input.markdown), "remote scripts are forbidden");
    add("security.no-tracking", !/(analytics|tracking-pixel|beacon)/i.test(input.markdown), "tracking and analytics beacons are forbidden");
    add("security.no-credential-form", !/<form\b[^>]*(password|api[_-]?key|credential)/i.test(input.markdown), "credential collection is forbidden");
    add("governance.risk-preserved", RISK_ORDER[input.riskLevel] >= RISK_ORDER[input.originalRiskLevel], "risk must not be downgraded");
    add("governance.failed-checks-visible", input.failedChecks.every((check) => check.trim().length > 0), "failed checks must stay visible");
    add("governance.claims-boundary", input.claimsBoundary.notProven.length > 0 || input.claimsBoundary.limitation.length > 0, "claims boundary must be explicit");
    add("dlp.warning-preserved", input.dlpWarning === null || input.dlpWarning.trim().length > 0, "DLP warning must not be erased");
    checks.push({
      checkId: "preview.sandbox",
      status: input.previewMode ? "pass" : "warning",
      message: input.previewMode ? "sandbox preview note is enabled" : "preview mode not requested",
      blocking: false,
    });
    return checks;
  }

  private summarizeVerification(checks: DocumentArtifactVerificationCheck[]): DocumentArtifactVerificationStatus {
    if (checks.some((check) => check.status === "fail" && check.blocking)) {
      return "FAIL";
    }
    if (checks.some((check) => check.status === "warning")) {
      return "PASS_WITH_WARNINGS";
    }
    return "PASS";
  }

  private renderHtml(artifact: GovernedDocumentArtifact, markdown: string, previewMode: boolean): string {
    const headings = extractHeadings(markdown);
    const toc = headings.map((h) => `<li class="level-${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join("");
    const failed = artifact.failedChecks.length === 0
      ? "<li>None reported.</li>"
      : artifact.failedChecks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
    const checks = artifact.verificationChecks
      .map((check) => `<li data-status="${check.status}">${escapeHtml(check.checkId)}: ${escapeHtml(check.message)}</li>`)
      .join("");
    const proven = artifact.claimsBoundary.proven.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>None declared by renderer.</li>";
    const notProven = artifact.claimsBoundary.notProven.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `<!doctype html>
<html lang="${artifact.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(artifact.title)}</title>
<style>
body{font-family:Arial,sans-serif;margin:0;color:#172033;background:#f7f7f4;line-height:1.55}
main{max-width:960px;margin:0 auto;padding:32px}
header,section{background:#fff;border:1px solid #d8d8d0;border-radius:8px;padding:20px;margin:0 0 16px}
a{color:#2457a6}a:focus{outline:3px solid #b88700;outline-offset:2px}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.badge{display:inline-block;border:1px solid #777;border-radius:4px;padding:2px 6px;margin-right:6px}
.fail{color:#8a1f11;font-weight:700}.pass{color:#155d27;font-weight:700}
pre,.source{white-space:pre-wrap;word-break:break-word;background:#f1f3f5;border-radius:6px;padding:12px}
</style>
</head>
<body>
<main>
<header>
<h1>${escapeHtml(artifact.title)}</h1>
<p><strong>CVF root authority:</strong> Controlled Vibe Framework</p>
<p><span class="badge">${escapeHtml(artifact.metadata.artifactType)}</span><span class="badge ${artifact.metadata.verificationStatus === "FAIL" ? "fail" : "pass"}">${artifact.metadata.verificationStatus}</span></p>
</header>
<section id="metadata"><h2>Metadata Panel</h2><div class="meta">
<p><strong>artifact_id</strong><br>${escapeHtml(artifact.metadata.artifactId)}</p>
<p><strong>source_path</strong><br>${escapeHtml(artifact.metadata.sourcePath)}</p>
<p><strong>source_hash</strong><br>${escapeHtml(artifact.metadata.sourceHash)}</p>
<p><strong>generated_at</strong><br>${escapeHtml(artifact.metadata.generatedAt)}</p>
<p><strong>owner</strong><br>${escapeHtml(artifact.owner)}</p>
<p><strong>status</strong><br>${escapeHtml(artifact.status)}</p>
<p><strong>adapter_origin</strong><br>${escapeHtml(artifact.metadata.adapterOrigin)}</p>
</div></section>
<section id="claims-boundary"><h2>Claims Boundary</h2><h3>Proven</h3><ul>${proven}</ul><h3>Not Proven</h3><ul>${notProven}</ul><p><strong>Limitation:</strong> ${escapeHtml(artifact.claimsBoundary.limitation)}</p></section>
<section id="governance"><h2>Governance Visibility</h2><p><strong>Risk:</strong> ${artifact.riskLevel}</p><p><strong>Approval:</strong> ${artifact.approvalState}</p><p><strong>Evidence:</strong> ${artifact.evidenceState}</p><h3>Failed Checks</h3><ul>${failed}</ul></section>
<section id="toc"><h2>Table Of Contents</h2><ul>${toc || "<li>No headings found.</li>"}</ul></section>
${previewMode ? `<section id="sandbox-preview-note"><h2>Sandbox Preview Note</h2><p>Preview must run in an iframe sandbox. Adapter origin does not imply trust.</p></section>` : ""}
<section id="main-content"><h2>Main Content</h2><div class="source">${renderMarkdownExcerpt(markdown)}</div></section>
<section id="verification-summary"><h2>Verification Summary</h2><ul>${checks}</ul></section>
<section id="source-provenance"><h2>Source Provenance</h2><p>Renderer policy: ${artifact.metadata.rendererPolicy}</p><p>Rendering is presentation only and cannot modify source governance decisions.</p></section>
</main>
</body>
</html>`;
  }
}

export function createDocumentArtifactRendererContract(
  dependencies?: DocumentArtifactRendererContractDependencies,
): DocumentArtifactRendererContract {
  return new DocumentArtifactRendererContract(dependencies);
}
