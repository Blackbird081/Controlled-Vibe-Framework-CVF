# Redaction And Key Safety

CVF treats key redaction as part of governance.

Public rule:

- real provider keys are supplied by environment variables
- raw key values must not be printed, committed, or stored in evidence
- fake-key positive tests may be used to prove redaction paths without exposing a real key

Known public test boundary:

- unit-level redaction probes cover process output and persisted job state in the provenance record
- renewed public repo must run hosted live-gate proof after environment secrets are configured

