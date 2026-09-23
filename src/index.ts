import { assertSafeShim, isSupportedPlatform, prependPath, shimDirectory } from "./path.js"

interface ShellCreateBefore {
  env: Record<string, string | undefined>
}

interface PluginContext {
  shell: {
    hook(name: "create.before", callback: (event: ShellCreateBefore) => void | Promise<void>): Promise<unknown>
  }
}

const plugin = {
  id: "opencode.macos-sudo",
  async setup(ctx: PluginContext) {
    if (!isSupportedPlatform()) return

    const directory = shimDirectory()
    await assertSafeShim(directory)

    await ctx.shell.hook("create.before", (event) => {
      event.env.PATH = prependPath(event.env.PATH ?? process.env.PATH, directory)
    })
  },
}

export default plugin
