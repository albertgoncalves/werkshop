with import <nixpkgs> {};
llvmPackages_10.stdenv.mkDerivation {
    name = "_";
    buildInputs = [
        glibcLocales
        htmlTidy
        jq
        nodejs
        parallel
        shellcheck
    ];
    shellHook = ''
        . .shellhook
    '';
}
