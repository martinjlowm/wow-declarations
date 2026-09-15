_: {
  # devenv supplies the tree root, so no projectRootFile is set here.
  # alejandra formats the Nix files (devenv.nix, treefmt.nix), the style devenv
  # itself uses. TypeScript formatting and linting stay with the Node toolchain
  # (tsc typecheck, bun test), so no JS formatter is wired in.
  programs.alejandra.enable = true;

  settings.global.excludes = [
    "node_modules/**"
    ".yarn/**"
    "cache/**"
    "generated/**"
    "tstl/build/**"
    "yarn.lock"
  ];
}
