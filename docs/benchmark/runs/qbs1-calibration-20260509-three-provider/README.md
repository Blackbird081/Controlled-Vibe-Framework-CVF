# QBS-1 Calibration Pilot: Three Provider Run

Status: `CALIBRATION_PILOT_PASS_NO_PUBLIC_QBS_SCORE`

Run ID: `qbs1-calibration-20260509-three-provider`

Pre-registration tag:
`qbs/preregister/qbs1-calibration-20260509-three-provider-r5`

Date: 2026-05-09

Providers:

- Alibaba / DashScope: `qwen-turbo`
- DeepSeek: `deepseek-chat`
- OpenAI: `gpt-4o-mini`

## Result

The calibration pilot passed as runner and artifact proof:

- 3 calibration tasks
- 3 configurations: `CFG-A0`, `CFG-A1`, `CFG-B`
- 3 provider lanes
- 27/27 configuration executions returned usable results
- `CFG-B` governed receipt completeness: pass
- secret scan: pass
- mock fallback detection: clean

Primary artifacts:

- [Aggregate Results](aggregate-results.json)
- [Run Manifest](run-manifest.json)
- [Corpus Manifest](corpus-manifest.json)
- [Config Prompt Manifest](config-prompt-manifest.json)
- [Hard Gate Results](hard-gate-results.json)
- [Claim Statement](claim-statement.md)
- [Limitations](limitations.md)

## Boundary

This run is a calibration pilot, not a scored QBS benchmark. It proves the
QBS-1 runner can execute the configured direct-model, neutral-control, and
governed-CVF paths across three live provider lanes and produce the required
public artifacts without leaking secrets.

It does not establish a public CVF quality score, a powered effect-size claim,
a family-level quality claim, or parity across all providers and models.
