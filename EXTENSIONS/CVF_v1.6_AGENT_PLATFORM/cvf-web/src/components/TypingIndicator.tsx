'use client';

export function TypingIndicator() {
    return (
        <div className="flex gap-3 mb-4 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                           flex items-center justify-center text-white text-sm flex-shrink-0 animate-pulse">
                🤖
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
            </div>
        </div>
    );
}
