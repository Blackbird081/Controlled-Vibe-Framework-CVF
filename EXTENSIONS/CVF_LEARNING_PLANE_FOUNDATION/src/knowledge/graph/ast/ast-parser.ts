import ts from "typescript";
import {
  createGraphEdge,
  createGraphNode,
  type GraphEdge,
  type GraphNode,
} from "../schema/graph-schema";

export interface ParsedGraphAst {
  filePath: string;
  symbols: readonly GraphNode[];
  dependencies: readonly GraphEdge[];
}

function lineOf(sourceFile: ts.SourceFile, position: number): number {
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
}

function namedNodeText(node: ts.Node): string | undefined {
  const maybeNamed = node as ts.Node & { name?: ts.Node };
  if (maybeNamed.name && ts.isIdentifier(maybeNamed.name)) {
    return maybeNamed.name.text;
  }
  return undefined;
}

export function parseFileToAST(filePath: string, source: string): ParsedGraphAst {
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const fileNode = createGraphNode({
    kind: "file",
    name: filePath,
    filePath,
    line: 1,
    confidence: "high",
  });
  const symbols: GraphNode[] = [fileNode];
  const dependencies: GraphEdge[] = [];
  const symbolStack: GraphNode[] = [fileNode];

  function addDeclaration(node: ts.Node, kind: GraphNode["kind"], fallback?: string): GraphNode {
    const name = namedNodeText(node) ?? fallback ?? `${kind}_${lineOf(sourceFile, node.getStart(sourceFile))}`;
    const graphNode = createGraphNode({
      kind,
      name,
      filePath,
      line: lineOf(sourceFile, node.getStart(sourceFile)),
      confidence: "high",
    });
    symbols.push(graphNode);
    dependencies.push(createGraphEdge({
      kind: "declares",
      from: fileNode.id,
      to: graphNode.id,
      confidence: "high",
    }));
    return graphNode;
  }

  function visit(node: ts.Node): void {
    let pushed = false;

    if (ts.isFunctionDeclaration(node)) {
      symbolStack.push(addDeclaration(node, "function"));
      pushed = true;
    } else if (ts.isClassDeclaration(node)) {
      symbolStack.push(addDeclaration(node, "class"));
      pushed = true;
    } else if (ts.isInterfaceDeclaration(node)) {
      addDeclaration(node, "interface");
    } else if (ts.isMethodDeclaration(node)) {
      symbolStack.push(addDeclaration(node, "method"));
      pushed = true;
    } else if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleNode = createGraphNode({
        kind: "module",
        name: node.moduleSpecifier.text,
        filePath,
        line: lineOf(sourceFile, node.getStart(sourceFile)),
        confidence: "medium",
      });
      symbols.push(moduleNode);
      dependencies.push(createGraphEdge({
        kind: "imports",
        from: fileNode.id,
        to: moduleNode.id,
        confidence: "medium",
      }));
    } else if (ts.isExportDeclaration(node)) {
      dependencies.push(createGraphEdge({
        kind: "exports",
        from: fileNode.id,
        to: fileNode.id,
        confidence: "medium",
      }));
    } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const caller = symbolStack[symbolStack.length - 1] ?? fileNode;
      const callee = createGraphNode({
        kind: "function",
        name: node.expression.text,
        filePath,
        line: lineOf(sourceFile, node.getStart(sourceFile)),
        confidence: "low",
      });
      symbols.push(callee);
      dependencies.push(createGraphEdge({
        kind: "calls",
        from: caller.id,
        to: callee.id,
        confidence: "low",
      }));
    }

    ts.forEachChild(node, visit);

    if (pushed) {
      symbolStack.pop();
    }
  }

  visit(sourceFile);

  return {
    filePath,
    symbols,
    dependencies,
  };
}

export function extractSymbols(ast: ParsedGraphAst): readonly GraphNode[] {
  return ast.symbols;
}

export function extractDependencies(ast: ParsedGraphAst): readonly GraphEdge[] {
  return ast.dependencies;
}
