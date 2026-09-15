// The root release tsconfigs (tsconfig.<release>.json) resolve their `types`
// from the repository root, but the toolkit installs into toolkit/node_modules.
// Link the root at node_modules -> toolkit/node_modules so `tsc -p` finds
// lua-types and the language extensions. Idempotent and safe to rerun.
import { existsSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolkitDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootLink = join(toolkitDir, "..", "node_modules");

if (!existsSync(rootLink)) {
  symlinkSync(join("toolkit", "node_modules"), rootLink, "junction");
  console.log("linked node_modules -> toolkit/node_modules");
}
