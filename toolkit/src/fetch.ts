import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { DOC_DIR, type Release } from "./releases.js";

// Fetches only the API doc directory at the release's pinned commit via a
// blobless, sparse checkout. This pulls ~1MB rather than the whole client
// source, and pinning to the commit keeps a regenerate reproducible.

const CACHE = new URL("../cache/", import.meta.url).pathname;

export function ensureCheckout(release: Release): string {
  mkdirSync(CACHE, { recursive: true });
  const repo = join(CACHE, `${release.id}-repo`);
  if (!existsSync(join(repo, ".git"))) {
    execFileSync(
      "git",
      [
        "clone", "--filter=blob:none", "--no-checkout", "--depth", "1",
        "-b", release.branch, "https://github.com/Gethe/wow-ui-source.git", repo,
      ],
      { stdio: "inherit" },
    );
    execFileSync("git", ["sparse-checkout", "set", "--no-cone", DOC_DIR], { cwd: repo, stdio: "inherit" });
  }
  // Fetch the exact commit in case the branch head has moved past our pin.
  execFileSync("git", ["fetch", "--depth", "1", "origin", release.commit], { cwd: repo, stdio: "inherit" });
  execFileSync("git", ["checkout", "--quiet", release.commit], { cwd: repo, stdio: "inherit" });
  return join(repo, DOC_DIR);
}

export interface DocFile {
  name: string;
  source: string;
}

export function readDocFiles(release: Release): DocFile[] {
  const dir = ensureCheckout(release);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".lua"))
    .sort()
    .map((name) => ({ name, source: readFileSync(join(dir, name), "utf8") }));
}
