interface ShellCreateBefore {
    env: Record<string, string | undefined>;
}
interface PluginContext {
    shell: {
        hook(name: "create.before", callback: (event: ShellCreateBefore) => void | Promise<void>): Promise<unknown>;
    };
}
declare const plugin: {
    id: string;
    setup(ctx: PluginContext): Promise<void>;
};
export default plugin;
