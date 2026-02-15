'use client';

import { useEffect, useState } from 'react';

export type AnalyticsEventType =
    | 'execution_created'
    | 'execution_completed'
    | 'execution_accepted'
    | 'execution_rejected'
    | 'execution_retry'
    | 'template_selected'
    | 'skill_viewed'
    | 'skill_copied'
    | 'analytics_opened'
    | 'agent_opened'
    | 'agent_closed'
    | 'multi_agent_opened'
    | 'tools_opened'
    | 'enforcement_decision'
    | 'pre_uat_failed'
    | 'demo_auto_run';

export interface AnalyticsEvent {
    id: string;
    type: AnalyticsEventType;
    timestamp: number;
    data?: Record<string, unknown>;
}

const STORAGE_KEY = 'cvf_analytics_events';
const SETTINGS_KEY = 'cvf_settings';
const MAX_EVENTS = 500;
const MAX_EVENT_AGE_DAYS = 30;
const MAX_EVENT_AGE_MS = MAX_EVENT_AGE_DAYS * 24 * 60 * 60 * 1000;
const UPDATE_EVENT = 'cvf-analytics-updated';

export function isAnalyticsEnabled() {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return true;
    try {
        const parsed = JSON.parse(stored);
        return parsed?.preferences?.analyticsEnabled !== false;
    } catch {
        return true;
    }
}

function pruneEvents(events: AnalyticsEvent[]) {
    const cutoff = Date.now() - MAX_EVENT_AGE_MS;
    const filtered = events.filter((event) => event.timestamp >= cutoff);
    const trimmed = filtered.slice(0, MAX_EVENTS);
    if (trimmed.length !== events.length) {
        writeEvents(trimmed);
    }
    return trimmed;
}

function readEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored) as AnalyticsEvent[];
        return pruneEvents(parsed);
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
    if (!isAnalyticsEnabled()) return;

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

export function exportAnalyticsEvents(format: 'json' | 'csv') {
    if (typeof window === 'undefined') return;
    const events = readEvents();
    const payload = format === 'json'
        ? JSON.stringify(events, null, 2)
        : toCsv(events);
    const blob = new Blob([payload], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cvf-analytics-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
}

function toCsv(events: AnalyticsEvent[]) {
    const headers = ['id', 'type', 'timestamp', 'data'];
    const rows = events.map((event) => {
        const data = event.data ? JSON.stringify(event.data).replace(/"/g, '""') : '';
        return [
            event.id,
            event.type,
            new Date(event.timestamp).toISOString(),
            `"${data}"`,
        ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}

export function useAnalyticsEvents() {
    const [events, setEvents] = useState<AnalyticsEvent[]>(() => readEvents());
    const [enabled, setEnabled] = useState<boolean>(() => isAnalyticsEnabled());

    useEffect(() => {
        const handler = () => {
            setEvents(readEvents());
            setEnabled(isAnalyticsEnabled());
        };
        window.addEventListener(UPDATE_EVENT, handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener(UPDATE_EVENT, handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    return {
        events,
        enabled,
        clearEvents: clearAnalyticsEvents,
    };
}
