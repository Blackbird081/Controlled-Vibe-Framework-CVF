import { useState, useSyncExternalStore } from 'react';

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

/** Snapshot the mount-time prompt only; editing a new draft must not reopen it. */
export function useStoredDraft(storageKey: string) {
    const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
    const [hasDraft, setHasDraft] = useState(() => {
        try {
            if (typeof window === 'undefined') return false;
            const saved = window.localStorage.getItem(storageKey);
            const parsed = saved ? JSON.parse(saved) : null;
            return !!parsed?.data && Object.keys(parsed.data).length > 0;
        } catch {
            return false;
        }
    });
    return [hydrated && hasDraft, setHasDraft] as const;
}
