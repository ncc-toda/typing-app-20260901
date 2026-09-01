{
  description = "Reply Rush development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-vite-plus.url = "github:ryoppippi/nix-vite-plus";
  };

  outputs =
    { nixpkgs, nix-vite-plus, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.just
              pkgs.git
              pkgs.gh
              pkgs.direnv
              nix-vite-plus.packages.${system}.vp
            ];

            # Vite+ の managed Node は Nix と衝突するため、常に flake の Node を使う。
            shellHook = ''
              export VITE_PLUS_USE_SYSTEM_NODE=1
              if command -v vp >/dev/null 2>&1; then
                vp env off >/dev/null 2>&1 || true
              fi
            '';
          };
        }
      );
    };
}
