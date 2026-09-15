import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import ts from "typescript";

// A minimal in-memory type-check so the property suite can assert that emitted
// declarations actually compile, not merely parse. The plain parser misses
// grammar errors such as TS1257 (a required tuple/param element after an
// optional one), which is exactly the class of emitter bug worth fuzzing for.

const require = createRequire(import.meta.url);
// The package sets `main` to "", so resolve through its package.json instead.
const LANG_EXT = join(
  dirname(require.resolve("@typescript-to-lua/language-extensions/package.json")),
  "index.d.ts",
);

const OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  types: [],
};

/** Build an in-memory program over the given virtual sources. */
export function buildProgram(sources: Record<string, string>, extraRoots: string[] = []): ts.Program {
  const host = ts.createCompilerHost(OPTIONS);
  const virtual = new Map<string, string>();
  for (const [name, content] of Object.entries(sources)) {
    virtual.set(ts.sys.resolvePath(name), content);
  }

  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    const resolved = ts.sys.resolvePath(fileName);
    const content = virtual.get(resolved);
    if (content !== undefined) {
      return ts.createSourceFile(fileName, content, languageVersion, true);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreate);
  };
  const originalFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) =>
    virtual.has(ts.sys.resolvePath(fileName)) || originalFileExists(fileName);
  const originalReadFile = host.readFile.bind(host);
  host.readFile = (fileName) =>
    virtual.get(ts.sys.resolvePath(fileName)) ?? originalReadFile(fileName);

  // The language-extensions declaration supplies LuaMultiReturn globally.
  const rootNames = [...virtual.keys(), LANG_EXT, ...extraRoots];
  return ts.createProgram(rootNames, OPTIONS, host);
}

/** Type-check ambient .d.ts sources together; returns diagnostic messages. */
export function typeCheck(sources: Record<string, string>): string[] {
  const program = buildProgram(sources);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];
  return diagnostics.map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
}
