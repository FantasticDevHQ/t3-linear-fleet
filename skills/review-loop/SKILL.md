---
name: review-loop
description: "Budgeted code review by a model from a different provider than the author. Sends a self-contained, read-only brief; grades findings blocker / should / nit; checks for bugs, missed acceptance criteria, over-engineering, weakened tests, and non-goal leakage; answers each finding with the smallest fix or a written reason; keeps a ledger; and stops on approval, budget end, or a stuck dispute. One round for risky tickets, up to three for a whole feature. Use before merging a risky ticket PR, before the final feature PR, or whenever the user asks for an independent or cross-provider review loop."
metadata:
  author: kellykampen
  version: "1.0.0"
---

# Review Loop

An author reviewing its own diff repeats its own blind spots. This loop gets an independent review from a **different model provider**, then fixes only what matters. It is a quality gate, not a way to grow the PR.

## When to run it

| Target | Budget |
| --- | --- |
| **Risky ticket PR** (security, permissions, auth, data, money, migrations, concurrency, any WARNING item) | 1 round, before the ticket gate |
| **Whole feature** (the integration branch against the default branch) | Up to 3 rounds, before the final gate |
| Ordinary ticket PRs | No review-loop. The fast check and the feature review cover them. |

Extend a budget to 5 rounds only for security, data, or concurrency problems where a blocker or should finding stays open with evidence, or when the user asks. Stop early if a round returns only nits.

## Choose the reviewer

- Use a model from a **different provider** than the one that wrote most of the code. In T3 Code, call `orchestrator_capabilities` and pick that provider's latest flagship model. Never hardcode a model ID.
- Start each round as a **new** read-only task: in T3 Code, `delegate_task` with a review role. Elsewhere, use your harness's subagent. Do not send review rounds as messages into an old thread.
- **One reviewer per round.** The reviewer must not start its own subagents.
- Do not edit the files under review while a round runs. A timeout, an error, or no reply is **not** approval.

## The brief

The reviewer gets no history, so the brief must stand alone:

```text
Review only. Do not edit, commit, push, comment on PRs, or start subagents.
Repo: <absolute path or URL>   Base: <sha>   Head: <sha>
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
Skip style unless it hides a bug.

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
- **Stuck:** a finding is still disputed after two replies, or the budget is spent. Write both sides in two or three lines each. Send it to the orchestrator as an escalation; the human decides. **The end of the budget is not approval.**

## Record the result

Put the outcome in the PR's evidence: the number of rounds, the reviewer's model, the final verdict, the diff size before and after, and the fixed, disputed, and declined findings with their reasons. Do not invent a verdict the reviewer did not give.
