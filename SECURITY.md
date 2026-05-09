# Security

Do not report secrets through public issues.

## Secret Handling

Never commit:

- provider API keys
- `.env` or `.env.local`
- local runtime state
- private tokens
- browser traces containing sensitive payloads

Use environment variables for live provider keys. Evidence files must redact raw
key values.

## Supported Reporting Channel

Use the operator-defined private security channel until a public security
mailbox is published.

Expected first response target: 48 hours.

