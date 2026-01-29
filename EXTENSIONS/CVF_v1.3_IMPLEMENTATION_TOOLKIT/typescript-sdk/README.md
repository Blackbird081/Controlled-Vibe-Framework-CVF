# CVF TypeScript SDK

TypeScript/JavaScript SDK for the Controlled Vibe Framework (CVF).

## Installation

```bash
npm install @cvf/sdk
# or
yarn add @cvf/sdk
```

## Quick Start

```typescript
import { 
  SkillRegistry, 
  validateContract, 
  loadContract,
  AuditTracer 
} from '@cvf/sdk';

// Load a contract
const contract = loadContract('./my_skill.contract.yaml');

// Validate
const result = validateContract(contract);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
  process.exit(1);
}

// Register
const registry = new SkillRegistry();
const capability = registry.register(contract, 'my-team');

// Transition to ACTIVE
registry.transition(capability.capability_id, 'APPROVED');
registry.transition(capability.capability_id, 'ACTIVE');

// Check execution permission
if (registry.canExecute(capability.capability_id, 'Execution', 'C')) {
  console.log('Ready to execute!');
}
```

## API Reference

### Types

```typescript
type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3';
type CapabilityState = 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';
type Archetype = 'Analysis' | 'Execution' | 'Orchestration';
type Phase = 'A' | 'B' | 'C' | 'D';
```

### SkillRegistry

```typescript
const registry = new SkillRegistry();

// Register a contract
registry.register(contract, owner);

// Get capability
const cap = registry.get('CODE_REVIEW_v1');

// List capabilities with filters
const active = registry.list({ state: 'ACTIVE' });
const r1Caps = registry.list({ risk_level: 'R1' });

// Transition state
registry.transition('CODE_REVIEW_v1', 'ACTIVE');

// Check execution permission
registry.canExecute('CODE_REVIEW_v1', 'Execution', 'C');

// Deprecate
registry.deprecate('OLD_SKILL_v1', 'Replaced by NEW_SKILL_v2');

// Export/Import
const data = registry.export();
registry.import(data);

// Stats
registry.stats();
```

### Validation

```typescript
import { validateContract, validateInputs } from '@cvf/sdk';

// Validate contract structure
const result = validateContract(contract);
// { valid: boolean, errors: string[], warnings: string[] }

// Validate inputs against contract
const inputResult = validateInputs(contract, { code: '...', language: 'python' });
```

### Contract Loading

```typescript
import { loadContract, parseContract, loadContractsFromDir } from '@cvf/sdk';

// Load from file
const contract = loadContract('./path/to/contract.yaml');

// Parse from string
const contract2 = parseContract(`
  capability_id: MY_SKILL_v1
  domain: development
  ...
`);

// Load all from directory
const contracts = loadContractsFromDir('./contracts/');
```

### Audit Tracer

```typescript
import { AuditTracer } from '@cvf/sdk';

const tracer = new AuditTracer();

// Log execution
tracer.log(contract, 'claude_adapter', inputs, result);

// Query logs
tracer.getLogsFor('CODE_REVIEW_v1');
tracer.getRecent(50);
tracer.getFailures();

// Stats
tracer.getStats();

// Export
const logs = tracer.export();
```

## Building

```bash
npm install
npm run build
```

## Testing

```bash
npm test
```

## License

MIT
