#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const WORKSPACE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SOURCE_ROOT = join(
  WORKSPACE_ROOT,
  "packages",
  "agent-reliability-lab",
  "src",
);
const DOCKER_SOURCE = "sandbox/docker.ts";
const NETWORK_MODULE_ROOTS = new Set([
  "axios",
  "dgram",
  "dns",
  "got",
  "http",
  "http2",
  "https",
  "net",
  "tls",
  "undici",
]);
const EVALUATION_MODULE_ROOTS = new Set(["module", "vm", "worker_threads"]);
const CHILD_PROCESS_MODULES = new Set(["child_process", "node:child_process"]);
const DYNAMIC_LOADING_MEMBERS = new Set(["createRequire", "getBuiltinModule"]);
const ALLOWED_NODE_MODULE_ROOTS = new Set([
  "child_process",
  "crypto",
  "fs",
  "os",
  "path",
  "timers",
  "url",
  "util",
]);
const CHILD_CALLS = new Set([
  "exec",
  "execFile",
  "execFileSync",
  "execSync",
  "fork",
  "spawn",
  "spawnSync",
]);
const EVALUATION_GLOBALS = new Set([
  "AsyncFunction",
  "Function",
  "GeneratorFunction",
  "eval",
]);

function portablePath(path) {
  return path.split(sep).join("/");
}

async function sourceFiles(root) {
  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Production source tree contains a symlink: ${path}`);
      } else if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        if (!entry.name.endsWith(".ts")) {
          throw new Error(`Production tree contains unsupported runtime source: ${path}`);
        }
        files.push(path);
      } else {
        throw new Error(`Production tree contains unsupported entry: ${path}`);
      }
    }
  }
  await visit(root);
  return files;
}

function importedModule(node) {
  if (
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
    node.moduleSpecifier !== undefined &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    return node.moduleSpecifier.text;
  }
  return undefined;
}

function moduleRoot(specifier) {
  const bare = specifier.startsWith("node:") ? specifier.slice(5) : specifier;
  return bare.split("/")[0] ?? bare;
}

function allowedStaticImport(specifier, sourcePath, sourceRoot) {
  if (specifier === "zod") return true;
  if (specifier.startsWith("node:")) {
    return ALLOWED_NODE_MODULE_ROOTS.has(moduleRoot(specifier));
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    if (!specifier.endsWith(".js")) return false;
    const target = resolve(dirname(sourcePath), specifier);
    const fromRoot = relative(sourceRoot, target);
    return fromRoot !== ".." && !fromRoot.startsWith(`..${sep}`);
  }
  return false;
}

function isInvocationMember(node, member) {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "invocation" &&
    node.name.text === member
  );
}

function isExactDockerSpawn(node, relativePath) {
  if (relativePath !== DOCKER_SOURCE || node.arguments.length !== 3) return false;
  const [executable, args, options] = node.arguments;
  if (
    executable === undefined ||
    args === undefined ||
    options === undefined ||
    !isInvocationMember(executable, "executable") ||
    !ts.isArrayLiteralExpression(args) ||
    args.elements.length !== 1 ||
    !ts.isSpreadElement(args.elements[0]) ||
    !isInvocationMember(args.elements[0].expression, "args") ||
    !ts.isObjectLiteralExpression(options)
  ) {
    return false;
  }
  const shellProperty = options.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) &&
      property.name.getText() === "shell",
  );
  return (
    shellProperty !== undefined &&
    ts.isPropertyAssignment(shellProperty) &&
    isInvocationMember(shellProperty.initializer, "shell")
  );
}

function allowedDockerImport(node, relativePath) {
  if (relativePath !== DOCKER_SOURCE || !ts.isImportDeclaration(node)) {
    return false;
  }
  const clause = node.importClause;
  if (
    clause === undefined ||
    clause.name !== undefined ||
    clause.namedBindings === undefined ||
    !ts.isNamedImports(clause.namedBindings) ||
    clause.namedBindings.elements.length !== 1
  ) {
    return false;
  }
  const imported = clause.namedBindings.elements[0];
  return (
    imported !== undefined &&
    imported.propertyName === undefined &&
    imported.name.text === "spawn"
  );
}

function nodeName(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  return undefined;
}

function computedMemberName(node) {
  return ts.isElementAccessExpression(node) &&
    node.argumentExpression !== undefined &&
    ts.isStringLiteral(node.argumentExpression)
    ? node.argumentExpression.text
    : undefined;
}

function typeReferenceNamed(node, name) {
  return (
    node !== undefined &&
    ts.isTypeReferenceNode(node) &&
    ts.isIdentifier(node.typeName) &&
    node.typeName.text === name
  );
}

function hasFixedDockerExecutableInvariant(sourceFile) {
  const statements = sourceFile.statements;
  const alias = statements.find(
    (node) =>
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === "FixedDockerExecutable",
  );
  if (
    alias === undefined ||
    !ts.isTypeAliasDeclaration(alias) ||
    !ts.isUnionTypeNode(alias.type)
  ) {
    return false;
  }
  const fixedPaths = alias.type.types
    .filter(ts.isLiteralTypeNode)
    .map((node) => node.literal)
    .filter(ts.isStringLiteral)
    .map((node) => node.text)
    .sort();
  if (
    alias.type.types.length !== 2 ||
    fixedPaths.length !== 2 ||
    fixedPaths[0] !== "/usr/bin/docker" ||
    fixedPaths[1] !== "/usr/local/bin/docker"
  ) {
    return false;
  }
  const processInvocation = statements.find(
    (node) =>
      ts.isInterfaceDeclaration(node) &&
      node.name.text === "ProcessInvocation",
  );
  const processExecutable =
    processInvocation !== undefined && ts.isInterfaceDeclaration(processInvocation)
      ? processInvocation.members.find(
          (member) => member.name?.getText(sourceFile) === "executable",
        )
      : undefined;
  if (!typeReferenceNamed(processExecutable?.type, "FixedDockerExecutable")) {
    return false;
  }
  const dockerClass = statements.find(
    (node) =>
      ts.isClassDeclaration(node) && node.name?.text === "DockerSandbox",
  );
  if (dockerClass === undefined || !ts.isClassDeclaration(dockerClass)) {
    return false;
  }
  const classExecutable = dockerClass.members.find(
    (member) => member.name?.getText(sourceFile) === "executable",
  );
  if (!typeReferenceNamed(classExecutable?.type, "FixedDockerExecutable")) {
    return false;
  }
  const constructor = dockerClass.members.find(ts.isConstructorDeclaration);
  if (constructor?.body === undefined) return false;
  let fixedAssignment = false;
  const findAssignment = (node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      node.getText(sourceFile).replace(/\s+/g, "") ===
        "this.executable=dockerExecutableForPlatform(options.platform??process.platform,)"
    ) {
      fixedAssignment = true;
    }
    ts.forEachChild(node, findAssignment);
  };
  findAssignment(constructor.body);
  if (!fixedAssignment) return false;
  const selector = statements.find(
    (node) =>
      ts.isFunctionDeclaration(node) &&
      node.name?.text === "dockerExecutableForPlatform",
  );
  if (
    selector === undefined ||
    !ts.isFunctionDeclaration(selector) ||
    selector.body?.statements.length !== 1 ||
    !ts.isSwitchStatement(selector.body.statements[0])
  ) {
    return false;
  }
  const clauses = selector.body.statements[0].caseBlock.clauses;
  if (clauses.length !== 3) return false;
  const expectedCases = [
    ["darwin", "/usr/local/bin/docker"],
    ["linux", "/usr/bin/docker"],
  ];
  for (let index = 0; index < expectedCases.length; index += 1) {
    const clause = clauses[index];
    const expected = expectedCases[index];
    if (
      clause === undefined ||
      expected === undefined ||
      !ts.isCaseClause(clause) ||
      !ts.isStringLiteral(clause.expression) ||
      clause.expression.text !== expected[0] ||
      clause.statements.length !== 1 ||
      !ts.isReturnStatement(clause.statements[0]) ||
      clause.statements[0].expression === undefined ||
      !ts.isStringLiteral(clause.statements[0].expression) ||
      clause.statements[0].expression.text !== expected[1]
    ) {
      return false;
    }
  }
  const defaultClause = clauses[2];
  return (
    defaultClause !== undefined &&
    ts.isDefaultClause(defaultClause) &&
    defaultClause.statements.length === 1 &&
    ts.isThrowStatement(defaultClause.statements[0])
  );
}

function isAllowedSpawnIdentifier(node, relativePath) {
  if (relativePath !== DOCKER_SOURCE || !ts.isIdentifier(node)) return false;
  const parent = node.parent;
  if (
    ts.isImportSpecifier(parent) &&
    parent.name === node &&
    parent.propertyName === undefined
  ) {
    return true;
  }
  return (
    ts.isCallExpression(parent) &&
    parent.expression === node &&
    isExactDockerSpawn(parent, relativePath)
  );
}

function inspectSource(path, sourceRoot) {
  return readFile(path, "utf8").then((text) => {
    const sourceFile = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const relativePath = portablePath(relative(sourceRoot, path));
    const findings = [];
    let usesDockerChildBoundary = false;
    const report = (node, message) => {
      const location = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      findings.push(
        `${relativePath}:${location.line + 1}:${location.character + 1}: ${message}`,
      );
    };

    for (const diagnostic of sourceFile.parseDiagnostics) {
      const position = diagnostic.start ?? 0;
      const location = sourceFile.getLineAndCharacterOfPosition(position);
      findings.push(
        `${relativePath}:${location.line + 1}:${location.character + 1}: TypeScript parse error: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
      );
    }

    const visit = (node) => {
      const specifier = importedModule(node);
      if (
        specifier !== undefined &&
        !allowedStaticImport(specifier, path, sourceRoot)
      ) {
        report(node, `static host capability import is forbidden: ${specifier}`);
      }
      if (
        specifier !== undefined &&
        NETWORK_MODULE_ROOTS.has(moduleRoot(specifier))
      ) {
        report(node, `host network import is forbidden: ${specifier}`);
      }
      if (
        specifier !== undefined &&
        EVALUATION_MODULE_ROOTS.has(moduleRoot(specifier))
      ) {
        report(node, `dynamic evaluation import is forbidden: ${specifier}`);
      }
      if (
        specifier !== undefined &&
        CHILD_PROCESS_MODULES.has(specifier) &&
        !allowedDockerImport(node, relativePath)
      ) {
        report(
          node,
          "child-process imports are forbidden outside the fixed Docker runner",
        );
      }
      if (
        specifier !== undefined &&
        CHILD_PROCESS_MODULES.has(specifier) &&
        allowedDockerImport(node, relativePath)
      ) {
        usesDockerChildBoundary = true;
      }
      if (ts.isImportEqualsDeclaration(node)) {
        report(node, "dynamic import/module loading is forbidden");
      }
      if (ts.isIdentifier(node) && node.text === "fetch") {
        report(node, "global fetch is forbidden in production source");
      }
      if (ts.isIdentifier(node) && EVALUATION_GLOBALS.has(node.text)) {
        report(node, "dynamic evaluation is forbidden");
      }
      if (ts.isIdentifier(node) && DYNAMIC_LOADING_MEMBERS.has(node.text)) {
        report(node, "dynamic import/module loading is forbidden");
      }
      const computedName = computedMemberName(node);
      if (computedName === "fetch") {
        report(node, "global fetch is forbidden in production source");
      }
      if (
        computedName !== undefined &&
        EVALUATION_GLOBALS.has(computedName)
      ) {
        report(node, "dynamic evaluation is forbidden");
      }
      if (
        (ts.isPropertyAccessExpression(node) && node.name.text === "constructor") ||
        computedName === "constructor"
      ) {
        report(node, "dynamic evaluation through a constructor is forbidden");
      }
      if (
        ((ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "process" &&
          (node.name.text === "binding" || node.name.text === "dlopen")) ||
          (ts.isElementAccessExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === "process" &&
            (computedName === "binding" || computedName === "dlopen")))
      ) {
        report(node, "native loading/execution through process is forbidden");
      }
      if (
        computedName !== undefined &&
        DYNAMIC_LOADING_MEMBERS.has(computedName)
      ) {
        report(node, "dynamic import/module loading is forbidden");
      }
      if (
        relativePath === DOCKER_SOURCE &&
        ts.isIdentifier(node) &&
        node.text === "spawn" &&
        !isAllowedSpawnIdentifier(node, relativePath)
      ) {
        report(node, "child execution must use the one fixed Docker invocation");
      }
      if (
        relativePath === DOCKER_SOURCE &&
        ts.isInterfaceDeclaration(node) &&
        node.name.text === "DockerSandboxOptions"
      ) {
        for (const member of node.members) {
          if (member.name?.getText() === "executable") {
            report(member, "an arbitrary Docker executable option is forbidden");
          }
        }
      }
      if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          report(node, "dynamic import is forbidden");
        }
        const name = nodeName(node.expression);
        if (name === "require" || name === "getBuiltinModule") {
          report(node, "dynamic import/module loading is forbidden");
        }
        if (
          ts.isIdentifier(node.expression) &&
          name !== undefined &&
          CHILD_CALLS.has(name)
        ) {
          if (
            name !== "spawn" ||
            !isExactDockerSpawn(node, relativePath)
          ) {
            report(
              node,
              "child execution must use the one fixed Docker invocation",
            );
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    if (
      usesDockerChildBoundary &&
      !hasFixedDockerExecutableInvariant(sourceFile)
    ) {
      findings.push(
        `${relativePath}:1:1: fixed Docker executable invariant is missing or broadened`,
      );
    }
    return findings;
  });
}

async function main() {
  if (process.argv.length > 3) {
    process.stderr.write("Usage: guard-production-source.mjs [source-root]\n");
    return 2;
  }
  const sourceRoot = resolve(process.argv[2] ?? DEFAULT_SOURCE_ROOT);
  let files;
  try {
    files = await sourceFiles(sourceRoot);
  } catch (error) {
    process.stderr.write(
      `Could not read production source root ${sourceRoot}: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
  if (files.length === 0) {
    process.stderr.write(`No TypeScript production sources found in ${sourceRoot}\n`);
    return 1;
  }
  const findings = (await Promise.all(
    files.map((path) => inspectSource(path, sourceRoot)),
  )).flat();
  if (findings.length > 0) {
    process.stderr.write(`${findings.join("\n")}\n`);
    return 1;
  }
  process.stdout.write(
    `Production source guard passed (${files.length} files).\n`,
  );
  return 0;
}

process.exitCode = await main();
