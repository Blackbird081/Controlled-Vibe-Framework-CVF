// role.graph.ts
// ⚠️ Source of truth cho AgentRole enum là role.types.ts
// File này chỉ re-export để backward compatibility với các file đang import từ đây.
// AllowedTransitions đã được chuyển về transition.validator.ts (single source of truth)

export { AgentRole } from "./role.types"