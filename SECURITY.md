# Security

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC SECURITY CONTACT SUMMARY

Do not report secrets through public issues.

## Purpose

Set the public security and secret-handling posture for CVF users and
contributors.

## Scope

This file covers public reporting posture and secret-handling rules. It does
not publish private security contacts, provider keys, or internal incident
process records.

## Claim Boundary

CVF public security guidance does not make the repository a hosted security
service. Operators remain responsible for their provider accounts, local
environment, and private disclosure channel.

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
