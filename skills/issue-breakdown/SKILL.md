---
name: issue-breakdown
description: "Plan a feature as a Linear project that agents can build unattended. Researches the codebase, writes an intent brief (problem, users, definition of done, non-goals, decisions), drafts the fewest reviewable tickets with acceptance criteria that can be proven inside the PR before merge, has a fresh agent cold-read them, asks the user every open question in one batch with recommended defaults, and only creates the tickets once a readiness gate passes. Use whenever the user wants to break down, scope, plan, or ticket a feature, epic, or initiative, write Linear issues or acceptance criteria, or prepare work for parallel agents, even if they don't say Linear. Works with the Linear MCP or linear-cli, or as drafts."
metadata:
  author: kellykampen
  version: "2.0.0"
---

# Issue Breakdown

Turn a feature into **one Linear project and the fewest tickets that agents can build without asking anyone anything.** All the talking happens here, once. After the plan is approved, agents execute, get everything green, and hand back evidence. A question an agent has to ask mid-build is a planning bug.

Three rules shape everything below:

- **Decide now, not later.** Every product decision is settled before a ticket is created. Agents may make reversible implementation choices on their own; they should never have to guess what the user wants.
- **Plan only what the feature needs.** No speculative requirements, options, or "while we're here" work. Over-planned tickets become over-engineered code. Non-goals are as important as goals.
- **Acceptance happens inside the PR.** Every acceptance criterion can be proven from the PR's branch, CI, or preview deploy before merge. Anything that can only be checked after release goes on a separate, non-blocking list.

## Step 1: Research before asking

Read before you write. Inspect the codebase (structure, existing patterns, similar features, test setup, how previews and CI run), the repo's agent instructions, and related Linear projects and issues. Never ask the user something the code or Linear can answer. Note what you found; it grounds your defaults in Step 5.

If the goal itself is unclear (you cannot say what problem this solves or for whom), ask that first, in one short question, before drafting anything.

## Step 2: Write the intent brief

The intent brief is the Linear project description. Every agent reads it before touching a ticket, so it must stand alone. Keep it under one page:

```markdown
## Problem
<who has what problem today, in 2-3 sentences>

## Users
<the actors this serves>

## Definition of done
<what a user can see or do when this ships, as concrete observable outcomes>

## Non-goals
- <explicitly out of scope; things a helpful agent might otherwise add>

## Constraints
<platform, performance, compatibility, deadlines, budget, security>

## Decisions
- <decision> — <one-line reason>   (settled choices; updated during execution)

## Release checks (post-merge, non-blocking)
- <things only provable after release: production metrics, rollout, live third-party behavior>
```

Also record **project-level dependencies**: which other existing projects this one builds on. Most projects depend on at least one; link them in Step 7.

## Step 3: Draft the tickets

### Size and count

A ticket is **one independently reviewable unit of work that lands as one PR.** There is no point cap. Split a ticket only when it has two outcomes that could ship separately, or when one PR could not prove all its criteria. Merge tickets that are too trivial to review on their own. Fewer, meaningful tickets beat many slivers.

Still set a provisional estimate on the team's configured scale; it is for planning, not a reason to split.

### Foundation first (Wave 0)

When tickets share schema, contracts, types, new dependencies, or central registries (routes, navigation, i18n keys), put that shared groundwork in one **foundation ticket** that blocks the rest. It also stubs the registry entries later tickets fill in, and adds contract-level tests. Real technical unknowns become a **time-boxed spike** in the foundation, not a guess inside a ticket.

### What every ticket contains

```markdown
**Title:** <the outcome, e.g. "Members can bulk-archive from the members table">

## Outcome
<1-3 sentences: what this delivers, for whom, and which part of the definition of done it serves>

## Scope
- <what to build>
- Decided: <decisions that apply here, so the agent does not re-decide them>

## Non-goals
- <ticket-specific exclusions, if any beyond the project's>

## Acceptance criteria
- [ ] **AC-1:** <one observable condition with real values>
  - Verify: <test, preview-deploy check, or command that runs on the PR>
  - Evidence: <what CI or the preview produces: test name, recording, output>

## Design
<screenshot/PNG of the target, plus optional source link (UI tickets only)>
```

Plus, as Linear fields: parent project, labels (`area:<domain>` and a type), estimate, and **blocker links** for every real dependency.

Describe **what**, not **how**. Name decisions already made; leave the implementation to the agent. A ticket that dictates files, functions, and patterns invites both over-engineering and wrong guesses about the codebase.

### Acceptance criteria that can be proven before merge

An acceptance criterion is a gate *before* merge. If it can only be checked after merge, it blocks the merge forever, and an unattended agent will loop, quietly skip it, or ask the user. So every criterion must be **provable from the PR alone**.

- Write criteria as **concrete examples with real values**: "Given a cart with 2 items, paying with Stripe test card 4242… shows the order as Paid and queues a receipt email." Given/When/Then is useful for behavior, not required.
- One observable condition per checkbox.
- If you cannot fill in **Verify** with something that runs on the PR, rewrite the criterion or move it to Release checks.
- A dependency on another ticket is a **blocker link**, never a criterion.

Swap the live world for a controlled one:

| Not provable before merge | Provable in the PR |
| --- | --- |
| Works in production | Works on the PR's preview deploy against staging or sandbox services |
| Users can pay with real cards | Checkout succeeds with the provider's test-mode keys on the preview |
| The provider's webhook updates the order | A test sends a signed sample payload to the handler; the order updates |
| The nightly job sends digests | A test invokes the job with fixture data; digests are rendered and queued |
| Error rate stays low after release | Error paths are tested and new errors are logged with a tag (monitoring becomes a release check) |
| Migration works on production data | Migration runs forward and back on a production-shaped fixture in CI |
| The event shows on the analytics dashboard | A test asserts the event is emitted with the right payload |
| The page is fast for users | A performance budget check on the preview passes in CI |
| Enabled for everyone | Flag on: new behavior works. Flag off: old behavior unchanged (rollout is a release check) |

## Step 4: Cold read by a fresh agent

You cannot see your own gaps. Before asking the user anything, give the intent brief and drafted tickets to a **fresh agent with no history**, ideally on a different model provider, as a read-only task. Ask it, for each ticket:

1. What would you have to guess or ask to build this?
2. Can each acceptance criterion be proven before merge, using only this PR?
3. Is anything here not needed for the definition of done, or excluded by a non-goal?

In T3 Code, use `orchestrator_capabilities` to pick a model and `delegate_task` with a review role. Elsewhere, use your harness's subagent. Fix what you can from the code; carry the rest into Step 5.

## Step 5: One batch of questions

Ask the user **once**, in a single batch, through your harness's question tool (for example `AskUserQuestion` or `request_user_input`) so the thread visibly waits. Group it in three parts:

1. **Decisions needed**, each with your recommended default first, grounded in what you found in Step 1.
2. **Assumptions** you will make unless the user objects.
3. **Non-code checklist**, which causes most unattended stalls: credentials and external accounts, secrets in the project's secrets manager, seed or fixture data, design assets, copy and wording, feature flags, preview-deploy and sandbox availability.

Put full context in each question so it reads on its own. Fold every answer into the intent brief's Decisions and the affected tickets. Ask a follow-up only when an answer opens a genuinely new product decision.

## Step 6: Readiness gate

Do not create tickets in Linear until every box is checked. Show the user the brief and ticket list for one approval.

- [ ] The intent brief has a problem, users, a definition of done, non-goals, constraints, and decisions.
- [ ] No product decision is unresolved. Every cold-read guess is answered or explicitly delegated to the agent as a reversible choice.
- [ ] Every ticket has an outcome, scope with decisions, and at least one acceptance criterion.
- [ ] Every criterion has a Verify that runs on the PR and an Evidence that CI or a preview produces. None depends on production, "after deploy," real users, time windows, dashboards, or another ticket merging.
- [ ] Post-release checks are in the brief's Release checks, not in tickets.
- [ ] Dependencies are blocker links. Shared groundwork is in a foundation ticket.
- [ ] UI tickets have a design screenshot attached.
- [ ] Nothing is planned that the definition of done does not need.

## Step 7: Create it in Linear

Order matters:

1. Create the **project** with the intent brief as its description.
2. Create the **tickets**, parented to the project as you go, with labels and estimates.
3. In a second pass, once all IDs exist, add **blocker relations**.
4. Link **project-level dependencies** to the other projects this builds on.
5. If the user gave an execution order, set the project's visible issue order to match. Blocker links do not reorder rows, and priority is not an ordering tool.

Labels: inspect the workspace and inherited team label catalog first and reuse existing labels. Do not create local duplicates such as `platform:cli` when a workspace `cli` exists. Project labels are a separate catalog. Verify labels and a provisional estimate on every ticket you create or revise.

Tool notes for `linear-cli`, including project relations and the description-body pitfall, are in [references/linear-cli.md](references/linear-cli.md). With the Linear MCP or another client, map the same fields.

Finish by reporting the project link, the tickets in dependency order, and the decisions recorded.

## How tickets connect to code

So agents and humans link work the same way:

- Work on a ticket happens on a branch named with Linear's copied branch name, which contains the ticket ID.
- Every commit for a ticket carries a Linear magic word in its body: `Fixes ENG-123` when it completes the ticket, `Refs ENG-123` for partial work. Linear links commits only through magic words.
- Each ticket lands as one PR into the feature's integration branch. The final PR to the default branch lists every ticket again (`Fixes ENG-1, ENG-2`), because Linear does not re-detect tickets that were merged into a feature branch.

## Gotchas

- **Criteria that need a merge to verify** are the most common planning bug. Run every criterion through the table above.
- **"How" in tickets** reads as helpful and causes over-engineering and wrong guesses. State outcomes and decisions only.
- **Over-splitting** fragments context and multiplies PR overhead. Split on independent outcomes, never on a point count.
- **Design tickets without the image** get guessed at. Attach the PNG even when a prototype link exists; links rot and need auth.
- **Relations need a second pass.** You cannot link A to B until both exist.
- **Project dependencies are a different mechanism from issue relations** and are easy to drop. The Linear MCP and `linear-cli rel` do not create them; see the reference for `projectRelationCreate` and its anchor orientation, where the reverse order silently does nothing.
- **`linear-cli -d` takes the markdown text, not a file path.** Pass `-d "$(cat body.md)"`; `-d body.md` stores the path string as the ticket body.
