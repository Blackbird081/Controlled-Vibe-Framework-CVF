// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
/** Existing export chrome, extracted to keep SpecExport below its approved size cap. */
export function SpecExportQuickLinks({ label }: { label: string }) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <a href="https://chat.openai.com/" target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800">
                ChatGPT ↗
            </a>
            <a href="https://claude.ai/" target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800">
                Claude ↗
            </a>
            <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
                Gemini ↗
            </a>
        </div>
    );
}
