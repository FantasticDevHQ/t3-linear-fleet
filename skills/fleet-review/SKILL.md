---
name: fleet-review
description: "Budgeted code review by a model from a different provider than the author. Sends a self-contained, read-only brief; grades findings blocker / should / nit; checks for bugs, missed acceptance criteria, over-engineering, weakened tests, and non-goal leakage; answers each finding with the smallest fix or a written reason; keeps a ledger; and stops on approval, budget end, or a stuck dispute. One round for every ticket PR (up to two for risky tickets), up to three for a whole feature, plus verification of each new head. Use before merging any ticket PR, before the final feature PR, or whenever the user asks for an independent or cross-provider review loop."
metadata:
  author: kellykampen
  version: "2.1.0"
---

# Fleet Review

An author reviewing its own diff repeats its own blind spots. This loop gets an independent review from a **different model provider**, then fixes only what matters. It is a quality gate, not a way to grow the PR.

## When to run it

| Target | Budget |
| --- | --- |
| **Risky ticket PR** (labeled `t3-fleet-risky` in planning: security, permissions, auth, data, money, migrations, concurrency, any WARNING item) | Up to 2 review rounds before the ticket gate, by the strongest available reviewer. The second round runs when the first found a blocker or should finding. |
| **Whole feature** (the integration branch against the default branch) | Up to 3 rounds, before the final gate |
| **Every other ticket PR** | 1 review round before the ticket gate, by a capable, inexpensive reviewer. |

**Verification rounds** are separate from the budget. The gate needs the reviewer's approval of the PR's **latest head**, or of an earlier head when every later commit is a merge of the integration branch with no conflicts. Whenever the head changes after a review (a fix for findings, a CI fix, a takeover, or a conflict resolved by hand), run a verification round on the new head. It checks only the change and the open finding IDs. A merge of the integration branch with no conflicts needs no new review; the approval carries over (`fleet-gate` allows it). The same holds when every commit since the approved head changes only the PR body, or only prose Markdown files that no build, test, or tool reads (such as README, CHANGELOG, or a docs page with no doc build or doc tests). Code comments, configuration, generated files, and Markdown that a build, test, or tool consumes do not count. List the changed files in the review record instead of running a round; when you cannot show that nothing reads a file, run the verification round. When the only change is added tests (no production code, and no existing test changed or deleted), the verification round checks only that the new tests are real and pass; use the cheapest eligible reviewer at low effort. A ticket gets at most **3 verification rounds**. Another head change after that, or a verification round that raises a new blocker or should finding after the budget is spent, ends the loop as **stuck**.

Extend a budget to 5 rounds only for security, data, or concurrency problems where a blocker or should finding stays open with evidence, or when the user asks. Stop early if a round returns only nits.

## Choose the reviewer

- **Independence.** Track every provider that wrote commits on the PR: the first attempt, fix tasks, and a takeover. The reviewer must come from a provider that wrote none of them. If no such provider is available, the loop is **stuck** and the orchestrator escalates it; never use a contributing provider.
- Use a model from that **independent provider**. Choose it with `fleet-models` ("Choosing a reviewer") from the models `orchestrator_capabilities` offers: a capable, inexpensive model for ordinary tickets, and the strongest one for risky tickets and the whole feature. Never hardcode a model ID.
- Every ticket review **verifies acceptance**: for each criterion, the reviewer checks that its Verify result and Evidence on the PR actually prove it on the latest head, then reviews the diff.
- Start each round as a **new** read-only task: in T3 Code, `delegate_task` with a review role. Elsewhere, use your harness's subagent. Do not send review rounds as messages into an old thread.
- **One reviewer per round.** The reviewer must not start its own subagents.
- Do not edit the files under review while a round runs. A timeout, an error, or no reply is **not** approval.

## The brief

The reviewer gets no history, so the brief must stand alone. **Generate it, do not retype it:** `node <this skill's folder>/scripts/review-brief.mjs <PR URL> --ticket <ticket.md> [--check "<command>: <result>"]...` (the folder this SKILL.md was loaded from, for example `~/.claude/skills/fleet-review` or `~/.codex/skills/fleet-review`; run it from any directory) prints this brief with the base and head SHAs pinned, the ticket's Outcome and Non-goals, and the acceptance criteria with their Verify and Evidence lines, read from the PR body's Acceptance section or, when the PR has none, from the ticket. It stops with an error when it finds no AC-n criteria or a criterion without an ID. Save the ticket's description as `ticket.md` first. For round 2 and later, add `--round <n> --ledger <ledger file> --since <head the last round reviewed>`; the brief then lists only the open finding IDs and the diff since that head. Add only what the script cannot know (known pre-existing failures, what to focus on). Without the script, write the same brief by hand:

```text
Review only. Do not edit, commit, push, comment on PRs, or start subagents.
Repo: <clone URL>   Branch: <head branch>   Base: <sha>   Head: <sha>
Get the code: clone or fetch the repo, then `git fetch origin <head branch>`.
Diff: git diff <base>...<head> [-- <paths>]
Intent: <one-line intent and the ticket outcome(s)>
Non-goals: <list>
PR: <PR URL>
Acceptance criteria: <IDs, with their Verify and Evidence lines from the PR>
Checks run: <commands and results, including known pre-existing failures>

First, for each acceptance criterion, check that its Verify result and Evidence on the PR prove it on this head.
Report each as `AC-n verified` or `AC-n not proven: <reason>`. Then read the surrounding code. Find:
- bugs and broken callers;
- acceptance criteria the change does not meet, or does not prove;
- code, tests, guards, options, or abstractions the intent does not need (over-engineering);
- tests that were weakened, skipped, or deleted compared with the base;
- work that a non-goal excludes.
Skip style unless it hides a bug. Judge the code and the evidence on the PR. Pending or
running CI is not a finding: the merge gate checks CI separately.

Severity:
- blocker: the intended case is wrong, a criterion is not met, or there is a security or data-loss risk.
- should: a real bug that callers will hit within the intent.
- nit: everything else (other paths, rare cases, style, small performance costs, extra compatibility).

Reply:
VERDICT: APPROVE <head SHA> or CHANGES
F1 [blocker|should|nit] <file>:<line> <claim>. Fix: <suggestion>
(Keep finding IDs stable across rounds.)
```

## Answer the findings

Check every finding against the code yourself, and grade it again. A finding about another path, a rare case, or a small cost is a nit, whatever label it came with.

- **Agree:** make the smallest fix. Prefer a fix that deletes or narrows code over one that adds a lock, cache, helper, or option. Add one focused test that fails without the fix when the intent needs it.
- **Disagree:** reply with evidence: `file:line`, a test, or output.
- **Nit or out of scope:** decline in one line, and list it as a possible follow-up for the orchestrator's report. Never widen the PR or file a ticket for it.

Do not agree just to end the loop. After fixes, rerun the checks and compare the diff size. If review made the diff grow, cut first.

Keep a **ledger** for the whole loop:

```text
F1  blocker  fixed     <commit or evidence>
F2  should   disputed  <evidence>
F3  nit      declined  <one-line reason>
```

## Next round

Start another round only if budget remains **and** a blocker or should is open, or behavior changed after the last approval. Send the original brief, the ledger, and the change since the last round. Ask the reviewer to check only the open finding IDs and the changed code, and to mark each old ID `resolved` or `still open: <reason>`.

## Stop

- **Approved:** the reviewer says APPROVE on the PR's latest head (or on an earlier head followed only by conflict-free merges of the integration branch), every acceptance criterion is verified, no blocker or should is open, and you have no concern of your own. This is the only result that passes the ticket gate.
- **Stuck:** a blocker or should finding is still disputed after two replies, or one is still open when the budget ends. Write both sides in two or three lines each. The orchestrator puts it in its escalation batch; the human decides. **The end of the budget alone is not approval.**

## Record the result

Put the outcome in the PR's evidence: the number of rounds, the reviewer's model, the final verdict, the diff size before and after, and the fixed, disputed, and declined findings with their reasons. Do not invent a verdict the reviewer did not give.
