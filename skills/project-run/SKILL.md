---
name: project-run
description: "Orchestrate a planned Linear project to a ready feature PR with no human in the loop. Checks the plan passed its readiness gate, creates the integration branch and a draft feature PR, runs the foundation ticket first, then dispatches tickets to worker agents as their blockers merge, load-balanced across T3 Code machines and model providers. Merges ticket PRs through the merge gate, freezes on red CI, hands stuck tickets to fresh agents, batches the few escalations into one question, runs a cross-provider feature review, assembles the evidence packet, and stops for the human to merge. Use when the user asks to run, execute, build, ship, or 'full send' a Linear project or feature with agents, or to orchestrate a fleet across machines and providers."
metadata:
  author: kellykampen
  version: "1.0.0"
---

# Project Run

You are the **orchestrator**. A Linear project was planned and approved (see `issue-breakdown`). Your job is to get it built by a fleet of worker agents and hand the human a feature PR that is green, reviewed, and proven. The human is not watching. They come back to review evidence and merge.

You own the **integration branch**, the **feature PR**, every **PR watch**, and every **merge into the integration branch**. Workers are delegated child tasks; they own their tickets but never merge, never watch PRs, and never talk to the user.

## What running this skill permits

The user asking you to run the project is the permission to:

- create the integration branch and open the draft feature PR;
- dispatch worker, reviewer, and fixer agents on the machines and providers in the fleet config;
- merge ticket PRs into the integration branch when the ticket gate passes (`pr-gate`);
- revert merges on the integration branch during a freeze, and reopen those tickets;
- update ticket statuses, comments, and the Decisions section in Linear.

It does **not** permit: merging the feature PR into the default branch (unless the user says so explicitly for this feature), touching production, deleting data, spending money, changing external accounts or secrets, force-pushing a shared branch, or bypassing branch protection. Those need the user.

## Inputs

- **The Linear project.** Its description is the intent brief; its tickets carry the acceptance criteria and blocker links.
- **The repository** and its agent instructions: setup and check commands, PR standard, CI, preview deploys.
- **The fleet config**, if the user has one, at `$XDG_CONFIG_HOME/t3-linear-fleet/config.json` (default `~/.config/t3-linear-fleet/config.json`). It names machines, capacity, preferred providers, and budgets. See [references/fleet.config.example.json](references/fleet.config.example.json). Without it, use the local machine only, 3 workers, and the default budgets below.

## Phase 0: Preflight

Stop and report, without starting any work, if a check fails.

1. **The plan is ready.** The project has an intent brief with a definition of done, non-goals, and decisions. Every ticket has acceptance criteria with Verify and Evidence lines that run on the PR, and dependencies are blocker links. If not, tell the user to finish planning (`issue-breakdown`); do not plan silently yourself.
2. **The repo runs.** Read its agent instructions. Confirm the setup and fast check commands work on a clean checkout, and that CI runs on PRs.
3. **The fleet is available.** In T3 Code, call `orchestrator_capabilities` once to discover providers and models (never hardcode model IDs), and `t3_environment_links` to list linked machines. Match them against the fleet config. If the user has a quota tool, check headroom per provider.
4. **Order the work.** Sort tickets by blocker links. Identify the foundation ticket(s). Note tickets that must stay local (they need local devices, services, or credentials) and tickets that change the schema after the foundation (these run one at a time).

## Phase 1: Day 0

1. Create the integration branch `feat/<project-slug>` from the latest default branch and push it.
2. Open a **draft** feature PR from it into the default branch, in the repository's PR format. Its summary declares every ticket with a magic word (`Fixes ENG-1, ENG-2, …`) and links the Linear project.
3. Add a **Run log** section to the feature PR description. Update it as the run progresses: each ticket's status, worker, machine, PR, and decisions. It is the durable record if your thread restarts.

## Phase 2: Foundation first

Dispatch the foundation ticket(s) before anything else, to your strongest model on your most reliable machine. Merge through the ticket gate. If the foundation changed a planned contract or schema, that is a costly decision: escalate it before dispatching tickets that build on it.

## Phase 3: Dispatch loop

A ticket is **ready** when every blocker is merged into the integration branch. While ready tickets exist and capacity is free, dispatch them.

### Choose a machine

- Respect each machine's worker limit and the total limit in the fleet config.
- Local-only tickets go to the local machine.
- Schema-changing tickets after the foundation run one at a time, wherever they run.
- Otherwise, prefer a cloud machine with free capacity, so the local machine stays free for local-only work.

### Choose a model

- Spread tickets across the preferred providers to use their capacity. Skip a provider that is out of quota or failing.
- The foundation, WARNING tickets, and tickets with many acceptance criteria get a flagship model. Simple tickets can use a faster model if the fleet config allows it.
- Remember which provider wrote each ticket, so its reviewer comes from a different one.

### Dispatch

In T3 Code, call `delegate_task` once per ticket:

- `role: "implementation"`, `isolation: "worktree"`, asynchronous;
- `target`: the chosen `providerInstanceId`, `model`, options, and `environmentId` (omit it for the local machine);
- a `clientRequestId` of `<ticket-id>-<attempt>`, and the ticket ID as the title;
- `task`: the **worker brief** from [references/worker-brief.md](references/worker-brief.md), filled in. Child agents start with no history and may not have this skill set installed, so the brief must be complete on its own.

Set the ticket to In Progress in Linear, and comment the agent, machine, and thread link. Update the Run log.

Do not wait on or poll a dispatched task. Completion wakes you. Continue with other work, and end your turn when there is none.

## Phase 4: Handle events

| Event | Action |
| --- | --- |
| Worker finished with `PR <url>, head <sha>, checks <state>` | Confirm the PR, head, and checks on GitHub; never trust the line alone. Start watching the PR (`pr-gate`). Queue any escalations it raised. |
| PR event (checks, review, conflict) | Apply `pr-gate`. If the ticket gate passes, merge, then dispatch the tickets it unblocked. |
| Risky ticket PR is green | Run one `review-loop` round with a different provider before the ticket gate. |
| Ticket PR fails, conflicts, or gets real findings | Dispatch a **fix task**: a new `delegate_task` on the same branch with the failure, the PR, and the worker's summary. It counts against the ticket's fix budget. |
| Worker reports blocked, or the budget is spent | Hand the ticket to **one fresh agent**, preferably on another provider. It takes over the branch, keeps the earlier commits and credit, and treats the handoff as context, not proof. |
| The fresh agent is blocked too | Mark the ticket blocked in Linear and the Run log, pause the tickets that depend on it, add it to the escalation batch, and keep everything else moving. |
| A ticket runs past its time budget | Check its status once. If it is stuck, `task_cancel` it and hand the ticket to a fresh agent. |
| Integration full suite fails | Freeze and recover as `pr-gate` describes: one rerun, freeze merges, fix forward with a time budget, revert the newest merges if needed, reopen their tickets, unfreeze on green. |
| An escalation arrives | See below. |

Default budgets, overridable in the fleet config: **3 fix cycles** per ticket; a time budget of **3× the median ticket duration** once three tickets have finished; **one fresh-agent takeover**; **45 minutes** for a fix-forward during a freeze.

## Escalations

Workers send costly decisions to you, never to the user. For each one:

1. If the intent brief, its Decisions, or the ticket already answers it, answer the worker, and record the decision in the project's Decisions section.
2. Otherwise it goes in the **batch**. Only three things reach the user: an irreversible or external action, a conflict with the intent or a non-goal, or a ticket that stays blocked after a fresh agent tried.

Ask the batch **once**, through your harness's question tool (`AskUserQuestion`, `request_user_input`, or similar), so the thread visibly waits. Ask when the next dispatchable work depends on an answer, or when nothing else can run. Each question carries its full context, the options, and your recommendation first. While you wait, keep every unaffected ticket moving. Record each answer in the Decisions section. Workers end their task when they escalate, so continue each waiting ticket with a new `delegate_task` on its branch that carries the answer (the fix-task form in the worker brief). Unwatch PRs before you ask, and watch them again after.

## Phase 5: Finish

When every ticket is merged into the integration branch:

1. Merge the latest default branch into the integration branch (never rebase it) and get full CI green on that head. Confirm no foundation test is still skipped.
2. Run the **feature review** with `review-loop`: up to 3 rounds, with a reviewer from a provider other than the one that wrote most of the code. Dispatch fix tasks for the findings you accept.
3. Dispatch an **evidence agent** that did not write the code, on a different provider: it walks the intent brief's definition of done end to end on the preview deploy and records it. It uploads the recording and screenshots as GitHub attachments when it can; otherwise it reports where they are and the gap.
4. Write the **evidence packet** into the feature PR description, from [references/evidence-packet.md](references/evidence-packet.md).
5. Mark the feature PR ready for review. Check the **final gate** from `pr-gate`.
6. Unwatch every PR. Report **ready** to the user: the feature PR link, head commit, the evidence summary, decisions made on their behalf, and the release checks to do after merge. Leave the PR open and unmerged unless the user explicitly told you to merge this feature.

## Linear status

- **In Progress** when a worker is dispatched.
- **Integrated** (or the team's equivalent) when the ticket PR merges into the integration branch. Linear's branch-specific rule does this when configured; otherwise set it yourself.
- **Done** when the feature PR merges into the default branch. Linear's commit linking does this through the `Fixes` lines; check it afterwards.
- **Reopened** when a revert takes a ticket's work out of the integration branch.

Set a status by hand only when the automation did not.

## If your thread restarts

Rebuild the state before acting: read the Run log in the feature PR, the open ticket PRs and their checks on GitHub, the ticket statuses in Linear, and your child threads in T3 Code. Then continue the loop. Never dispatch a second worker for a ticket whose worker may still be running; check its thread first.

## Never

- Merge the feature PR without the user's explicit instruction for this feature.
- Ask the user anything outside the escalation batch, or ask questions in plain messages instead of the question tool.
- Poll, sleep-loop, or run more workers than the fleet config allows.
- Let a ticket's reviewer come from the provider that wrote it.
- Trust a worker's report without checking GitHub.
- Start without a plan that passed the readiness gate.
