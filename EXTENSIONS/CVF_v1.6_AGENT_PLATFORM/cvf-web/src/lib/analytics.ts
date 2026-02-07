'use client';

import { useEffect, useState } from 'react';

export type AnalyticsEventType =
    | 'execution_created'
    | 'execution_completed'
    | 'execution_accepted'
    | 'execution_rejected'
    | 'execution_retry'
    | 'template_selected'
    | 'analytics_opened'
    | 'agent_opened'
    | 'agent_closed'
    | 'multi_agent_opened'
    | 'tools_opened';

export interface AnalyticsEvent {
    id: string;
    type: AnalyticsEventType;
    timestamp: number;
    data?: Record<string, unknown>;
}

const STORAGE_KEY = 'cvf_analytics_events';
const MAX_EVENTS = 500;
const UPDATE_EVENT = 'cvf-analytics-updated';

function readEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored) as AnalyticsEvent[];
    } catch {
        return [];
    }
}

function writeEvents(events: AnalyticsEvent[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function trackEvent(type: AnalyticsEventType, data?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;

    const events = readEvents();
    const entry: AnalyticsEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        timestamp: Date.now(),
        data,
    };

    const updated = [entry, ...events].slice(0, MAX_EVENTS);
    writeEvents(updated);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
    return readEvents();
}

export function clearAnalyticsEvents() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function useAnalyticsEvents() {
    const [events, setEvents] = useState<AnalyticsEvent[]>(() => readEvents());

    useEffect(() => {
        const handler = () => setEvents(readEvents());
        window.addEventListener(UPDATE_EVENT, handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener(UPDATE_EVENT, handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    return {
        events,
        clearEvents: clearAnalyticsEvents,
    };
}
