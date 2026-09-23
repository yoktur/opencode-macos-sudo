export declare const SAFE_SYSTEM_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";
export declare function isSupportedPlatform(platform?: NodeJS.Platform): boolean;
export declare function prependPath(currentPath: string | undefined, directory: string, separator?: ";" | ":"): string;
export declare function shimDirectory(moduleUrl?: string): string;
export declare function assertSafeShim(directory: string): Promise<void>;
