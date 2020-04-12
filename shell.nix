with import <nixpkgs> {};
llvmPackages_10.stdenv.mkDerivation {
    name = "_";
    buildInputs = [
        htmlTidy
        jq
        nodejs
        shellcheck
    ];
    shellHook = ''
        . .shellhook
    '';
}
