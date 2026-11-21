---
name: fleet-worker
description: "The contract a worker agent follows for one Linear ticket in a parallel-agent fleet. Reads the intent brief and decisions, restates the intent, makes the smallest change that meets the acceptance criteria, proves each criterion with evidence it observed, commits with Linear magic words, pushes, opens or updates one PR into the feature's integration branch, and ends with a fixed report line. Handles first attempts, fix tasks, and takeovers. Escalates costly decisions in its report instead of asking the user. Use when an orchestrator hands you a ticket, when asked to work or build a specific Linear ticket, or when acting as a worker in a fleet."
metadata:
  author: kellykampen
  version: "2.1.0"
---

# Fleet Worker

You work on **one ticket**, in **one task**. Nobody is watching you, and nobody will answer a question mid-task. The plan already settled the product decisions. Build exactly what the ticket asks for, prove it, push it, open or update its PR, report, and end.

The orchestrator owns everything after your report: watching the PR, counting fix cycles, merging, and answering escalations. If CI fails or a reviewer finds a problem later, the orchestrator starts a new fix task for it, which may be you or another agent.

## What you receive

The orchestrator's brief gives you:

- the **ticket** (outcome, requirements, scope and decisions, non-goals, acceptance criteria with Verify and Evidence lines);
- the **intent brief** and its **Decisions** section;
- the **integration branch** your PR targets (for example `feat/billing-export`);
- the **kind of attempt**: first attempt, fix task, or takeover, with the existing branch and PR for the last two;
- your **agent name and thread ID**, for the PR's Agent section.

If something is missing, read it from Linear yourself. Do not start without the intent brief.

## Step 1: Understand the intent

Read the intent brief, the Decisions section, and the whole ticket. Then write **one line** that restates what this ticket is for, in your own words. It goes at the top of the PR. If you cannot write it, read the related code until you can.

Read the repository's agent instructions (`AGENTS.md`, `CLAUDE.md`, or similar) and follow them.

## Step 2: Get the right branch

Work in your own checkout. Never share a working tree with another agent.

- **First attempt:** fetch, then create your branch from the latest integration branch tip, using Linear's branch name for the ticket (it contains the ticket ID).
- **Stacked attempt** (the brief names a **PR base**, another ticket's branch): create your branch from that branch's tip instead, and open your PR into that branch, not the integration branch. The orchestrator links and later retargets it.
- **Fix task or takeover:** continue the **existing** branch. Another worktree may still have it checked out, so do not check it out by name:

  ```sh
  git fetch origin <branch>
  git switch --detach origin/<branch>
  # … work and commit …
  git push origin HEAD:<branch>
  ```

  For a takeover, treat the handoff notes as context, not proof. Check the current code and checks yourself, and keep the earlier commits.

Run the repository's setup and fast check before you change anything. Write down failures that already exist, so you neither chase nor hide them.

## Step 3: Build the smallest change

Build what the acceptance criteria need, and nothing else. For a fix task, fix only what the brief lists.

- Follow the existing patterns and style.
- Do not add abstractions, dependencies, configuration options, or hooks "for later" unless the ticket asks for them.
- Do not refactor code the ticket does not touch.
- Fix the case the ticket describes, not every case you can imagine.
- Get secrets and environment values from the project's configured secrets manager, as its agent instructions say. Do not create environment files unless the project allows them. Never write secret values into code, commits, logs, or the PR.
- If a step carries **WARNING** or **CAUTION**, do exactly what the ticket decided. If it decided nothing, that is a costly decision.

## Step 4: Decide without the user

Sort each question the plan did not answer:

- **Reversible implementation detail** (naming, internal structure, which existing helper to use): choose the simplest option consistent with the intent brief, record it in the PR with a one-line reason, and continue.
- **Costly decision**: user-visible behavior the ticket does not specify, a data model or shared contract change, a WARNING item, or anything outside the repository (production, data, money, external accounts, secrets). Do not ask the user and do not guess. Finish every part that does not depend on it, then report it in your final message:

  ```text
  ESCALATION <ticket-id>
  Blocks: <what cannot continue>
  Options: 1) <recommended> 2) <alternative>
  Recommendation: <1> because <reason>
  Done so far: <work completed and pushed>
  ```

## Step 5: Prove every acceptance criterion

Proof is evidence **you observed in this task**: command output, a passing test, a recording of the running app or preview. A claim is not proof.

- For each criterion, add or un-skip the test its Verify line names, and make it pass.
- Do not weaken, skip, or delete an existing test to get green, including the foundation tests. If a test is genuinely wrong, change it and record why in the PR.
- For UI or runtime behavior, run the app or preview and look at it. Green mocked tests do not prove the user experience works. Capture the screenshot or recording the criterion's Evidence asks for, and publish it as described below.

### Publishing screenshots and recordings

**Use the GitHub CLI, never a browser.** `gh pr create`, `gh pr edit`, and `gh pr comment` take `--attach`, which uploads an image or video as a GitHub attachment. Write the reference into the PR body on a labeled line, then attach the file; `gh` rewrites the local path to the uploaded URL:

```sh
# In the PR body (Evidence section):
#   - Screenshot: ![Archived list after bulk archive](./archived.png)
#   - Video: ![Bulk archive flow](./archive-flow.mp4)
gh pr edit <n> --body-file pr-body.md \
  --attach './archived.png#Archived list after bulk archive' \
  --attach './archive-flow.mp4#Bulk archive flow'
```

- Check first that `gh --version` is 2.99.0 or newer, the first release with `--attach`. If it is older, update `gh` before falling back.
- Up to 50 files per command. The alt text goes after `#`.
- Fallback only when `--attach` is unavailable: link a GitHub Actions artifact that contains the recording (`Video: https://github.com/<owner>/<repo>/actions/runs/<run>/artifacts/<id>`), if the repository's PR standard accepts it.
- Do not commit evidence files to the repository. If you cannot publish evidence at all, say so in the PR.
- If you cannot prove a criterion before merge, do not mark it done. Escalate it.

## Step 6: Commit, push, PR

1. Commit with a Conventional Commit subject and, on its own line in the body of **every** commit, a Linear magic word: `Fixes ENG-123` when the work completes the ticket, `Refs ENG-123` for partial work.
2. Fetch and rebase onto the latest tip of your PR's base: the integration branch for first attempts, the given PR base for stacked attempts, or `origin/<branch>` for fix tasks and takeovers. **Then** run the fast check, so the code you push is the code you checked.
3. **Always push before you end**, even when you are blocked or escalating, so the next agent can continue your work.
4. Open **one** PR into the **integration branch**, or into the given PR base for a stacked attempt (never the default branch), or update the existing one. Use the repository's PR format exactly; do not add top-level headings it does not define. Include:
   - the one-line intent restatement and `Fixes ENG-123` (or `Refs`) in the summary;
   - the acceptance checklist: each criterion ID, the result of its Verify step, and its Evidence;
   - decisions you made and deviations or limitations, as subsections inside the format's sections (for example `### Decisions` under Evidence). An empty deviations list must be true;
   - the UI-changes declaration and the Agent fields with your agent name and thread ID, if the format requires them.

Do not watch the PR and do not merge it.

## Step 7: Report and end

End with a short summary (criteria met with evidence, decisions, escalations, deviations, blockers, and **possible follow-ups**: anything out of scope you noticed but did not do; never file tickets for them), then **exactly this final line**:

```text
PR <url>, head <sha>, checks <passing|failing|pending>
```

If you are blocked before a PR exists, push the branch anyway and end with `PR none, head <sha>, checks none`. The orchestrator checks GitHub, so the line must match it.

## Never

- Ask the user a question. Escalate in your report.
- Push to the integration branch or the default branch, or open a PR into the default branch.
- Bypass branch protection, use admin merges, or force-push any branch you do not own (and then only with `--force-with-lease`).
- Touch production, delete data, spend money, or change external accounts.
- Mark a criterion done without evidence you observed.
- Expand scope beyond the ticket, even when the extra work looks cheap.
- End without pushing your work.
