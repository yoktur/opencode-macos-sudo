import { type PamInspection } from "./pam.js";
export declare function homebrewPrefixFromBrewPath(binary: string): string | null;
export interface DoctorReport {
    platform: NodeJS.Platform;
    architecture: string;
    openCodeClient: string | null;
    openCodeDesktop: boolean;
    tty: {
        stdin: boolean;
        stdout: boolean;
        stderr: boolean;
    };
    session: {
        aquaBootstrapNamespace: "available" | "unavailable" | "not-macos" | "unknown";
        ssh: boolean;
        terminalProgram: string | null;
    };
    sudo: {
        path: "/usr/bin/sudo";
        exists: boolean;
    };
    pam: {
        sudoLocalExists: boolean;
        sudoLocalReadable: boolean;
        touchIdModulePresent: boolean;
    } & PamInspection;
    homebrewPrefixes: string[];
    touchIdHardware: "not-probed";
    touchIdHardwareNote: string;
}
export declare function collectDiagnostics(): Promise<DoctorReport>;
export declare function recommendedPamLines(report: Pick<DoctorReport, "architecture" | "homebrewPrefixes">, reattach: boolean): string[];
export declare function runNativeTouchIdTest(): Promise<number>;
