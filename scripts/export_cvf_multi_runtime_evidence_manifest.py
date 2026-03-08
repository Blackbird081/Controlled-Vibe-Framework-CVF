#!/usr/bin/env python3
"""Export a multi-runtime remediation evidence manifest for the current CVF local baseline."""

from __future__ import annotations

import argparse

from runtime_evidence_manifest.baselines import emit_family_baseline
from runtime_evidence_manifest.common import rel, resolve_repo_path, write_json, write_text
from runtime_evidence_manifest.fixtures import DEFAULT_MANIFEST_JSON, DEFAULT_MANIFEST_MD, EMITTED_RUNTIME_FAMILIES, RUNTIME_FAMILY_CONFIG, RUNTIME_FAMILY_ORDER
from runtime_evidence_manifest.manifest_builder import build_manifest, build_manifest_log


def main() -> int:
    parser = argparse.ArgumentParser(description="Export a multi-runtime remediation evidence manifest.")
    for runtime_family in RUNTIME_FAMILY_ORDER:
        config = RUNTIME_FAMILY_CONFIG[runtime_family]
        parser.add_argument(
            f"--{config['cliKey']}-artifact",
            default=str(config["defaultArtifact"]),
            help=f"Canonical {config['versionToken']} artifact path",
        )
        parser.add_argument(
            f"--{config['cliKey']}-log",
            default=str(config["defaultLog"]),
            help=f"Canonical {config['versionToken']} markdown log path",
        )
    parser.add_argument("--manifest-json", default=str(DEFAULT_MANIFEST_JSON), help="Output multi-runtime manifest JSON path")
    parser.add_argument("--manifest-log", default=str(DEFAULT_MANIFEST_MD), help="Output multi-runtime manifest markdown path")
    args = parser.parse_args()

    family_paths = {
        runtime_family: {
            "artifact": resolve_repo_path(getattr(args, f"{RUNTIME_FAMILY_CONFIG[runtime_family]['cliKey']}_artifact")),
            "log": resolve_repo_path(getattr(args, f"{RUNTIME_FAMILY_CONFIG[runtime_family]['cliKey']}_log")),
        }
        for runtime_family in RUNTIME_FAMILY_ORDER
    }
    manifest_json = resolve_repo_path(args.manifest_json)
    manifest_log = resolve_repo_path(args.manifest_log)

    for runtime_family in RUNTIME_FAMILY_ORDER:
        emit_family_baseline(runtime_family, family_paths[runtime_family]["artifact"], family_paths[runtime_family]["log"])

    manifest = build_manifest(family_paths, manifest_log)
    write_json(manifest_json, manifest)
    write_text(manifest_log, build_manifest_log(manifest, manifest_json))

    for runtime_family in EMITTED_RUNTIME_FAMILIES:
        config = RUNTIME_FAMILY_CONFIG[runtime_family]
        print(f"Exported {config['printLabel']} artifact: {rel(family_paths[runtime_family]['artifact'])}")
        print(f"Exported {config['printLabel']} log: {rel(family_paths[runtime_family]['log'])}")
    print(f"Exported multi-runtime evidence manifest: {rel(manifest_json)}")
    print(f"Exported multi-runtime evidence log: {rel(manifest_log)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
