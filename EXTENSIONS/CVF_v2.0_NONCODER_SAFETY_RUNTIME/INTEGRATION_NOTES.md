# CVF v2.0 — Integration Notes

## 1. Relationship with Existing Layers

| Existing CVF Component | v2.0 Relationship |
|-----------------------|-------------------|
| v1.7.2 Safety Dashboard | v2.0 extends — adds interactive mode selection, not read-only |
| v1.7.3 Runtime Adapter Hub | v2.0 uses — Intent Interpreter uses adapter contracts |
| v1.8 Control Kernel | v2.0 wraps — Mode Abstraction maps to kernel policies |
| v1.9 Execution Records | v2.0 surfaces — Non-coder sees: "Completed" / "Rolled back" |

## 2. Does NOT Bypass the Kernel

The central design principle:
```
v2.0 is an interface. Not a shortcut.
All executions still go through the full v1.8+v1.9 kernel pipeline.
```

## 3. Creative Mode (Important)

The SAFE/BALANCED/CREATIVE definitions in `CREATIVE_MODE_SPEC.md` are **authoritative** (per ADR-010).
v1.7.1 Creative Control layer documentation is superseded by this spec for definition purposes.
v1.7.1 code implementation remains the production Creative Control — this spec defines target behavior.

## 4. Governance Guards Triggered

- ✅ Architecture Check Guard: COMPAT completed (ADR-010)
- ✅ ADR Guard: ADR-010 covers v2.0 placement decision
- → Test Guard: required when v2.0 UI code is implemented
- → Bug Guard: standard for any implementation bugs

## 5. Compat Gate

```bash
python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD
```
