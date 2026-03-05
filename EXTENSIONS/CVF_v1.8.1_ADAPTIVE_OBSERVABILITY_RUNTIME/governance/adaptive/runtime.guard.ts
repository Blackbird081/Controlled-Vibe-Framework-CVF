import { computeRisk } from './risk.engine'
import { derivePolicy } from './policy.deriver'

export async function runtimeGuard(context, metrics) {
  const risk = computeRisk(metrics)
  const action = derivePolicy(risk.value)

  switch (action) {
    case 'block':
      throw new Error('Execution blocked due to high risk score')

    case 'throttle':
      context.maxTokens = Math.min(context.maxTokens, 1024)
      break

    case 'strict_mode':
      context.validationLevel = 'strict'
      break
  }

  return context
}