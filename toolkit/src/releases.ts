// Each release pins a Gethe/wow-ui-source branch to the commit we last
// generated from, so a regenerate is reproducible until someone bumps the SHA
// on purpose. `id` names the emitted directory and tsconfig (generated/<id>,
// tsconfig.<id>.json) and follows the repo's existing major.minor.x scheme.

export interface Release {
  /** Directory and tsconfig suffix, e.g. "12.1.x". */
  id: string;
  /** Gethe/wow-ui-source branch this release tracks. */
  branch: string;
  /** Commit the checked-in types were generated from. */
  commit: string;
  /** Full game version at that commit, from the repo's version.txt. */
  version: string;
  /** Human label for the client. */
  label: string;
}

export const RELEASES: Release[] = [
  {
    id: "12.1.x",
    branch: "live",
    commit: "4e3cbb8c5609e4bfc332c0aebbfa4d79731fab59",
    version: "12.1.0.69814",
    label: "Retail",
  },
  {
    id: "5.5.x",
    branch: "classic",
    commit: "ecadf9d3326fa87828cacca7f13c0ab5f41840a6",
    version: "5.5.4.69585",
    label: "Mists of Pandaria Classic",
  },
  {
    id: "1.15.x",
    branch: "classic_era",
    commit: "33e177d9bf38d76d5c6c6e05d5da78db1899659a",
    version: "1.15.9.69722",
    label: "Classic Era",
  },
];

export const DOC_DIR = "Interface/AddOns/Blizzard_APIDocumentationGenerated";

export function findRelease(id: string): Release | undefined {
  return RELEASES.find((r) => r.id === id);
}
