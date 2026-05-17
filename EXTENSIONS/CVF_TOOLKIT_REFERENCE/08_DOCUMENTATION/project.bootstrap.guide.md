# Project Bootstrap Guide

This guide explains how to start a new AI project using CVF Toolkit.

---

## 1. Create Project Folder

Import CVF-TOOLKIT as core module.

---

## 2. Decide Domain Extension

Options:
- Financial
- Logistics
- Legal
- Custom

Create extension under:
04_EXTENSION_LAYER/

---

## 3. Register Skill Pack

Example:

registerFinancialSkills()

---

## 4. Define Risk Model

Map domain risk to CVF risk levels.

---

## 5. Configure AI Provider

Allow user to paste API key.

---

## 6. Connect Workflow

Use adapters, never bypass governance.

---

## 7. Run UAT Before Production

Mandatory for MEDIUM and above.

---

## 8. Freeze Production Version

If HIGH or CRITICAL.

---

## 9. Tag Version

Follow version.policy.md
