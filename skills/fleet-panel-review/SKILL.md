---
name: fleet-panel-review
description: "Get an independent verdict from a panel of three flagship models, one per provider, on a plan, a set of contracts, or a large feature. Each panelist works read-only and returns findings and a score out of 10; you check every finding against the source, settle disagreements, fix what you accept, and run a fresh round after fixes until the panel is satisfied or the budget ends, while keeping scope fixed. Records a per-round score table in the PR. Use for large or risky features, Wave-0 contracts, a plan before execution, or when the user asks for a panel or multi-provider review. For a single-reviewer loop on one PR, use fleet-review instead."
metadata:
  author: kellykampen
  version: "2.0.0"
---

# Fleet Panel Review

One reviewer has blind spots; three reviewers from three different providers rarely share them. Use a panel when a mistake would be expensive: a plan before agents execute it, shared contracts before parallel work builds on them, or a large feature before the human's final review. For an ordinary PR, `fleet-review` with one reviewer is enough.

## Before the panel

Give the panel the current state, not a state you already know is wrong. Fix known issues, address open review comments, and run the relevant checks first. If the user wants fresh ideas instead of a review of existing work, skip the fixes.

## Choose the panel

- **Three panelists, three providers.** In T3 Code, call `orchestrator_capabilities` (per machine if you use linked machines) and take the latest flagship model from three different providers, at high reasoning effort. Never hardcode a model ID. If the user named panelists, use those.
- If fewer than three providers are available, or a named panelist is missing, **report it**. Do not quietly substitute a second model from the same provider.
- Start each panelist as its own read-only task (in T3 Code, one `delegate_task` per panelist with a review role, in parallel). Every round uses new tasks.

## The brief

Panelists start with no history. Send each the same self-contained brief:

```text
You are one of three independent panelists, each from a different AI provider.
Review only: do not edit, commit, push, comment on PRs, or start subagents.

What to review: <repo URL + branch + commit, or the plan or contract text in full>
Goal: <the intent, in 2-3 sentences, with the definition of done>
Non-goals and constraints: <list>
Context already settled: <decisions; previous round's ledger if this is round 2+>

Give your own view, not a consensus. Return:
1. A score out of 10 for how well this achieves the goal.
2. Real defects only, ranked, each with a location and a concrete fix.
3. What is unnecessary and should be cut.
4. What would make it a 10.
Propose new machinery only to fix a real defect. Stay under ~700 words.
```

## While the panel works

Do not sit idle. When one panelist returns, check its findings against the source right away and decide what you accept, while the others still run. Do not edit the files under review until every panelist of the round has returned.

## Synthesize

When the round is complete:

- **Check every finding yourself.** A finding is real only if the source confirms it. Three panelists agreeing makes a finding likely, not certain.
- **Group** the findings: agreed by several panelists, raised by one, and disagreements.
- **Settle each disagreement** with evidence. When it is a judgment call, pick one option and say why.
- **Fight scope creep.** A panel will always suggest more. Accept a finding only if it fixes a real defect against the goal. Decline the rest in one line each, and list them as possible follow-ups.

Then fix what you accepted, with the smallest change.

## Rounds and stopping

A **round** is one full review by all three panelists. After you fix accepted findings, run a **fresh** round on the updated work, sending the previous round's ledger so panelists check what changed and what is still open.

Stop when:

- every panelist is satisfied, with no open real defect; or
- the remaining findings are all declined scope additions; or
- the budget ends (default 3 rounds). The end of the budget is not approval: report what is still open.

Do not let repeated rounds grow the scope. That is your job to prevent.

## Record the result

Report the useful findings, the disagreements and how you settled them, what you changed, what you declined, and the next steps. If the work ends in a PR, add this section to the PR description (before the agent line), and edit it as rounds complete rather than posting comments:

```markdown
### Panel review

Rounds: 2

| Panelist | Round 1 | Round 2 |
| --- | --- | --- |
| <provider model> | 6/10 | 8.5/10 |
| <provider model> | 7/10 | 9/10 |
| <provider model> | 6.5/10 | 8.5/10 |
```

If a panelist gives no score, write `no score`. Never invent one. A panelist added in a later round shows `—` for the rounds it missed. Without a PR, put the table in your final message.
