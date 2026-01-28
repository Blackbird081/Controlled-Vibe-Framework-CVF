#!/usr/bin/env python3
"""
CVF Validate CLI

Command-line tool for validating CVF Skill Contracts.

Usage:
    python cvf_validate.py validate <contract_path>
    python cvf_validate.py check-registry <registry_path>
    python cvf_validate.py lint <directory>
"""

import argparse
import sys
from pathlib import Path

# Add SDK to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sdk.registry.validators import ContractValidator, RegistryValidator


def validate_contract(path: str, verbose: bool = False) -> int:
    """Validate a single contract file"""
    validator = ContractValidator()
    result = validator.validate(Path(path))
    
    if result.is_valid:
        print(f"✅ {path}: VALID")
        if verbose and result.warnings:
            for warning in result.warnings:
                print(f"   ⚠️  {warning}")
        return 0
    else:
        print(f"❌ {path}: INVALID")
        for error in result.errors:
            print(f"   ❌ {error}")
        if result.warnings:
            for warning in result.warnings:
                print(f"   ⚠️  {warning}")
        return 1


def validate_directory(directory: str, verbose: bool = False) -> int:
    """Validate all contracts in a directory"""
    dir_path = Path(directory)
    if not dir_path.is_dir():
        print(f"Error: {directory} is not a directory")
        return 1
    
    # Find all YAML files
    yaml_files = list(dir_path.rglob("*.contract.yaml"))
    yaml_files.extend(dir_path.rglob("*.contract.yml"))
    
    if not yaml_files:
        print(f"No contract files found in {directory}")
        return 0
    
    print(f"Found {len(yaml_files)} contract file(s)")
    print()
    
    errors = 0
    for yaml_file in yaml_files:
        result = validate_contract(str(yaml_file), verbose)
        errors += result
    
    print()
    if errors == 0:
        print(f"✅ All {len(yaml_files)} contracts are valid")
    else:
        print(f"❌ {errors} contract(s) have errors")
    
    return 1 if errors > 0 else 0


def check_registry(path: str, verbose: bool = False) -> int:
    """Check registry consistency"""
    validator = RegistryValidator()
    result = validator.validate_registry(Path(path))
    
    if result.is_valid:
        print(f"✅ Registry: VALID")
        if verbose and result.warnings:
            for warning in result.warnings:
                print(f"   ⚠️  {warning}")
        return 0
    else:
        print(f"❌ Registry: INVALID")
        for error in result.errors:
            print(f"   ❌ {error}")
        return 1


def lint_contracts(directory: str) -> int:
    """Lint contracts for style issues"""
    dir_path = Path(directory)
    
    yaml_files = list(dir_path.rglob("*.contract.yaml"))
    yaml_files.extend(dir_path.rglob("*.contract.yml"))
    
    if not yaml_files:
        print(f"No contract files found in {directory}")
        return 0
    
    validator = ContractValidator()
    total_warnings = 0
    
    for yaml_file in yaml_files:
        result = validator.validate(yaml_file)
        if result.warnings:
            print(f"⚠️  {yaml_file}")
            for warning in result.warnings:
                print(f"   └─ {warning}")
                total_warnings += 1
    
    if total_warnings == 0:
        print(f"✅ No style issues found in {len(yaml_files)} contract(s)")
    else:
        print()
        print(f"⚠️  Found {total_warnings} warning(s)")
    
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="CVF Contract Validation Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s validate my_skill.contract.yaml
  %(prog)s validate --all contracts/
  %(prog)s check-registry registry.json
  %(prog)s lint contracts/
        """,
    )
    
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Show warnings and detailed output",
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # validate command
    validate_parser = subparsers.add_parser(
        "validate",
        help="Validate contract file(s)",
    )
    validate_parser.add_argument(
        "path",
        help="Contract file or directory",
    )
    validate_parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Validate all contracts in directory",
    )
    
    # check-registry command
    registry_parser = subparsers.add_parser(
        "check-registry",
        help="Check registry consistency",
    )
    registry_parser.add_argument(
        "path",
        help="Registry JSON file",
    )
    
    # lint command
    lint_parser = subparsers.add_parser(
        "lint",
        help="Lint contracts for style issues",
    )
    lint_parser.add_argument(
        "directory",
        help="Directory containing contracts",
    )
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 0
    
    if args.command == "validate":
        path = Path(args.path)
        if path.is_dir() or args.all:
            return validate_directory(args.path, args.verbose)
        else:
            return validate_contract(args.path, args.verbose)
    
    elif args.command == "check-registry":
        return check_registry(args.path, args.verbose)
    
    elif args.command == "lint":
        return lint_contracts(args.directory)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
