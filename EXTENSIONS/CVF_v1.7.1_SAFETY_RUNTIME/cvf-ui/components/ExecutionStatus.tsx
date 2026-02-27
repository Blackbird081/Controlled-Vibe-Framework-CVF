"use client"

interface Props {
  status: string
}

export default function ExecutionStatus({ status }: Props) {
  return (
    <div>
      <strong>Execution Status:</strong> {status}
    </div>
  )
}
