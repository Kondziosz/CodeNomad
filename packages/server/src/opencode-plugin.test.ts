import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, it } from "node:test"

import { buildOpencodeConfigContent, readOpencodeConfigContentFromDir } from "./opencode-plugin"

describe("buildOpencodeConfigContent", () => {
  it("creates config content with the CodeNomad plugin", () => {
    const content = buildOpencodeConfigContent(undefined, "file:///plugin.tgz")

    assert.deepEqual(JSON.parse(content), {
      "$schema": "https://opencode.ai/config.json",
      plugin: ["file:///plugin.tgz"],
    })
  })

  it("merges with existing JSONC content", () => {
    const content = buildOpencodeConfigContent(
      `{
        // user plugin
        "plugin": ["npm:user-plugin",],
        "model": "test-model",
      }`,
      "file:///plugin.tgz",
    )

    assert.deepEqual(JSON.parse(content), {
      "$schema": "https://opencode.ai/config.json",
      plugin: ["npm:user-plugin", "file:///plugin.tgz"],
      model: "test-model",
    })
  })

  it("does not duplicate the CodeNomad plugin", () => {
    const content = buildOpencodeConfigContent('{"plugin":["file:///plugin.tgz"]}', "file:///plugin.tgz")

    assert.deepEqual(JSON.parse(content).plugin, ["file:///plugin.tgz"])
  })
})

describe("readOpencodeConfigContentFromDir", () => {
  let workDir: string

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "codenomad-opencode-test-"))
  })

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true })
  })

  it("returns undefined for a missing directory", () => {
    assert.equal(readOpencodeConfigContentFromDir(join(workDir, "does-not-exist")), undefined)
  })

  it("returns undefined for an empty directory", () => {
    assert.equal(readOpencodeConfigContentFromDir(workDir), undefined)
  })

  it("reads the opencode.json file when present", () => {
    const configPath = join(workDir, "opencode.json")
    writeFileSync(configPath, '{"plugin":["npm:user-plugin"]}')

    const content = readOpencodeConfigContentFromDir(workDir)
    assert.equal(content, '{"plugin":["npm:user-plugin"]}')

    // Round-trip: feeding the dir's content into buildOpencodeConfigContent
    // preserves the user's plugin entry alongside the CodeNomad plugin.
    const merged = buildOpencodeConfigContent(content, "file:///plugin.tgz")
    assert.deepEqual(JSON.parse(merged).plugin, ["npm:user-plugin", "file:///plugin.tgz"])
  })

  it("prefers opencode.jsonc over config.json when both are present", () => {
    writeFileSync(join(workDir, "opencode.jsonc"), '{"plugin":["npm:jsonc"]}')
    writeFileSync(join(workDir, "config.json"), '{"plugin":["npm:json"]}')

    const content = readOpencodeConfigContentFromDir(workDir)
    assert.equal(content, '{"plugin":["npm:jsonc"]}')
  })
})
