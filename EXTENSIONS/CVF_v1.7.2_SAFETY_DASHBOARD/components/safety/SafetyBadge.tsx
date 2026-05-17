'use client'

import { t } from '../../lib/i18n'

type BadgeVariant = 'minimal' | 'full'

/**
 * SafetyBadge — Visual indicator that AI is being controlled by CVF.
 * CVF Doctrine: "AI đang được kiểm soát" must always be visible to non-coders.
 */
export function SafetyBadge({ variant = 'full' }: { variant?: BadgeVariant }) {
    const i18n = t().badge

    if (variant === 'minimal') {
        return (
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(76, 201, 240, 0.1)',
                border: '1px solid rgba(76, 201, 240, 0.3)',
                borderRadius: 8, padding: '4px 12px', fontSize: 12,
                color: '#4cc9f0'
            }}>
                <span>🛡️</span>
                <span>{i18n.controlled}</span>
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(135deg, rgba(76, 201, 240, 0.08), rgba(67, 97, 238, 0.08))',
            border: '1px solid rgba(76, 201, 240, 0.2)',
            borderRadius: 12, padding: '12px 20px',
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4cc9f0, #4361ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18
            }}>
                🛡️
            </div>
            <div>
                <div style={{ color: '#4cc9f0', fontWeight: 600, fontSize: 14 }}>
                    {i18n.controlled}
                </div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                    {i18n.byFramework}
                </div>
            </div>
        </div>
    )
}
