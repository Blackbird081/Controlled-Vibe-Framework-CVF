import { createHash } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { authorizeRouteGovernanceProof, getRouteGovernanceProofConfig } from '@/lib/route-governance-proof';
import { fetchGovernanceReceipt } from './proof';

type ArtifactMemoryClass = 'POINTER_RECORD' | 'FULL_RECORD';

interface ArtifactExportRequest {
  title?: unknown;
  sourcePath?: unknown;
  sourceContent?: unknown;
  memoryClass?: unknown;
  status?: unknown;
  claimBoundary?: unknown;
  receiptAnchor?: unknown;
}

type ValidatedExportRequest = {
  title: string;
  sourcePath: string;
  sourceContent: string;
  memoryClass: ArtifactMemoryClass;
  status: string;
  claimBoundary: string;
  receiptAnchor: string;
};

const FIELD_LIMITS = {
  title: 200,
  sourcePath: 500,
  sourceContent: 100_000,
  status: 100,
  claimBoundary: 2_000,
  receiptAnchor: 150,
} as const;
const MAX_BODY_BYTES = 128_000;

interface ArtifactVerificationItem {
  label: string;
  passed: boolean;
  detail?: string;
}

const SECRET_PATTERNS = [
  /\b(?:DASHSCOPE|ALIBABA|OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE)_API_KEY\s*[:=]/i,
  /\b(?:API[_-]?KEY|ACCESS[_-]?TOKEN|SECRET[_-]?KEY|AUTH[_-]?TOKEN)\s*[:=]\s*\S{8,}/i,
  /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/i,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatRecordType(value: ArtifactMemoryClass): string {
  return value === 'POINTER_RECORD' ? 'Reference record' : 'Complete record';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

function filenameFrom(title: string): string {
  const slug = slugify(title).slice(0, 70) || 'cvf-artifact';
  return `${slug}.html`;
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderMarkdownLite(markdown: string): string {
  const html: string[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const content = heading[2];
      html.push(`<h${level} id="${slugify(content)}">${renderInline(content)}</h${level}>`);
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${renderInline(listItem[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeList();
  return html.join('\n');
}

function hasRequiredSection(sourceContent: string, label: string): boolean {
  const expression = new RegExp(`(^|\\n)#{1,3}\\s+${label}\\b|(^|\\n)${label}:`, 'i');
  return expression.test(sourceContent);
}

function hasSecretPattern(sourceContent: string): boolean {
  return SECRET_PATTERNS.some(pattern => pattern.test(sourceContent));
}

function buildVerification(input: ValidatedExportRequest, html: string): ArtifactVerificationItem[] {
  const sourceContent = String(input.sourceContent);
  const claimBoundary = String(input.claimBoundary);
  const receiptAnchor = String(input.receiptAnchor);
  const receiptAnchorId = slugify(receiptAnchor);
  const hasSecret = Object.keys(FIELD_LIMITS).some(key => hasSecretPattern(input[key as keyof typeof FIELD_LIMITS]));

  return [
    {
      label: 'Source reference recorded',
      passed: String(input.sourcePath).length > 0,
      detail: String(input.sourcePath),
    },
    {
      label: 'Record type selected',
      passed: String(input.memoryClass).length > 0,
      detail: formatRecordType(input.memoryClass as ArtifactMemoryClass),
    },
    {
      label: 'Review status present',
      passed: String(input.status).length > 0,
      detail: String(input.status),
    },
    {
      label: 'Review boundary visible',
      passed: claimBoundary.length > 0 && html.includes('Review boundary'),
      detail: claimBoundary,
    },
    {
      label: 'Receipt anchor rendered (not a governance receipt)',
      passed: receiptAnchorId.length > 0 && html.includes(`id="${escapeHtml(receiptAnchorId)}"`),
      detail: `#${receiptAnchorId}`,
    },
    {
      label: 'No common secret pattern detected in rendered fields',
      passed: !hasSecret,
      detail: hasSecret ? 'Potential secret-like value detected.' : 'Common-pattern scan only; not a full secret audit.',
    },
    {
      label: 'Review boundary source supplied',
      passed: hasRequiredSection(sourceContent, 'Claim Boundary') || hasRequiredSection(sourceContent, 'Review Boundary') || claimBoundary.length > 0,
      detail: 'Presence check only; semantic equivalence requires separate review.',
    },
    {
      label: 'Self-contained HTML',
      passed: !/(<script|https?:\/\/|@import)/i.test(html),
      detail: 'The HTML uses inline styles only.',
    },
  ];
}

function buildHtml(input: ValidatedExportRequest, generatedAt: string, sourceHash: string): string {
  const title = String(input.title);
  const receiptAnchor = slugify(String(input.receiptAnchor));
  const body = renderMarkdownLite(String(input.sourceContent));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f6f7fb; color: #111827; }
    main { max-width: 920px; margin: 0 auto; padding: 40px 24px; }
    header, section { background: #ffffff; border: 1px solid #d9dee8; border-radius: 14px; padding: 24px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 28px; line-height: 1.15; }
    h2 { margin-top: 24px; font-size: 18px; }
    h3 { margin-top: 20px; font-size: 15px; }
    p, li { font-size: 14px; line-height: 1.7; }
    code { background: #eef2ff; border-radius: 6px; padding: 2px 5px; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 18px; }
    .meta div { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; font-size: 12px; }
    .label { display: block; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .boundary { border-color: #f59e0b; background: #fffbeb; }
    .receipt { border-color: #10b981; background: #ecfdf5; }
  </style>
</head>
<body>
  <main>
    <header>
      <span class="label">CVF HTML Review Packet</span>
      <p class="boundary">DRAFT / UNACCEPTED. A receipt anchor and this presentation do not establish governance approval or final artifact acceptance.</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        <div><span class="label">Record type</span>${escapeHtml(formatRecordType(input.memoryClass as ArtifactMemoryClass))}</div>
        <div><span class="label">Review status</span>${escapeHtml(String(input.status))}</div>
        <div><span class="label">Source reference</span>${escapeHtml(String(input.sourcePath))}</div>
        <div><span class="label">Generated</span>${escapeHtml(generatedAt)}</div>
        <div><span class="label">Source hash</span>${escapeHtml(sourceHash)}</div>
      </div>
    </header>
    <section id="${escapeHtml(receiptAnchor)}" class="receipt">
      <span class="label">Receipt reference</span>
      <p>#${escapeHtml(String(input.receiptAnchor))}</p>
    </section>
    <section class="boundary">
      <span class="label">Review boundary</span>
      <p>${escapeHtml(String(input.claimBoundary))}</p>
    </section>
    <section>
      ${body}
    </section>
  </main>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Artifact export body exceeds size limit.' }, { status: 413 });
  }
  const bodyText = await request.text();
  const routeAuth = await authorizeRouteGovernanceProof(
    request,
    bodyText,
    getRouteGovernanceProofConfig('/api/artifacts/export'),
  );
  if (!routeAuth.allowed && routeAuth.response) return routeAuth.response;

  if (Buffer.byteLength(bodyText, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Artifact export body exceeds size limit.', routeGovernanceProof: routeAuth.proof },
      { status: 413 },
    );
  }

  let body: ArtifactExportRequest;
  try {
    body = JSON.parse(bodyText) as ArtifactExportRequest;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.', routeGovernanceProof: routeAuth.proof },
      { status: 400 },
    );
  }
  const title = text(body.title);
  const sourcePath = text(body.sourcePath);
  const sourceContent = text(body.sourceContent);
  const status = text(body.status);
  const claimBoundary = text(body.claimBoundary);
  const receiptAnchor = text(body.receiptAnchor);

  if (!title || !sourcePath || !sourceContent || !status || !claimBoundary || !receiptAnchor) {
    return NextResponse.json(
      { success: false, error: 'Missing required artifact export fields.', routeGovernanceProof: routeAuth.proof },
      { status: 400 },
    );
  }

  const fields = { title, sourcePath, sourceContent, status, claimBoundary, receiptAnchor };
  if (Object.entries(fields).some(([key, value]) => typeof body[key as keyof ArtifactExportRequest] !== 'string' || value.length > FIELD_LIMITS[key as keyof typeof FIELD_LIMITS])) {
    return NextResponse.json(
      { success: false, error: 'Invalid artifact export field type or size.', routeGovernanceProof: routeAuth.proof },
      { status: 400 },
    );
  }
  if (body.memoryClass !== 'FULL_RECORD' && body.memoryClass !== 'POINTER_RECORD') {
    return NextResponse.json(
      { success: false, error: 'Invalid artifact memory class.', routeGovernanceProof: routeAuth.proof },
      { status: 400 },
    );
  }
  const allowedKeys = new Set([...Object.keys(FIELD_LIMITS), 'memoryClass']);
  if (Object.keys(body).some(key => !allowedKeys.has(key))) {
    return NextResponse.json(
      { success: false, error: 'Unknown artifact export field.', routeGovernanceProof: routeAuth.proof },
      { status: 400 },
    );
  }

  if (Object.values(fields).some(hasSecretPattern)) {
    return NextResponse.json(
      { success: false, error: 'Potential secret-like value detected in artifact export fields.', routeGovernanceProof: routeAuth.proof },
      { status: 400 },
    );
  }

  const input = {
    title,
    sourcePath,
    sourceContent,
    memoryClass: body.memoryClass as ArtifactMemoryClass,
    status,
    claimBoundary,
    receiptAnchor,
  };
  const generatedAt = new Date().toISOString();
  const sourceHash = createHash('sha256').update(sourceContent).digest('hex');
  const html = buildHtml(input, generatedAt, sourceHash);
  const verification = buildVerification(input, html);

  const serviceToken = process.env.CVF_SERVICE_TOKEN;
  const receiptCheck = await fetchGovernanceReceipt(
    slugify(receiptAnchor),
    sourceContent,
    serviceToken,
  );
  const governanceReceipt = receiptCheck.receipt;

  return NextResponse.json({
    success: true,
    routeGovernanceProof: routeAuth.proof,
    data: {
      html,
      filename: filenameFrom(title),
      receiptAnchor: slugify(receiptAnchor),
      verification,
      generatedAt,
      governanceReceiptStatus: receiptCheck.status,
      ...(receiptCheck.requestId ? { governanceReceiptAttemptId: receiptCheck.requestId } : {}),
      governanceState: governanceReceipt?.decision === 'APPROVED' && verification.every(item => item.passed)
        ? 'RECEIPT_ALLOW_REVIEW_REQUIRED'
        : 'DRAFT_UNACCEPTED',
      ...(governanceReceipt ? { governanceReceipt } : {}),
    },
  });
}
