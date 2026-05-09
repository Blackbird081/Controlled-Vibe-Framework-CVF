/**
 * CVF System Prompt Generator — M2
 *
 * Generates context-aware system prompts for AI agents that include:
 * 1. CVF governance rules (from original CVF_AGENT_SYSTEM_PROMPT)
 * 2. MCP tool references (so agents know which tools to call)
 * 3. Goal/Constraint separation (Planner vs Governor pattern from Non-coder.md)
 * 4. Self-Correction Loop instructions
 * 5. Session context (current phase, risk, role)
 *
 * @module prompt/system-prompt
 */
import type { CVFPhase, CVFRiskLevel, CVFRole } from '../guards/types.js';
export interface PromptContext {
    /** Current CVF phase */
    phase?: CVFPhase;
    /** Current risk level */
    riskLevel?: CVFRiskLevel;
    /** Agent role */
    role?: CVFRole;
    /** Agent identifier */
    agentId?: string;
    /** Project name */
    projectName?: string;
    /** Whether MCP tools are available */
    mcpToolsAvailable?: boolean;
    /** Maximum allowed risk level */
    maxRiskLevel?: CVFRiskLevel;
    /** Custom constraints from user */
    userConstraints?: string[];
    /** Language preference */
    language?: 'en' | 'vi';
}
export interface GeneratedPrompt {
    /** The full system prompt text */
    systemPrompt: string;
    /** Summary of active rules */
    activeRules: string[];
    /** Sections included */
    sections: string[];
    /** Token estimate (rough) */
    estimatedTokens: number;
}
declare const MCP_TOOL_DESCRIPTIONS: {
    name: string;
    usage: string;
}[];
export declare function generateSystemPrompt(context?: PromptContext): GeneratedPrompt;
export { MCP_TOOL_DESCRIPTIONS };
//# sourceMappingURL=system-prompt.d.ts.map