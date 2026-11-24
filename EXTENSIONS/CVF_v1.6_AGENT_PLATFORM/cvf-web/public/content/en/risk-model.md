# Risk model

CVF uses R0–R3 to describe increasing risk. R4 is a blocked outcome and never runs. Missing information is treated as R3. Risk can rise as more information becomes available; a lower declared level cannot reduce the effective level.

| Level | Meaning | Example |
| --- | --- | --- |
| R0 | Passive, with no external effect | Reading or formatting supplied text |
| R1 | Small, bounded and reversible work | A local change within an agreed scope |
| R2 | Elevated impact or authority | A change involving an external API, security or governance behavior |
| R3 | High impact, uncertainty or difficulty reversing the effect | Destructive changes or insufficient information to judge risk |
| R4 | Blocked | Never execute |

Risk depends on the actual work, not the feature name. The effective level considers the content, the applicable certified minimum and any higher declared level. The server determines it. A phase, role or template does not itself grant permission; the current phase, role, risk and applicable rules determine authority. R1 does not automatically require approval. Higher-risk work follows its applicable controls and approval boundaries.

Before handing work to an agent, identify the data, possible external effects and reversibility. Review what the agent did and any uncertainty before accepting the result. For the connected decisions, see the [work lifecycle](lifecycle.md).

## What to consider

Assess authority, scope expansion, reversibility, interpretability and dependence on external systems. Consider who can see the data and what happens if the action fails. Use the highest applicable risk, including the certified outcome floor, and do not reduce it because a browser declared a lower level.

## Example: an external connection

Identify the service, data to be sent, expected effect, spending limit and who can approve the connection. External API or security work is at least R2; uncertainty may require R3. Review the actual scope and controls before acting.

<!-- Text Encoding Exception: preserves localized reader text and existing navigation symbols. -->
