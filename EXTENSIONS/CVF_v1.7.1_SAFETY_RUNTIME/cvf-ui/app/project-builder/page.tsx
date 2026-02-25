"use client"

import { useState } from "react"

interface ProjectStep {
  id: number
  label: string
  status: "done" | "active" | "upcoming"
}

const pipelineSteps: ProjectStep[] = [
  { id: 1, label: "Define Proposal", status: "done" },
  { id: 2, label: "Risk Assessment", status: "done" },
  { id: 3, label: "Cost Validation", status: "active" },
  { id: 4, label: "Policy Check", status: "upcoming" },
  { id: 5, label: "Approval Gate", status: "upcoming" },
  { id: 6, label: "Execute", status: "upcoming" },
]

const stepColors: Record<string, string> = {
  done: "var(--cvf-success)",
  active: "var(--cvf-accent)",
  upcoming: "var(--cvf-text-muted)",
}

export default function ProjectBuilderPage() {
  const [instruction, setInstruction] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!instruction.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="cvf-animate-in">
      <div className="cvf-page-header">
        <h1 className="cvf-page-title">Project Builder</h1>
        <p className="cvf-page-subtitle">Create and submit proposals through the CVF pipeline</p>
      </div>

      {/* Pipeline Visualization */}
      <div className="cvf-card" style={{ marginBottom: "24px" }}>
        <div className="cvf-card-header">
          <span className="cvf-card-title">Pipeline Status</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 0" }}>
          {pipelineSteps.map((step, i) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                flex: 1,
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: step.status === "active" ? stepColors.active : step.status === "done" ? stepColors.done : "var(--cvf-bg-input)",
                  border: `2px solid ${stepColors[step.status]}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: step.status !== "upcoming" ? "white" : stepColors.upcoming,
                  fontSize: "14px",
                  fontWeight: 700,
                }}>
                  {step.status === "done" ? "✓" : step.id}
                </div>
                <span style={{
                  fontSize: "11px",
                  color: stepColors[step.status],
                  fontWeight: step.status === "active" ? 600 : 400,
                  textAlign: "center",
                }}>
                  {step.label}
                </span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <div style={{
                  height: "2px",
                  flex: "0 0 20px",
                  background: step.status === "done" ? stepColors.done : "var(--cvf-border)",
                  marginBottom: "24px",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Proposal Form */}
      <div className="cvf-card">
        <div className="cvf-card-header">
          <span className="cvf-card-title">New Proposal</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--cvf-text-primary)", marginBottom: "8px" }}>
              Instruction
            </label>
            <textarea
              placeholder="Describe what you want to deploy, configure, or modify..."
              value={instruction}
              onChange={(e) => { setInstruction(e.target.value); setSubmitted(false) }}
              rows={4}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "var(--cvf-bg-input)",
                border: "1px solid var(--cvf-border)",
                borderRadius: "var(--cvf-radius-sm)",
                color: "var(--cvf-text-primary)",
                fontSize: "14px",
                resize: "vertical",
                outline: "none",
                fontFamily: "var(--cvf-font-sans)",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: instruction.length > 500 ? "var(--cvf-danger)" : "var(--cvf-text-muted)" }}>
              {instruction.length} chars {instruction.length > 500 ? "— High risk threshold" : ""}
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button className="cvf-btn cvf-btn-primary" onClick={handleSubmit} disabled={!instruction.trim()}>
              Submit Proposal
            </button>
            <button className="cvf-btn cvf-btn-outline" onClick={() => { setInstruction(""); setSubmitted(false) }}>
              Clear
            </button>
          </div>

          {submitted && (
            <div style={{
              padding: "16px",
              background: "var(--cvf-success-bg)",
              border: "1px solid var(--cvf-success)",
              borderRadius: "var(--cvf-radius-sm)",
              color: "var(--cvf-success)",
              fontSize: "14px",
            }}>
              ✓ Proposal submitted successfully — entering pipeline for review.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}