# Research notes

Checked on 2026-09-23 against OpenCode 2.0.14 and the linked upstream sources.

## OpenCode V2

- The current Promise plugin contract is a default `{ id, setup }` definition. The `define()` helper is an identity function, so this project exports that shape directly and types only the hook it uses. No OpenCode SDK is loaded at runtime.
- `ctx.shell.hook("create.before", callback)` receives a mutable event containing `command`, `cwd`, `timeout`, `shell`, and `env`.
- Git package specifications are supported by `opencode plugin add`, including `github:OWNER/REPOSITORY` and full commit pins.
- OpenCode Desktop sets `OPENCODE_CLIENT=desktop` in the environment inherited by its local server sidecar, so the doctor treats only that documented value as positive Desktop detection.
- A local OpenCode 2.0.14 smoke test loaded the source plugin as `opencode.macos-sudo` through project discovery. `command -v sudo` resolved to the package shim, and native sudo authentication succeeded on Intel macOS. The root `index.ts` is retained for direct local-package compatibility.

These facts make invocation-scoped PATH augmentation possible without parsing or rewriting shell text.

## Apple PAM

Apple's `pam_tid` source performs two checks central to this design:

1. the process must be in an Aqua session;
2. if PAM data named `askpass-enabled` is present, `pam_tid` returns authentication-info-unavailable instead of presenting UI.

Therefore an askpass helper is not a Touch ID transport. The correct first experiment is native `/usr/bin/sudo` from the OpenCode Desktop shell child.

## References reviewed

- OpenCode V2 docs and current source/types: <https://opencode.ai/v2/docs/build/plugins>
- Git plugin installation: <https://opencode.ai/v2/docs/plugins>
- Apple `pam_tid`: <https://github.com/apple-oss-distributions/pam_modules/blob/main/modules/pam_tid/pam_tid.c>
- `pam_reattach`: <https://github.com/fabianishere/pam_reattach>
- `opencode-pty` V2 implementation, current commit during review: `9be51267ed31c81cc953b84da5b615496ab4c95a`
- Linux askpass reference, current commit during review: `90ff467850eb9efb278ddaac12430f7b25918263`

No source was copied from the reference plugins. Their licenses were checked (both MIT), but the design here is an independent implementation based on the OpenCode and PAM contracts.
