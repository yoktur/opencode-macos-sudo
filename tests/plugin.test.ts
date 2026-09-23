import { describe, it } from "node:test"
import assert from "node:assert/strict"
import plugin from "../index.js"

describe("OpenCode V2 plugin", () => {
  it("exports the current id/setup definition", () => {
    assert.equal(plugin.id, "opencode.macos-sudo")
    assert.equal(typeof plugin.setup, "function")
  })
})
