import { collectDiagnostics, recommendedPamLines, runNativeTouchIdTest } from "./doctor.js"

const HELP = `opencode-macos-sudo

Usage:
  opencode-macos-sudo doctor [--json]
  opencode-macos-sudo test-touch-id
  opencode-macos-sudo pam-snippet [--reattach]

The command never reads or stores a password and never edits PAM configuration.`

function printDoctor(report: Awaited<ReturnType<typeof collectDiagnostics>>): void {
  const yesNo = (value: boolean) => (value ? "yes" : "no")
  console.log(`Platform: ${report.platform} (${report.architecture})`)
  console.log(`OpenCode client: ${report.openCodeClient ?? "not detected"}`)
  console.log(`OpenCode Desktop: ${yesNo(report.openCodeDesktop)}`)
  console.log(`TTY (stdin/stdout/stderr): ${yesNo(report.tty.stdin)}/${yesNo(report.tty.stdout)}/${yesNo(report.tty.stderr)}`)
  console.log(`Aqua bootstrap namespace: ${report.session.aquaBootstrapNamespace}`)
  console.log(`SSH session: ${yesNo(report.session.ssh)}`)
  console.log(`Terminal program: ${report.session.terminalProgram ?? "not detected"}`)
  console.log(`/usr/bin/sudo executable: ${yesNo(report.sudo.exists)}`)
  console.log(`/etc/pam.d/sudo_local exists: ${yesNo(report.pam.sudoLocalExists)}`)
  console.log(`/etc/pam.d/sudo_local readable: ${yesNo(report.pam.sudoLocalReadable)}`)
  console.log(`pam_tid module present: ${yesNo(report.pam.touchIdModulePresent)}`)
  console.log(`pam_tid configured: ${yesNo(report.pam.touchIdConfigured)}`)
  console.log(`pam_reattach configured: ${yesNo(report.pam.reattachConfigured)}`)
  console.log(`Homebrew prefixes: ${report.homebrewPrefixes.join(", ") || "none detected"}`)
  console.log(`Touch ID hardware/enrollment: ${report.touchIdHardware}`)
  console.log(report.touchIdHardwareNote)
  console.log("\nThis report does not authenticate. Run `opencode-macos-sudo test-touch-id` only when you are ready for a native prompt.")
}

export async function runCli(args: readonly string[]): Promise<number> {
  const [command = "doctor", ...flags] = args
  if (command === "doctor") {
    const report = await collectDiagnostics()
    if (flags.includes("--json")) console.log(JSON.stringify(report, null, 2))
    else printDoctor(report)
    return report.platform === "darwin" && report.sudo.exists ? 0 : 1
  }
  if (command === "test-touch-id") return runNativeTouchIdTest()
  if (command === "pam-snippet") {
    const report = await collectDiagnostics()
    console.log("# Review before adding to /etc/pam.d/sudo_local; this command makes no changes.")
    console.log(recommendedPamLines(report, flags.includes("--reattach")).join("\n"))
    return 0
  }
  if (command === "help" || command === "--help" || command === "-h") {
    console.log(HELP)
    return 0
  }
  console.error(`Unknown command: ${command}\n\n${HELP}`)
  return 2
}
