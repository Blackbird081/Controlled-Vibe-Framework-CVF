'use client';

import { ChatMessage } from '@/lib/agent-chat';

interface ExportMenuProps {
    messages: ChatMessage[];
    onClose: () => void;
}

export function ExportMenu({ messages, onClose }: ExportMenuProps) {
    const exportToMarkdown = () => {
        const content = messages.map(m => {
            const role = m.role === 'user' ? '👤 User' : '🤖 Assistant';
            const metadata = m.metadata ? `\n\n_${m.metadata.model || ''} | ${m.metadata.tokens || 0} tokens_` : '';
            return `## ${role}\n\n${m.content}${metadata}`;
        }).join('\n\n---\n\n');

        const blob = new Blob([`# Chat Export\n\n${content}`], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
    };

    const exportToJSON = () => {
        const data = {
            exportedAt: new Date().toISOString(),
            messageCount: messages.length,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                metadata: m.metadata,
            })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
    };

    const copyAll = async () => {
        const content = messages.map(m => {
            const role = m.role === 'user' ? 'User' : 'Assistant';
            return `[${role}]\n${m.content}`;
        }).join('\n\n---\n\n');

        try {
            await navigator.clipboard.writeText(content);
            alert('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
        onClose();
    };

    return (
        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[140px] z-50">
            <button onClick={exportToMarkdown} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                📄 Markdown
            </button>
            <button onClick={exportToJSON} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                📦 JSON
            </button>
            <button onClick={copyAll} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                📋 Copy All
            </button>
        </div>
    );
}
