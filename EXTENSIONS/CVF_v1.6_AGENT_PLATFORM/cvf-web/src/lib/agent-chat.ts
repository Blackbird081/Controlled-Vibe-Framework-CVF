'use client';

import type { AcceptanceStatus, QualityScore } from '@/lib/governance';

export type CVFMode = 'simple' | 'governance' | 'full';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    status?: 'sending' | 'streaming' | 'complete' | 'error';
    metadata?: {
        tokens?: number;
        model?: string;
        phase?: string;
        qualityScore?: QualityScore;
        acceptanceStatus?: AcceptanceStatus;
        preUatStatus?: 'PASS' | 'FAIL';
        preUatScore?: number;
        factualScore?: number;
        factualRisk?: 'low' | 'medium' | 'high';
    };
}

export const PHASE_CONFIG = {
    Discovery: { color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', icon: '🔍', label: 'Phase A' },
    Design: { color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300', icon: '✏️', label: 'Phase B' },
    Build: { color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300', icon: '🔨', label: 'Phase C' },
    Review: { color: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300', icon: '✅', label: 'Phase D' },
    Processing: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300', icon: '⚙️', label: '' },
};

export const MODE_CONFIG: Record<CVFMode, { color: string; icon: string; label: string; labelEn: string }> = {
    simple: {
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        icon: '⚡',
        label: 'Đơn giản',
        labelEn: 'Simple',
    },
    governance: {
        color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
        icon: '⚠️',
        label: 'Có Quy tắc',
        labelEn: 'With Rules',
    },
    full: {
        color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
        icon: '🚦',
        label: 'CVF Full Mode',
        labelEn: 'CVF Full Mode',
    },
};

export function detectSpecMode(content: string): CVFMode {
    if (!content) return 'simple';

    const lower = content.toLowerCase();

    // Full mode detection — flexible matching (case-insensitive, partial matches)
    if (
        content.includes('CVF FULL MODE PROTOCOL') ||
        content.includes('MANDATORY 4-PHASE PROCESS') ||
        content.includes('QUY TRÌNH 4-PHASE BẮT BUỘC') ||
        content.includes('Full Mode (4-Phase)') ||
        lower.includes('cvf full mode') ||
        lower.includes('full cvf mode') ||
        lower.includes('4-phase process') ||
        lower.includes('4 phase bắt buộc') ||
        /full\s*mode/i.test(content)
    ) {
        return 'full';
    }

    // Governance mode detection — flexible matching
    if (
        content.includes('CVF GOVERNANCE RULES') ||
        content.includes('QUY TẮC CVF GOVERNANCE') ||
        content.includes('Stop Conditions') ||
        content.includes('Điều kiện dừng') ||
        content.includes('With Rules') ||
        content.includes('Có Quy Tắc)') ||
        lower.includes('governance mode') ||
        lower.includes('governance rules') ||
        lower.includes('có quy tắc') ||
        lower.includes('with rules') ||
        /governance/i.test(content)
    ) {
        return 'governance';
    }

    return 'simple';
}
