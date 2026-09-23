# opencode-macos-sudo

[![CI](https://github.com/yoktur/opencode-macos-sudo/actions/workflows/ci.yml/badge.svg)](https://github.com/yoktur/opencode-macos-sudo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Native macOS authentication for `sudo` commands run by OpenCode V2. The plugin
keeps OpenCode unprivileged and leaves passwords entirely to `/usr/bin/sudo` and
PAM. If Touch ID is enabled for sudo, macOS presents its normal system prompt.

> [!CAUTION]
> PAM configuration controls system authentication. Keep an administrator
> recovery path available, review every change, and never paste PAM edits you do
> not understand. This project can print suggested lines, but it never modifies
> `/etc/pam.d`.

Tested with OpenCode Desktop 2.0.6 and CLI/server 2.0.14 on Intel macOS. Apple
Silicon uses the same native `pam_tid` path but still needs real-machine
validation.

## Install

Install the current `master` branch:

```sh
opencode plugin add github:yoktur/opencode-macos-sudo#master
opencode plugin list
```

For a reproducible install, replace `master` with a full commit SHA:

```sh
opencode plugin add github:yoktur/opencode-macos-sudo#FULL_COMMIT_SHA
```

Restart OpenCode if the plugin does not appear immediately. Its plugin ID is
`opencode.macos-sudo`.

## Enable Touch ID for sudo

First check the current policy:

```sh
cat /etc/pam.d/sudo
test -f /etc/pam.d/sudo_local && cat /etc/pam.d/sudo_local
```

On current macOS releases, `/etc/pam.d/sudo_local` should contain an active
`pam_tid.so` line:

```text
auth       sufficient     pam_tid.so
```

If `sudo_local` does not exist but Apple provides the template:

```sh
sudo cp /etc/pam.d/sudo_local.template /etc/pam.d/sudo_local
sudoedit /etc/pam.d/sudo_local
```

Uncomment or add the `pam_tid.so` line in the editor. The plugin never runs
these commands for you.

## Verify

Check native sudo first in Terminal:

```sh
/usr/bin/sudo -k
/usr/bin/sudo true
```

Then ask OpenCode to run:

```sh
command -v sudo
sudo -k && sudo true
```

The first command should resolve to this package's `bin/sudo`. The second should
show the native macOS authentication prompt and exit successfully. `sudo true`
does not change the system; `sudo -k` only invalidates the cached sudo timestamp.

## Diagnostics

From a clone:

```sh
npm ci
npm run doctor
```

When the package binary is available on `PATH`:

```sh
opencode-macos-sudo doctor
opencode-macos-sudo doctor --json
opencode-macos-sudo test-touch-id
```

`doctor` checks the platform, session, sudo binary, PAM files, `pam_tid`, and
standard Homebrew locations. It does not authenticate, inspect fingerprints, or
use private biometric APIs. `test-touch-id` explicitly runs `/usr/bin/sudo -k`
followed by `/usr/bin/sudo true` with inherited stdio.

## How it works

The plugin registers OpenCode V2's `create.before` shell hook and prepends its
`bin` directory to the child shell's `PATH`. The `sudo` shim is deliberately
small:

```sh
exec /usr/bin/sudo "$@"
```

The shell still parses the command. The shim does not inspect or reconstruct
arguments, and `exec` preserves stdin, stdout, stderr, the working directory,
exit status, and normal signal behavior. The absolute path prevents recursion.

This covers ordinary shell forms such as `sudo command`, pipelines,
`foo && sudo bar`, `sudo -u user command`, and `sudo sh -c '...'`. An explicit
`/usr/bin/sudo` call bypasses the shim and reaches the same native binary.

See [docs/architecture.md](docs/architecture.md) for the full threat model and
design rationale.

## Troubleshooting `pam_reattach`

Do not install `pam_reattach` by default. It is useful when a process has lost
access to the Aqua bootstrap namespace, commonly under tmux or screen. If Touch
ID works in Terminal but not OpenCode, run the doctor first. Only then consider:

```sh
brew install pam-reattach
opencode-macos-sudo pam-snippet --reattach
```

Review the printed architecture-specific path and place the optional
`pam_reattach` line before `pam_tid.so` in `/etc/pam.d/sudo_local`. The command
prints a snippet; it does not apply it.

## Security and limitations

- The plugin never reads, stores, logs, or transmits a password.
- It does not use `sudo -A`, `sudo -S`, askpass, password files, or `NOPASSWD`.
- It never edits PAM, sudoers, shell profiles, or the global `PATH`.
- Touch ID approval authorizes the proposed privileged command. Review it first.
- Native sudo timestamp caching still applies.
- Shell aliases and functions named `sudo` take precedence over `PATH`.
- Remote SSH sessions should not attempt local biometric authentication.
- Linux and Windows elevation are outside this project's scope.

If native authentication is unavailable and no usable TTY exists, sudo fails.
There is no password-collection fallback in the plugin.

See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Local development

```sh
git clone https://github.com/yoktur/opencode-macos-sudo.git
cd opencode-macos-sudo
npm ci
npm run check
```

Add the clone to a test project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-macos-sudo"]
}
```

The test suite never invokes privileged sudo. macOS authentication integration
requires user presence and is tested manually.

## Uninstall

```sh
opencode plugin remove github:yoktur/opencode-macos-sudo#master
```

Removing the plugin does not revert PAM changes made manually.

## License

[MIT](LICENSE)
