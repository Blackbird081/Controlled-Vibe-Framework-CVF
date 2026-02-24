interface StatusBadgeProps {
    status: string
}

const statusStyles: Record<string, string> = {
    approved: "cvf-badge-approved",
    rejected: "cvf-badge-rejected",
    pending: "cvf-badge-pending",
    proposed: "cvf-badge-pending",
    validated: "cvf-badge-approved",
    executed: "cvf-badge-approved",
    low: "cvf-badge-low",
    medium: "cvf-badge-medium",
    high: "cvf-badge-high",
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const className = statusStyles[status.toLowerCase()] ?? "cvf-badge-pending"
    return <span className={`cvf-badge ${className}`}>{status}</span>
}
