// hooks/useMultiTabSync.ts
"use client";

import { useEffect } from "react";

const CHANNEL_NAME = "cvf-session-sync";

interface SyncMessage {
    type: "SESSION_UPDATED" | "SESSION_FROZEN" | "NEW_SESSION";
    sessionId: string;
    timestamp: number;
}

/**
 * Multi-tab sync via BroadcastChannel API.
 * When one tab modifies a session, other tabs reload from localStorage.
 */
export function useMultiTabSync(
    sessionId: string | undefined,
    onSync: () => void
) {
    useEffect(() => {
        if (typeof BroadcastChannel === "undefined") return;

        const channel = new BroadcastChannel(CHANNEL_NAME);

        channel.onmessage = (event: MessageEvent<SyncMessage>) => {
            // Only react to messages from other tabs (different timestamp)
            if (event.data.sessionId !== sessionId) {
                onSync();
            }
        };

        return () => channel.close();
    }, [sessionId, onSync]);
}

/**
 * Broadcast a sync message to other tabs.
 */
export function broadcastSync(
    type: SyncMessage["type"],
    sessionId: string
) {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
        type,
        sessionId,
        timestamp: Date.now(),
    } satisfies SyncMessage);
    channel.close();
}
