/**
 * OpenClaw Engine — server-side processing pipeline
 * Adapts the Safety Runtime adapter logic for use inside cvf-web API routes.
 *
 * Pipeline: parseIntent → buildProposal → guardProposal → evaluateProposal
 * Supports real AI provider (via API key) and mock/rule-based fallback.
 */

// ==================== TYPES ====================

export interface OpenClawIntent {
    action: string;
    confidence: number;
    parameters: Record<string, unknown>;
    simulateOnly?: boolean;
}

export interface OpenClawProposalEnvelope {
    id: string;
    source: 'openclaw' | 'api' | 'structured';
    action: string;
    payload: Record<string, unknown>;
    createdAt: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
}

export interface GuardResult {
    allowed: boolean;
    escalatedRisk?: 'medium' | 'high';
    reason?: string;
}

export interface CVFDecision {
    status: 'approved' | 'rejected' | 'pending';
    reason?: string;
    executionId?: string;
}

export interface OpenClawResult {
    proposal: OpenClawProposalEnvelope;
    guard: GuardResult;
    decision: CVFDecision;
    response: string;
    mode: 'real' | 'mock';
}

export interface StoredProposal {
    id: string;
    action: string;
    source: string;
    riskLevel: string;
    state: string;
    time: string;
    confidence: number;
    guardReason?: string;
}

// ==================== CONFIG ====================

const ENGINE_CONFIG = {
    maxTokensPerDay: 100_000,
    blockedActions: ['delete_database', 'shutdown_system', 'transfer_funds', 'rm_rf', 'drop_table'],
    maxProposalHistory: 50,
};

// ==================== PROPOSAL STORE ====================

let proposalHistory: StoredProposal[] = [];
let dailyTokenUsage = 0;

export function getProposalHistory(): StoredProposal[] {
    return [...proposalHistory];
}

export function clearProposalHistory(): void {
    proposalHistory = [];
    dailyTokenUsage = 0;
}

function storeProposal(proposal: OpenClawProposalEnvelope, state: string, guardReason?: string): void {
    const entry: StoredProposal = {
        id: proposal.id,
        action: proposal.action,
        source: proposal.source,
        riskLevel: proposal.riskLevel,
        state,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        confidence: proposal.confidence,
        guardReason,
    };
    proposalHistory.unshift(entry);
    if (proposalHistory.length > ENGINE_CONFIG.maxProposalHistory) {
        proposalHistory = proposalHistory.slice(0, ENGINE_CONFIG.maxProposalHistory);
    }
}

// ==================== STEP 1: PARSE INTENT ====================

const MOCK_INTENT_RULES: Array<{ keywords: string[]; action: string; confidence: number }> = [
    { keywords: ['deploy', 'triển khai'], action: 'deploy_system', confidence: 0.85 },
    { keywords: ['auth', 'xác thực', 'login', 'đăng nhập'], action: 'deploy_auth_system', confidence: 0.8 },
    { keywords: ['database', 'cơ sở dữ liệu', 'db'], action: 'modify_database', confidence: 0.7 },
    { keywords: ['pricing', 'giá', 'price'], action: 'update_pricing_engine', confidence: 0.75 },
    { keywords: ['token', 'scale', 'mở rộng'], action: 'scale_ai_token_limit', confidence: 0.8 },
    { keywords: ['admin', 'role', 'quyền', 'grant'], action: 'grant_admin_role', confidence: 0.65 },
    { keywords: ['delete', 'xóa', 'remove'], action: 'delete_resource', confidence: 0.6 },
    { keywords: ['create', 'tạo', 'build', 'xây'], action: 'create_module', confidence: 0.75 },
    { keywords: ['update', 'cập nhật', 'sửa', 'fix'], action: 'update_component', confidence: 0.7 },
    { keywords: ['test', 'kiểm tra', 'check'], action: 'run_test_suite', confidence: 0.9 },
];

function mockParseIntent(message: string): OpenClawIntent {
    const lower = message.toLowerCase();
    for (const rule of MOCK_INTENT_RULES) {
        if (rule.keywords.some(kw => lower.includes(kw))) {
            return {
                action: rule.action,
                confidence: rule.confidence + (Math.random() * 0.1 - 0.05), // slight variance
                parameters: { originalMessage: message },
            };
        }
    }
    return {
        action: 'unknown_action',
        confidence: 0.2 + Math.random() * 0.2,
        parameters: { originalMessage: message },
    };
}

async function realParseIntent(
    message: string,
    provider: string,
    apiKey: string,
    model: string,
): Promise<OpenClawIntent> {
    const systemPrompt = `You are an intent parser for CVF (Controlled Vibe Framework). Extract structured intent from the user message.
Return ONLY valid JSON with this format: { "action": "string", "confidence": 0.0-1.0, "parameters": {} }
Actions should be snake_case like: deploy_system, update_pricing, grant_admin_role, create_module, etc.`;

    try {
        let content = '';

        if (provider === 'gemini') {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `${systemPrompt}\n\nMessage: "${message}"` }] }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
                    }),
                },
            );
            const data = await res.json();
            content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            dailyTokenUsage += data?.usageMetadata?.totalTokenCount || 100;
        } else if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message },
                    ],
                    temperature: 0.1,
                    max_tokens: 200,
                }),
            });
            const data = await res.json();
            content = data?.choices?.[0]?.message?.content || '';
            dailyTokenUsage += data?.usage?.total_tokens || 100;
        } else if (provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 200,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: message }],
                }),
            });
            const data = await res.json();
            content = data?.content?.[0]?.text || '';
            dailyTokenUsage += (data?.usage?.input_tokens || 0) + (data?.usage?.output_tokens || 0);
        }

        // Extract JSON from response (may be wrapped in markdown code block)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            action: parsed.action || 'unknown_action',
            confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
            parameters: parsed.parameters || { originalMessage: message },
        };
    } catch {
        // Fallback to mock if AI call fails
        return mockParseIntent(message);
    }
}

// ==================== STEP 2: BUILD PROPOSAL ====================

function buildProposal(intent: OpenClawIntent, source: string = 'openclaw'): OpenClawProposalEnvelope {
    const riskLevel: 'low' | 'medium' | 'high' =
        intent.confidence > 0.8 ? 'low' :
            intent.confidence > 0.5 ? 'medium' : 'high';

    return {
        id: `p-${String(Date.now()).slice(-4)}`,
        source: source as 'openclaw' | 'api' | 'structured',
        action: intent.action,
        payload: intent.parameters,
        createdAt: Date.now(),
        confidence: Math.round(intent.confidence * 100) / 100,
        riskLevel,
    };
}

// ==================== STEP 3: GUARD PROPOSAL ====================

function guardProposal(proposal: OpenClawProposalEnvelope): GuardResult {
    // 1. Budget control
    if (dailyTokenUsage > ENGINE_CONFIG.maxTokensPerDay) {
        return { allowed: false, reason: 'Daily AI token budget exceeded' };
    }

    // 2. Blocked actions
    if (ENGINE_CONFIG.blockedActions.some(blocked => proposal.action.includes(blocked))) {
        return { allowed: false, reason: `Blocked high-risk action: ${proposal.action}` };
    }

    // 3. Low confidence → escalate
    if (proposal.confidence < 0.4) {
        return { allowed: true, escalatedRisk: 'high', reason: 'Low AI confidence — requires review' };
    }

    // 4. Medium confidence → warn
    if (proposal.confidence < 0.6) {
        return { allowed: true, escalatedRisk: 'medium', reason: 'Moderate confidence — auto-approved with caution' };
    }

    return { allowed: true };
}

// ==================== STEP 4: CVF DECISION ====================

function evaluateProposal(proposal: OpenClawProposalEnvelope, guard: GuardResult): CVFDecision {
    if (!guard.allowed) {
        return { status: 'rejected', reason: guard.reason };
    }

    if (guard.escalatedRisk === 'high') {
        return { status: 'pending', reason: guard.reason };
    }

    if (proposal.riskLevel === 'high') {
        return { status: 'pending', reason: 'High risk level — human approval required' };
    }

    return {
        status: 'approved',
        executionId: `exec-${Date.now()}`,
    };
}

// ==================== MAIN PIPELINE ====================

export async function processOpenClawMessage(
    message: string,
    options: {
        provider?: string;
        apiKey?: string;
        model?: string;
    } = {},
): Promise<OpenClawResult> {
    const { provider, apiKey, model } = options;
    const useRealAI = !!(provider && apiKey && model);

    // Step 1: Parse intent
    const intent = useRealAI
        ? await realParseIntent(message, provider, apiKey, model)
        : mockParseIntent(message);

    // Step 2: Build proposal
    const proposal = buildProposal(intent);

    // Step 3: Guard
    const guard = guardProposal(proposal);

    // Step 4: CVF decision
    const decision = evaluateProposal(proposal, guard);

    // Step 5: Format response
    const response = decision.status === 'approved'
        ? `✅ Approved. Execution ID: ${decision.executionId}`
        : decision.status === 'pending'
            ? `⏳ Pending approval: ${decision.reason}`
            : `🚫 Rejected: ${decision.reason}`;

    // Store
    const state = decision.status === 'approved' ? 'approved'
        : decision.status === 'pending' ? 'pending'
            : guard.allowed ? 'pending' : 'rejected';
    storeProposal(proposal, state, guard.reason);

    return {
        proposal,
        guard,
        decision,
        response,
        mode: useRealAI ? 'real' : 'mock',
    };
}
