#!/usr/bin/env python3
"""Retired bulk skill intake entry point kept for callers of the old CLI."""

import argparse


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bulk external skill intake is retired. Use the candidate-specific process in "
        "governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md."
    )
    parser.parse_known_args()
    parser.exit(2, f"{parser.description}\n")


if __name__ == "__main__":
    main()
