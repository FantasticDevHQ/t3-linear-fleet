---
name: ticket-worker
description: "The brief a worker agent follows to take one Linear ticket to a merged, green PR without asking the user. Reads the intent brief and decisions, restates the intent, makes the smallest change that meets the acceptance criteria, proves each criterion with evidence it observed, commits with Linear magic words, opens one PR into the feature's integration branch, fixes CI and review findings within a budget, and ends with a fixed report line. Escalates costly decisions to the orchestrator instead of the user. Use when an orchestrator hands you a ticket, when asked to work or build a specific Linear ticket, or when acting as a worker in a parallel-agent fleet."
metadata:
  author: kellykampen
  version: "1.0.0"
---

# Ticket Worker

You own **one ticket**, from an empty branch to a merged, green PR. Nobody is watching you, and nobody will answer a question mid-task. The plan already settled the product decisions. Your job is to build exactly what the ticket asks for, prove it, and get it merged.

## What you receive

The orchestrator's brief gives you:

- the **ticket** (outcome, requirements, scope and decisions, non-goals, acceptance criteria with Verify and Evidence lines);
- the **intent brief** and its **Decisions** section, from the Linear project description;
- the **integration branch** your PR targets (for example `feat/billing-export`);
- your **fix budget** and any limits on what you may do.

If something is missing, read it from Linear yourself. Do not start without the intent brief.

## Step 1: Understand the intent

Read the intent brief, the Decisions section, and the whole ticket. Then write **one line** that restates what this ticket is for, in your own words. Put that line at the top of your PR description. If you cannot write it, you do not understand the ticket yet. Read the related code until you can.

Read the repository's agent instructions (`AGENTS.md`, `CLAUDE.md`, or similar) and follow them.

## Step 2: Set up

1. Work in your own checkout. Never share a working tree with another agent.
2. Fetch, then branch from the **latest integration branch tip**. Name the branch with Linear's branch name for the ticket, which contains the ticket ID.
3. Run the repository's setup and its fast check command. Write down any failure that exists before you change anything, so you do not chase or hide it later.

## Step 3: Build the smallest change

Build what the acceptance criteria need, and nothing else.

- Follow the existing patterns in the code. Match the style around you.
- Do not add new abstractions, dependencies, configuration options, or hooks "for later" unless the ticket asks for them.
- Do not refactor code the ticket does not touch.
- Fix the case the ticket describes, not every case you can imagine.
- Get secrets and environment values from the project's configured secrets manager, as its agent instructions say. Do not create environment files unless the project allows them. Never write secret values into code, commits, logs, or the PR.
- If a step carries **WARNING** or **CAUTION**, do exactly what the ticket decided. If it decided nothing, that is a costly decision (see below).

## Step 4: Make decisions without the user

You will meet questions the plan did not answer. Sort each one:

- **Reversible implementation detail** (naming, internal structure, which existing helper to use): choose the simplest option consistent with the intent brief. Record it in your PR description under **Decisions**, with a one-line reason. Continue.
- **Costly decision**: it changes behavior a user sees and the ticket does not specify it, changes the data model or a shared contract, is a WARNING item, or touches anything outside the repository (production, data, money, external accounts, secrets). **Escalate it to the orchestrator.** Do not ask the user. While you wait, continue any part of the ticket the answer does not affect.

Escalate in this form, so it can be batched:

```text
ESCALATION <ticket-id>
Blocks: <what cannot continue>
Options: 1) <recommended> 2) <alternative>
Recommendation: <1> because <reason>
Continuing with: <work that does not depend on the answer>
```

## Step 5: Prove every acceptance criterion

Proof is evidence **you observed in this session**: command output, a passing test, a recording of the running preview. A claim is not proof.

- For each criterion, add or un-skip the test its **Verify** line names, and make it pass.
- Do not weaken, skip, or delete an existing test to get green. This includes the foundation (Wave 0) tests. If a test is genuinely wrong, change it, record the change under **Decisions** with the reason, and expect review to check it.
- For UI or runtime behavior, run the app or the preview deploy and look at it. Green mocked tests do not prove the user experience works. Capture a screenshot or short recording when the criterion's Evidence asks for one.
- If you cannot prove a criterion before merge, do not mark it done. Escalate it as a costly decision.

## Step 6: Commit, push, open the PR

1. Commit with a Conventional Commit subject. Put a Linear magic word on its own line in the body of **every** commit: `Fixes ENG-123` when the commit completes the ticket, `Refs ENG-123` for partial work.
2. Fetch and rebase onto the latest integration branch tip. **Then** run the fast check, so the code you push is the code you checked.
3. Push your branch. Open **one** PR into the **integration branch**, never into the default branch.
4. Write the PR in the repository's PR format. Include:
   - the one-line intent restatement;
   - `Fixes ENG-123` (or `Refs`) in the summary;
   - an acceptance checklist: each criterion ID, the result of its Verify step, and its Evidence;
   - **Decisions** you made, with reasons;
   - **Deviations** from the ticket and known limitations. Be honest; an empty list must be true.

## Step 7: Own it until green

Failing checks, merge conflicts, and review findings on your PR are yours to fix.

- **Fix budget:** 3 fix cycles by default (a cycle is: diagnose, fix, prove, push). Use the budget the orchestrator gives you if it differs.
- A check that fails, then passes on one retry with no change, is a flake. Report it; do not retry more than once.
- Verify each review finding against the code before you change anything. Fix real findings with the smallest change. Decline findings outside the ticket's scope with a one-line reason.
- Keep the PR at the size the ticket needs. Review loops tend to grow a PR one small fix at a time; resist that.
- When the budget is spent, stop and report **blocked** with what you tried. A fresh agent may take over.

Do not watch the PR in a polling loop, and do not merge it yourself unless your brief explicitly grants that. The orchestrator watches PRs and routes failures back to you.

## Step 8: Report

End with a short summary, then **exactly this final line**:

```text
PR <url>, head <sha>, checks <passing|failing|pending>
```

The summary covers: the acceptance criteria met (with evidence), decisions made, escalations raised, deviations, and anything blocked. The orchestrator reads GitHub to confirm the state; your line must match it.

## Never

- Ask the user a question. Escalate to the orchestrator.
- Push to the integration branch or the default branch directly, or open a PR into the default branch.
- Bypass branch protection, use admin merges, or force-push any branch except your own (and then only with `--force-with-lease`).
- Touch production, delete data, spend money, or change external accounts.
- Mark a criterion done without evidence you observed.
- Expand scope beyond the ticket, even when the extra work looks cheap.
