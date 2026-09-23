# Security policy

## Design guarantees

- The plugin and shim never request, read, store, log, or transmit a password.
- Elevation is limited to commands that explicitly invoke `sudo`; OpenCode remains unprivileged.
- PAM and sudo policy remain the system's responsibility.
- PATH is changed only in OpenCode-created shell child environments.
- No PAM or sudoers file is modified by this project.

## Trust boundary

Installing a plugin executes its code as your user. Review the repository and pin a commit for higher assurance. Anyone who can modify the installed plugin package or your OpenCode configuration already has code execution as your user and can replace the shim. The plugin does not weaken sudo policy, but successful biometric approval authorizes the exact command passed to native sudo, so inspect agent-proposed privileged commands before approving.

## Reporting a vulnerability

Use GitHub's **Report a vulnerability** link in the repository's Security tab.
Do not open a public issue for an undisclosed vulnerability, and do not include
credentials or unrelated machine details.
