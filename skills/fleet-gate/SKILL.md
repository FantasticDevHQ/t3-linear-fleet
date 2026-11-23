---
name: fleet-gate
description: "Merge gates and PR event handling for a feature built by parallel agents. Defines when a ticket PR may merge into the feature's integration branch, when the final PR to the default branch is ready for the human (agents never merge it), how to watch PRs without polling (one watcher per PR, owned by the thread that owns the PR, never by delegated children), how to route failures back to the owning worker, how to recheck when the base moved under a PR, and how to freeze merges when integration CI goes red. Use when merging or watching PRs in the fleet workflow, deciding whether a PR is ready, handling a red integration branch, or acting as the orchestrator for a Linear project."
metadata:
  author: kellykampen
  version: "2.1.1"
---

# Fleet Gate

A feature has two kinds of PRs:

- **Ticket PRs** go from a worker's branch into the feature's **integration branch** (for example `feat/billing-export`). The orchestrator merges them when the ticket gate passes.
- **The feature PR** goes from the integration branch into the **default branch**. Agents bring it to the final gate and stop. **The human merges it.** An agent merges it only when the user explicitly says so for this feature.

The thread that owns a PR decides on it. A watcher wake-up is news, not a decision: always check the gate yourself on the latest head before you act.

## Ticket gate

A **stacked** ticket PR (its base is another ticket's branch) never merges while that base is unmerged: merge the bottom PR first through this gate, the ordinary way with its explicit squash message (`gh stack merge` cannot set one), rebase the stacked one onto the integration branch, then run this gate on it.

Merge a ticket PR into the integration branch only when **all** of these are true on its **latest head commit**:

- [ ] Every check on the PR has completed and passed, and at least one check ran. Branch protection is often configured only for the default branch, so do not rely on "required" checks alone.
- [ ] The PR's acceptance checklist shows every criterion with a Verify result and Evidence.
- [ ] `fleet-review` ended **Approved** on the latest head, or on an earlier head when every later commit is a merge of the integration branch with no conflicts, or changes only Markdown documentation, comments, or the PR body (as `fleet-review` defines): a reviewer from a provider that wrote none of the PR's commits verified every acceptance criterion, and no **blocker** or **should** finding is open. Tickets labeled `t3-fleet-risky` used the strongest reviewer.
- [ ] Every commit carries a Linear magic word, and the PR summary declares the ticket.
- [ ] GitHub reports the PR mergeable, and not DIRTY (conflicting).
- [ ] The integration branch is not frozen, or this is a **repair PR** (a fix-forward or revert during a freeze), which is exempt.
- [ ] If the integration branch moved since the last green run **and** the new commits touch files in this PR, the PR was updated and its checks are green again. If the new commits touch none of its files, merge without updating.

Then fetch and look at the PR once more, and squash-merge it with an **explicit** message, because the repository's default squash message may drop the PR body:

```sh
gh pr merge <n> --squash --subject "<PR title> (#<n>)" --body "<summary>

Fixes <ENG-123>"
```

Never use `--admin` or any other protection bypass. If a check fails or the gate cannot pass, route the PR back (see Events).

## Final gate

Bring the feature PR to this state, then **stop**:

- [ ] Every ticket PR for the feature is merged, and no ticket is open except ones explicitly moved out of scope.
- [ ] The integration branch includes the latest default branch (merge it in; never rebase a shared integration branch), and full CI is green on that exact head.
- [ ] No foundation (Wave 0) test is still skipped. No test was weakened without a recorded decision.
- [ ] The feature fleet-review has finished with no open blocker or should finding.
- [ ] Every review-bot thread is resolved, or dismissed with a written reason.
- [ ] The PR summary lists **every** ticket again (`Fixes ENG-1, ENG-2, …`) and links the Linear project, because Linear does not re-detect tickets merged into a feature branch.
- [ ] The evidence packet is in the PR description. For a user-facing feature it leads with a recording of the definition of done on the preview deploy. For a backend feature it leads with the command, API, or test transcripts that prove the definition of done.
- [ ] The evidence was captured on the current head. If the head changed after capture, the evidence was refreshed.

When the gate passes, report **ready** to the human with the PR link, head commit, and evidence summary. Leave the PR open and unmerged. If the default branch moves before the human merges, merge it in again and rerun the checks.

## Watching PRs

- **One watcher per PR.** Every watcher on a GitHub account shares one rate limit.
- **Only the thread that owns the PR watches it.** That is the orchestrator. A delegated child (a worker, a reviewer) never watches a PR; its parent does.
- **Never poll.** No `sleep` loops and no hand-written watchers. In T3 Code, handle any current state first, then call `watch_pull_request` and end your turn; T3 wakes you on check results, comments, reviews, and conflicts. It reports conflicts but not BEHIND, so check that yourself before a merge. Outside T3, use your harness's PR event mechanism, or one background watch command with a monitor.
- **Watch only PRs that need a decision**, plus the feature PR once it exists: the integration branch's full suite reports there. Its `PR standard` status may stay red until the evidence packet is written; that is not a reason to freeze. Keep the number of open watches small (about 5). Merging or closing a PR ends its watch.
- **Unwatch before you hand off** or wait on the human, so the thread does not look busy.
- If a watcher stops because it could not read GitHub, check `gh api rate_limit` before watching again, and wait for the reset if it is used up. When GraphQL is used up, REST (`gh api repos/<owner>/<repo>/pulls/<n>`) usually still works.
- When an event needs no action, stay silent. Never post or say "still waiting".

## Events

| Event | Action |
| --- | --- |
| A check failed | Look at the log. Infrastructure flake: rerun once. Real failure: dispatch a fix task, with the log link. |
| Conflict (DIRTY) | Dispatch a fix task to rebase and recheck. |
| Review comment or bot finding | Verify it against the code. Dispatch a fix task for real findings. Act only on comments newer than the latest push. |
| Integration branch moved and touched the PR's files | The PR updates its branch and reruns checks before the ticket gate. |
| The fix budget is spent, or a worker reports blocked | Dispatch one takeover by a fresh agent, which continues the branch and keeps the earlier commits. |
| PR merged | Confirm the ticket's status in Linear and dispatch tickets it unblocked. |

Workers are one-shot tasks that end when they report, so every follow-up is a **new** task on the same branch: a fix task carries the event and its evidence, and counts as one fix cycle. The orchestrator counts the cycles.

## Red integration branch: freeze

Every push to the integration branch runs the full suite. When it fails:

1. Rerun it once. If it passes with no change, it was a flake: record the test in the Run log and continue.
2. If it fails again, **freeze**: stop merging ticket PRs into the integration branch. Workers keep building; only merges stop.
3. Find the cause: map the failing test to a ticket, or test the merges since the last green run.
4. Dispatch one agent to **fix forward**, with a time budget. It works on a repair branch from the integration tip and opens a **repair PR** into the integration branch. Its commits carry `Refs` for the ticket that caused the failure. The repair PR goes through the ticket gate, which exempts it from the freeze.
5. If the fix misses its budget, revert the newest merges until the suite is green, through a repair PR of revert commits (each with `Refs` for the reverted ticket). Move the reverted tickets back to the team's started status and dispatch fix tasks for them. Tell the workers of any open ticket PRs built on reverted work to rebase.
6. Unfreeze when the full suite is green on the current head.

## Never

- Merge the feature PR without the user's explicit instruction for this feature.
- Merge any PR that is DIRTY, has failing required checks, or has base changes since the last green run that touch its files.
- Bypass branch protection, use admin merges, or skip a required check.
- Rebase or force-push the integration branch.
- Watch a PR from a delegated child, or run two watchers on one PR.
