import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';

// Diagnostic collection for validation errors
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('CVF Contracts extension activated');

    // Create diagnostic collection
    diagnosticCollection = vscode.languages.createDiagnosticCollection('cvf-contract');
    context.subscriptions.push(diagnosticCollection);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cvf.validate', validateCurrentContract),
        vscode.commands.registerCommand('cvf.lint', lintCurrentContract),
        vscode.commands.registerCommand('cvf.createContract', createNewContract)
    );

    // Validate on save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (isContractFile(document.fileName)) {
                const config = vscode.workspace.getConfiguration('cvf');
                if (config.get('validateOnSave', true)) {
                    validateDocument(document);
                }
            }
        })
    );

    // Validate on open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (isContractFile(document.fileName)) {
                validateDocument(document);
            }
        })
    );

    // Provide hover information
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('cvf-contract', {
            provideHover(document, position) {
                return provideContractHover(document, position);
            }
        })
    );

    // Validate already open documents
    vscode.workspace.textDocuments.forEach((document) => {
        if (isContractFile(document.fileName)) {
            validateDocument(document);
        }
    });
}

function isContractFile(fileName: string): boolean {
    return fileName.endsWith('.contract.yaml') || fileName.endsWith('.contract.yml');
}

async function validateCurrentContract() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isContractFile(editor.document.fileName)) {
        vscode.window.showWarningMessage('No CVF contract file is currently open');
        return;
    }

    const diagnostics = await validateDocument(editor.document);
    if (diagnostics.length === 0) {
        vscode.window.showInformationMessage('✅ Contract is valid');
    } else {
        vscode.window.showErrorMessage(`❌ Contract has ${diagnostics.length} issue(s)`);
    }
}

async function lintCurrentContract() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isContractFile(editor.document.fileName)) {
        vscode.window.showWarningMessage('No CVF contract file is currently open');
        return;
    }

    const diagnostics = lintDocument(editor.document);
    diagnosticCollection.set(editor.document.uri, diagnostics);

    if (diagnostics.length === 0) {
        vscode.window.showInformationMessage('✅ No lint issues found');
    } else {
        vscode.window.showWarningMessage(`⚠️ Found ${diagnostics.length} lint issue(s)`);
    }
}

async function createNewContract() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter capability name (e.g., CODE_REVIEW)',
        placeHolder: 'CAPABILITY_NAME'
    });

    if (!name) { return; }

    const riskLevel = await vscode.window.showQuickPick(['R0', 'R1', 'R2', 'R3'], {
        placeHolder: 'Select risk level'
    });

    if (!riskLevel) { return; }

    const domain = await vscode.window.showInputBox({
        prompt: 'Enter domain (e.g., development, data, devops)',
        placeHolder: 'domain'
    });

    if (!domain) { return; }

    const template = generateContractTemplate(name, riskLevel, domain);

    const uri = await vscode.window.showSaveDialog({
        filters: { 'CVF Contract': ['contract.yaml'] },
        defaultUri: vscode.Uri.file(`${name.toLowerCase()}.contract.yaml`)
    });

    if (uri) {
        fs.writeFileSync(uri.fsPath, template);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
    }
}

function generateContractTemplate(name: string, riskLevel: string, domain: string): string {
    return `# ${name} Capability
# Domain: ${domain}
# Risk: ${riskLevel}

capability_id: "${name}_v1"
domain: "${domain}"
description: "TODO: Add description"
risk_level: "${riskLevel}"
version: "1.0"

governance:
  allowed_archetypes:
    - "Execution"
  allowed_phases:
    - "C"
  required_decisions: []
  required_status: "ACTIVE"

input_spec:
  - name: "input_name"
    type: "string"
    required: true

output_spec:
  - name: "result"
    type: "string"
    success_criteria: "TODO: Define success criteria"

execution:
  side_effects: false
  rollback_possible: true
  idempotent: true

audit:
  trace_level: "Full"
  required_fields:
    - "timestamp"
    - "actor"
    - "inputs"
    - "outputs"
`;
}

function validateDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    try {
        const contract = yaml.parse(text);

        // Required fields validation
        const requiredFields = ['capability_id', 'domain', 'description', 'risk_level', 'version', 'governance', 'input_spec', 'output_spec', 'execution', 'audit'];

        for (const field of requiredFields) {
            if (!(field in contract)) {
                const range = new vscode.Range(0, 0, 0, 1);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Missing required field: ${field}`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Risk level validation
        if (contract.risk_level && !['R0', 'R1', 'R2', 'R3'].includes(contract.risk_level)) {
            const line = findLineContaining(document, 'risk_level');
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 100),
                `Invalid risk level: ${contract.risk_level}. Expected R0, R1, R2, or R3`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Governance validation
        if (contract.governance) {
            if (contract.governance.allowed_archetypes) {
                const validArchetypes = ['Analysis', 'Decision', 'Planning', 'Execution', 'Supervisor', 'Exploration'];
                for (const archetype of contract.governance.allowed_archetypes) {
                    if (!validArchetypes.includes(archetype)) {
                        const line = findLineContaining(document, archetype);
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(line, 0, line, 100),
                            `Invalid archetype: ${archetype}. Valid: ${validArchetypes.join(', ')}`,
                            vscode.DiagnosticSeverity.Error
                        ));
                    }
                }
            }

            if (contract.governance.allowed_phases) {
                for (const phase of contract.governance.allowed_phases) {
                    if (!['A', 'B', 'C', 'D'].includes(phase)) {
                        const line = findLineContaining(document, `"${phase}"`);
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(line, 0, line, 100),
                            `Invalid phase: ${phase}. Expected A, B, C, or D`,
                            vscode.DiagnosticSeverity.Error
                        ));
                    }
                }
            }
        }

        // Check R2/R3 has required decisions
        if ((contract.risk_level === 'R2' || contract.risk_level === 'R3') &&
            (!contract.governance?.required_decisions || contract.governance.required_decisions.length === 0)) {
            const line = findLineContaining(document, 'risk_level');
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 100),
                `Risk level ${contract.risk_level} requires at least one required_decision in governance`,
                vscode.DiagnosticSeverity.Warning
            ));
        }

        // Input/Output spec validation
        if (contract.input_spec && Array.isArray(contract.input_spec)) {
            for (const input of contract.input_spec) {
                if (!input.name || !input.type) {
                    const line = findLineContaining(document, 'input_spec');
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(line, 0, line, 100),
                        'Input field must have name and type',
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }

        if (contract.output_spec && Array.isArray(contract.output_spec)) {
            for (const output of contract.output_spec) {
                if (!output.name || !output.type) {
                    const line = findLineContaining(document, 'output_spec');
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(line, 0, line, 100),
                        'Output field must have name and type',
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }

    } catch (e: any) {
        // YAML parse error
        diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 1),
            `YAML parse error: ${e.message}`,
            vscode.DiagnosticSeverity.Error
        ));
    }

    diagnosticCollection.set(document.uri, diagnostics);
    return diagnostics;
}

function lintDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    try {
        const contract = yaml.parse(text);

        // Lint: Description too short
        if (contract.description && contract.description.length < 20) {
            const line = findLineContaining(document, 'description');
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 100),
                'Description is too short. Consider adding more detail.',
                vscode.DiagnosticSeverity.Information
            ));
        }

        // Lint: No success_criteria in outputs
        if (contract.output_spec && Array.isArray(contract.output_spec)) {
            for (const output of contract.output_spec) {
                if (!output.success_criteria) {
                    const line = findLineContaining(document, `name: "${output.name}"`);
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(line, 0, line, 100),
                        `Output "${output.name}" has no success_criteria defined`,
                        vscode.DiagnosticSeverity.Hint
                    ));
                }
            }
        }

        // Lint: R3 without failure_info
        if (contract.risk_level === 'R3' && !contract.failure_info) {
            const line = findLineContaining(document, 'risk_level');
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 100),
                'R3 risk level should include failure_info section',
                vscode.DiagnosticSeverity.Warning
            ));
        }

        // Lint: side_effects true but rollback_possible false
        if (contract.execution?.side_effects === true && contract.execution?.rollback_possible === false) {
            const line = findLineContaining(document, 'side_effects');
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 100),
                'Consider if rollback is truly impossible when side_effects is true',
                vscode.DiagnosticSeverity.Information
            ));
        }

    } catch (e) {
        // Ignore parse errors in lint
    }

    return diagnostics;
}

function findLineContaining(document: vscode.TextDocument, text: string): number {
    for (let i = 0; i < document.lineCount; i++) {
        if (document.lineAt(i).text.includes(text)) {
            return i;
        }
    }
    return 0;
}

function provideContractHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const line = document.lineAt(position.line).text;
    const word = document.getText(document.getWordRangeAtPosition(position));

    const hoverInfo: { [key: string]: string } = {
        'capability_id': '**Capability ID**\n\nUnique identifier for this capability. Format: `NAME_vX`\n\n⚠️ This ID is immutable - never change it after creation.',
        'risk_level': '**Risk Level**\n\n- **R0**: Passive - No side effects\n- **R1**: Controlled - Small bounded effects\n- **R2**: Elevated - Has authority, may chain\n- **R3**: Critical - System changes, human approval required',
        'governance': '**Governance Constraints**\n\nDefines who can use this capability and under what conditions.',
        'allowed_archetypes': '**Allowed Archetypes**\n\nWhich agent archetypes can use this capability:\n- Analysis, Decision, Planning, Execution, Supervisor, Exploration',
        'allowed_phases': '**Allowed Phases**\n\nProject phases where this capability is valid:\n- A: Discovery\n- B: Blueprint\n- C: Construct\n- D: Deliver',
        'input_spec': '**Input Specification**\n\nDefines the inputs this capability accepts.\n\nRequired fields: `name`, `type`, `required`',
        'output_spec': '**Output Specification**\n\nDefines the outputs this capability produces.\n\nRecommended: Include `success_criteria` for each output.',
        'side_effects': '**Side Effects**\n\n- `true`: This capability modifies external state\n- `false`: Read-only, no external changes',
        'trace_level': '**Trace Level**\n\n- `Full`: Log all inputs, outputs, and metadata\n- `Minimal`: Log only essential information',
        'R0': '**R0 - Passive**\n\n✅ No side effects\n📋 Required controls: Logging',
        'R1': '**R1 - Controlled**\n\n⚙️ Small, bounded side effects\n📋 Required controls: Logging, Scope Guard',
        'R2': '**R2 - Elevated**\n\n⚠️ Has authority, may chain with other capabilities\n📋 Required controls: Logging, Scope Guard, Explicit Approval, Audit',
        'R3': '**R3 - Critical**\n\n🚨 System changes, external impact\n📋 Required controls: All + Hard Gate + Human-in-the-loop',
    };

    if (hoverInfo[word]) {
        return new vscode.Hover(new vscode.MarkdownString(hoverInfo[word]));
    }

    return undefined;
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
