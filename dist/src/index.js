import { assertSafeShim, isSupportedPlatform, prependPath, shimDirectory } from "./path.js";
const plugin = {
    id: "opencode.macos-sudo",
    async setup(ctx) {
        if (!isSupportedPlatform())
            return;
        const directory = shimDirectory();
        await assertSafeShim(directory);
        await ctx.shell.hook("create.before", (event) => {
            event.env.PATH = prependPath(event.env.PATH ?? process.env.PATH, directory);
        });
    },
};
export default plugin;
//# sourceMappingURL=index.js.map