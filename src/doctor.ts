import { constants } from "node:fs"
import { access, readFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { inspectPamConfig, type PamInspection } from "./pam.js"

const PAM_FILES = ["/etc/pam.d/sudo_local", "/etc/pam.d/sudo"] as const
const BREW_BINARIES = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"] as const
const PAM_TID_MODULES = ["/usr/lib/pam/pam_tid.so", "/usr/lib/pam/pam_tid.so.2"] as const

export function homebrewPrefixFromBrewPath(binary: string): string | null {
  const suffix = "/bin/brew"
  return binary.endsWith(suffix) ? binary.slice(0, -suffix.length) : null
}

export interface DoctorReport {
  platform: NodeJS.Platform
  architecture: string
  openCodeClient: string | null
  openCodeDesktop: boolean
  tty: { stdin: boolean; stdout: boolean; stderr: boolean }
  session: {
    aquaBootstrapNamespace: "available" | "unavailable" | "not-macos" | "unknown"
    ssh: boolean
    terminalProgram: string | null
  }
  sudo: { path: "/usr/bin/sudo"; exists: boolean }
  pam: {
    sudoLocalExists: boolean
    sudoLocalReadable: boolean
    touchIdModulePresent: boolean
  } & PamInspection
  homebrewPrefixes: string[]
  touchIdHardware: "not-probed"
  touchIdHardwareNote: string
}

async function exists(path: string, mode = constants.F_OK): Promise<boolean> {
  return access(path, mode).then(
    () => true,
    () => false,
  )
}

async function readIfAllowed(path: string): Promise<string | null> {
  return readFile(path, "utf8").catch(() => null)
}

async function aquaSessionStatus(): Promise<DoctorReport["session"]["aquaBootstrapNamespace"]> {
  if (process.platform !== "darwin") return "not-macos"
  return new Promise((resolve) => {
    const child = spawn("/bin/launchctl", ["print", `gui/${process.getuid?.() ?? -1}`], {
      stdio: "ignore",
    })
    child.once("error", () => resolve("unknown"))
    child.once("exit", (code) => resolve(code === 0 ? "available" : "unavailable"))
  })
}

export async function collectDiagnostics(): Promise<DoctorReport> {
  const pamContents = await Promise.all(PAM_FILES.map(readIfAllowed))
  const pam = inspectPamConfig(pamContents.filter((value): value is string => value !== null))
  const homebrewPrefixes = (
    await Promise.all(
      BREW_BINARIES.map(async (binary) => ((await exists(binary, constants.X_OK)) ? homebrewPrefixFromBrewPath(binary) : null)),
    )
  ).filter((value): value is string => value !== null)
  const openCodeClient = process.env.OPENCODE_CLIENT ?? null

  return {
    platform: process.platform,
    architecture: process.arch,
    openCodeClient,
    openCodeDesktop: openCodeClient === "desktop",
    tty: {
      stdin: Boolean(process.stdin.isTTY),
      stdout: Boolean(process.stdout.isTTY),
      stderr: Boolean(process.stderr.isTTY),
    },
    session: {
      aquaBootstrapNamespace: await aquaSessionStatus(),
      ssh: Boolean(process.env.SSH_CLIENT || process.env.SSH_CONNECTION || process.env.SSH_TTY),
      terminalProgram: process.env.TERM_PROGRAM ?? null,
    },
    sudo: { path: "/usr/bin/sudo", exists: await exists("/usr/bin/sudo", constants.X_OK) },
    pam: {
      sudoLocalExists: await exists(PAM_FILES[0]),
      sudoLocalReadable: pamContents[0] !== null,
      touchIdModulePresent: (await Promise.all(PAM_TID_MODULES.map((path) => exists(path)))).some(Boolean),
      ...pam,
    },
    homebrewPrefixes,
    touchIdHardware: "not-probed",
    touchIdHardwareNote:
      "Hardware and fingerprint enrollment are intentionally not probed with private or authentication-triggering APIs.",
  }
}

export function recommendedPamLines(
  report: Pick<DoctorReport, "architecture" | "homebrewPrefixes">,
  reattach: boolean,
): string[] {
  const lines: string[] = []
  if (reattach) {
    const prefix = report.homebrewPrefixes[0]
    const fallback = report.architecture === "x64" ? "/usr/local" : "/opt/homebrew"
    const module = `${prefix ?? fallback}/lib/pam/pam_reattach.so`
    lines.push(`auth       optional       ${module} ignore_ssh`)
  }
  lines.push("auth       sufficient     pam_tid.so")
  return lines
}

export async function runNativeTouchIdTest(): Promise<number> {
  if (process.platform !== "darwin") {
    console.error("Touch ID sudo testing is supported only on macOS.")
    return 2
  }
  if (!(await exists("/usr/bin/sudo", constants.X_OK))) {
    console.error("/usr/bin/sudo is not available.")
    return 2
  }

  const run = (args: string[]) =>
    new Promise<number>((resolve, reject) => {
      const child = spawn("/usr/bin/sudo", args, { stdio: "inherit" })
      child.once("error", reject)
      child.once("exit", (code, signal) => {
        if (signal) console.error(`sudo ended from signal ${signal}`)
        resolve(code ?? 1)
      })
    })

  const invalidate = await run(["-k"])
  if (invalidate !== 0) return invalidate
  return run(["true"])
}
