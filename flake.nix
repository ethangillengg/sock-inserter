{
  description = "Experiment using websocketd";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        system = "x86_64-linux"; # or something else
      };
    in {
      devShell = pkgs.mkShell {
        nativeBuildInputs = [pkgs.bashInteractive];
        buildInputs = with pkgs; [
          websocketd
        ];
      };
    });
}
