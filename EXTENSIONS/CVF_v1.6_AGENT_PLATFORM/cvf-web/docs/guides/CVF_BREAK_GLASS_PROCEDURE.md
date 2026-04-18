# CVF Break-Glass Procedure

## Conditions

- Break-glass is reserved for owner-level emergency access when normal admin authentication is unavailable and delaying access would materially increase operational or security risk.
- Typical triggers include SSO outage, expired admin session during an incident bridge, or urgent audit export / policy inspection required for containment.
- Break-glass must not be used for convenience, routine admin work, or impersonation flows.

## Procedure

1. Confirm the incident requires immediate owner access and that standard admin login is blocked or unsafe to wait for.
2. Obtain the current `CVF_BREAK_GLASS_TOKEN` from the approved operations secret store.
3. Send the token in the `x-cvf-break-glass` request header to the required admin page or admin API route.
4. Complete only the minimum emergency action required to stabilize the incident.
5. Monitor audit logs for `BREAK_GLASS_USED` and treat any use as an R3 security event.
6. Rotate `CVF_BREAK_GLASS_TOKEN` immediately after the emergency action is complete.

## Post-Incident

- Record why break-glass was needed, which routes were accessed, and what actions were taken.
- Verify token rotation is complete and confirm no active impersonation session was started during the event.
- Review emitted audit events and export signed CSV evidence if the incident requires compliance or CISO review.
