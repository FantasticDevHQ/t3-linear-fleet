import assert from "node:assert/strict";
import { test } from "node:test";
import { metadataVersion, readmeVersion } from "./skill-versions.mjs";

const skill = (body) => `---\nname: demo\n${body}\n---\n\n# Demo\n`;

test("reads metadata.version", () => {
  assert.equal(metadataVersion(skill('description: "x"\nmetadata:\n  author: a\n  version: "1.2.3"')), "1.2.3");
});

test("ignores a version outside metadata", () => {
  assert.equal(metadataVersion(skill('description: "x"\nother:\n  version: "9.9.9"\nmetadata:\n  author: a')), undefined);
});

test("ignores a version in the body", () => {
  assert.equal(metadataVersion(`${skill("metadata:\n  author: a")}\n  version: "9.9.9"\n`), undefined);
});

const readme = [
  "## Skills",
  "See [demo](./skills/demo/SKILL.md) (9.9.9) in the text.",
  "",
  "| Skill | Status | What it does |",
  "| --- | --- | --- |",
  "| [demo](./skills/demo/SKILL.md) | Ready (1.2.3) | Does things (2.0.0). |",
].join("\n");

test("reads the version from the table row only", () => {
  assert.equal(readmeVersion(readme, "demo"), "1.2.3");
});

test("a link outside the table is not a row", () => {
  assert.equal(readmeVersion("## Skills\nSee [demo](./skills/demo/SKILL.md) (1.2.3).", "demo"), undefined);
});

test("a row in another section does not count", () => {
  const other = "## Other\n| [demo](./skills/demo/SKILL.md) | Ready (1.2.3) | x |\n## Skills\n| Skill | Status |";
  assert.equal(readmeVersion(other, "demo"), undefined);
});

test("a row in a fenced example does not count", () => {
  const fenced = "## Skills\n```\n| [demo](./skills/demo/SKILL.md) | Ready (1.2.3) | x |\n```";
  assert.equal(readmeVersion(fenced, "demo"), undefined);
});

test("a row without a version has none", () => {
  assert.equal(readmeVersion("## Skills\n| Skill | Status | What it does |\n| --- | --- | --- |\n| [demo](./skills/demo/SKILL.md) | Ready | Does things. |", "demo"), undefined);
});

test("a standalone row in the Skills section does not count", () => {
  assert.equal(readmeVersion("## Skills\n| [demo](./skills/demo/SKILL.md) | Ready (1.2.3) | x |", "demo"), undefined);
});

test("a row in another table in the Skills section does not count", () => {
  const other = [
    "## Skills",
    "| Name | Note |",
    "| --- | --- |",
    "| [demo](./skills/demo/SKILL.md) | Ready (9.9.9) | x |",
    "",
    "| Skill | Status | What it does |",
    "| --- | --- | --- |",
    "| [demo](./skills/demo/SKILL.md) | Ready (1.2.3) | x |",
  ].join("\n");
  assert.equal(readmeVersion(other, "demo"), "1.2.3");
});
