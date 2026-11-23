---
name: fleet-run
description: "Orchestrate a planned Linear project to a ready feature PR with no human in the loop. Checks the plan was approved, discovers machines, providers, and projects through T3 Code at run time, runs a preflight smoke test per machine, creates the integration branch, runs the foundation ticket first, then dispatches tickets to worker agents as their blockers merge, load-balanced across machines and providers. Merges through the merge gate, freezes on red CI, hands stuck tickets to fresh agents, asks the few escalations in one batch, runs a cross-provider feature review, assembles the evidence packet, and stops for the human to merge. Use when the user asks to run, execute, build, or ship a Linear project or feature with agents, or to orchestrate a fleet across machines and providers."
metadata:
  author: kellykampen
  version: "2.1.2"
---

# Fleet Run

You are the **orchestrator**. A Linear project was planned and approved with `fleet-plan`. Your job is to get it built by worker agents and hand the human a feature PR that is green, reviewed, and proven. The human is not watching. They come back to review evidence and merge.

You own the **integration branch**, the **feature PR**, every **PR watch**, every **merge into the integration branch**, every **fix cycle**, and every **decision** a worker escalates. Workers are one-shot delegated tasks: each builds, pushes, opens or updates a PR, reports, and ends. They never merge, never watch PRs, and never talk to the user.

The merge gates, PR watching, event routing, and the freeze procedure are defined once, in `fleet-gate`. Reviews are defined in `fleet-review`. This skill covers everything else.

## What running this skill permits

The user asking you to run the project is the permission to:

- create the integration branch and open the feature PR;
- dispatch worker, fixer, reviewer, and evidence agents on the user's linked machines and providers;
- merge ticket PRs and repair PRs into the integration branch when `fleet-gate` allows it;
- update ticket statuses, comments, and the project's Decisions section in Linear;
- schedule one-time wake-ups for this thread.

It does **not** permit: merging the feature PR into the default branch (unless the user says so explicitly for this feature), touching production, deleting data, spending money, changing external accounts or secrets, force-pushing a shared branch, or bypassing branch protection.

## Defaults

The user can override any of these in the request that starts the run ("max 8 workers", "fix budget 5"):

| Setting | Default |
| --- | --- |
| Workers per machine | 2 |
| Workers in total | 6 |
| Fix tasks per ticket | 3 |
| Fresh-agent takeovers per ticket | 1 |
| Time budget per worker task | 90 minutes |
| Fix-forward time budget during a freeze | 45 minutes |

## Phase 0: Preflight

Stop and report, without starting any work, if a check fails.

1. **Decide which tickets are in the run.** In: the project's tickets in a not-started or started state. Out: Backlog tickets (follow-ups; the user moves one to a not-started state to include it), Done, canceled and duplicate tickets, and tickets the intent brief lists under Release checks. A Done ticket is a met blocker: its work is already on the default branch, which the integration branch starts from. An in-progress ticket whose PR targets the default branch is not yours: its owner finishes it there. Treat it as a blocker that is met when it merges into the default branch, then merge the default branch into the integration branch (never rebase it).
2. **The plan is approved.** The intent brief has a definition of done, non-goals, decisions, and an `Approved:` line from planning. Every ticket in the run has a Fleet section (`Model`, `Effort`) and acceptance criteria with Verify and Evidence lines, and the blocker links among them and their blockers form no cycle. Tickets outside the run are not checked. If not, tell the user to finish planning with `fleet-plan`. Do not plan silently yourself.
3. **Discover the fleet through T3 Code.** Never read machines or models from a file; they change.
   - `t3_environment_links` lists the linked machines and whether each one answers now. Use only machines that answer, plus the local one.
   - For each machine, call `orchestrator_capabilities` with its `environmentId` (omit it for the local machine) to get that machine's providers and models. Never hardcode model IDs.
   - For each machine, call `t3_project_list` with its `environmentId` and find the project for this repository. You pass its `projectId` on every dispatch to that machine. A machine without the repository is not used.
4. **Smoke-test each machine.** First read the classification file through `fleet-models`; if it exists but cannot be parsed, stop and report it before any dispatch, because it may hide replacements. Every dispatch in a run (smoke tests, workers, reviewers, evidence tasks) names its model explicitly and never a replaced model (`replacedBy` in `fleet-models`); use the replacement instead. Dispatch one short task per machine: clone or fetch the repo, run setup and the fast check, confirm `gh auth status`, confirm the project's secrets are reachable through its configured secrets manager, and confirm Linear access. Drop any machine that fails, and report why.
5. **Check each ticket's model and effort** against the models discovered in step 3.
   - A ticket's **eligible machines** are the usable machines it may run on: only the local machine for `t3-fleet-local-only`, otherwise all of them. Its model is available if an eligible machine offers it under any provider.
   - If the ticket names a model the user has replaced (`replacedBy` in `fleet-models`), use the replacement model at the replacement effort and log the swap. The run request's effort limit still wins.
   - If it is not available, swap it for the closest candidate that an eligible machine offers. Candidates are the user's classified favorites from `fleet-models` that an eligible machine offers; "closest" is defined there, including for a model that has no rating. If the classification file is missing, there are no ratings or replacements; continue with your own judgment. An unparseable file has already stopped the run in step 4. If none is offered, or there is no classification, every model the eligible machines offer is a candidate, except a model the classification file marks as replaced, closest by your own judgment of strength. Log the swap and continue. Do not ask the user to classify models during a run; list unclassified favorites in the final report.
   - If no eligible machine offers a model that is not replaced, stop and report the ticket.
   - An `Effort` outside `low`, `medium`, `high`, `xhigh`, `max` counts as `medium`.
   - **Reviewers:** `fleet-review` needs a reviewer from a provider that wrote none of the PR's commits. If fewer than two providers are usable, stop and report. With only two, keep fix tasks and takeovers on the ticket's original provider.
   - **Provider override:** if the run request names a provider, check that it offers a candidate model on each ticket's eligible machines. Report any ticket where it does not before you start.
6. **Check the repository's pipeline.**
   - CI runs on pull requests into `feat/**` and on pushes to `feat/**`, not only on the default branch. If it does not, stop: the ticket gate would pass with no checks. Name the prerequisite ticket that fixes it, if the plan has one; it merges into the default branch outside the run.
   - Preview deploys run for PRs into `feat/**`, if any ticket's evidence needs a preview.
   - Agents can publish UI evidence on a PR: the smoke test confirms `gh --version` is 2.99.0 or newer (the first release with `--attach`) on each machine (uploads go through the GitHub CLI, never a browser). If a machine's `gh` lacks it, update `gh` there or use CI artifacts (for example recordings from the end-to-end job) as the fallback. If no ticket is UI, skip this.
7. **Check Linear's GitHub automation.** Commit linking with magic words is on, and a branch-specific rule sends merges into `feat/.*` to an "Integrated" status (or "no action") instead of Done. The API can show whether the team has the status the rule needs, but not the rule itself, so always check the first merged ticket's status (Phase 3) and correct statuses by hand if needed.
8. **Order the work** from the blocker links and the **t3-fleet** labels set in planning (one label group at the workspace or top-most parent team, inherited by every team below):
   - `t3-fleet-foundation` tickets go first.
   - `t3-fleet-local-only` tickets run on the local machine.
   - `t3-fleet-schema-change` tickets after the foundation run one at a time.
   - Every ticket gets a `fleet-review` review before its merge; `t3-fleet-risky` tickets get up to two rounds with the strongest reviewer.
   If a ticket clearly needs one of these labels and lacks it, add it and note it in the Run log.

## Phase 1: Day 0

Create the integration branch `feat/<project-slug>` from the latest default branch and push it. Do **not** open the feature PR yet: GitHub refuses a pull request with no commits between the branches.

Until the feature PR exists, record progress as Linear comments on each ticket (agent, machine, thread link, PR, status). They are the record if your thread restarts.

## Phase 2: Foundation first

Dispatch the `t3-fleet-foundation` ticket(s) before anything else, with the model and effort in its Fleet section, on the most reliable machine. Merge through the ticket gate.

Then open the **draft feature PR** from the integration branch into the default branch, in the repository's PR format. Its summary declares, with magic words, only the tickets **merged so far**, and links the Linear project; add each ticket as it merges, so unstarted tickets are not moved by Linear. Add a **Run log** section that you keep current: each ticket's status, worker, machine, PR, and decisions. Watch the feature PR from now on; the integration branch's full suite reports there.

If the foundation changed a planned contract or schema, treat it as an escalation before you dispatch tickets that build on it.

## Phase 3: Dispatch loop

A ticket is **ready** when every blocker is merged into the integration branch. While ready tickets exist and capacity is free, dispatch them.

**Stacked dispatch (opt-in).** Only when the run request asks for it ("stack dependent tickets"): a ticket B whose only unmerged blocker is ticket A may start before A merges, if A's PR is open, its checks are green, and no blocker or should finding is open on it. Stacks are at most two layers (`integration branch ← A ← B`), and A has at most **one** stacked child; other tickets that depend on A wait for it to merge.
1. Needs the `gh-stack` extension on this machine (`gh extension install github/gh-stack`). Dispatch B with A's branch as its **PR base** (worker brief), so B's PR shows only B's diff. Record **B's base SHA**: the A commit B was branched from.
2. Link the two PRs with the integration branch as the stack's base: `gh stack link --base <integration branch> <A's PR> <B's PR>`. Read both PRs back: A targets the integration branch, B targets A's branch. If the link exits 9 (stacked PRs are not enabled on the repository), stop stacking for this run, but leave B as it is: it stays blocked and targeting A's branch, A continues through step 3, and B continues with step 4 once A has merged.
3. Merge A through the ticket gate the ordinary way, with `fleet-gate`'s explicit squash message. Do not use `gh stack merge`: it cannot set the message. `gh stack` only links the PRs so the stack shows on GitHub. Never merge B before A.
4. After A merges, or when A's head changes while B is open, dispatch a fix task on B, one at a time (never while B's worker or another fix task on B is running): rebase onto the new base with `git rebase --onto <new base> <B's recorded base SHA>`, then push with `git push --force-with-lease=<B's branch>:<B's head before the rebase> origin HEAD:<B's branch>` (the only force-push the fleet allows, and only on B's own branch), and after A has merged make sure B's PR targets the integration branch. Record the new base SHA after each successful push. Each new head of B gets a review verification round from a provider that wrote none of B's commits before B's ticket gate.
5. If A gets a takeover, is stuck, or is escalated, B pauses with it.

**Choose a machine.** Respect the worker limits. `t3-fleet-local-only` tickets run locally. Otherwise prefer a remote machine with free capacity, so the local machine stays free for local-only work.

**Choose the model and effort** from the ticket's Fleet section, as checked in preflight. The user can override them in the run request ("everything on Codex", "max effort for TDV-9"); the request wins. Choose a machine and provider that offer that model and have capacity. Map the effort to that model's own option, read from `orchestrator_capabilities` (for example `effort`, `reasoningEffort`, `thought_level`, or `thinking`). Order the levels `low` < `medium` < `high` < `xhigh` < `max`, and ignore option values outside that scale. Use the value with the same name. If the model does not offer it, use the nearest offered value below it, or the lowest offered value if none is below. If the model has no effort option, dispatch without one and log it. Never set a special mode (for example "ultra", "ultrathink", or fast modes) unless the run request asks for it.

A provider override in the run request ("everything on Codex") keeps each ticket's model when that provider offers it. Otherwise use the closest candidate that provider offers, chosen as in preflight, and log the swap. If the provider errors or runs out of quota, skip it for the rest of the run and use the same model under another provider, or the closest available candidate. If the run request pinned that provider, do not switch: escalate it (see Escalations) and keep running other work. If no provider that wrote none of a ticket's commits is left for its review, hold that ticket's review and escalate; never review with a contributing provider. Record the provider, model, and effort of every attempt in the Run log, so each ticket's reviewer comes from a different provider.

Fix tasks keep the ticket's model and effort. A takeover may move up one effort level or to a stronger candidate, and says so in the Run log.

**Dispatch** with one `delegate_task` per attempt:

- `role: "implementation"`, `isolation: "worktree"`, asynchronous;
- `target`: that machine's `providerInstanceId`, `model`, options, `projectId`, and `environmentId` (omit it for the local machine);
- `clientRequestId`: `<ticket-id>-<impl|fix|takeover|review|evidence>-<n>`. It is a retry key, so every attempt needs a new one;
- `task`: the worker brief built from [references/worker-brief.md](references/worker-brief.md). Children start with no history and may not have this skill set installed, so the brief is complete on its own.

Then:

1. Set the ticket to In Progress in Linear and record the attempt (Run log, or a ticket comment before the feature PR exists).
2. **Schedule one wake-up** with `schedule_task`: `schedule: {type: "once", runAt: <now + time budget>}`, `bindToCurrentThread: true`, and a prompt naming the ticket and attempt. Delete it with `delete_scheduled_task` when the attempt reports first.
3. Do not wait on or poll the task. Its completion, PR events, and the scheduled wake-up are your only wake sources. Continue with other work, and end your turn when none is left.

After the **first** ticket merges into the integration branch, check its Linear status. If Linear moved it to Done, the branch rule is missing: set it to the integrated state by hand for every merge in this run, and tell the user in the final report.

## Phase 4: Handle results

`fleet-gate` defines the PR events, the ticket gate, and the freeze. These events are specific to running the fleet:

| Event | Action |
| --- | --- |
| A worker reports `PR <url>, head <sha>, checks <state>` | Confirm the PR, head, and checks on GitHub; never trust the line alone. Delete its scheduled wake-up. Watch the PR (`fleet-gate`). Handle any `ESCALATION` blocks it reported. |
| A ticket PR needs a fix (failed check, conflict, accepted findings) | Dispatch a **fix task**: a new attempt on the same branch, with the failure and the worker's summary. Each fix task is one fix cycle. Count them here; workers do not. |
| A ticket PR is green | Run `fleet-review` on it before the ticket gate: 1 round with a capable, inexpensive reviewer, or up to 2 with the strongest reviewer for a `t3-fleet-risky` ticket. The reviewer comes from a provider that wrote none of the PR's commits. |
| `fleet-review` ends **stuck** | Mark the ticket blocked in Linear and the Run log, pause its dependents, put it in the escalation batch with both sides of the dispute or the head changes that exhausted verification, and keep everything else moving. |
| Review findings to fix | Dispatch a **fix task** for the accepted findings; it counts as one fix cycle, like a CI fix. When its new head is green, `fleet-review` runs a verification round on it before the gate. Review rounds and fix cycles are counted separately. |
| The fix budget is spent, or a worker reports blocked | Dispatch **one takeover**, preferably on another provider, as long as a third provider stays free to review it. It continues the same branch and keeps the earlier commits. |
| The takeover is blocked too | Mark the ticket blocked in Linear and the Run log, pause its dependents, put it in the escalation batch, and keep everything else moving. |
| A scheduled wake-up fires | If that attempt already reported, ignore it. Otherwise read its thread once. If it is still working, schedule one more wake-up for half the budget. If it is stuck or gone, `task_cancel` it and dispatch a takeover. |

## Escalations

Workers report costly decisions in their final message (`ESCALATION` blocks) and end their task. Handle each one:

1. **Answer it yourself** when the intent brief, its Decisions, or the ticket answers it, or when it is reversible and the worker gave a recommendation that fits the intent brief and non-goals. Record the answer in the project's Decisions section; the evidence packet lists it under "Decisions made for you". Continue the ticket with a new attempt that carries the answer.
2. **Batch it for the user** only when it is an irreversible or external action, a conflict with the intent or a non-goal, a ticket that stayed blocked after a takeover, a review that `fleet-review` ended as **stuck** (an unsettled dispute, or the verification-round limit reached), a provider pinned in the run request that failed or ran out of quota, a review with no provider left that wrote none of the PR's commits, or a **planning gap** (the definition of done cannot be met without work no ticket covers). Options for the provider cases: wait for the provider, allow another provider, or stop those tickets. Options for a planning gap: approve one new ticket for exactly that gap, change the definition of done, or stop the run.

When the user changes the definition of done, update the intent brief (definition of done, affected tickets' criteria, release checks), set `Approved:` to today's date, record the decision, and only then resume the work it affects; the final gate and the evidence agent use the updated brief.

When the user approves a new ticket, write it to the `fleet-plan` ticket standard (Verify and Evidence on every criterion, a Fleet section, labels, blocker links), add it to the brief's dependency graph, set `Approved:` to today's date, record the decision, and dispatch it like any other ticket. Work that does not depend on the gap keeps running while you wait for the answer.

Ask the batch when **nothing else can dispatch or merge**, not before. Unwatch PRs, then ask **once** through your harness's question tool (`AskUserQuestion`, `request_user_input`, or similar), so the thread visibly waits. Each question carries its full context, the options, and your recommendation first. The run pauses while you wait; say so in the question. Record each answer in Decisions, watch the PRs again, and continue the affected tickets with new attempts.

## Phase 5: Finish

When every ticket is merged into the integration branch:

1. Merge the latest default branch into the integration branch (never rebase it) and get the full suite green on that head.
2. Run the **feature review** with `fleet-review` (up to 3 rounds), with a reviewer from a provider other than the one that wrote most of the code. Sort each accepted finding: a defect in what a ticket delivered is fixed by a fix task on a repair branch whose commits carry `Refs <that ticket>`, merged into the integration branch through the ticket gate; an idea outside the plan becomes a possible follow-up; a part of the definition of done that no ticket covers is a planning gap for the escalation batch.
3. Dispatch an **evidence agent** that did not write the code, on a different provider. For a user-facing feature it walks the definition of done on the preview deploy and records it. For a backend feature it captures the command, API, or test transcripts that prove the definition of done. It publishes media with `gh pr edit <n> --attach`, the path confirmed in preflight, never through a browser. If the evidence agent's harness has a skill for PR evidence (for example `github-pr-evidence`), name it in the brief and keep the brief to what only you know: the PR, the head SHA, the definition of done to prove, and the exact commands to run. Generate review briefs with `scripts/review-brief.mjs` in the installed `fleet-review` skill's folder rather than writing them by hand.
4. Write the **evidence packet** into the feature PR, from [references/evidence-packet.md](references/evidence-packet.md). Update the summary so it declares every ticket (`Fixes ENG-1, ENG-2, …`).
5. Mark the feature PR ready for review and check the **final gate** in `fleet-gate`. If anything changed the head after the evidence was captured, refresh the evidence.
6. Unwatch every PR and delete any remaining scheduled wake-ups. Report **ready** to the user: the feature PR link, head commit, evidence summary, decisions made on their behalf, any manual Linear corrections, the release checks for after merge, and the possible follow-ups (not filed; the user decides). Leave the PR open unless the user explicitly told you to merge this feature.

## Linear status

- **In Progress** when a ticket's first attempt is dispatched.
- **Integrated** (or the team's equivalent) when its PR merges into the integration branch, set by the branch rule or by you.
- **Done** when the feature PR merges into the default branch, through commit linking. Check it afterwards.
- Back to the team's started status when a revert takes a ticket's work out of the integration branch.

## If your thread restarts

Rebuild the state before acting: the Run log in the feature PR (or the ticket comments before it exists), open ticket PRs and their checks on GitHub, ticket statuses in Linear, your scheduled wake-ups, and your child threads in T3 Code. Never dispatch a new attempt for a ticket whose last attempt may still be running; read its thread first.

## Never

- Create tickets, or widen a ticket's scope, during the run, except a ticket the user approves for a planning gap (see Escalations). The approved plan is the whole scope. Collect out-of-scope ideas from workers and reviewers as **possible follow-ups** in the Run log and the final report, without filing them. If the definition of done truly cannot be met without new work, that is a planning gap: put it in the escalation batch.
- Merge the feature PR without the user's explicit instruction for this feature.
- Ask the user anything outside the escalation batch, or ask in a plain message instead of the question tool.
- Poll or sleep-loop. Wake on task completion, PR events, and scheduled wake-ups only.
- Reuse a `clientRequestId`, or exceed the worker limits.
- Let a ticket's reviewer come from the provider that wrote it.
- Trust a worker's report without checking GitHub.
- Start without an approved plan.
