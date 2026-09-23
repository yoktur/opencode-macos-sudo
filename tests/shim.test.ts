import { chmod, copyFile, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawn } from "node:child_process"
import { describe, it } from "node:test"
import assert from "node:assert/strict"

const sourceShim = resolve("bin/sudo")

function run(file: string, args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number | null; stdout: string }> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(file, args, { env, stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.once("error", reject)
    child.once("close", (code) => resolveRun({ code, stdout }))
  })
}

describe("sudo shim", () => {
  it("hard-codes /usr/bin/sudo to prevent PATH recursion", async () => {
    const text = await readFile(sourceShim, "utf8")
    assert.match(text, /exec \/usr\/bin\/sudo "\$@"/u)
    assert.doesNotMatch(text, /exec sudo/u)
  })

  it("preserves argv, stdout, and exit status", async () => {
    const directory = await mkdtemp(join(tmpdir(), "opencode-macos-sudo-test-"))
    const fakeSudo = join(directory, "real-sudo")
    const testShim = join(directory, "sudo")
    await writeFile(fakeSudo, "#!/bin/sh\nprintf '%s\\n' \"$@\"\nexit 23\n", { mode: 0o700 })
    await copyFile(sourceShim, testShim)
    const content = await readFile(testShim, "utf8")
    await writeFile(testShim, content.replace("/usr/bin/sudo", fakeSudo), { mode: 0o700 })
    await chmod(testShim, 0o700)

    const result = await run(testShim, ["--", "space value", "", "'quoted'", "$(not-executed)"], {
      PATH: `${directory}:/usr/bin:/bin`,
    })
    assert.equal(result.code, 23)
    assert.deepEqual(result.stdout.split("\n").slice(0, -1), ["--", "space value", "", "'quoted'", "$(not-executed)"])
  })
})
