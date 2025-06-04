{
  description = "Development environment for my project";

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
        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Programming languages
            nodejs_20
            python3
            go
            
            # Development tools
            git
            curl
            jq
            eza  # Modern ls replacement
            
            # Language-specific tools
            nodePackages.typescript
            nodePackages.pnpm
            python3Packages.pip
            
            # Optional: Database tools
            # postgresql
            # redis
          ];

          shellHook = ''
            echo "🚀 Development environment loaded!"
            echo "Node: $(node --version)"
            echo "Python: $(python --version)"
            echo "Go: $(go version)"
          '';

          # Environment variables
          env = {
            DATABASE_URL = "postgresql://localhost:5432/mydb";
            NODE_ENV = "development";
          };
        };

        # Optional: Define packages your project provides
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "my-project";
          version = "0.1.0";
          src = ./.;
          
          buildPhase = ''
            # Your build commands here
            echo "Building project..."
          '';
          
          installPhase = ''
            mkdir -p $out/bin
            # Install your built artifacts
          '';
        };
      });
}