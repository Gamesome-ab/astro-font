{
  description = "astro-font Monorepo Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nodePackages.pnpm
            nodePackages.typescript
          ];

          shellHook = ''
            echo "astro-font development environment"
            echo "Node.js: $(node --version)"
            echo "pnpm: $(pnpm --version)"

            export PATH="$PWD/node_modules/.bin:$PATH"
            export NODE_ENV=development

            if [ ! -d "node_modules" ]; then
              echo "Installing dependencies..."
              pnpm install
            fi
          '';
        };
      });
}
