# CI/CD Integration Templates

This directory contains templates for integrating CVF contract validation
into your CI/CD pipeline.

## GitHub Actions

### Setup

1. Copy `github_actions/cvf-validate.yml` to your repository's `.github/workflows/` directory

2. The workflow will automatically:
   - Run on any push that modifies `.contract.yaml` files
   - Validate all contracts in `EXTENSIONS/examples/`
   - Report results in the GitHub Actions summary

### Customization

Edit the workflow to:
- Change the path to your contracts directory
- Add additional validation steps
- Configure notifications

## Pre-commit Hooks

### Setup

1. Install pre-commit:
   ```bash
   pip install pre-commit
   ```

2. Copy `.pre-commit-config.yaml` to your repository root

3. Install the hooks:
   ```bash
   pre-commit install
   ```

### Usage

Pre-commit will automatically validate contracts before each commit:

```bash
# Manual run
pre-commit run --all-files

# Run specific hook
pre-commit run cvf-validate --all-files
```

## Manual Integration

You can also integrate CVF validation directly into your build scripts:

```bash
# Validate all contracts
python cli/cvf_validate.py validate --all path/to/contracts/

# Check registry
python cli/cvf_validate.py check-registry registry.json

# Lint for style issues
python cli/cvf_validate.py lint path/to/contracts/
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All validations passed |
| 1 | One or more validations failed |

## Best Practices

1. **Require validation on PRs**: Block merging if contracts are invalid
2. **Run on all contract changes**: Use path filters efficiently
3. **Include lint checks**: Catch style issues early
4. **Add to CI/CD pipeline**: Validate before deployment
