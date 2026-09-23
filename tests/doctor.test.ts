import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { homebrewPrefixFromBrewPath, recommendedPamLines } from "../src/doctor.js"

describe("doctor recommendations", () => {
  it("uses Intel Homebrew when detected", () => {
    assert.deepEqual(recommendedPamLines({ architecture: "x64", homebrewPrefixes: ["/usr/local"] }, true), [
      "auth       optional       /usr/local/lib/pam/pam_reattach.so ignore_ssh",
      "auth       sufficient     pam_tid.so",
    ])
  })

  it("does not recommend reattach by default", () => {
    assert.deepEqual(recommendedPamLines({ architecture: "arm64", homebrewPrefixes: [] }, false), [
      "auth       sufficient     pam_tid.so",
    ])
  })

  it("detects standard Homebrew prefixes", () => {
    assert.equal(homebrewPrefixFromBrewPath("/opt/homebrew/bin/brew"), "/opt/homebrew")
    assert.equal(homebrewPrefixFromBrewPath("/usr/local/bin/brew"), "/usr/local")
    assert.equal(homebrewPrefixFromBrewPath("/usr/local/bin/not-brew"), null)
  })

  it("falls back to the Intel module location on x64", () => {
    assert.equal(
      recommendedPamLines({ architecture: "x64", homebrewPrefixes: [] }, true)[0],
      "auth       optional       /usr/local/lib/pam/pam_reattach.so ignore_ssh",
    )
  })
})
