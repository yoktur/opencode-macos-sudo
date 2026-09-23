# Architecture

## Decision

The V2 plugin registers `ctx.shell.hook("create.before", ...)` and prepends the package's `bin` directory to `PATH` only for shell processes created by OpenCode. The `bin/sudo` shim immediately uses `exec /usr/bin/sudo "$@"`.

This is intentionally smaller and safer than rewriting shell command strings:

- the shell itself resolves ordinary `sudo` command positions, including pipelines, substitutions, and `&&` lists;
- the shim does not parse or reconstruct syntax;
- `"$@"` preserves argument boundaries, and `exec` preserves the process's streams, working directory, exit status, and practical signal behavior;
- the absolute `/usr/bin/sudo` path prevents recursion;
- native `sudo` remains responsible for policy, timestamps, environment filtering, and PAM;
- OpenCode, the model, and the plugin never receive authentication credentials.

Absolute `/usr/bin/sudo` calls bypass the shim by design. Shell aliases or functions named `sudo` can take precedence over `PATH`, and a user's shell startup files can replace `PATH` after the hook has populated it.

## Authentication path

```text
OpenCode Desktop shell child
  -> PATH lookup finds bin/sudo
  -> exec /usr/bin/sudo with unchanged argv
  -> macOS PAM sudo policy
  -> pam_tid.so (when configured and eligible)
  -> native Touch ID / system authorization UI
  -> requested privileged command
```

`SUDO_ASKPASS`, `sudo -A`, `sudo -S`, password pipes, password files, and blanket `NOPASSWD` rules are not used. The plugin never runs OpenCode itself as root and never edits `/etc/pam.d`.

## Doctor and real-machine boundary

The doctor reads only the two sudo PAM policy files, checks fixed executable/module paths, reports a narrow set of session indicators, and checks whether the current user has a `gui/<uid>` launchd bootstrap namespace. It does not enumerate hardware or use private biometric APIs. Hardware presence, fingerprint enrollment, and whether OpenCode Desktop's sidecar remains eligible for `pam_tid` can only be established by the explicit native test:

```bash
/usr/bin/sudo -k
/usr/bin/sudo true
```

## `pam_reattach`

It is not part of the plugin and is not enabled automatically. It is a conditional PAM-layer workaround for processes outside the current Aqua bootstrap namespace, historically tmux/screen. OpenCode Desktop should be tested without it first. If the native prompt does not appear despite valid `pam_tid` configuration, install and configure `pam_reattach` before `pam_tid` as an `optional` module, then repeat the test.

## PTY

No PTY is introduced. Apple's `pam_tid` uses native authorization UI and explicitly rejects sudo askpass mode. A PTY is relevant only to password conversation fallback, which version 0.1 intentionally does not implement. Secure failure is preferred to capturing or brokering a password.

The current `opencode-pty` V2 implementation exposes dedicated tools backed by a native PTY dependency. It confirms that PTY support is a separate execution architecture, not a requirement of the V2 shell hook. Adding it here would bypass the desired ordinary `sudo ...` UX and expand the trusted dependency surface without helping `pam_tid`'s Aqua-session check.
