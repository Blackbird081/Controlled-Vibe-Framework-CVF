"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuditTracer: () => AuditTracer,
  SkillRegistry: () => SkillRegistry,
  VERSION: () => VERSION,
  loadContract: () => loadContract,
  loadContractsFromDir: () => loadContractsFromDir,
  parseContract: () => parseContract,
  parseYaml: () => import_yaml2.parse,
  stringifyYaml: () => import_yaml2.stringify,
  validateContract: () => validateContract,
  validateInputs: () => validateInputs
});
module.exports = __toCommonJS(index_exports);

// src/validator.ts
var VALID_RISK_LEVELS = ["R0", "R1", "R2", "R3", "R4"];
var VALID_ARCHETYPES = ["Analysis", "Execution", "Orchestration"];
var VALID_PHASES = ["A", "B", "C", "D"];
var VALID_STATES = ["PROPOSED", "APPROVED", "ACTIVE", "DEPRECATED", "RETIRED"];
var VALID_TRACE_LEVELS = ["Minimal", "Standard", "Full"];
function validateContract(contract) {
  const errors = [];
  const warnings = [];
  const requiredFields = [
    "capability_id",
    "domain",
    "description",
    "risk_level",
    "version",
    "governance",
    "input_spec",
    "output_spec",
    "execution",
    "audit"
  ];
  for (const field of requiredFields) {
    if (!(field in contract) || contract[field] === void 0) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (contract.capability_id) {
    if (!/^[A-Z][A-Z0-9_]*_v\d+$/.test(contract.capability_id)) {
      warnings.push(
        `capability_id should follow format: NAME_v1 (e.g., CODE_REVIEW_v1)`
      );
    }
  }
  if (contract.risk_level && !VALID_RISK_LEVELS.includes(contract.risk_level)) {
    errors.push(`Invalid risk_level: ${contract.risk_level}. Must be one of: ${VALID_RISK_LEVELS.join(", ")}`);
  }
  if (contract.governance) {
    const gov = contract.governance;
    if (!gov.allowed_archetypes || gov.allowed_archetypes.length === 0) {
      errors.push("governance.allowed_archetypes must have at least 1 item");
    } else {
      for (const archetype of gov.allowed_archetypes) {
        if (!VALID_ARCHETYPES.includes(archetype)) {
          errors.push(`Invalid archetype: ${archetype}`);
        }
      }
    }
    if (!gov.allowed_phases || gov.allowed_phases.length === 0) {
      errors.push("governance.allowed_phases must have at least 1 item");
    } else {
      for (const phase of gov.allowed_phases) {
        if (!VALID_PHASES.includes(phase)) {
          errors.push(`Invalid phase: ${phase}`);
        }
      }
    }
    if (gov.required_status && !VALID_STATES.includes(gov.required_status)) {
      errors.push(`Invalid governance.required_status: ${gov.required_status}`);
    }
  }
  if (contract.input_spec) {
    if (!Array.isArray(contract.input_spec) || contract.input_spec.length === 0) {
      errors.push("input_spec must be a non-empty array");
    } else {
      contract.input_spec.forEach((field, idx) => {
        if (!field.name) errors.push(`input_spec[${idx}]: missing 'name'`);
        if (!field.type) errors.push(`input_spec[${idx}]: missing 'type'`);
      });
    }
  }
  if (contract.output_spec) {
    if (!Array.isArray(contract.output_spec) || contract.output_spec.length === 0) {
      errors.push("output_spec must be a non-empty array");
    } else {
      contract.output_spec.forEach((field, idx) => {
        if (!field.name) errors.push(`output_spec[${idx}]: missing 'name'`);
        if (!field.type) errors.push(`output_spec[${idx}]: missing 'type'`);
      });
    }
  }
  if (contract.execution) {
    const exec = contract.execution;
    if (typeof exec.side_effects !== "boolean") {
      errors.push("execution.side_effects must be a boolean");
    }
    if (typeof exec.rollback_possible !== "boolean") {
      errors.push("execution.rollback_possible must be a boolean");
    }
    if (typeof exec.idempotent !== "boolean") {
      errors.push("execution.idempotent must be a boolean");
    }
  }
  if (contract.audit) {
    const audit = contract.audit;
    if (audit.trace_level && !VALID_TRACE_LEVELS.includes(audit.trace_level)) {
      errors.push(`Invalid audit.trace_level: ${audit.trace_level}`);
    }
    if (!audit.required_fields || audit.required_fields.length === 0) {
      warnings.push("audit.required_fields should not be empty");
    }
  }
  if (contract.risk_level === "R2" || contract.risk_level === "R3" || contract.risk_level === "R4") {
    if (!contract.failure_info) {
      warnings.push(`${contract.risk_level} contracts should have failure_info section`);
    }
  }
  if (contract.risk_level === "R3" || contract.risk_level === "R4") {
    if (!contract.governance?.required_decisions || contract.governance.required_decisions.length === 0) {
      warnings.push(`${contract.risk_level} contracts should have required_decisions`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function validateInputs(contract, inputs) {
  const errors = [];
  const warnings = [];
  for (const spec of contract.input_spec) {
    const value = inputs[spec.name];
    if (spec.required !== false && value === void 0 && spec.default === void 0) {
      errors.push(`Missing required input: ${spec.name}`);
      continue;
    }
    if (value !== void 0) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      const expectedType = spec.type.toLowerCase();
      if (expectedType !== "any" && actualType !== expectedType) {
        if (!(expectedType === "integer" && actualType === "number")) {
          errors.push(
            `Input '${spec.name}': expected ${spec.type}, got ${actualType}`
          );
        }
      }
      if (spec.enum && !spec.enum.includes(value)) {
        errors.push(
          `Input '${spec.name}': must be one of: ${spec.enum.join(", ")}`
        );
      }
      if (spec.max_length && typeof value === "string" && value.length > spec.max_length) {
        errors.push(
          `Input '${spec.name}': exceeds max_length of ${spec.max_length}`
        );
      }
      if (spec.range && typeof value === "number") {
        const [min, max] = spec.range;
        if (value < min || value > max) {
          errors.push(
            `Input '${spec.name}': must be between ${min} and ${max}`
          );
        }
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// src/registry.ts
var SkillRegistry = class {
  capabilities = /* @__PURE__ */ new Map();
  stateTransitions = /* @__PURE__ */ new Map([
    ["PROPOSED", ["APPROVED"]],
    ["APPROVED", ["ACTIVE"]],
    ["ACTIVE", ["DEPRECATED"]],
    ["DEPRECATED", ["RETIRED", "ACTIVE"]],
    ["RETIRED", []]
  ]);
  /**
   * Register a new capability
   */
  register(contract, owner) {
    const validation = validateContract(contract);
    if (!validation.valid) {
      throw new Error(`Invalid contract: ${validation.errors.join(", ")}`);
    }
    if (this.capabilities.has(contract.capability_id)) {
      throw new Error(`Capability already exists: ${contract.capability_id}`);
    }
    const capability = {
      ...contract,
      state: "PROPOSED",
      owner,
      registered_by: owner,
      registered_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.capabilities.set(contract.capability_id, capability);
    return capability;
  }
  /**
   * Get a capability by ID
   */
  get(capabilityId) {
    return this.capabilities.get(capabilityId);
  }
  /**
   * List all capabilities
   */
  list(options) {
    let results = Array.from(this.capabilities.values());
    if (options?.domain) {
      results = results.filter((c) => c.domain === options.domain);
    }
    if (options?.risk_level) {
      results = results.filter((c) => c.risk_level === options.risk_level);
    }
    if (options?.state) {
      results = results.filter((c) => c.state === options.state);
    }
    if (options?.archetype) {
      results = results.filter(
        (c) => c.governance.allowed_archetypes.includes(options.archetype)
      );
    }
    if (options?.phase) {
      results = results.filter(
        (c) => c.governance.allowed_phases.includes(options.phase)
      );
    }
    return results;
  }
  /**
   * Transition capability to new state
   */
  transition(capabilityId, newState, actor) {
    const capability = this.capabilities.get(capabilityId);
    if (!capability) {
      throw new Error(`Capability not found: ${capabilityId}`);
    }
    const allowedTransitions = this.stateTransitions.get(capability.state) || [];
    if (!allowedTransitions.includes(newState)) {
      throw new Error(
        `Invalid transition: ${capability.state} -> ${newState}. Allowed: ${allowedTransitions.join(", ") || "none"}`
      );
    }
    capability.state = newState;
    capability.last_audit = (/* @__PURE__ */ new Date()).toISOString();
    return capability;
  }
  /**
   * Check if capability can be executed
   */
  canExecute(capabilityId, archetype, phase) {
    const capability = this.capabilities.get(capabilityId);
    if (!capability) return false;
    if (capability.state !== "ACTIVE") return false;
    if (!capability.governance.allowed_archetypes.includes(archetype)) {
      return false;
    }
    if (!capability.governance.allowed_phases.includes(phase)) {
      return false;
    }
    return true;
  }
  /**
   * Deprecate a capability
   */
  deprecate(capabilityId, reason) {
    const capability = this.transition(capabilityId, "DEPRECATED");
    capability.deprecation_reason = reason;
    return capability;
  }
  /**
   * Export registry to JSON
   */
  export() {
    return {
      version: "1.0",
      exported_at: (/* @__PURE__ */ new Date()).toISOString(),
      capabilities: Array.from(this.capabilities.values())
    };
  }
  /**
   * Import capabilities from JSON
   */
  import(data) {
    for (const capability of data.capabilities) {
      this.capabilities.set(capability.capability_id, capability);
    }
  }
  /**
   * Get registry stats
   */
  stats() {
    const capabilities = Array.from(this.capabilities.values());
    return {
      total: capabilities.length,
      active: capabilities.filter((c) => c.state === "ACTIVE").length,
      proposed: capabilities.filter((c) => c.state === "PROPOSED").length,
      deprecated: capabilities.filter((c) => c.state === "DEPRECATED").length,
      retired: capabilities.filter((c) => c.state === "RETIRED").length,
      r0: capabilities.filter((c) => c.risk_level === "R0").length,
      r1: capabilities.filter((c) => c.risk_level === "R1").length,
      r2: capabilities.filter((c) => c.risk_level === "R2").length,
      r3: capabilities.filter((c) => c.risk_level === "R3").length
    };
  }
};

// src/loader.ts
var import_yaml = require("yaml");
var import_fs = require("fs");
function loadContract(path) {
  if (!(0, import_fs.existsSync)(path)) {
    throw new Error(`Contract file not found: ${path}`);
  }
  const content = (0, import_fs.readFileSync)(path, "utf-8");
  return (0, import_yaml.parse)(content);
}
function parseContract(yamlContent) {
  return (0, import_yaml.parse)(yamlContent);
}
function loadContractsFromDir(dirPath) {
  const { readdirSync, statSync } = require("fs");
  const { join } = require("path");
  const contracts = [];
  function walkDir(dir) {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith(".contract.yaml") || file.endsWith(".contract.yml")) {
        try {
          contracts.push(loadContract(fullPath));
        } catch (e) {
          console.warn(`Failed to load contract: ${fullPath}`, e);
        }
      }
    }
  }
  walkDir(dirPath);
  return contracts;
}

// src/audit.ts
function generateId() {
  return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
var AuditTracer = class {
  logs = [];
  maxLogs;
  constructor(maxLogs = 1e4) {
    this.maxLogs = maxLogs;
  }
  /**
   * Log an execution
   */
  log(contract, actor, inputs, result) {
    const entry = {
      id: generateId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      capability_id: contract.capability_id,
      version: contract.version,
      actor,
      inputs: this.sanitizeInputs(inputs, contract),
      outputs: result.success ? result.outputs : null,
      success: result.success,
      error: result.error,
      duration_ms: result.duration_ms
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    return entry;
  }
  /**
   * Sanitize inputs based on trace level
   */
  sanitizeInputs(inputs, contract) {
    if (contract.audit.trace_level === "Minimal") {
      const sanitized = {};
      for (const field of contract.audit.required_fields) {
        if (field in inputs) {
          sanitized[field] = inputs[field];
        }
      }
      return sanitized;
    }
    if (contract.audit.trace_level === "Standard") {
      const sensitiveFields = ["password", "token", "secret", "key", "api_key"];
      const sanitized = { ...inputs };
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = "[REDACTED]";
        }
      }
      return sanitized;
    }
    return inputs;
  }
  /**
   * Get logs for a capability
   */
  getLogsFor(capabilityId, limit = 100) {
    return this.logs.filter((log) => log.capability_id === capabilityId).slice(-limit);
  }
  /**
   * Get recent logs
   */
  getRecent(limit = 100) {
    return this.logs.slice(-limit);
  }
  /**
   * Get failed executions
   */
  getFailures(limit = 100) {
    return this.logs.filter((log) => !log.success).slice(-limit);
  }
  /**
   * Get stats
   */
  getStats() {
    const total = this.logs.length;
    const successful = this.logs.filter((l) => l.success).length;
    const avgDuration = total > 0 ? this.logs.reduce((sum, l) => sum + l.duration_ms, 0) / total : 0;
    return {
      total_executions: total,
      successful,
      failed: total - successful,
      success_rate: total > 0 ? `${(successful / total * 100).toFixed(1)}%` : "0%",
      avg_duration_ms: Math.round(avgDuration)
    };
  }
  /**
   * Export logs
   */
  export() {
    return [...this.logs];
  }
  /**
   * Clear logs
   */
  clear() {
    this.logs = [];
  }
};

// src/index.ts
var import_yaml2 = require("yaml");
var VERSION = "1.3.0";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuditTracer,
  SkillRegistry,
  VERSION,
  loadContract,
  loadContractsFromDir,
  parseContract,
  parseYaml,
  stringifyYaml,
  validateContract,
  validateInputs
});
