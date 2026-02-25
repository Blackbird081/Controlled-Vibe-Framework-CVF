"use client";

interface Props {
  riskScore: number;
}

export default function RiskBadge({ riskScore }: Props) {
  let label = "Low";
  let color = "green";

  if (riskScore > 5) {
    label = "High";
    color = "red";
  } else if (riskScore > 3) {
    label = "Medium";
    color = "orange";
  }

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "6px",
        background: color,
        color: "white",
        fontSize: "12px",
      }}
    >
      {label} (Score: {riskScore})
    </span>
  );
}