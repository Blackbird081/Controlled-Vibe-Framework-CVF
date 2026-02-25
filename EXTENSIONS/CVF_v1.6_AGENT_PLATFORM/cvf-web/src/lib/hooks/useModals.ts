'use client';

import { useState, useCallback } from 'react';

export type ModalName = 'userContext' | 'settings' | 'aiUsage' | 'apiKeyWizard' | 'onboarding';

export function useModals(permissions?: {
    canUseSettings: boolean;
    canUseAIUsage: boolean;
    canUseContext: boolean;
}) {
    const [showUserContext, setShowUserContext] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showAIUsage, setShowAIUsage] = useState(false);
    const [showApiKeyWizard, setShowApiKeyWizard] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !localStorage.getItem('cvf_onboarding_complete');
    });

    const handleOnboardingComplete = useCallback(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        setShowOnboarding(false);
    }, []);

    const canUseSettings = permissions?.canUseSettings ?? true;
    const canUseAIUsage = permissions?.canUseAIUsage ?? true;
    const canUseContext = permissions?.canUseContext ?? true;

    const openModal = useCallback((name: ModalName) => {
        switch (name) {
            case 'userContext': setShowUserContext(true); break;
            case 'settings': setShowSettings(true); break;
            case 'aiUsage': setShowAIUsage(true); break;
            case 'apiKeyWizard': setShowApiKeyWizard(true); break;
            case 'onboarding': setShowOnboarding(true); break;
        }
    }, []);

    const closeModal = useCallback((name: ModalName) => {
        switch (name) {
            case 'userContext': setShowUserContext(false); break;
            case 'settings': setShowSettings(false); break;
            case 'aiUsage': setShowAIUsage(false); break;
            case 'apiKeyWizard': setShowApiKeyWizard(false); break;
            case 'onboarding': setShowOnboarding(false); break;
        }
    }, []);

    return {
        showUserContext: canUseContext && showUserContext,
        showSettings: canUseSettings && showSettings,
        showAIUsage: canUseAIUsage && showAIUsage,
        showApiKeyWizard,
        showOnboarding,
        openModal,
        closeModal,
        handleOnboardingComplete,
    };
}
