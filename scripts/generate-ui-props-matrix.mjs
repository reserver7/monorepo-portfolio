#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";

const repoRoot = process.cwd();
const componentsDir = path.join(repoRoot, "packages/ui/components");
const componentsIndexPath = path.join(componentsDir, "index.ts");
const outputPath = path.join(repoRoot, "packages/ui/COMPONENT_PROPS_MATRIX.md");

const toPascalCase = (value) =>
  value
    .split("-")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join("");

const readText = (filePath) => fs.readFileSync(filePath, "utf8");

const toSourceFile = (filePath) =>
  ts.createSourceFile(filePath, readText(filePath), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const isNodeExported = (node) => Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));

const propNameFromNode = (nameNode) => {
  if (!nameNode) return null;
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) return nameNode.text;
  return null;
};

const collectFieldsFromMembers = (members) => {
  const fields = [];
  for (const member of members) {
    if (!ts.isPropertySignature(member)) continue;
    const propName = propNameFromNode(member.name);
    if (!propName) continue;
    fields.push(`${propName}${member.questionToken ? "?" : ""}`);
  }
  return fields;
};

const collectFieldsFromTypeNode = (typeNode) => {
  if (!typeNode) return [];

  if (ts.isTypeLiteralNode(typeNode)) {
    return collectFieldsFromMembers(typeNode.members);
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    const set = new Set();
    for (const inner of typeNode.types) {
      for (const field of collectFieldsFromTypeNode(inner)) {
        set.add(field);
      }
    }
    return [...set];
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return collectFieldsFromTypeNode(typeNode.type);
  }

  return [];
};

const parsePublicComponentDirs = () => {
  if (!fs.existsSync(componentsIndexPath)) return [];
  const sourceFile = toSourceFile(componentsIndexPath);
  const componentDirs = new Set();

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;
    if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;

    const modulePath = statement.moduleSpecifier.text;
    if (!modulePath.startsWith("./")) continue;

    const dirName = modulePath.slice(2);
    const expectedComponentName = toPascalCase(dirName);
    const exportedValueNames = statement.exportClause.elements
      .filter((element) => !element.isTypeOnly)
      .map((element) => element.name.text);

    if (exportedValueNames.includes(expectedComponentName)) {
      componentDirs.add(dirName);
    }
  }

  return [...componentDirs].sort((a, b) => a.localeCompare(b));
};

const parsePropsCandidates = (typesFilePath) => {
  const sourceFile = toSourceFile(typesFilePath);
  const candidates = [];

  for (const statement of sourceFile.statements) {
    if (!isNodeExported(statement)) continue;

    if (ts.isInterfaceDeclaration(statement) && statement.name.text.endsWith("Props")) {
      candidates.push({
        propsName: statement.name.text,
        fields: collectFieldsFromMembers(statement.members),
        sourceFileName: path.basename(typesFilePath)
      });
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement) && statement.name.text.endsWith("Props")) {
      candidates.push({
        propsName: statement.name.text,
        fields: collectFieldsFromTypeNode(statement.type),
        sourceFileName: path.basename(typesFilePath)
      });
    }
  }

  return candidates;
};

const selectPropsCandidate = (componentName, candidates) => {
  if (candidates.length === 0) {
    return { propsName: `${componentName}Props`, fields: [], sourceFileName: "-" };
  }

  const withScore = candidates.map((candidate) => {
    const name = candidate.propsName;
    const lcName = name.toLowerCase();
    const lcComponent = componentName.toLowerCase();
    let score = candidate.fields.length;

    if (name === `${componentName}Props`) score += 1000;
    else if (name.startsWith(componentName)) score += 500;
    else if (lcName.includes(lcComponent)) score += 200;
    else if (name.endsWith("ContentProps")) score += 100;

    return { candidate, score };
  });

  withScore.sort((a, b) => b.score - a.score);
  return withScore[0].candidate;
};

const unwrapExpression = (expression) => {
  let current = expression;
  while (current) {
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isAsExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isSatisfiesExpression(current)) {
      current = current.expression;
      continue;
    }
    break;
  }
  return current;
};

const parseDefaults = (constantsFilePath) => {
  const sourceText = readText(constantsFilePath);
  const sourceFile = ts.createSourceFile(constantsFilePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const entries = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || !isNodeExported(statement)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;

      const constName = declaration.name.text;
      if (!constName.endsWith("_DEFAULTS")) continue;
      if (!declaration.initializer) continue;

      const unwrapped = unwrapExpression(declaration.initializer);
      if (!unwrapped || !ts.isObjectLiteralExpression(unwrapped)) continue;

      for (const property of unwrapped.properties) {
        if (ts.isPropertyAssignment(property)) {
          const key = propNameFromNode(property.name);
          if (!key) continue;
          const value = sourceText.slice(property.initializer.pos, property.initializer.end).trim();
          entries.push(`${constName}.${key}=${value}`);
          continue;
        }
        if (ts.isShorthandPropertyAssignment(property)) {
          const key = property.name.text;
          entries.push(`${constName}.${key}=${key}`);
        }
      }
    }
  }

  return entries;
};

const getFilesBySuffix = (dirPath, suffix) =>
  fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith(suffix))
    .map((name) => path.join(dirPath, name))
    .sort((a, b) => a.localeCompare(b));

const componentDirs = parsePublicComponentDirs();
const rows = [];

for (const componentDirName of componentDirs) {
  const dirPath = path.join(componentsDir, componentDirName);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) continue;

  const componentName = toPascalCase(componentDirName);
  const typeFiles = getFilesBySuffix(dirPath, ".types.ts");
  const constantsFiles = getFilesBySuffix(dirPath, ".constants.ts");

  const allCandidates = typeFiles.flatMap((filePath) => parsePropsCandidates(filePath));
  const selected = selectPropsCandidate(componentName, allCandidates);

  const defaults = constantsFiles.flatMap((filePath) => parseDefaults(filePath));

  rows.push({
    componentName,
    dirPath: `packages/ui/components/${componentDirName}`,
    typesFile: selected.sourceFileName,
    propsName: selected.propsName,
    fields: selected.fields,
    defaults
  });
}

rows.sort((a, b) => a.componentName.localeCompare(b.componentName));

const lines = [
  "# UI Component Props Matrix",
  "",
  "Generated by `scripts/generate-ui-props-matrix.mjs`.",
  "",
  `Generated at: ${new Date().toISOString()}`,
  "",
  "| Component | Directory | Types File | Props Type | Key Props | Defaults |",
  "| --- | --- | --- | --- | --- | --- |"
];

for (const row of rows) {
  const keyProps = row.fields.length > 0 ? `\`${row.fields.join("`, `")}\`` : "-";
  const defaults = row.defaults.length > 0 ? `\`${row.defaults.join("`, `")}\`` : "-";
  lines.push(
    `| ${row.componentName} | \`${row.dirPath}\` | \`${row.typesFile}\` | \`${row.propsName}\` | ${keyProps} | ${defaults} |`
  );
}

lines.push("");
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`generated: ${outputPath}`);
