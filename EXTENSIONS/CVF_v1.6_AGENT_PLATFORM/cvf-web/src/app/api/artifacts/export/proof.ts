const GOVERNANCE_EVALUATE_URL = '/api/governance/evaluate';
const PROOF_TIMEOUT_MS = 4000;

export interface GovernanceReceipt {
  receiptId: string;
  decision: string;
  evaluatedAt: string;
  riskLevel: string;
}

interface EvaluateResponseData {
  request_id?: string;
  decision?: string;
  risk_level?: string;
  evaluated_at?: string;
  [key: string]: unknown;
}

interface EvaluateResponse {
  success: boolean;
  data?: EvaluateResponseData;
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function resolveEvaluateUrl(base: string): string {
  if (isAbsoluteUrl(base)) return base;
  if (typeof process !== 'undefined' && process.env.NEXTAUTH_URL) {
    return `${process.env.NEXTAUTH_URL.replace(/\/$/, '')}${base}`;
  }
  return base;
}

export async function fetchGovernanceReceipt(
  artifactId: string,
  sourceContent: string,
  serviceToken?: string,
): Promise<GovernanceReceipt | null> {
  const url = resolveEvaluateUrl(GOVERNANCE_EVALUATE_URL);

  if (!isAbsoluteUrl(url)) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROOF_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (serviceToken) headers['x-cvf-service-token'] = serviceToken;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        request_id: `artifact-proof-${artifactId}-${Date.now()}`,
        artifact_id: artifactId,
        payload: { content: sourceContent.slice(0, 500) },
        cvf_phase: 'REVIEW',
        cvf_risk_level: 'R0',
      }),
    });

    if (!response.ok) return null;

    const payload = await response.json() as EvaluateResponse;
    if (!payload.success || !payload.data) return null;

    const data = payload.data;
    return {
      receiptId: String(data.request_id ?? artifactId),
      decision: String(data.decision ?? 'ALLOW'),
      evaluatedAt: String(data.evaluated_at ?? new Date().toISOString()),
      riskLevel: String(data.risk_level ?? 'R0'),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
