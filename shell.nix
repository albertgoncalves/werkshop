with import <nixpkgs> {};
mkShell {
    buildInputs = [
        clang-tools
        htmlTidy
        jq
        nodejs
        shellcheck
    ];
    shellHook = ''
        . .shellhook
    '';
}
