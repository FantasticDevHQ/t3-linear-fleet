import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acceptanceCriteria,
  buildBrief,
  openFindings,
  parsePrRef,
  section,
} from "../skills/fleet-review/scripts/review-brief.mjs";

const prBody = `## Summary
Fixes ENG-7. Members can archive in bulk.

## Acceptance criteria
- [x] **AC-1 (REQ-001):** Given 3 members, When archived, Then the table shows 0.
  - Verify: members.test.ts › bulk archive
  - Evidence: CI test pass
- [ ] **AC-2:** Given a viewer, When they try, Then 403.
  - Verify: auth.test.ts › viewer
Unrelated paragraph.
`;

const ticket = `## Outcome
Admins archive many members at once.

## Non-goals
- No undo.
`;

const base = {
  repo: "acme/app",
  url: "https://github.com/acme/app/pull/12",
  prBody,
  ticket,
  headRef: "feat/x",
  headSha: "bbbb",
  baseSha: "aaaa",
};

test("section reads a named section and stops at the next one", () => {
  assert.equal(section(ticket, "Outcome"), "Admins archive many members at once.");
  assert.equal(section(ticket, "Missing"), "");
});

test("acceptanceCriteria keeps each AC with its Verify and Evidence lines only", () => {
  const acs = acceptanceCriteria(prBody);
  assert.equal(acs.length, 5);
  assert.match(acs[0], /AC-1/);
  assert.match(acs[1], /Verify: members\.test\.ts/);
  assert.ok(!acs.some((l) => l.includes("Unrelated")));
});

test("openFindings skips fixed, declined, and resolved findings", () => {
  const ledger = "F1 blocker fixed abc\nF2 should disputed evidence\nF3 nit declined reason\nF4 should open\n";
  assert.deepEqual(openFindings(ledger), ["F2", "F4"]);
});

test("round 1 brief pins base and head and carries intent, non-goals and ACs", () => {
  const brief = buildBrief(base);
  assert.match(brief, /Base: aaaa {3}Head: bbbb/);
  assert.match(brief, /Diff: git diff aaaa\.\.\.bbbb/);
  assert.match(brief, /Intent: Admins archive many members at once\./);
  assert.match(brief, /Non-goals: - No undo\./);
  assert.match(brief, /AC-2/);
  assert.match(brief, /VERDICT: APPROVE bbbb or CHANGES/);
  assert.doesNotMatch(brief, /This is round/);
});

test("round 2 brief diffs from the last reviewed head and lists only open findings", () => {
  const brief = buildBrief({ ...base, round: 2, since: "cccc", ledger: "F1 blocker fixed x\nF2 should disputed y\n" });
  assert.match(brief, /Diff: git diff cccc\.\.\.bbbb/);
  assert.match(brief, /Check only the open finding IDs \(F2\)/);
});

test("without a ticket the intent falls back to the PR summary", () => {
  const brief = buildBrief({ ...base, ticket: undefined });
  assert.match(brief, /Intent: Fixes ENG-7\. Members can archive in bulk\./);
  assert.match(brief, /Non-goals: \(none listed\)/);
});

test("parsePrRef accepts URLs and owner/repo#n", () => {
  assert.deepEqual(parsePrRef("https://github.com/acme/app/pull/12"), { repo: "acme/app", number: "12" });
  assert.deepEqual(parsePrRef("acme/app#12"), { repo: "acme/app", number: "12" });
  assert.throws(() => parsePrRef("nope"));
});
