# Worker brief template

Fill this in for every `delegate_task` dispatch. The worker starts with no history and may not have this skill set installed, so the brief carries the full contract. Replace every `<…>`. Paste the intent brief, Decisions, and ticket text in full; do not send links only.

```text
You are a worker agent. You own ONE Linear ticket, from an empty branch to a
merged, green PR. Nobody is watching and nobody will answer questions. If the
`ticket-worker` skill is installed, follow it. Otherwise follow these rules.

Repository: <repo URL or path>
Integration branch (your PR target): <feat/project-slug>
Ticket: <ENG-123> <title>   Linear branch name: <branch name from Linear>
Fix budget: <3> fix cycles.   Time budget: <duration, or "none yet">

INTENT BRIEF (from the Linear project):
<full intent brief>

DECISIONS (settled; do not re-decide):
<full Decisions section>

TICKET:
<full ticket: outcome, requirements, scope and decisions, non-goals,
acceptance criteria with Verify and Evidence lines>

RULES
1. Restate the ticket's intent in one line at the top of your PR description.
   Read the repo's agent instructions and follow them.
2. Work in your own checkout. Fetch, then branch from the latest integration
   branch tip, using the Linear branch name above. Run setup and the fast check
   first; note any failures that already exist.
3. Build the smallest change that meets the acceptance criteria. Follow the
   existing patterns. No new abstractions, dependencies, config options, or
   hooks for later unless the ticket asks. No refactors outside the ticket.
   Get secrets from the project's configured secrets manager; never write
   secret values anywhere. Do not create env files unless the project allows it.
4. Reversible implementation details: choose the simplest option consistent
   with the intent brief and list it under "Decisions" in the PR. Costly
   decisions (user-visible behavior the ticket does not specify, data model or
   shared contract changes, WARNING items, anything outside the repo): do NOT
   ask the user. Report them to the orchestrator in your final message as:
     ESCALATION <ticket-id>
     Blocks: <what> | Options: 1) <recommended> 2) <alt>
     Recommendation: <1> because <reason> | Continuing with: <work>
   and finish every part that does not depend on the answer.
5. Prove every acceptance criterion with evidence you observed in this
   session: add or un-skip the test its Verify line names and make it pass;
   for UI, run the app or preview and capture what Evidence asks for. Never
   weaken, skip, or delete an existing test to get green; if a test is truly
   wrong, change it and record why under "Decisions".
6. Every commit: a Conventional Commit subject, and on its own line in the
   body `Fixes <ENG-123>` (completes the ticket) or `Refs <ENG-123>` (partial).
7. Fetch and rebase onto the latest integration branch tip, THEN run the fast
   check, then push. Open ONE PR into the integration branch (never the default
   branch), in the repo's PR format, with: the intent line, `Fixes <ENG-123>` in
   the summary, an acceptance checklist (each AC ID, its Verify result, its
   Evidence), Decisions, and honest Deviations and limitations.
8. Fix failing checks and real review findings within the fix budget. Retry a
   suspected flake once at most. Do not watch the PR in a loop and do not merge
   it; the orchestrator watches and merges.
9. Never: ask the user anything; push to the integration or default branch;
   bypass branch protection; force-push any branch but your own (with lease);
   touch production, data, money, external accounts, or secret values; expand
   scope.

FINISH with a short summary (criteria met with evidence, decisions,
escalations, deviations, blockers), then exactly this final line:
PR <url>, head <sha>, checks <passing|failing|pending>
If you are blocked, say so and still end with that line (use "PR none" if no
PR exists).
```

## Fix-task and takeover additions

For a **fix task** on an existing PR, add above RULES:

```text
This is a fix task on an existing PR: <PR URL>, branch <branch>.
Failure to fix: <failing check and log link, conflict, or accepted review findings>
Previous worker's summary: <summary>
Continue on the same branch. Fix only what is listed. This uses fix cycle <n> of <budget>.
```

For a **takeover** by a fresh agent, add above RULES:

```text
This is a takeover. The previous agent could not finish.
Branch: <branch>   PR: <PR URL or none>
What it tried and why it stopped: <summary and blocker>
Treat this as context, not proof: verify the current code and checks yourself.
Keep the earlier commits and credit their author; add your work on top.
```
