import fs from "node:fs/promises";
import path from "node:path";
import * as ts from "typescript";
import { parseExportedNames } from "./ui-storybook-targets.mjs";

const toPascalCase = (value) =>
  value
    .split("-")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join("");

const unwrapExpression = (expression) => {
  let current = expression;
  while (current) {
    if (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) {
      current = current.expression;
      continue;
    }
    break;
  }
  return current;
};

const propNameFromNode = (nameNode) => {
  if (!nameNode) return null;
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) return nameNode.text;
  return null;
};

const nodeToLiteralValue = (node, sourceText) => {
  const unwrapped = unwrapExpression(node);
  if (ts.isStringLiteral(unwrapped)) return unwrapped.text;
  if (ts.isNoSubstitutionTemplateLiteral(unwrapped)) return unwrapped.text;
  if (ts.isNumericLiteral(unwrapped)) return Number(unwrapped.text);
  if (unwrapped.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (unwrapped.kind === ts.SyntaxKind.FalseKeyword) return false;
  return sourceText.slice(unwrapped.pos, unwrapped.end).trim();
};

const parseOptionsFromTypeNode = (typeNode) => {
  if (!typeNode || !ts.isUnionTypeNode(typeNode)) return null;
  const values = [];
  for (const part of typeNode.types) {
    if (part.kind === ts.SyntaxKind.NullKeyword || part.kind === ts.SyntaxKind.UndefinedKeyword) continue;
    if (ts.isLiteralTypeNode(part)) {
      const literal = part.literal;
      if (ts.isStringLiteral(literal)) values.push(literal.text);
      else if (ts.isNumericLiteral(literal)) values.push(Number(literal.text));
      else if (literal.kind === ts.SyntaxKind.TrueKeyword) values.push(true);
      else if (literal.kind === ts.SyntaxKind.FalseKeyword) values.push(false);
      else return null;
      continue;
    }
    return null;
  }
  if (values.length < 2) return null;
  return values;
};

const collectTypeAliasOptionMap = (sourceFile) => {
  const aliasMap = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) continue;
    if (!ts.isIdentifier(statement.name)) continue;
    const options = parseOptionsFromTypeNode(statement.type);
    if (!options || options.length < 2) continue;
    aliasMap.set(statement.name.text, options);
  }

  return aliasMap;
};

const parsePrimitiveKind = (typeNode) => {
  if (!typeNode) return "unknown";
  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) return "boolean";
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return "number";
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) return "string";
  return "unknown";
};

const collectPropMetaFromMembers = (members, aliasOptionMap = new Map()) => {
  const map = new Map();
  for (const member of members) {
    if (!ts.isPropertySignature(member)) continue;
    const propName = propNameFromNode(member.name);
    if (!propName) continue;
    let options = parseOptionsFromTypeNode(member.type);
    if (!options && member.type && ts.isTypeReferenceNode(member.type) && ts.isIdentifier(member.type.typeName)) {
      options = aliasOptionMap.get(member.type.typeName.text) ?? null;
    }
    const primitive = parsePrimitiveKind(member.type);
    map.set(propName, { options, primitive });
  }
  return map;
};

const pickBestPropsNode = (componentName, sourceFile) => {
  const candidates = [];
  const aliasOptionMap = collectTypeAliasOptionMap(sourceFile);

  for (const statement of sourceFile.statements) {
    const exported = Boolean(statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
    if (!exported) continue;

    if (ts.isInterfaceDeclaration(statement) && statement.name.text.endsWith("Props")) {
      const fields = collectPropMetaFromMembers(statement.members, aliasOptionMap);
      candidates.push({ name: statement.name.text, fields });
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement) && statement.name.text.endsWith("Props") && ts.isTypeLiteralNode(statement.type)) {
      const fields = collectPropMetaFromMembers(statement.type.members, aliasOptionMap);
      candidates.push({ name: statement.name.text, fields });
    }
  }

  if (candidates.length === 0) return null;

  const scored = candidates.map((candidate) => {
    let score = candidate.fields.size;
    if (candidate.name === `${componentName}Props`) score += 1000;
    else if (candidate.name.startsWith(componentName)) score += 500;
    return { candidate, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].candidate;
};

const parseDefaultsFromConstants = (sourceFile, sourceText) => {
  const defaults = {};

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const exported = Boolean(statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
    if (!exported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (!declaration.name.text.endsWith("_DEFAULTS")) continue;
      if (!declaration.initializer) continue;

      const expression = unwrapExpression(declaration.initializer);
      if (!ts.isObjectLiteralExpression(expression)) continue;

      for (const property of expression.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = propNameFromNode(property.name);
        if (!key) continue;
        defaults[key] = nodeToLiteralValue(property.initializer, sourceText);
      }
    }
  }

  return defaults;
};

const collectFilesBySuffix = async (dirPath, suffix) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
};

export const loadUiStorybookMetadata = async (rootDir) => {
  const componentsIndexPath = path.join(rootDir, "packages/ui/components/index.ts");
  const componentsDir = path.join(rootDir, "packages/ui/components");
  const indexSource = await fs.readFile(componentsIndexPath, "utf8");
  const componentNames = parseExportedNames(indexSource);

  const metadata = {};

  for (const componentName of componentNames) {
    const dirName = componentName
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const dirPath = path.join(componentsDir, dirName);

    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    const typeFiles = await collectFilesBySuffix(dirPath, ".types.ts");
    const constantsFiles = await collectFilesBySuffix(dirPath, ".constants.ts");

    const propMeta = new Map();
    for (const filePath of typeFiles) {
      const sourceText = await fs.readFile(filePath, "utf8");
      const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      const selected = pickBestPropsNode(componentName, sourceFile);
      if (!selected) continue;
      for (const [key, value] of selected.fields.entries()) {
        if (!propMeta.has(key)) propMeta.set(key, value);
      }
    }

    const defaults = {};
    for (const filePath of constantsFiles) {
      const sourceText = await fs.readFile(filePath, "utf8");
      const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      Object.assign(defaults, parseDefaultsFromConstants(sourceFile, sourceText));
    }

    const options = {};
    const stringProps = [];
    const booleanProps = [];
    const numberProps = [];

    for (const [propName, meta] of propMeta.entries()) {
      if (meta.options && meta.options.length > 0) options[propName] = meta.options;
      if (meta.primitive === "string") stringProps.push(propName);
      if (meta.primitive === "boolean") booleanProps.push(propName);
      if (meta.primitive === "number") numberProps.push(propName);
    }

    metadata[componentName] = {
      dirName: toPascalCase(dirName),
      defaults,
      options,
      stringProps,
      booleanProps,
      numberProps
    };
  }

  return metadata;
};
