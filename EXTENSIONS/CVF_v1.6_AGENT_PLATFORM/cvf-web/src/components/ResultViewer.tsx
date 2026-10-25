'use client';

// Text Encoding Exception: Vietnamese product copy needs its native characters.

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { generateDeliverablePack, serializePackToMarkdown } from '@/lib/deliverable-pack';
import ReactMarkdown from 'react-markdown';
import { Execution } from '@/types';
import { useLanguage } from '@/lib/i18n';
import { analyzeOutputSafety } from '@/lib/safety-status';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { trackEvent } from '@/lib/analytics';
import { exportLabels, ResultExportControls } from './ResultExportControls';
import type { ExportFormat, ExportLanguage } from './ResultExportControls';

interface ResultViewerProps {
    execution: Execution;
    output: string;
    onAccept: () => void;
    onReject: () => void;
    onRetry: () => void;
    onBack: () => void;
    onSendToAgent?: (content: string) => void;
    // W97-T1: optional follow-up handler; when provided, shows the follow-up section
    onFollowUp?: (refinement: string) => void;
    // W119-T1: route-returned evidence receipt for non-coder handoff.
    evidenceReceipt?: GovernanceEvidenceReceipt;
    savedLocalHistory?: boolean;
}

// A run's transient UI (draft, view, menu, copy feedback, busy state and deferred work) lives in a
// body keyed by execution.id, so a different run id, A to B to A included, starts a new lifetime and
// unmounting ends the old one. The export language is a user preference, not run identity, so it
// stays here above the key. Same-id rerenders (new object, refreshed output, language) keep the body.
export function ResultViewer(props: ResultViewerProps) {
    const { language } = useLanguage();
    const [exportLang, setExportLang] = useState<ExportLanguage>(language as ExportLanguage);
    return <ResultViewerBody key={props.execution.id} {...props} exportLang={exportLang} onExportLangChange={setExportLang} />;
}

function ResultViewerBody({ execution, output, onAccept, onReject, onRetry, onBack, onSendToAgent, onFollowUp, evidenceReceipt, savedLocalHistory, exportLang, onExportLangChange }: ResultViewerProps & {
    exportLang: ExportLanguage;
    onExportLangChange: (lang: ExportLanguage) => void;
}) {
    const { language } = useLanguage();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [receiptCopied, setReceiptCopied] = useState(false);
    const [exporting, setExporting] = useState<ExportFormat | null>(null);
    const [exportFailures, setExportFailures] = useState<Partial<Record<ExportFormat, boolean>>>({});
    // Deferred completions and feedback timers belong to this mounted lifetime only. The export
    // sequence lets a newer export keep its busy state when an older one finishes. Already started
    // clipboard, download and analytics side effects are not cancelled; only stale UI state is.
    const alive = useRef(true);
    const exportSeq = useRef(0);
    const feedbackTimers = useRef<{ copied?: ReturnType<typeof setTimeout>; receipt?: ReturnType<typeof setTimeout> }>({});
    useEffect(() => {
        alive.current = true;
        const timers = feedbackTimers.current;
        return () => {
            alive.current = false;
            clearTimeout(timers.copied);
            clearTimeout(timers.receipt);
        };
    }, []);
    // Show 1.5s success feedback; a newer success replaces the older timer instead of being cut short.
    const flashFeedback = useCallback((key: 'copied' | 'receipt', set: (value: boolean) => void) => {
        set(true);
        clearTimeout(feedbackTimers.current[key]);
        feedbackTimers.current[key] = setTimeout(() => set(false), 1500);
    }, []);
    // W97-T1: follow-up input state
    const [followupText, setFollowupText] = useState('');
    // W125-T1: deliverable pack view mode; W130-T1: default to pack in noncoder mode (onFollowUp present)
    const [viewMode, setViewMode] = useState<'result' | 'pack'>(onFollowUp ? 'pack' : 'result');
    const deliverablePack = useMemo(
        () => generateDeliverablePack(execution, evidenceReceipt),
        [execution, evidenceReceipt]
    );

    const labels = exportLabels[exportLang];

    const writeTextToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch {
            // Fall back to the legacy copy path below.
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(textarea);
            return copied;
        } catch {
            return false;
        }
    }, []);

    const generateEvidenceReceiptContent = useCallback(() => {
        if (!evidenceReceipt) return '';
        const decision = evidenceReceipt.decision ?? 'UNKNOWN';
        const provider = evidenceReceipt.provider ?? 'unknown provider';
        const model = evidenceReceipt.model ?? 'unknown model';
        const nextAction = decision === 'ALLOW'
            ? 'Use the deliverable pack, review it with the accountable owner, and keep the receipt with the handoff.'
            : 'Review the decision, revise the request or seek approval, and keep the receipt for traceability.';
        const fields = [
            ['Receipt', evidenceReceipt.receiptId],
            ['Evidence mode', evidenceReceipt.evidenceMode],
            ['Route', evidenceReceipt.routeId],
            ['Decision', evidenceReceipt.decision],
            ['Risk', evidenceReceipt.riskLevel],
            ['Provider', evidenceReceipt.provider],
            ['Model', evidenceReceipt.model],
            ['Routing', evidenceReceipt.routingDecision],
            ['Policy', evidenceReceipt.policySnapshotId],
            ['Envelope', evidenceReceipt.envelopeId],
            ['Knowledge source', evidenceReceipt.knowledgeSource],
            ['Knowledge collection', evidenceReceipt.knowledgeCollectionId],
            ['Knowledge chunks', typeof evidenceReceipt.knowledgeChunkCount === 'number' ? String(evidenceReceipt.knowledgeChunkCount) : undefined],
            ['Approval', evidenceReceipt.approvalId],
            ['Output hint', evidenceReceipt.validationHint],
            ['Generated', evidenceReceipt.generatedAt],
        ].filter(([, value]) => value !== undefined && value !== null && String(value).length > 0);

        return [
            '## CVF Evidence Receipt',
            '',
            ...(savedLocalHistory ? [
                'Saved local history receipt. This is a saved copy; it has not been reverified.',
                `Original evidence mode: ${evidenceReceipt.evidenceMode}.`,
                '',
            ] : []),
            '### What happened',
            `CVF evaluated this run on \`${evidenceReceipt.routeId}\` and recorded decision \`${decision}\` using ${provider} / ${model}.`,
            '',
            '### Why this can be used',
            evidenceReceipt.evidenceMode === 'live'
                ? 'This receipt came from a live governed execution path, not a mock-only UI state.'
                : `This receipt evidence mode is \`${evidenceReceipt.evidenceMode}\`; do not use it as live governance proof without a live rerun.`,
            '',
            '### What to do next',
            nextAction,
            '',
            '### Receipt fields',
            ...fields.map(([label, value]) => `- **${label}:** ${value}`),
            '',
            '_No raw provider keys are included in this receipt._',
        ].join('\n');
    }, [evidenceReceipt, savedLocalHistory]);

    // Generate export content - remove any existing footer from output to prevent duplication
    const generateExportContent = () => {
        const date = new Date().toISOString().split('T')[0];
        // Clean output - remove any existing CVF footer to prevent duplication
        const cleanOutput = output.replace(/\n---\n\*Generated by CVF.*\*/g, '').trim();

        return `---
# ${labels.title}
**${labels.generated}:** ${date}
**${labels.template}:** ${execution.templateName}
---

${cleanOutput}

${evidenceReceipt ? generateEvidenceReceiptContent() : ''}

---
*${labels.footer}*
`;
    };

    const handleCopyToClipboard = async () => {
        try {
            const copiedOk = await writeTextToClipboard(generateExportContent());
            if (!copiedOk) {
                throw new Error('Clipboard copy failed');
            }
            if (alive.current) flashFeedback('copied', setCopied);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleExportToFile = () => {
        const content = generateExportContent();
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cvf-result-${execution.templateId}-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
        // W127: track evidence export
        trackEvent('evidence_exported', { executionId: execution.id, format: 'md' });
    };

    // Both receipt-copy controls share this path; only the tracked one fires the W130 analytics event.
    const copyReceipt = useCallback(async (trackExport: boolean) => {
        if (!evidenceReceipt) return;
        const runId = execution.id;
        try {
            const copiedOk = await writeTextToClipboard(generateEvidenceReceiptContent());
            if (!copiedOk) {
                throw new Error('Receipt copy failed');
            }
            if (alive.current) flashFeedback('receipt', setReceiptCopied);
            if (trackExport) trackEvent('evidence_exported', { executionId: runId, format: 'receipt_copy' });
        } catch (err) {
            console.error('Failed to copy receipt:', err);
        }
    }, [evidenceReceipt, execution.id, flashFeedback, generateEvidenceReceiptContent, writeTextToClipboard]);

    const handleCopyReceipt = () => copyReceipt(false);

    // W130-T1: Copy receipt with analytics tracking (fires evidence_exported)
    const handleCopyReceiptWithTracking = useCallback(() => copyReceipt(true), [copyReceipt]);

    // W125-T1: Download deliverable pack as .md
    const handleDownloadPack = useCallback(() => {
        const content = serializePackToMarkdown(deliverablePack);
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cvf-pack-${execution.templateId}-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
        // W127: track deliverable pack export
        trackEvent('deliverable_pack_exported', { executionId: execution.id, templateId: execution.templateId });
    }, [deliverablePack, execution.templateId, execution.id]);

    // Real PDF export using jsPDF
    const handleExportPdf = useCallback(async () => {
        const exportToken = ++exportSeq.current;
        setExporting('pdf');
        setExportFailures(current => ({ ...current, pdf: false }));
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const maxWidth = pageWidth - margin * 2;
            let y = 20;

            const addText = (text: string, fontSize: number, isBold = false) => {
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                const lines = doc.splitTextToSize(text, maxWidth);
                for (const line of lines) {
                    if (y + fontSize * 0.5 > doc.internal.pageSize.getHeight() - 15) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, margin, y);
                    y += fontSize * 0.45;
                }
            };

            // Title
            addText(labels.title, 18, true);
            y += 3;
            addText(`${labels.template}: ${execution.templateName}`, 11);
            addText(`${labels.generated}: ${new Date().toISOString().split('T')[0]}`, 11);
            y += 5;

            // Draw separator line
            doc.setDrawColor(200);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;

            // Parse markdown content into sections
            const rawContent = output.replace(/\n---\n\*Generated by CVF.*\*/g, '').trim();
            const contentLines = rawContent.split('\n');

            for (const line of contentLines) {
                const trimmed = line.trim();
                if (!trimmed) { y += 3; continue; }

                if (trimmed.startsWith('### ')) {
                    y += 2;
                    addText(trimmed.replace(/^###\s*/, ''), 12, true);
                    y += 1;
                } else if (trimmed.startsWith('## ')) {
                    y += 4;
                    addText(trimmed.replace(/^##\s*/, ''), 14, true);
                    y += 2;
                } else if (trimmed.startsWith('# ')) {
                    y += 4;
                    addText(trimmed.replace(/^#\s*/, ''), 16, true);
                    y += 2;
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    addText(`  \u2022 ${trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, '')}`, 10);
                } else if (/^\d+\.\s/.test(trimmed)) {
                    addText(`  ${trimmed.replace(/\*\*/g, '')}`, 10);
                } else if (trimmed.startsWith('|')) {
                    // Table row: render as simple text
                    if (!trimmed.match(/^[|\s-]+$/)) {
                        const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
                        addText(`  ${cells.join('  |  ')}`, 9);
                    }
                } else if (trimmed.startsWith('- [')) {
                    // Checklist items
                    const checked = trimmed.includes('[x]') || trimmed.includes('[X]');
                    const text = trimmed.replace(/^-\s*\[.?\]\s*/, '');
                    addText(`  ${checked ? '\u2611' : '\u2610'} ${text}`, 10);
                } else {
                    addText(trimmed.replace(/\*\*/g, ''), 10);
                }
            }

            // Footer
            y += 8;
            doc.setDrawColor(200);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(labels.footer, margin, y);

            doc.save(`cvf-result-${execution.templateId}-${Date.now()}.pdf`);
            // W127: track evidence export
            trackEvent('evidence_exported', { executionId: execution.id, format: 'pdf' });
        } catch (err) {
            console.error('PDF export failed:', err);
            if (alive.current && exportSeq.current === exportToken) {
                setExportFailures(current => ({ ...current, pdf: true }));
            }
        } finally {
            if (alive.current && exportSeq.current === exportToken) {
                setExporting(null);
                setShowExportMenu(false);
            }
        }
    }, [output, execution, labels]);

    // Real Word (.docx) export using docx library
    const handleExportDocx = useCallback(async () => {
        const exportToken = ++exportSeq.current;
        setExporting('docx');
        setExportFailures(current => ({ ...current, docx: false }));
        try {
            const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');
            const { saveAs } = await import('file-saver');

            const rawContent = output.replace(/\n---\n\*Generated by CVF.*\*/g, '').trim();
            const contentLines = rawContent.split('\n');
            const children: InstanceType<typeof Paragraph>[] = [];

            // Title
            children.push(new Paragraph({
                children: [new TextRun({ text: labels.title, bold: true, size: 36, color: '1a56db' })],
                heading: HeadingLevel.TITLE,
                spacing: { after: 200 },
            }));

            // Metadata
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: `${labels.template}: `, bold: true, size: 22 }),
                    new TextRun({ text: execution.templateName, size: 22 }),
                ],
                spacing: { after: 50 },
            }));
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: `${labels.generated}: `, bold: true, size: 22 }),
                    new TextRun({ text: new Date().toISOString().split('T')[0], size: 22 }),
                ],
                spacing: { after: 200 },
            }));

            // Separator
            children.push(new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' } },
                spacing: { after: 300 },
            }));

            // Parse content
            for (const line of contentLines) {
                const trimmed = line.trim();
                if (!trimmed) {
                    children.push(new Paragraph({ spacing: { after: 100 } }));
                    continue;
                }

                if (trimmed.startsWith('### ')) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: trimmed.replace(/^###\s*/, ''), bold: true, size: 24 })],
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 },
                    }));
                } else if (trimmed.startsWith('## ')) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: trimmed.replace(/^##\s*/, ''), bold: true, size: 28, color: '1a56db' })],
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 300, after: 150 },
                    }));
                } else if (trimmed.startsWith('# ')) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: trimmed.replace(/^#\s*/, ''), bold: true, size: 32 })],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 200 },
                    }));
                } else if (trimmed.startsWith('- [')) {
                    const checked = trimmed.includes('[x]') || trimmed.includes('[X]');
                    const text = trimmed.replace(/^-\s*\[.?\]\s*/, '');
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `${checked ? '\u2611' : '\u2610'} ${text}`, size: 20 })],
                        indent: { left: 400 },
                    }));
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    // Handle bold markers within text
                    const parts = trimmed.replace(/^[-*]\s*/, '').split(/\*\*/);
                    const runs = parts.map((part, i) => new TextRun({ text: part, bold: i % 2 === 1, size: 20 }));
                    children.push(new Paragraph({
                        children: [new TextRun({ text: '\u2022 ', size: 20 }), ...runs],
                        indent: { left: 400 },
                        spacing: { after: 50 },
                    }));
                } else if (/^\d+\.\s/.test(trimmed)) {
                    const parts = trimmed.split(/\*\*/);
                    const runs = parts.map((part, i) => new TextRun({ text: part, bold: i % 2 === 1, size: 20 }));
                    children.push(new Paragraph({
                        children: runs,
                        indent: { left: 400 },
                        spacing: { after: 50 },
                    }));
                } else if (trimmed.startsWith('|') && !trimmed.match(/^[|\s-]+$/)) {
                    const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
                    children.push(new Paragraph({
                        children: cells.map((cell, i) => new TextRun({
                            text: (i > 0 ? '  |  ' : '') + cell,
                            bold: i === 0,
                            size: 18,
                            font: 'Courier New',
                        })),
                        indent: { left: 200 },
                        spacing: { after: 30 },
                    }));
                } else {
                    const parts = trimmed.split(/\*\*/);
                    const runs = parts.map((part, i) => new TextRun({ text: part, bold: i % 2 === 1, size: 20 }));
                    children.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
                }
            }

            // Footer
            children.push(new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' } },
                spacing: { before: 400 },
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: labels.footer, italics: true, size: 16, color: '888888' })],
                alignment: AlignmentType.CENTER,
            }));

            const docFile = new Document({
                sections: [{ children }],
                creator: 'CVF Agent Platform',
                title: `${execution.templateName} - CVF Result`,
            });

            const blob = await Packer.toBlob(docFile);
            saveAs(blob, `cvf-result-${execution.templateId}-${Date.now()}.docx`);
            // W127: track evidence export
            trackEvent('evidence_exported', { executionId: execution.id, format: 'docx' });
        } catch (err) {
            console.error('Word export failed:', err);
            if (alive.current && exportSeq.current === exportToken) {
                setExportFailures(current => ({ ...current, docx: true }));
            }
        } finally {
            if (alive.current && exportSeq.current === exportToken) {
                setExporting(null);
                setShowExportMenu(false);
            }
        }
    }, [output, execution, labels]);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label={language === 'vi' ? 'Quay lại' : 'Go back'}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            <span>{execution.templateName} Complete</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* W125-T1: Result / Pack view toggle */}
                    <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
                        <button
                            onClick={() => setViewMode('result')}
                            className={`px-3 py-2 transition-colors ${viewMode === 'result' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            aria-label="Result view"
                        >
                            📄 Result
                        </button>
                        <button
                            onClick={() => setViewMode('pack')}
                            data-testid="pack-view-toggle"
                            className={`px-3 py-2 transition-colors border-l border-gray-300 dark:border-gray-600 ${viewMode === 'pack' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            aria-label="Deliverable pack preview"
                        >
                            📦 Pack
                        </button>
                    </div>

                    <ResultExportControls
                        labels={labels}
                        exportLang={exportLang}
                        onExportLangChange={onExportLangChange}
                        copied={copied}
                        exporting={exporting}
                        failures={exportFailures}
                        showExportMenu={showExportMenu}
                        onToggleMenu={() => setShowExportMenu(!showExportMenu)}
                        onCopy={handleCopyToClipboard}
                        onDownloadMarkdown={handleExportToFile}
                        onExportPdf={handleExportPdf}
                        onExportDocx={handleExportDocx}
                        onDownloadPack={handleDownloadPack}
                    />
                </div>
            </div>

            {/* Output Safety Badge */}
            {evidenceReceipt && (
                <section
                    data-testid="w119-evidence-receipt"
                    className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="text-sm font-semibold">{labels.evidenceTitle}</div>
                            {savedLocalHistory && (
                                <p data-testid="saved-receipt-origin" className="mt-2 text-xs">
                                    {language === 'vi'
                                        ? 'Biên nhận lưu trong lịch sử cục bộ. Đây là bản đã lưu; chưa được xác minh lại.'
                                        : 'Saved local history receipt. This is a saved copy; it has not been reverified.'}
                                </p>
                            )}
                            <div className="mt-2 grid gap-x-5 gap-y-1 text-xs sm:grid-cols-2">
                                {evidenceReceipt.decision && <p><span className="font-medium">Decision:</span> {evidenceReceipt.decision}</p>}
                                {evidenceReceipt.riskLevel && <p><span className="font-medium">Risk:</span> {evidenceReceipt.riskLevel}</p>}
                                {evidenceReceipt.provider && <p><span className="font-medium">Provider:</span> {evidenceReceipt.provider}</p>}
                                {evidenceReceipt.model && <p><span className="font-medium">Model:</span> {evidenceReceipt.model}</p>}
                                {evidenceReceipt.routingDecision && <p><span className="font-medium">Routing:</span> {evidenceReceipt.routingDecision}</p>}
                                {evidenceReceipt.knowledgeSource && evidenceReceipt.knowledgeSource !== 'none' && <p><span className="font-medium">Knowledge:</span> {evidenceReceipt.knowledgeSource}</p>}
                                {evidenceReceipt.knowledgeCollectionId && <p className="break-all"><span className="font-medium">Collection:</span> {evidenceReceipt.knowledgeCollectionId}</p>}
                                {typeof evidenceReceipt.knowledgeChunkCount === 'number' && <p><span className="font-medium">Chunks:</span> {evidenceReceipt.knowledgeChunkCount}</p>}
                            </div>
                            <div className="mt-2 space-y-1 text-[11px] text-emerald-700 dark:text-emerald-200/80">
                                <p className="break-all"><span className="font-medium">Receipt:</span> {evidenceReceipt.receiptId}</p>
                                {evidenceReceipt.policySnapshotId && <p className="break-all"><span className="font-medium">Policy:</span> {evidenceReceipt.policySnapshotId}</p>}
                                {evidenceReceipt.envelopeId && <p className="break-all"><span className="font-medium">Envelope:</span> {evidenceReceipt.envelopeId}</p>}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyReceipt}
                            className="cvf-control rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                            {receiptCopied ? labels.copiedReceipt : labels.copyReceipt}
                        </button>
                    </div>
                </section>
            )}

            {/* Output Safety Badge */}
            {(() => {
                const safety = analyzeOutputSafety(output);
                return (
                    <div className={`mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl border ${safety.riskLevel === 'R0' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
                            safety.riskLevel === 'R1' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                                safety.riskLevel === 'R2' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}>
                        <span className="text-lg">{safety.emoji}</span>
                        <div>
                            <div className="text-sm font-semibold">
                                {language === 'vi' ? safety.label.vi : safety.label.en}
                            </div>
                            {safety.issues.length > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {safety.issues.join(', ')}
                                </div>
                            )}
                        </div>
                        <div className="ml-auto text-xs text-gray-400">
                            {language === 'vi' ? 'Kiểm tra bởi CVF Safety' : 'Checked by CVF Safety'}
                        </div>
                    </div>
                );
            })()}

            {/* Output Content / Pack Preview */}
            {viewMode === 'result' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
                    <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{output}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                /* W125-T1: Deliverable pack preview */
                <div
                    data-testid="deliverable-pack-preview"
                    className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 p-4 sm:p-8 space-y-6"
                >
                    {/* Pack type badge + headline */}
                    <div>
                        <span className="inline-block mb-2 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                            📦 {deliverablePack.packType.replace(/_/g, ' ')}
                        </span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{deliverablePack.headline}</h2>
                    </div>

                    {/* Executive summary */}
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 border border-gray-100 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Executive Summary</div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{deliverablePack.executiveSummary}</p>
                    </div>

                    {/* Main output (collapsed) */}
                    <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Main Output</div>
                        <div className="prose dark:prose-invert max-w-none text-sm max-h-64 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40">
                            <ReactMarkdown>{deliverablePack.mainOutput}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Scope boundary */}
                    <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Scope Boundary</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{deliverablePack.scopeBoundary}</p>
                    </div>

                    {/* Governance evidence */}
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-4">
                        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">Governance Evidence</div>
                        <div className="text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                            <p><span className="font-medium">Decision:</span> {deliverablePack.governanceEvidence.decision}</p>
                            {deliverablePack.governanceEvidence.provider && <p><span className="font-medium">Provider:</span> {deliverablePack.governanceEvidence.provider}</p>}
                            {deliverablePack.governanceEvidence.model && <p><span className="font-medium">Model:</span> {deliverablePack.governanceEvidence.model}</p>}
                            <p><span className="font-medium">Receipt available:</span> {deliverablePack.governanceEvidence.receiptAvailable ? 'Yes' : 'No'}</p>
                        </div>
                    </div>

                    {/* Recommended next actions */}
                    <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Recommended Next Actions</div>
                        <ol className="space-y-1">
                            {deliverablePack.recommendedNextActions.map((action, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">{i + 1}.</span>
                                    <span>{action}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Handoff notes */}
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4">
                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Handoff Notes</div>
                        <p className="text-sm text-amber-800 dark:text-amber-200">{deliverablePack.handoffNotes}</p>
                    </div>

                    {/* Download CTA */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleDownloadPack}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            📦 Download Pack (.md)
                        </button>
                    </div>
                </div>
            )}

            {/* W130-T1: Noncoder export nudge — save results section */}
            {onFollowUp && output && (
                <div
                    data-testid="noncoder-export-nudge"
                    className="mt-6 rounded-xl border border-purple-200 dark:border-purple-700
                        bg-purple-50 dark:bg-purple-950/40 p-4"
                >
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                        💾 {language === 'vi' ? 'Lưu kết quả của bạn' : 'Save your results'}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-4">
                        {language === 'vi'
                            ? 'Tải xuống kết quả cùng bằng chứng quản trị để lưu trữ hoặc bàn giao.'
                            : 'Download your output with governance evidence for handoff or storage.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {evidenceReceipt && (
                            <button
                                type="button"
                                data-testid="nudge-copy-evidence-btn"
                                onClick={handleCopyReceiptWithTracking}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-purple-300
                                    dark:border-purple-600 bg-white dark:bg-gray-900 text-purple-700
                                    dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40
                                    transition-colors"
                            >
                                {receiptCopied
                                    ? (language === 'vi' ? '✅ Đã sao chép' : '✅ Copied!')
                                    : (language === 'vi' ? '📋 Sao chép bằng chứng' : '📋 Copy Evidence Receipt')}
                            </button>
                        )}
                        <button
                            type="button"
                            data-testid="nudge-download-pack-btn"
                            onClick={handleDownloadPack}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600
                                hover:bg-purple-700 text-white transition-colors"
                        >
                            📦 {language === 'vi' ? 'Tải Deliverable Pack (.md)' : 'Download Deliverable Pack (.md)'}
                        </button>
                    </div>
                </div>
            )}

            {/* W97-T1: Follow-up section — only shown when onFollowUp prop is provided */}
            {onFollowUp && output && (!execution.htmlPilot || (execution.htmlPilot.jobId && evidenceReceipt?.htmlPilotEvidence)) && (
                <div
                    data-testid="followup-section"
                    className="mt-6 rounded-xl border border-blue-200 dark:border-blue-700
                        bg-blue-50 dark:bg-blue-950/40 p-4"
                >
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                        🔄 {language === 'vi' ? 'Bổ sung hoặc làm rõ kết quả' : 'Refine or follow up on this result'}
                    </p>
                    <textarea
                        data-testid="followup-input"
                        value={followupText}
                        onChange={(e) => setFollowupText(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder={language === 'vi'
                            ? 'Bạn muốn điều chỉnh hoặc khám phá thêm điều gì?'
                            : 'What would you like to adjust or explore next?'}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-600
                            bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                            placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            resize-none transition-all"
                    />
                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            data-testid="followup-submit-btn"
                            disabled={followupText.trim().length < 5}
                            onClick={() => {
                                if (followupText.trim().length >= 5) {
                                    // W127: track follow-up continuation
                                    trackEvent('followup_started', { executionId: execution.id });
                                    onFollowUp(followupText.trim());
                                    setFollowupText('');
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40
                                disabled:cursor-not-allowed text-white text-sm font-medium
                                rounded-lg transition-colors"
                        >
                            {language === 'vi' ? 'Chạy tiếp →' : 'Run follow-up →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                {execution.htmlPilot?.runId && <a data-testid="html-pilot-transfer-exact-run"
                    href={`/work-transfer?source=${encodeURIComponent(execution.id)}`}
                    className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white">
                    {language === 'vi' ? 'Chuyển đúng kết quả sang HTML' : 'Transfer exact result to HTML'}
                </a>}
                {!execution.htmlPilot && <>
                <button
                    onClick={onAccept}
                    className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg
                     shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <span>✅</span>
                    <span>Accept</span>
                </button>

                <button
                    onClick={onReject}
                    className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg
                     shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <span>❌</span>
                    <span>Reject</span>
                </button>

                <button
                    onClick={onRetry}
                    className="w-full sm:w-auto px-8 py-3 border border-gray-300 dark:border-gray-600 
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <span>↻</span>
                    <span>Retry</span>
                </button>
                </>}

                {onSendToAgent && (
                    <button
                        onClick={() => onSendToAgent(generateExportContent())}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                         hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg
                         shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <span>🤖</span>
                        <span>Send to Agent</span>
                    </button>
                )}
            </div>

            {/* Metadata */}
            <div className="mt-8 text-center text-sm text-gray-500">
                Executed at {new Date().toLocaleString()} • Duration: 12.5s
            </div>
        </div>
    );
}
