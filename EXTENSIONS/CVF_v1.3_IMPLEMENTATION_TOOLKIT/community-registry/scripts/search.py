#!/usr/bin/env python3
"""
Search CVF Community Registry

Usage:
    python search.py <query>
    python search.py --domain development
    python search.py --risk R1
    python search.py --tags code,review
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Optional


def load_index() -> dict:
    """Load the registry index."""
    index_path = Path(__file__).parent.parent / "REGISTRY_INDEX.json"
    with open(index_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def search_contracts(
    query: Optional[str] = None,
    domain: Optional[str] = None,
    risk: Optional[str] = None,
    tags: Optional[list] = None
) -> list:
    """Search contracts by various criteria."""
    index = load_index()
    results = index.get("contracts", [])
    
    # Filter by domain
    if domain:
        results = [c for c in results if c.get("domain") == domain]
    
    # Filter by risk level
    if risk:
        results = [c for c in results if c.get("risk_level") == risk.upper()]
    
    # Filter by tags
    if tags:
        results = [
            c for c in results 
            if any(tag in c.get("tags", []) for tag in tags)
        ]
    
    # Filter by query (searches id, description, tags)
    if query:
        query_lower = query.lower()
        results = [
            c for c in results
            if (query_lower in c.get("capability_id", "").lower() or
                query_lower in c.get("description", "").lower() or
                any(query_lower in tag for tag in c.get("tags", [])))
        ]
    
    return results


def format_result(contract: dict) -> str:
    """Format a single contract result."""
    risk_colors = {
        "R0": "\033[92m",  # Green
        "R1": "\033[94m",  # Blue
        "R2": "\033[93m",  # Yellow
        "R3": "\033[91m",  # Red
    }
    reset = "\033[0m"
    
    risk = contract.get("risk_level", "?")
    color = risk_colors.get(risk, "")
    
    return f"""
{color}[{risk}]{reset} {contract.get('capability_id', 'Unknown')}
    Domain: {contract.get('domain', '?')}
    Description: {contract.get('description', 'No description')}
    Tags: {', '.join(contract.get('tags', []))}
    Path: {contract.get('path', '?')}
"""


def main():
    parser = argparse.ArgumentParser(description="Search CVF Community Registry")
    parser.add_argument("query", nargs="?", help="Search query")
    parser.add_argument("--domain", "-d", help="Filter by domain")
    parser.add_argument("--risk", "-r", help="Filter by risk level (R0-R3)")
    parser.add_argument("--tags", "-t", help="Filter by tags (comma-separated)")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    
    tags = args.tags.split(",") if args.tags else None
    
    results = search_contracts(
        query=args.query,
        domain=args.domain,
        risk=args.risk,
        tags=tags
    )
    
    if args.json:
        print(json.dumps(results, indent=2))
        return
    
    if not results:
        print("No contracts found matching your criteria.")
        return
    
    print(f"\n📋 Found {len(results)} contract(s):\n")
    for contract in results:
        print(format_result(contract))
    
    # Show summary
    print("-" * 50)
    domains = set(c.get("domain") for c in results)
    risks = set(c.get("risk_level") for c in results)
    print(f"Domains: {', '.join(domains)}")
    print(f"Risk levels: {', '.join(sorted(risks))}")


if __name__ == "__main__":
    main()
