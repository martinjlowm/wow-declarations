// TypeScriptToLua plugin: flag calls to protected WoW APIs in insecure code.
//
// Protected functions (HasRestrictions in the Blizzard docs) only run from a
// secure execution path — a hardware event handler or Blizzard's own code. That
// taint cannot be proven statically, so this guard does the next best thing: it
// makes every protected call site explicit. A call to a protected API fails the
// Lua build unless the statement is annotated `// wow-secure`, which forces the
// author to acknowledge "this runs from a secure handler" at the exact line.
//
// The protected name list is generated alongside the types
// (generated/<release>/protected.json), so it tracks the API surface.

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function loadProtectedNames(releaseId) {
  const file = path.join(__dirname, "..", "..", "..", "generated", releaseId, "protected.json");
  return new Set(JSON.parse(fs.readFileSync(file, "utf8")));
}

// "C_AuctionHouse.PostItem" for a call like C_AuctionHouse.PostItem(...).
function qualifiedName(expression) {
  if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)) {
    return `${expression.expression.text}.${expression.name.text}`;
  }
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  return undefined;
}

function statementOf(node) {
  let current = node;
  while (current && !ts.isStatement(current)) current = current.parent;
  return current;
}

function isSecureAnnotated(node, sourceText) {
  const statement = statementOf(node);
  if (!statement) return false;
  const ranges = ts.getLeadingCommentRanges(sourceText, statement.getFullStart()) || [];
  return ranges.some((range) => /wow-secure/.test(sourceText.slice(range.pos, range.end)));
}

/** Scan a program for unacknowledged protected calls; returns ts.Diagnostics. */
function scan(program, protectedNames) {
  const diagnostics = [];
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile || sourceFile.fileName.includes("node_modules")) continue;
    const text = sourceFile.text;
    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const name = qualifiedName(node.expression);
        if (name && protectedNames.has(name) && !isSecureAnnotated(node, text)) {
          diagnostics.push({
            file: sourceFile,
            start: node.getStart(sourceFile),
            length: node.getWidth(sourceFile),
            category: ts.DiagnosticCategory.Error,
            code: 9001,
            messageText:
              `Protected API '${name}' is only callable from secure code. Annotate the ` +
              `statement with '// wow-secure' if it runs from a hardware event handler.`,
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return diagnostics;
}

// TSTL plugin. beforeTransform runs once with the full program; returned
// diagnostics with Error severity fail the build.
const plugin = {
  beforeTransform(program) {
    const releaseId = process.env.WOW_RELEASE || "12.1.x";
    return scan(program, loadProtectedNames(releaseId));
  },
};

module.exports = plugin;
module.exports.scan = scan;
module.exports.loadProtectedNames = loadProtectedNames;
