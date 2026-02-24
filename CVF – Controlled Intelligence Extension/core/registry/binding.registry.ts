export interface Binding {
  skillName: string
  role: string
}

const bindings: Binding[] = []

export function registerBinding(binding: Binding): void {
  bindings.push(binding)
}

export function getBindingsForRole(role: string): Binding[] {
  return bindings.filter(b => b.role === role)
}