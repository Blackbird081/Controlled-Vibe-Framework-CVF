# Working with skills and templates

## Start with the result

Choose a [template on Home](/home) to write a specification. Describe your goal, supply the relevant inputs and constraints, and say what an acceptable result would look like. Download the specification and share it with the agent responsible for the work.

## Browse packages for agents

The [skill library](/skills) lists packages for agents and describes their limits. Check the scope of each package and use the review checks applicable to your work. Some entries have a different certification or availability status.

For example, if you need a weekly sales summary, specify the date range, the source file and the columns or totals you want to check. The specification helps the receiving agent judge what information it needs and gives you details to verify before accepting the result.

## Adding a package

First establish a recurring need and check whether the agent already has the capability. Reuse the original source with a tracked adapter; keep provenance and dependencies visible. A new package needs the applicable ASSF certification and a test agreed before running it. Update the suggestion test when the catalog changes. The Local owners decide admission; listing a package does not grant permission to run it.

## Prepare a reusable package

1. State the recurring job, its inputs, expected output and intended users. Give a realistic input and expected result.
2. Record prerequisites, scope, risk floor, authority and execution boundaries, and where the agent must stop. Preserve the original source and track the adapter and dependencies.
3. Include checks for completeness, quality, missing inputs and common failure recovery. Define a reviewable test before running it; obtain the applicable ASSF certification before admission.
4. Version changes, validate them with the existing tools and publish them only through the authorized process. Re-run the Jev suggestion test when the catalog changes.

For example, a weekly sales summary should identify the date range, approved source file, totals to calculate, required output format and how to verify the totals. If the source is missing or outside the permitted scope, the agent should ask rather than invent data.
