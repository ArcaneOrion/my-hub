{
  description = "my-hub — arcane orion 的个人主站开发环境";

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
          name = "my-hub";

          buildInputs = with pkgs; [
            nodejs_22
            git
          ];

          shellHook = ''
            echo "🏗  my-hub dev environment"
            echo "Node.js: $(node --version)"
            echo ""
            echo "Available commands:"
            echo "  npm install    - Install dependencies"
            echo "  npm run dev    - Start dev server (http://localhost:4321)"
            echo "  npm run build  - Build static site"
            echo "  npm run preview- Preview built site"
          '';
        };
      });
}
