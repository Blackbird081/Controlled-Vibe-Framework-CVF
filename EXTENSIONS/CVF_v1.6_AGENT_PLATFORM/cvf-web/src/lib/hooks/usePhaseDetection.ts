'use client';

import { useCallback } from 'react';
import {
    autoCheckItems,
    calculatePhaseCompliance,
    detectCurrentPhase,
    CVFPhase,
} from '@/lib/cvf-checklists';

export function usePhaseDetection() {
    const detectPhase = useCallback((response: string): CVFPhase | null => {
        return detectCurrentPhase(response);
    }, []);

    const getCompliance = useCallback((phase: CVFPhase | null, response: string) => {
        if (!phase) return null;
        const checkedItems = autoCheckItems(phase, response);
        return calculatePhaseCompliance(phase, checkedItems);
    }, []);

    return {
        detectPhase,
        getCompliance,
    };
}
