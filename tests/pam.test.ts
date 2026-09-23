import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { inspectPamConfig } from "../src/pam.js"

describe("PAM parsing", () => {
  it("finds active Touch ID and reattach modules", () => {
    const result = inspectPamConfig([
      `# local policy
auth optional /usr/local/lib/pam/pam_reattach.so ignore_ssh
auth sufficient pam_tid.so
`,
    ])
    assert.equal(result.touchIdConfigured, true)
    assert.equal(result.reattachConfigured, true)
  })

  it("ignores commented modules and similarly named files", () => {
    const result = inspectPamConfig([
      `#auth sufficient pam_tid.so
auth sufficient pam_tid.so.disabled
# auth optional pam_reattach.so
`,
    ])
    assert.equal(result.touchIdConfigured, false)
    assert.equal(result.reattachConfigured, false)
  })

  it("combines sudo_local and sudo", () => {
    const result = inspectPamConfig(["auth sufficient pam_tid.so", "auth required pam_opendirectory.so"])
    assert.equal(result.touchIdConfigured, true)
  })
})
