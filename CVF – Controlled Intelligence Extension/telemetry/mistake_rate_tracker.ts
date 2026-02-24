let totalActions = 0
let mistakes = 0

export function recordAction(): void {
  totalActions++
}

export function recordMistake(): void {
  mistakes++
}

export function getMistakeRate(): number {
  if (totalActions === 0) return 0
  return mistakes / totalActions
}