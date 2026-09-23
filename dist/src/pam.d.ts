export interface PamInspection {
    touchIdConfigured: boolean;
    reattachConfigured: boolean;
    touchIdLines: string[];
    reattachLines: string[];
}
export declare function inspectPamConfig(texts: readonly string[]): PamInspection;
