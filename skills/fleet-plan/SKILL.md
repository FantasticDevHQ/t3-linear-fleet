---
name: fleet-plan
description: "Plan a feature as a Linear project that the T3 Linear Fleet (project-run) can build unattended. Researches the codebase, writes an intent brief (problem, users, definition of done, non-goals, decisions), drafts the fewest reviewable tickets with EARS requirements and traceable acceptance criteria that can be proven inside the PR before merge, has a fresh agent cold-read them, asks the user every open question in one batch with recommended defaults, and only creates the tickets once a readiness gate passes. Use when the user wants to plan a feature for the fleet, for project-run, or for parallel agents in T3 Code, or asks for fleet-plan by name. Works with the Linear MCP or linear-cli, or as drafts."
metadata:
  author: kellykampen
  version: "3.1.0"
---

# Fleet Plan

Turn a feature into **one Linear project and the fewest tickets that agents can build without asking anyone anything.** All the talking happens here, once. After the plan is approved, agents execute, get everything green, and hand back evidence. A question an agent has to ask mid-build is a planning bug.

Three rules shape everything below:

- **Decide now, not later.** Every product decision is settled before a ticket is created. Agents may make reversible implementation choices on their own; they should never have to guess what the user wants.
- **Plan only what the feature needs.** No speculative requirements, options, or "while we're here" work. Over-planned tickets become over-engineered code. Non-goals are as important as goals.
- **Acceptance happens inside the PR.** Every acceptance criterion can be proven from the PR's branch, CI, or preview deploy before merge. Anything that can only be checked after release goes on a separate, non-blocking list.

Precision is not over-engineering. Exact requirements and plain wording are what let an agent build the right thing without asking; over-engineering is scope or code the feature does not need.

## Writing standards

Every ticket and the intent brief use the same standards:

- **Wording: ASD-STE100.** Write all text you put in Linear in Simplified Technical English: short sentences, active voice, one meaning per word, the same term for the same thing. Use it as a style guide, not a certified process. Do not rewrite text you quote verbatim. See [references/ste-writing.md](references/ste-writing.md).
- **Requirements: EARS, for behavioral tickets.** Number them `REQ-001` and up, one requirement per ID, using the ubiquitous, event-driven ("When X, the system shall Y"), state-driven, unwanted-behavior, or optional-feature pattern. Config, chore, and migration tickets can skip numbered requirements. See [references/requirements-ears.md](references/requirements-ears.md).
- **Quality: ISO/IEC/IEEE 29148.** Each requirement is necessary, appropriate, unambiguous, complete, singular, feasible, verifiable, correct, and conforming. The readiness gate checks this. Same reference.
- **Traceability: REQ → AC → TEST.** Every REQ has at least one acceptance criterion tagged with its ID, and every criterion's Verify line names its test or check. Nothing gets built without a check. See [references/traceability.md](references/traceability.md).
- **Diagrams: Mermaid.** The intent brief carries a small flowchart of ticket dependencies. A complex ticket can add a REQ → AC → TEST graph. Same reference.
- **Risky changes.** Put **WARNING:** (data loss, security, injury) or **CAUTION:** (damage to systems, money, schedule) first, then the step, then the risk. A WARNING item is a costly decision: it is settled in planning or escalated during execution, never decided silently by an agent.

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

## Ticket dependencies
<Mermaid flowchart: foundation ticket first, A --> B means A blocks B>
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
<1-3 sentences: what this delivers, for whom, and which part of the definition of done it serves.
A user story ("As a <role>, I want <action>, so <result>") is a good way to write this; it is optional.>

## Requirements   (behavioral tickets)
- **REQ-001:** When <trigger>, the <system> shall <response>.

## Scope
- <what to build>
- Decided: <decisions that apply here, so the agent does not re-decide them>

## Non-goals
- <ticket-specific exclusions, if any beyond the project's>

## Acceptance criteria
- [ ] **AC-1 (REQ-001):** Given <state>, When <action>, Then <observable result with real values>.
  - Verify: <test (file › name), preview-deploy check, or command that runs on the PR>
  - Evidence: <what CI or the preview produces: test pass, recording, output>

## Design
<screenshot/PNG of the target, plus optional source link (UI tickets only)>

## Fleet
- Model: <model ID, exactly as T3 Code lists it, e.g. claude-fable-5-2>
- Effort: <low | medium | high | xhigh | max>
- Why: <optional: one line on why this model and effort>
```

Plus, as Linear fields: parent project, labels (an area and a type, from the team's existing labels), estimate, and **blocker links** for every real dependency.

### t3-fleet labels

The orchestrator reads these labels to schedule the work, so set them on every ticket they apply to. They belong to one multi-select label group named **t3-fleet**:

| Label | Set it when |
| --- | --- |
| `t3-fleet-foundation` | The ticket is shared groundwork that other tickets build on (schema, contracts, dependencies, registry stubs, spikes). |
| `t3-fleet-local-only` | The ticket needs something only the user's local machine has: a device, simulator, local service, or local credential. |
| `t3-fleet-schema-change` | The ticket changes the database schema after the foundation. These run one at a time. |
| `t3-fleet-risky` | The ticket touches security, permissions, auth, data, money, migrations, or concurrency, or has a WARNING step. It gets a cross-provider review before merge. |

Create the **t3-fleet** group once, at the **workspace** or the **top-most parent team**, so every team below inherits it. Never create it, or any of its labels, on a leaf team. See Step 7.

Linear label names are unique across the workspace and every team, ignoring case and group. That is why each label carries the `t3-fleet-` prefix: a plain `risky` or `foundation` often exists already on some team. If a create still fails on a name clash, report it; do not rename another team's label without asking.

Describe **what**, not **how**. Name decisions already made; leave the implementation to the agent. A ticket that dictates files, functions, and patterns invites both over-engineering and wrong guesses about the codebase.

### Model and effort

Every ticket says which model builds it and how hard that model thinks, in its **Fleet** section. `Model` and `Effort` are required; `Why` is optional. The section is plain text, so the user changes a ticket's model by editing one line. `project-run` reads it and checks it at preflight.

1. **Get the candidates from `fleet-models`.** It reads the user's favorite models from T3 Code's settings, keeps the user's own rating of each one, and asks about new favorites once. Put any question it needs into this skill's one batch (Step 5). Outside T3 Code, with no settings file, ask for the candidate models in that batch instead.
2. **Choose per ticket** with the rule in `fleet-models` ("Choosing a model for a ticket"): intelligence first, then taste, then cost, with the ticket's labels and risk deciding the bar. Spread equal choices across providers. Write the reason in `Why`.
3. **Effort** is one of five levels: `low`, `medium`, `high`, `xhigh`, `max`. `project-run` maps it to each provider's own option. Special modes (for example "ultra" or "ultrathink") are never set here; the user asks for them in the run request.

Use the model ID exactly as `orchestrator_capabilities` lists it. Do not name a provider: the same model often runs under several, and `project-run` picks one that has capacity.

### Acceptance criteria that can be proven before merge

An acceptance criterion is a gate *before* merge. If it can only be checked after merge, it blocks the merge forever, and an unattended agent will loop, quietly skip it, or ask the user. So every criterion must be **provable from the PR alone**.

- Write criteria as **concrete examples with real values**: "Given a cart with 2 items, When the user pays with Stripe test card 4242…, Then the order shows Paid and a receipt email is queued." Use Given/When/Then for behavior.
- One observable condition per checkbox, tagged with the REQ it checks.
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

Do not create tickets in Linear until every box is checked. Show the user the brief and ticket list for one approval, as part of the question batch or right after it. When they approve, add `Approved: <date>` at the end of the intent brief. The orchestrator will not start without that line.

- [ ] The intent brief has a problem, users, a definition of done, non-goals, constraints, and decisions.
- [ ] No product decision is unresolved. Every cold-read guess is answered or explicitly delegated to the agent as a reversible choice.
- [ ] Every ticket has an outcome, scope with decisions, and at least one acceptance criterion.
- [ ] Every behavioral ticket has numbered EARS requirements, and each passes the 29148 checks: necessary, appropriate, unambiguous, complete, singular, feasible, verifiable, correct, conforming.
- [ ] Traceability has no gaps: every REQ has at least one tagged criterion, and every criterion's Verify names its test or check.
- [ ] Every criterion has a Verify that runs on the PR and an Evidence that CI or a preview produces. None depends on production, "after deploy," real users, time windows, dashboards, or another ticket merging.
- [ ] Post-release checks are in the brief's Release checks, not in tickets.
- [ ] Dependencies are blocker links, and they form no cycle. Shared groundwork is in a ticket labeled `t3-fleet-foundation`.
- [ ] Every ticket has a Fleet section with a `Model` from the candidate models and an `Effort` from `low`, `medium`, `high`, `xhigh`, `max`.
- [ ] t3-fleet labels are set where they apply (`t3-fleet-foundation`, `t3-fleet-local-only`, `t3-fleet-schema-change`, `t3-fleet-risky`).
- [ ] UI tickets have a design screenshot attached.
- [ ] Risky steps carry WARNING or CAUTION, and every WARNING decision is settled.
- [ ] The intent brief has the Mermaid dependency flowchart.
- [ ] Text follows ASD-STE100 style.
- [ ] Nothing is planned that the definition of done does not need.

## Step 7: Create it in Linear

Order matters:

1. Create the **project** with the intent brief as its description.
2. Create the **tickets**, parented to the project as you go, with labels and estimates.
3. In a second pass, once all IDs exist, add **blocker relations**.
4. Link **project-level dependencies** to the other projects this builds on.
5. If the user gave an execution order, set the project's visible issue order to match. Blocker links do not reorder rows, and priority is not an ordering tool.

Labels: discover before you create.

1. Read the team hierarchy, and the issue-label catalog with each label's owning team, parent group, and `inheritedFrom`. Follow every page. Project labels are a separate catalog and do not label issues.
2. Reuse workspace and inherited parent-team labels. Do not create a local variant such as `platform:cli` when an applicable workspace `cli` exists. A child team's copy with `inheritedFrom` set is an inherited definition, not a duplicate.
3. If the **t3-fleet** group does not exist yet, create it once at the workspace (when unrelated teams will use the fleet) or at the top-most parent team (when only that parent's teams will), as a multi-select group with the four labels above. Never create it on a leaf team. If a team-local copy already exists, tell the user and use it rather than adding another.
4. A catalog read can miss labels that belong to other teams' label groups. Read each relevant team's labels with the team filter, ask for groups too, and treat a name-clash error on create as the final check.
5. Verify labels and a provisional estimate on every ticket you create or revise.

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
