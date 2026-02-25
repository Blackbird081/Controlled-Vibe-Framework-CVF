export let sandboxEnabled = false

export function enableSandbox() {
  sandboxEnabled = true
}

export function disableSandbox() {
  sandboxEnabled = false
}

export function isSandbox(): boolean {
  return sandboxEnabled
}