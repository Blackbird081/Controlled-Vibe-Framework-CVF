'use client'

import { useState } from 'react'
import { t } from '../../lib/i18n'

/**
 * OnboardingFlow — 3-step welcome for non-coders.
 * CVF Doctrine: Non-coders see friendly Vietnamese, never R0-R3.
 */
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0)
    const i18n = t().onboarding

    const steps = [
        { title: i18n.step1Title, desc: i18n.step1Desc, icon: '🛡️' },
        { title: i18n.step2Title, desc: i18n.step2Desc, icon: '📊' },
        { title: i18n.step3Title, desc: i18n.step3Desc, icon: '✅' },
    ]

    const current = steps[step]

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#1a1a2e', borderRadius: 16, padding: 40,
                maxWidth: 440, width: '90%', textAlign: 'center',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{current.icon}</div>
                <h2 style={{ color: '#fff', fontSize: 22, marginBottom: 8 }}>{current.title}</h2>
                <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                    {current.desc}
                </p>

                {/* Step indicator */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: i === step ? '#4cc9f0' : 'rgba(255,255,255,0.2)'
                        }} />
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                        onClick={onComplete}
                        style={{
                            background: 'transparent', color: '#888', border: 'none',
                            cursor: 'pointer', fontSize: 14
                        }}
                    >
                        {i18n.skip}
                    </button>
                    <button
                        onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}
                        style={{
                            background: 'linear-gradient(135deg, #4cc9f0, #4361ee)',
                            color: '#fff', border: 'none', borderRadius: 8,
                            padding: '10px 28px', cursor: 'pointer', fontSize: 15,
                            fontWeight: 600
                        }}
                    >
                        {step < steps.length - 1 ? i18n.next : i18n.getStarted}
                    </button>
                </div>
            </div>
        </div>
    )
}
