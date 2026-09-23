import { access, lstat } from "node:fs/promises";
import { constants } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export const SAFE_SYSTEM_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";
export function isSupportedPlatform(platform = process.platform) {
    return platform === "darwin";
}
export function prependPath(currentPath, directory, separator = delimiter) {
    const entries = (currentPath || SAFE_SYSTEM_PATH)
        .split(separator)
        .filter((entry) => entry.length > 0 && entry !== directory);
    return [directory, ...entries].join(separator);
}
export function shimDirectory(moduleUrl = import.meta.url) {
    return join(dirname(fileURLToPath(moduleUrl)), "..", "bin");
}
export async function assertSafeShim(directory) {
    const shim = join(directory, "sudo");
    const info = await lstat(shim);
    if (!info.isFile() || info.isSymbolicLink()) {
        throw new Error(`Refusing unsafe sudo shim: ${shim}`);
    }
    if ((info.mode & 0o022) !== 0) {
        throw new Error(`Refusing group/world-writable sudo shim: ${shim}`);
    }
    await access(shim, constants.X_OK);
}
//# sourceMappingURL=path.js.map