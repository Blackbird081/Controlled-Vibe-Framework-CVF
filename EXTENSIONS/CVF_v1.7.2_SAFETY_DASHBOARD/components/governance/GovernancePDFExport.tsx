// components/governance/GovernancePDFExport.tsx
"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SessionInfo, SessionState, GovernanceEvent } from "@/lib/sessionManager";

interface Props {
    sessionInfo: SessionInfo;
    finalState: SessionState;
    events: GovernanceEvent[];
}

export default function GovernancePDFExport({ sessionInfo, finalState, events }: Props) {
    const handleExport = () => {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text("CVF Governance Report", pageW / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Session: ${sessionInfo.sessionId.slice(0, 8)}...`, pageW / 2, 28, { align: "center" });
        doc.text(`Generated: ${new Date().toLocaleString("vi-VN")}`, pageW / 2, 34, { align: "center" });

        // Session Info Table
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text("Session Info", 14, 46);

        autoTable(doc, {
            startY: 50,
            head: [["Field", "Value"]],
            body: [
                ["Session ID", sessionInfo.sessionId],
                ["CVF Version", sessionInfo.cvfVersion],
                ["Profile", sessionInfo.profile],
                ["Started At", new Date(sessionInfo.startedAt).toLocaleString("vi-VN")],
            ],
            theme: "striped",
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 9 },
        });

        // Final State Table
        const stateY = (doc as any).lastAutoTable.finalY + 12;
        doc.setFontSize(13);
        doc.text("Final State", 14, stateY);

        autoTable(doc, {
            startY: stateY + 4,
            head: [["Field", "Value"]],
            body: [
                ["Risk Level", finalState.rLevel],
                ["Phase", finalState.phase],
                ["Autonomy", String(finalState.autonomy)],
                ["Step", String(finalState.step)],
                ["Escalated", finalState.escalated ? "⚠️ Yes" : "No"],
                ["Require Human", finalState.requireHuman ? "⚠️ Yes" : "No"],
                ["Hard Stop", finalState.hardStop ? "🛑 Yes" : "No"],
                ["Warning", finalState.warning ? "Yes" : "No"],
                ["Critical", finalState.critical ? "Yes" : "No"],
            ],
            theme: "striped",
            headStyles: { fillColor: [234, 88, 12] },
            styles: { fontSize: 9 },
        });

        // Events Timeline
        const eventsY = (doc as any).lastAutoTable.finalY + 12;
        doc.setFontSize(13);
        doc.text(`Governance Timeline (${events.length} events)`, 14, eventsY);

        autoTable(doc, {
            startY: eventsY + 4,
            head: [["#", "Time", "Type", "Phase", "Risk", "Autonomy"]],
            body: events.map((e, i) => [
                String(i + 1),
                new Date(e.timestamp).toLocaleTimeString("vi-VN"),
                e.type,
                e.phase,
                e.rLevel,
                String(e.autonomy),
            ]),
            theme: "striped",
            headStyles: { fillColor: [22, 163, 74] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 25 },
            },
        });

        // Footer
        const pgCount = doc.getNumberOfPages();
        for (let i = 1; i <= pgCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `CVF V${sessionInfo.cvfVersion} — Page ${i}/${pgCount}`,
                pageW / 2,
                doc.internal.pageSize.getHeight() - 8,
                { align: "center" }
            );
        }

        doc.save(`cvf-report-${sessionInfo.sessionId.slice(0, 8)}.pdf`);
    };

    return (
        <button
            onClick={handleExport}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition"
        >
            📄 Export PDF
        </button>
    );
}
