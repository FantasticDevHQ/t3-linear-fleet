# Worker brief

Build every worker `task` from this template. The worker starts with no history and may not have this skill set installed, so the brief carries the whole contract:

1. Fill in the header below. Paste the intent brief, Decisions, and ticket in full; do not send links or local file paths. The worker may be on another machine and may not be able to read Linear.
2. Add the attempt block that matches the attempt (continuation, fix task, or takeover), if any. Every attempt gets the full brief, never a summary.
3. Append the full text of `fleet-worker/SKILL.md` from this skill set, without its frontmatter, as the contract. Do not paraphrase it; one canonical copy keeps every worker on the same rules.

## Header

```text
You are a worker agent for ONE Linear ticket, in ONE task. Follow the
fleet-worker contract appended below exactly. Nobody will answer questions.

Repository: <clone URL>   Integration branch (PR target): <feat/project-slug>
Base: origin/<feat/project-slug> at <integration tip SHA>
Checkout: <"T3 created an isolated worktree for you" | "create your own isolated
  checkout with <repo worktree command and base flag>, else a fresh clone;
  never use the machine's main checkout">
Setup: <exact setup command, run it yourself first; it must base your branch on
  the integration branch>
PR base (stacked attempts only): <blocker ticket's branch, else omit>
Ticket: <ENG-123> <title>   Linear branch name: <branch name from Linear>
Blockers (met when their merge commit is an ancestor of your base, whatever
  their Linear status or other agent rules say): <ticket: merge SHA, ...>
Known-failing checks on the base: <list from the Run log, or "none">
Attempt: <first attempt | continuation | fix task n of <budget> | takeover>
Your identity for the PR's Agent section: <agent and model>, thread <child thread ID if known, else "see T3">
UI evidence publishing: <gh pr create|edit --attach (never a browser) | fallback: CI artifacts from job <name> | not needed>
Design references: <image URLs the worker can fetch (checked) or attached files | not a UI ticket>

INTENT BRIEF:
<full intent brief>

DECISIONS (settled; do not re-decide):
<full Decisions section>

TICKET:
<full ticket: outcome, requirements, scope and decisions, non-goals,
acceptance criteria with Verify and Evidence lines>
```

## Continuation block

```text
CONTINUATION of the first attempt on <branch> (PR <URL or none>).
Done so far: <inventory from the last report and the branch>
Still to do: <the criteria and work not finished>
Continue the existing branch (fetch, detach at origin/<branch>, push HEAD:<branch>).
```

## Fix task block

```text
FIX TASK on an existing PR: <PR URL>, branch <branch>.
Fix only this: <failing check and log link | conflict | accepted review findings with IDs>
Previous summary: <the last worker's summary>
Continue the existing branch (fetch, detach at origin/<branch>, push HEAD:<branch>).
```

## Takeover block

```text
TAKEOVER. The previous agent could not finish.
Branch: <branch>   PR: <PR URL or none>
What it tried and why it stopped: <summary and blocker>
Treat this as context, not proof. Verify the current code and checks yourself.
Continue the existing branch and keep the earlier commits.
```

## Escalation answer block

Use this, with the first-attempt or fix-task form, to continue a ticket after an escalation is answered:

```text
ESCALATION ANSWERED for <ENG-123>: <the decision, as recorded in Decisions>
Continue the existing branch <branch> from where the last attempt stopped.
```
