interface StatCardProps {
    title: string
    value: string | number
    change?: string
    changeType?: "positive" | "negative" | "neutral"
    icon?: string
}

export default function StatCard({ title, value, change, changeType = "neutral", icon }: StatCardProps) {
    const changeColor = {
        positive: "var(--cvf-success)",
        negative: "var(--cvf-danger)",
        neutral: "var(--cvf-text-muted)",
    }[changeType]

    return (
        <div className="cvf-card cvf-animate-in">
            <div className="cvf-card-header">
                <span className="cvf-card-title">{title}</span>
                {icon && <span style={{ fontSize: "20px" }}>{icon}</span>}
            </div>
            <div className="cvf-card-value">{value}</div>
            {change && (
                <div style={{ fontSize: "13px", color: changeColor, marginTop: "8px" }}>
                    {change}
                </div>
            )}
        </div>
    )
}
