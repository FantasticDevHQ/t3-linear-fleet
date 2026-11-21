---
name: project-refresh
description: "Bring an existing Linear project up to the fleet spec so project-run can execute it. Invoked as /project-refresh <Linear project URL>. Audits a project whose tickets were written to an older standard (user stories, 3-point slivers, post-merge acceptance criteria, missing intent brief, no t3-fleet labels), proposes a change plan, asks every open question in one batch, then rewrites the intent brief and tickets in place: it keeps ticket IDs, links, and history, saves each old description as a comment first, merges slivers as duplicates, and ends at the readiness gate with an Approved line. Use when the user wants to refresh, upgrade, migrate, clean up, or rewrite an existing Linear project or backlog to the new ticket standard."
metadata:
  author: kellykampen
  version: "1.2.0"
---

# Project Refresh

Turn an existing Linear project into one that `project-run` can execute: a real intent brief, the fewest tickets, acceptance criteria provable inside the PR, and t3-fleet labels. The **target standard is `fleet-plan`** from this skill set; read it first. This skill adds what is different about starting from tickets that already exist: auditing them, preserving their history, and changing them **in place**.

## Input

The Linear project URL, passed as the argument (`/project-refresh https://linear.app/<workspace>/project/<slug>`). If it is missing, ask for it once. If the user named a project without a URL, find it in Linear and confirm the match.

## Step 1: Read everything (no changes yet)

Read, following every page:

- the project description, documents, and recent project updates;
- every issue in the project, including completed and canceled ones: description, status, assignee, estimate, labels, comments, relations, and linked branches and PRs;
- the team hierarchy and the label catalog, with owning team and `inheritedFrom`;
- the repository the project builds on: structure, existing patterns, tests, CI, previews, and agent instructions. Do not ask what the code can answer.
- whether the repository is ready for `project-run`: CI runs on pull requests into `feat/**` and on pushes to `feat/**`; which tests CI runs and which only run on demand (for example a remote end-to-end command); whether previews exist; and which PR standard the repository enforces. A gap here becomes a small **prerequisite ticket** whose PR targets the default branch and merges before `project-run` starts. `project-run` stops at preflight while the gap exists, so this ticket cannot be part of the run. Give it no t3-fleet label, name it under Constraints in the brief as a run prerequisite, and let it block the tickets it gates. Once it merges, it is Done and counts as a met blocker.

With the Linear MCP, `get_issue` returns relations only when you pass both `includeRelations: true` and `"relations"` in `fields`. Read relations in a separate pass and check that at least one ticket has some; an empty result for every ticket usually means the request was wrong, not that there are no links. See [references/linear-notes.md](references/linear-notes.md).

Sort the tickets by state, because each state gets different treatment:

| State | Treatment |
| --- | --- |
| **Done** (merged) | History. Do not rewrite. Use it to understand what exists. |
| **Canceled** or **duplicate** | Leave as is. |
| **In progress** (a branch or open PR exists) | Do not change its scope. Add only what is missing for execution (Verify and Evidence lines, t3-fleet labels, blocker links). A scope problem goes in the question batch. |
| **Not started** | The main target. Rewrite to the standard. |
| **Backlog** (not started, not scheduled) | Usually follow-ups filed during the work. Ask whether each belongs in this run. A Backlog ticket is outside the run unless the user moves it to a not-started state. |

An in-progress ticket whose PR targets the default branch stays as it is: its owner finishes it there. Record it in the plan, because `project-run` treats it as a blocker that is met when it merges into the default branch.

## Step 2: Audit against the standard

Check the project and every not-started ticket against `fleet-plan`:

- **Intent brief:** problem, users, definition of done, non-goals, constraints, decisions, release checks, the dependency flowchart. Most old projects have only a summary; the gaps become drafts or questions.
- **Size:** slivers that only exist to stay under a point cap (merge them), and tickets with two independent outcomes (split them).
- **Requirements:** behavioral tickets without EARS requirements; vague or compound requirements that fail the 29148 checks.
- **Acceptance criteria:** criteria that need a merge, a deploy, production, real users, or time to verify (rewrite as pre-merge proof, or move to release checks); criteria without Verify and Evidence; criteria that are another ticket merging (convert to blocker links).
- **Over-specification:** "how" content with no recorded decision behind it (remove it, or turn a real constraint into a decision).
- **Dependencies:** missing blocker links, links that point the wrong way, and cycles.
- **t3-fleet labels:** `t3-fleet-foundation`, `t3-fleet-local-only`, `t3-fleet-schema-change`, `t3-fleet-risky`, and whether the t3-fleet group exists at the right level.
- **Design and risk:** UI tickets without a design image, and risky steps without WARNING or CAUTION.
- **Model and effort:** tickets without a Fleet section (`Model`, `Effort`). Add one to every ticket in the run, including in-progress tickets (it does not change scope), as `fleet-plan` describes under Model and effort. List the choices in the change plan so the user can change them in one place.
- **Unlinked duplicates:** tickets with the same title or the same requirements and no duplicate relation. Merge them into the one with history.
- **Work no agent can finish in a PR:** external setup, staging checks, live-service checks, release acceptance, and runbooks for the owner. They are release checks. List them in the brief's Release checks. Keep their tickets if the user tracks them as tickets, but they are outside the run.
- **Old delivery rules that conflict with the fleet:** rules in the old description such as "merges after owner authorization", a point cap, or a fixed reviewer model. Keep what still applies. Ask about each conflict in the question batch.
- **Dates:** deadlines or a season that limits the schedule. Put them in Constraints, and say in the question batch if the plan cannot fit them.

## Step 3: Draft the change plan

Write the plan before touching Linear. For each ticket, give exactly one action and a one-line reason:

| Action | Meaning |
| --- | --- |
| **Keep** | Already meets the standard (only labels or links may change). |
| **Rewrite** | Same ticket and ID, description rewritten to the ticket template. |
| **Merge into ENG-n** | Its scope folds into the surviving ticket; it is then marked a duplicate of it. |
| **Split** | It keeps its first outcome; new tickets take the others. |
| **New** | A missing ticket, usually the foundation ticket or a spike. |
| **Cancel** | Out of scope under the intent brief or a non-goal. Never delete. |

Choose the surviving ticket in a merge by: the one with history (branch, PR, comments), then the most complete, then the lowest number.

Also draft the new intent brief, and the rewritten text of every ticket you will change.

## Step 4: Cold read and one batch of questions

Run `fleet-plan` Step 4 (a cold read by a fresh agent, ideally on another provider) on the drafts. Then ask **one batch** through the question tool, as in `fleet-plan` Step 5: decisions with defaults, assumptions, the non-code checklist, plus:

- approval of the change plan, showing every merge, split, cancel, and new ticket;
- each in-progress ticket whose scope conflicts with the new plan.

Fold the answers into the drafts. Ask a follow-up only for a genuinely new product decision.

## Step 5: Apply in place

Make the changes in this order, and read each one back:

Prefer **patches over rewrites**. When a ticket mostly meets the standard, change only the sections that need it: insert Verify and Evidence lines under each criterion, replace an old Entry or Exit line, add a WARNING or CAUTION line. The Linear MCP `save_issue` takes `patch` operations (`insert_after`, `replace`, `replace_range`). Patches keep inline images and text you did not mean to touch. A full rewrite sends back image markup with signed upload URLs that can expire. Generate the patches with a script, apply them to a local copy first, check that every anchor occurs exactly once, and keep the patched copies as the drafts for the cold read.

1. **Preserve the old text.** Before you change a ticket's description, add a comment to it that contains the old description in full, under a heading such as "Description before the fleet refresh (<date>)". Do the same for the project description, as a project document or a project update. If that comment already exists, the ticket was refreshed before: compare, and do not save it twice.
2. **Rewrite the project description** with the new intent brief.
3. **Rewrite tickets** to the ticket template. Keep the ID, assignee, comments, attachments, and links. Update the title to the outcome when the old title was a task. Move post-merge criteria to the intent brief's release checks.
4. **Merge** each sliver: fold its requirements and criteria into the surviving ticket, move its blocker links to the survivor, then mark it a duplicate of the survivor. Never delete a ticket.
5. **Split** and **create** tickets, parented to the project, with labels and estimates.
6. **Relations:** add missing blocker links and fix reversed ones. Remove a link only when it is clearly wrong, and say so in the ticket's comment. Confirm there is no cycle.
7. **Labels:** create the t3-fleet group only if it does not exist, at the workspace or top-most parent team, as `fleet-plan` Step 7 describes. Add and remove individual labels; never replace a ticket's whole label set, so unrelated labels survive.
8. **Cancel** out-of-scope tickets with a comment that names the non-goal.

## Step 6: Readiness gate

Run the `fleet-plan` readiness gate over the whole project. When it passes and the user approved the plan, add `Approved: <date>` at the end of the intent brief. `project-run` will not start without it.

Report: the project link, a table of every ticket with its action and new state, the merges and splits, any remaining open items, and whether the project is ready for `project-run`.

## Never

- Delete a ticket or a comment. Merge as a duplicate, or cancel with a reason.
- Rewrite a Done ticket, or change the scope of an in-progress ticket without the user's answer.
- Change a description before its old text is saved as a comment.
- Replace a ticket's full label set, or create t3-fleet labels on a leaf team.
- Apply changes before the user approves the change plan.
