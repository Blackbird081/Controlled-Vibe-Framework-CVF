# CVF W7 Windows PowerShell Command Reference

> **Document Type:** REFERENCE APPENDIX
> **Status:** Curated from `Windows_Skill_Normalization` materials on 2026-04-12
> **Source Quality:** internal_design_draft
> **Scope:** Windows-native operator reference for common shell-command equivalences
> **Scope Boundary:** This appendix is a convenience reference only. It does not represent CVF Command Runtime translation logic or override existing shell/tool safety rules.

## 1. Purpose

This appendix provides common Bash-to-PowerShell equivalences that are useful when normalizing Windows-oriented skills or reviewing environment mismatch.

## 2. Common Equivalences

| Bash / Unix pattern | PowerShell reference |
| --- | --- |
| `ls -la` | `Get-ChildItem -Force` |
| `grep` | `Select-String` |
| `cat` | `Get-Content` |
| `mkdir -p` | `New-Item -ItemType Directory -Force` |
| `pwd` | `Get-Location` |
| `cp` | `Copy-Item` |
| `mv` | `Move-Item` |
| `rm` | `Remove-Item` |
| `export VAR=value` | `$env:VAR=\"value\"` |
| `.sh` script | `.ps1` script |

## 3. Important Limits

These mappings are contextual.

They do not mean:

- every Bash command can be translated mechanically
- CVF will auto-rewrite shell logic for runtime execution
- aliases are always safe or semantically identical

## 4. Final Rule

Use this appendix as a normalization and review aid only.

Do not treat it as runtime doctrine.
