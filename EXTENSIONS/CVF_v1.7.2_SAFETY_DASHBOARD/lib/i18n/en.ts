// lib/i18n/en.ts
// English translations for Non-Coder Safety Dashboard (v1.7.2)

export const en = {
    dashboard: {
        title: 'AI Safety Dashboard',
        subtitle: 'Monitor your AI activity',
    },
    risk: {
        R0: { emoji: '🟢', label: 'Safe', description: 'AI is operating normally, no intervention needed.' },
        R1: { emoji: '🟡', label: 'Attention', description: 'AI needs additional review, may require guidance.' },
        R2: { emoji: '🟠', label: 'Review Required', description: 'AI needs approval before proceeding.' },
        R3: { emoji: '🔴', label: 'Dangerous', description: 'AI has been stopped. Authorized review required.' },
    },
    status: {
        active: 'Active',
        paused: 'Paused',
        blocked: 'Blocked',
        safe: 'Safe',
    },
    actions: {
        approve: 'Approve',
        reject: 'Reject',
        review: 'Review',
        viewDetails: 'View Details',
        export: 'Export Report',
    },
    onboarding: {
        welcome: 'Welcome to CVF Safety Dashboard!',
        step1Title: 'Your AI is protected',
        step1Desc: 'CVF monitors all AI activity and alerts you when there\'s risk.',
        step2Title: 'Understand risk levels',
        step2Desc: '🟢 Safe → 🟡 Attention → 🟠 Review Required → 🔴 Dangerous',
        step3Title: 'You are always in control',
        step3Desc: 'AI never acts without your consent at R2+.',
        getStarted: 'Get Started',
        next: 'Next',
        skip: 'Skip',
    },
    badge: {
        controlled: 'AI is being controlled',
        byFramework: 'by CVF — Controlled Vibe Framework',
        learnMore: 'Learn More',
    },
    errors: {
        connectionLost: 'Connection lost. Retrying...',
        unauthorized: 'You do not have access.',
        unknown: 'An error occurred. Please try again.',
    }
}
