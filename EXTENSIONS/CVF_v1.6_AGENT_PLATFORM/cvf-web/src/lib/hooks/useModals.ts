'use client';

import { useState, useCallback, useEffect } from 'react';

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
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Check first visit
    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('cvf_onboarding_complete');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleOnboardingComplete = useCallback(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        setShowOnboarding(false);
    }, []);

    // Close modals when permissions change
    useEffect(() => {
        if (permissions) {
            if (!permissions.canUseSettings && showSettings) setShowSettings(false);
            if (!permissions.canUseAIUsage && showAIUsage) setShowAIUsage(false);
            if (!permissions.canUseContext && showUserContext) setShowUserContext(false);
        }
    }, [permissions, showSettings, showAIUsage, showUserContext]);

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
        showUserContext,
        showSettings,
        showAIUsage,
        showApiKeyWizard,
        showOnboarding,
        openModal,
        closeModal,
        handleOnboardingComplete,
    };
}
