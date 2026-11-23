#!/usr/bin/env node
// Usage:
//   review-brief.mjs <pr-url | owner/repo#n> [--ticket <file>] [--check "<command>: <result>"]...
//                    [--paths "<path> ..."] [--round <n> --ledger <file> --since <sha>]
//
// Prints a fleet-review brief (the "The brief" format in SKILL.md) for one review round.
// It pins the PR's base and head SHAs and reads the acceptance criteria (with their Verify and
// Evidence lines) from the PR body's Acceptance section, or from the ticket's when the PR has
// none. --ticket is the ticket description saved as Markdown; its
// Outcome and Non-goals sections become the brief's Intent and Non-goals. For round 2 and later,
// pass the ledger and the head the last round reviewed: the brief then lists only the open
// finding IDs and the diff since that head.
// Requires: gh (authenticated). Read-only: it never writes to GitHub or Linear.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Returns the body of a `## <name>` section (case-insensitive), or "". */
export function section(markdown, name) {
  const lines = (markdown ?? "").split("\n");
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${name}\\b`, "i").test(l.trim()));
  if (start < 0) return "";
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line.trim())) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

/**
 * Extracts acceptance criteria from the first `## Acceptance criteria` section (or, failing that,
 * the first `## Acceptance...` section that lists AC-n items): each AC item plus its indented
 * Verify and Evidence lines. Returns [] when there is no such section. Throws when a list item in
 * the chosen section has no AC-n identifier, so a malformed checklist is never silently dropped.
 */
export function acceptanceCriteria(markdown) {
  const headings = (markdown ?? "").split("\n").filter((l) => /^##\s+Acceptance/i.test(l.trim()));
  const names = headings.map((h) => h.trim().replace(/^##\s+/, ""));
  const ordered = [...names.filter((n) => /^Acceptance criteria\b/i.test(n)), ...names];
  for (const name of ordered) {
    const body = section(markdown, name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const items = body.split("\n").filter((l) => /^[-*]\s/.test(l));
    const explicit = /^Acceptance criteria\b/i.test(name);
    if (!items.length || (!explicit && !items.some((l) => /\bAC-\d+\b/.test(l)))) continue;
    const bad = items.filter((l) => !/\bAC-\d+\b/.test(l));
    if (bad.length) throw new Error(`acceptance items without an AC-n ID in "${name}": ${bad.join(" | ")}`);
    const out = [];
    for (const line of body.split("\n")) {
      if (/^[-*]\s/.test(line)) out.push(line.trim());
      else if (/^\s+[-*]\s*(Verify|Evidence)\s*:/i.test(line)) out.push(`  ${line.trim()}`);
    }
    return out;
  }
  return [];
}

/** Open finding IDs from a ledger: every ID whose status is not fixed, declined, or resolved. */
export function openFindings(ledger) {
  return (ledger ?? "")
    .split("\n")
    .map((l) => l.trim().split(/\s+/))
    .filter(([id, , status]) => /^F\d+$/.test(id ?? "") && !/^(fixed|declined|resolved)$/i.test(status ?? ""))
    .map(([id]) => id);
}

export function buildBrief(d) {
  const round = d.round ?? 1;
  const followUp = round > 1;
  const diffBase = followUp ? d.since : d.baseSha;
  const intent = section(d.ticket, "Outcome") || section(d.prBody, "Summary") || "(none found: pass --ticket)";
  const nonGoals = section(d.ticket, "Non-goals") || "(none listed)";
  const fromPr = acceptanceCriteria(d.prBody);
  const acs = fromPr.length ? fromPr : acceptanceCriteria(d.ticket);
  if (!acs.length) throw new Error("no acceptance criteria with AC-n IDs in the PR body or the ticket");
  const lines = [
    "Review only. Do not edit, commit, push, comment on PRs, or start subagents.",
    `Repo: https://github.com/${d.repo}.git   Branch: ${d.headRef}   Base: ${d.baseSha}   Head: ${d.headSha}`,
    `Get the code: clone or fetch the repo, then \`git fetch origin pull/${d.number}/head\` (works for forks too).`,
    ...(followUp
      ? [
          `Also fetch the head the last round reviewed: \`git fetch origin ${d.since}\` (GitHub serves commits by SHA).`,
          `If that fails because the branch was rewritten, review the full diff \`git diff ${d.baseSha}...${d.headSha}\` instead and say so.`,
        ]
      : []),
    `Diff: git diff ${followUp ? `${d.since} ${d.headSha}` : `${diffBase}...${d.headSha}`}${d.paths ? ` -- ${d.paths}` : ""}`,
    `Intent: ${intent.replace(/\n+/g, " ")}`,
    `Non-goals: ${nonGoals.replace(/\n+/g, " ")}`,
    `PR: ${d.url}`,
    "Acceptance criteria:",
    ...acs.map((l) => `  ${l}`),
    `Checks run: ${d.checks?.length ? d.checks.join("; ") : "(see the PR's checks on this head)"}`,
    "",
  ];
  if (followUp) {
    const open = openFindings(d.ledger);
    lines.push(
      `This is round ${round}. The previous round reviewed ${d.since}. Open findings from the ledger:`,
      ...(d.ledger ?? "")
        .trim()
        .split("\n")
        .filter((l) => open.includes(l.trim().split(/\s+/)[0]))
        .map((l) => `  ${l.trim()}`),
      "",
      `Check only the open finding IDs (${open.length ? open.join(", ") : "none"}) and the code changed since ${d.since}.`,
      "Mark each old ID `resolved` or `still open: <reason>`. Raise a new finding only for the changed code.",
      "",
    );
  }
  lines.push(
    "First, for each acceptance criterion, check that its Verify result and Evidence on the PR prove it on this head.",
    "Report each as `AC-n verified` or `AC-n not proven: <reason>`. Then read the surrounding code. Find:",
    "- bugs and broken callers;",
    "- acceptance criteria the change does not meet, or does not prove;",
    "- code, tests, guards, options, or abstractions the intent does not need (over-engineering);",
    "- tests that were weakened, skipped, or deleted compared with the base;",
    "- work that a non-goal excludes.",
    "Skip style unless it hides a bug. Judge the code and the evidence on the PR. Pending or",
    "running CI is not a finding: the merge gate checks CI separately.",
    "",
    "Severity:",
    "- blocker: the intended case is wrong, a criterion is not met, or there is a security or data-loss risk.",
    "- should: a real bug that callers will hit within the intent.",
    "- nit: everything else (other paths, rare cases, style, small performance costs, extra compatibility).",
    "",
    "Reply:",
    `VERDICT: APPROVE ${d.headSha} or CHANGES`,
    "F1 [blocker|should|nit] <file>:<line> <claim>. Fix: <suggestion>",
    "(Keep finding IDs stable across rounds.)",
  );
  return lines.join("\n");
}

export function parsePrRef(ref) {
  const url = /github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/.exec(ref);
  const short = /^([^/\s]+\/[^#\s]+)#(\d+)$/.exec(ref);
  const m = url ?? short;
  if (!m) throw new Error(`cannot parse PR reference: ${ref}`);
  return { repo: m[1], number: m[2] };
}

function main(argv) {
  if (!argv.length || argv.includes("-h") || argv.includes("--help")) {
    console.error(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 12).join("\n"));
    process.exit(argv.length ? 0 : 2);
  }
  const { repo, number } = parsePrRef(argv.shift());
  const opts = { checks: [] };
  while (argv.length) {
    const flag = argv.shift();
    const val = argv.shift();
    if (val === undefined) throw new Error(`${flag} needs a value`);
    if (flag === "--ticket") opts.ticket = readFileSync(val, "utf8");
    else if (flag === "--check") opts.checks.push(val);
    else if (flag === "--paths") opts.paths = val;
    else if (flag === "--round") opts.round = Number(val);
    else if (flag === "--ledger") opts.ledger = readFileSync(val, "utf8");
    else if (flag === "--since") opts.since = val;
    else throw new Error(`unknown flag ${flag}`);
  }
  if ((opts.round ?? 1) > 1 && (!opts.ledger || !opts.since)) {
    throw new Error("--round 2 and later need --ledger <file> and --since <sha>");
  }
  const pr = JSON.parse(
    execFileSync("gh", ["pr", "view", number, "--repo", repo, "--json", "url,body,headRefOid,headRefName,baseRefOid,state"], {
      encoding: "utf8",
    }),
  );
  if (pr.state !== "OPEN") console.error(`warning: PR is ${pr.state}`);
  console.log(
    buildBrief({
      ...opts,
      repo,
      number,
      url: pr.url,
      prBody: pr.body,
      headRef: pr.headRefName,
      headSha: pr.headRefOid,
      baseSha: pr.baseRefOid,
    }),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
