{pkgs, ...}: let
  # Pin Yarn Berry to this shell's Node, the same override agents-mj uses so the
  # package manager and the runtime never drift.
  yarn = pkgs.yarn-berry.override {
    nodejs = pkgs.nodejs_24;
  };
in {
  # The toolchain this package needs: Node plus Yarn 4 for package management,
  # Bun as the test runner and the generator's runtime, git for the generator's
  # sparse checkout of wow-ui-source, and treefmt for the Nix files.
  packages = [
    pkgs.nodejs_24
    yarn
    pkgs.bun
    pkgs.git
    pkgs.treefmt
  ];

  # `languages.javascript.enable` is what registers the Yarn install task; with
  # only the `yarn` block set it never runs, so a fresh shell would reach `yarn
  # test` with no node_modules. The node-modules linker (.yarnrc.yml) is what
  # lets Bun resolve dependencies from that tree.
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    yarn = {
      enable = true;
      package = yarn;
      install.enable = true;
    };
  };

  # treefmt on PATH and as a pre-commit hook. The formatter set lives in
  # ./treefmt.nix so the shell and the hook cannot drift.
  treefmt = {
    enable = true;
    config.imports = [./treefmt.nix];
  };

  git-hooks.hooks.treefmt.enable = true;
}
