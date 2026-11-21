---
name: review-loop
description: "Budgeted code review by a model from a different provider than the author. Sends a self-contained, read-only brief; grades findings blocker / should / nit; checks for bugs, missed acceptance criteria, over-engineering, weakened tests, and non-goal leakage; answers each finding with the smallest fix or a written reason; keeps a ledger; and stops on approval, budget end, or a stuck dispute. Two rounds for risky tickets, up to three for a whole feature. Use before merging a risky ticket PR, before the final feature PR, or whenever the user asks for an independent or cross-provider review loop."
metadata:
  author: kellykampen
  version: "1.2.0"
---

# Review Loop

An author reviewing its own diff repeats its own blind spots. This loop gets an independent review from a **different model provider**, then fixes only what matters. It is a quality gate, not a way to grow the PR.

## When to run it

| Target | Budget |
| --- | --- |
| **Risky ticket PR** (labeled `t3-fleet-risky` in planning: security, permissions, auth, data, money, migrations, concurrency, any WARNING item) | 2 rounds before the ticket gate, by the strongest available reviewer: one review, and one to verify the fixes |
| **Whole feature** (the integration branch against the default branch) | Up to 3 rounds, before the final gate |
| **Every other ticket PR** | 1 round before the ticket gate, by a capable, inexpensive reviewer. Add a second round only to verify fixes for a blocker or should finding. |

Extend a budget to 5 rounds only for security, data, or concurrency problems where a blocker or should finding stays open with evidence, or when the user asks. Stop early if a round returns only nits.

## Choose the reviewer

- Use a model from a **different provider** than the one that wrote the code under review. Choose it with `fleet-models` ("Choosing a reviewer") from the models `orchestrator_capabilities` offers: a capable, inexpensive model for ordinary tickets, and the strongest one for risky tickets and the whole feature. Never hardcode a model ID.
- Every ticket review **verifies acceptance**: for each criterion, the reviewer checks that its Verify result and Evidence on the PR actually prove it on the latest head, then reviews the diff.
- Start each round as a **new** read-only task: in T3 Code, `delegate_task` with a review role. Elsewhere, use your harness's subagent. Do not send review rounds as messages into an old thread.
- **One reviewer per round.** The reviewer must not start its own subagents.
- Do not edit the files under review while a round runs. A timeout, an error, or no reply is **not** approval.

## The brief

The reviewer gets no history, so the brief must stand alone:

```text
Review only. Do not edit, commit, push, comment on PRs, or start subagents.
Repo: <clone URL>   Branch: <head branch>   Base: <sha>   Head: <sha>
Get the code: clone or fetch the repo, then `git fetch origin <head branch>`.
Diff: git diff <base>...<head> [-- <paths>]
Intent: <one-line intent and the ticket outcome(s)>
Non-goals: <list>
Acceptance criteria: <IDs, with Verify lines>
Checks run: <commands and results, including known pre-existing failures>

Read the surrounding code. Find:
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
VERDICT: APPROVE or CHANGES
F1 [blocker|should|nit] <file>:<line> <claim>. Fix: <suggestion>
(Keep finding IDs stable across rounds.)
```

## Answer the findings

Check every finding against the code yourself, and grade it again. A finding about another path, a rare case, or a small cost is a nit, whatever label it came with.

- **Agree:** make the smallest fix. Prefer a fix that deletes or narrows code over one that adds a lock, cache, helper, or option. Add one focused test that fails without the fix when the intent needs it.
- **Disagree:** reply with evidence: `file:line`, a test, or output.
- **Nit or out of scope:** decline in one line, and list it as a possible follow-up.

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

- **Approved:** the reviewer says APPROVE on the current diff, no blocker or should is open, and you have no concern of your own.
- **Passed after fixes:** the budget is spent, but every blocker and should finding is fixed, and you verified each fix yourself against the code and the checks. Record that in the ledger. This passes the gate.
- **Stuck:** a blocker or should finding is still disputed after two replies, or one is still open when the budget ends. Write both sides in two or three lines each. The orchestrator puts it in its escalation batch; the human decides. **The end of the budget alone is not approval.**

## Record the result

Put the outcome in the PR's evidence: the number of rounds, the reviewer's model, the final verdict, the diff size before and after, and the fixed, disputed, and declined findings with their reasons. Do not invent a verdict the reviewer did not give.
