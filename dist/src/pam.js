function activeLines(text) {
    return text
        .split(/\r?\n/u)
        .map((line) => line.replace(/\s+#.*$/u, "").trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));
}
function isAuthLineFor(line, moduleName) {
    if (!/^auth(?:\s|$)/u.test(line))
        return false;
    return line.split(/\s+/u).some((token) => {
        const lastSlash = token.lastIndexOf("/");
        return token.slice(lastSlash + 1) === moduleName;
    });
}
export function inspectPamConfig(texts) {
    const lines = texts.flatMap(activeLines);
    const touchIdLines = lines.filter((line) => isAuthLineFor(line, "pam_tid.so"));
    const reattachLines = lines.filter((line) => isAuthLineFor(line, "pam_reattach.so"));
    return {
        touchIdConfigured: touchIdLines.length > 0,
        reattachConfigured: reattachLines.length > 0,
        touchIdLines,
        reattachLines,
    };
}
//# sourceMappingURL=pam.js.map