import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { isSupportedPlatform, prependPath, SAFE_SYSTEM_PATH, shimDirectory } from "../src/path.js"

describe("PATH setup", () => {
  it("prepends the shim directory", () => {
    assert.equal(prependPath("/usr/local/bin:/usr/bin", "/plugin/bin", ":"), "/plugin/bin:/usr/local/bin:/usr/bin")
  })

  it("does not add the shim twice", () => {
    assert.equal(prependPath("/usr/bin:/plugin/bin:/bin", "/plugin/bin", ":"), "/plugin/bin:/usr/bin:/bin")
  })

  it("uses a conservative fallback when PATH is missing", () => {
    assert.equal(prependPath(undefined, "/plugin/bin", ":"), `/plugin/bin:${SAFE_SYSTEM_PATH}`)
  })

  it("activates only on macOS", () => {
    assert.equal(isSupportedPlatform("darwin"), true)
    assert.equal(isSupportedPlatform("linux"), false)
    assert.equal(isSupportedPlatform("win32"), false)
  })

  it("resolves the package shim directory without consulting PATH", () => {
    const sourceModule = pathToFileURL(resolve("src/index.ts")).href
    assert.equal(shimDirectory(sourceModule), resolve("bin"))
  })
})
