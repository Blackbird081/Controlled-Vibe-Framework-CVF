import { detectPII } from "./pii.detector"
import { detectSecrets } from "./secret.detector"
import { precheckInjection } from "./injection.precheck"
import { VaultStore } from "./vault.store"
import { rehydrateResponse } from "./rehydrator"
import { logSecurityEvent } from "./security.audit.log"
import { defaultEdgeSecurityConfig } from "./edge.config"

export class SecurityProxy {
  private vault = new VaultStore()

  processRequest(sessionId: string, input: string) {
    this.vault.createSession(sessionId)

    const pii = detectPII(input)
    const secrets = detectSecrets(input)
    const injection = precheckInjection(input)

    let maskedInput = input

    const allSensitive = [...pii, ...secrets]
    const uniqueSensitiveValues = Array.from(new Set(allSensitive.map(item => item.value)))

    uniqueSensitiveValues.forEach((value, index) => {
      const token = `${defaultEdgeSecurityConfig.maskingTokenPrefix}_${index}`
      maskedInput = maskedInput.split(value).join(token)
      this.vault.add(sessionId, {
        original: value,
        masked: token
      })
    })

    logSecurityEvent({
      sessionId,
      timestamp: Date.now(),
      piiCount: pii.length,
      secretCount: secrets.length,
      injectionScore: injection.score
    })

    return {
      maskedInput,
      injection
    }
  }

  processResponse(sessionId: string, response: string) {
    const entries = this.vault.get(sessionId)
    const rehydrated = rehydrateResponse(response, entries)
    this.vault.clear(sessionId)
    return rehydrated
  }
}
