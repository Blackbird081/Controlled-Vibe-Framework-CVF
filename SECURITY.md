# Security

Status: CURRENT PUBLIC SECURITY CONTACT SUMMARY

Do not report secrets through public issues.

## Purpose

Set the public security reporting and secret-handling posture for CVF users and
contributors.

## Scope

This file covers vulnerability reporting, secret handling, and disclosure
boundaries for the public CVF repository. It does not publish provider keys,
private incident records, or internal operator contact details.

## Supported Reporting Channel

Use GitHub's private vulnerability reporting flow for this repository when
available:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/security/advisories/new`

If that flow is unavailable, open a public issue titled `Security contact
request` with no exploit details, no secrets, no logs, and no vulnerable
payloads. Ask the maintainer to provide a private channel.

Expected first response target: 48 hours.

## What To Include

Include only safe metadata in the first private report:

- affected repository and path;
- affected version, commit, or branch when known;
- vulnerability class and impact summary;
- minimal reproduction steps with secrets redacted;
- whether active exploitation is suspected.

## Secret Handling

Never commit:

- provider API keys;
- `.env` or `.env.local`;
- local runtime state;
- private tokens;
- browser traces containing sensitive payloads.

Use environment variables for live provider keys. Evidence files must redact raw
key values.

## Claim Boundary

CVF public security guidance creates a reporting path and disclosure discipline.
It does not make the repository a hosted security service, does not prove
production readiness, and does not authorize publication of private
vulnerability details.
