# Changelog

## Unreleased

- **Stacked dispatch for dependency chains (opt-in).** With "stack dependent tickets" in the run request, `fleet-run` 2.1.0 starts a ticket whose only unmerged blocker has an open, green PR on top of that PR as a two-layer stack. It links the PRs with `gh stack link`, merges the bottom with `gh stack merge --squash`, and rebases the top onto the integration branch afterwards. It falls back to waiting when stacked PRs are not enabled. `fleet-worker` 2.1.0 builds stacked attempts on the given PR base, `fleet-gate` 2.1.0 never merges a stacked PR before its base, and `fleet-setup` 1.2.0 checks for the optional `gh-stack` extension. Ticket PRs still fan in to the integration branch, which `gh stack` cannot model as one stack.

- `fleet-setup` 1.1.0 verifies Linear workflow statuses through the API (an "Integrated" status for the feature-branch rule) instead of trusting the user's confirmation, and marks the settings the API cannot read as confirmed, not verified. `fleet-run` 2.0.1 always checks the first merged ticket's status, because the branch rule itself cannot be read through the API. The pilot run found a team with no Integrated status after setup had reported ready.
- `gh` 2.99.0 is now the stated minimum for `--attach` evidence uploads (`fleet-setup`, `fleet-run` 2.0.1, `fleet-worker` 2.0.1, README), checked with `gh --version` instead of reading help text.
- README: secrets and external accounts are no longer listed as a general requirement; the `fleet-run` usage notes say to add any the plan needs before a run.

- **Breaking: every skill now starts with `fleet-`.** Generic names were hard to find and could collide with other skill collections. Renamed (each to 2.0.0):

  | Before | After |
  | --- | --- |
  | `project-run` | `fleet-run` |
  | `project-refresh` | `fleet-refresh` |
  | `ticket-worker` | `fleet-worker` |
  | `pr-gate` | `fleet-gate` |
  | `review-loop` | `fleet-review` |
  | `panel-review` | `fleet-panel-review` |

  `fleet-setup`, `fleet-plan`, and `fleet-models` keep their names. Reinstall, and remove the old names from your skill manager.

- **The least change, and no scope creep.** `fleet-plan` 3.2.0 makes each ticket the least change that meets its outcome, and the plan the fewest tickets that meet the definition of done. The approved plan is the whole scope. `project-run` 1.7.0 does not create or widen tickets on its own during a run: workers (`ticket-worker` 1.3.0) and reviewers (`review-loop` 1.2.1) report out-of-scope ideas as possible follow-ups, which the final report lists for the user to decide, and a real gap is escalated as a planning gap: the user approves one new ticket for exactly that gap, changes the definition of done, or stops the run. Feature-review findings are sorted into fixes for the owning ticket, follow-ups, or planning gaps. `project-refresh` 1.5.0 adds a new ticket only when the definition of done cannot be met without it.

- Every ticket is now verified and reviewed by an independent model from another provider before it merges, not only risky tickets. `review-loop` 1.2.0 gives ordinary tickets one round with a capable, inexpensive reviewer that checks each acceptance criterion's Verify and Evidence on the latest head, and keeps two rounds with the strongest reviewer for risky tickets. `fleet-models` 1.1.0 adds the rule for choosing a reviewer, `pr-gate` 1.2.0 requires an approved review in the ticket gate, and `project-run` 1.6.0 reviews every green ticket PR. The review brief tells reviewers that pending CI is not a finding, because the merge gate checks CI.
  - Only an approval of the PR's latest head passes the gate, or of an earlier head followed only by conflict-free merges of the integration branch. Every new head after a review gets a verification round, and the old "passed after fixes" result is gone. The reviewer must come from a provider that wrote none of the PR's commits, or the review is escalated. A ticket gets at most 3 verification rounds; a stuck review is escalated. Fixes for review findings count as fix cycles. The brief carries the PR link and each criterion's Evidence, and asks the reviewer to verify each criterion.

- Lessons from re-running `/project-refresh` on an already refreshed project:
  - `project-refresh` 1.4.0 adds **Running it again**. It handles tickets that entered or left the run since approval, stale brief notes, open prerequisites, and writes that never applied. It re-approves only for scope changes. Work outside the definition of done now moves to another project instead of staying in the run. Every write is read back, and a merge whose duplicate link fails becomes a cancel with a comment.
  - `references/linear-notes.md` notes that `duplicateOf` and `relatedTo` can report success without applying, and that `list_issues` rejects some `get_issue` fields.
  - `fleet-plan` 3.1.3 requires the brief's dependency graph to list every ticket in the run, so a later refresh can tell approved scope from new scope.
  - `fleet-setup` 1.0.1 recognizes the t3-fleet group by its four labels and renames an old group name instead of creating a second group.

- `fleet-setup` 1.0.0: one-time setup and health check. It checks Linear access (MCP or linear-cli), T3 Code providers (two needed for cross-provider review), and `gh` with `--attach`. It creates the `t3-fleet` label group at the right level, walks the user through Linear's GitHub automation, runs `fleet-models`, and ends with a ready checklist. The README's setup section now points to it. `fleet-plan` 3.1.2 asks where to create a missing label group in its single question batch, then creates it with `fleet-setup`.

- `fleet-models` 1.0.0: classifies the user's favorite models in T3 Code once. It proposes intelligence, taste, cost and best-use defaults, the user confirms or edits them in one question, and the result is saved to `~/.config/t3-linear-fleet/models.json`. Only favorites added later are asked about; removed favorites keep their ratings. It also holds the rule for choosing a ticket's model and the closest replacement.
- `fleet-plan` 3.1.0 and `project-refresh` 1.3.0 choose models through `fleet-models`. `project-run` 1.5.0 uses its classification to replace an unavailable model and never asks for classification mid-run.
- Reading favorites from T3 Code's `settings.json` is the supported source, not a stopgap.
- The README skills table is up to date, and `scripts/validate-skills.mjs` now fails when a skills-table row's version differs from the skill's `metadata.version` (helpers in `scripts/skill-versions.mjs`, with tests).

- **Breaking:** `issue-breakdown` is renamed `fleet-plan` (3.0.0), and its description now targets fleet planning. Another widely installed skill named `issue-breakdown` made the two collide in skill managers, so only one could be installed. `project-run` and `project-refresh` now refer to `fleet-plan`. Reinstall to pick up the new name.

- Model and effort per ticket: every ticket gets a required **Fleet** section (`Model`, `Effort`, optional `Why`). Labels were rejected because Linear label groups cannot nest, label names must be unique across the workspace, and model IDs and effort scales change too often.
  - `issue-breakdown` 2.3.0 picks the model from the user's T3 Code favorites (the `favorites` list in T3 Code's settings file, until T3 Code exposes favorites to agents). It uses a model-classification skill if one is installed, or a built-in rule of intelligence, then taste, then cost. Effort is `low`, `medium`, `high`, `xhigh`, or `max`. The readiness gate requires the section.
  - `project-refresh` 1.2.0 adds the section to every ticket in the run.
  - `project-run` 1.4.0 checks each ticket's model at preflight and swaps an unavailable one for the closest candidate. It dispatches to any machine and provider that offers the model, maps effort to the provider's own option, never sets special modes unless the run request asks, and logs provider, model, and effort per attempt.

- Lessons from the first `/project-refresh` pilot, on a real 42-ticket project:
  - The fleet labels are now `t3-fleet-foundation`, `t3-fleet-local-only`, `t3-fleet-schema-change`, and `t3-fleet-risky`, in a group named `t3-fleet`. Linear label names are unique across the workspace and every team, so plain names such as `foundation` clash with labels that already exist (`issue-breakdown` 2.2.0, `project-run` 1.3.0, `project-refresh` 1.1.0, `pr-gate` 1.1.1, README).
  - `project-refresh` 1.1.0:
    - Audits whether the repository is ready for `project-run` (CI on `feat/**`, which tests CI runs). A gap becomes a prerequisite ticket that merges into the default branch before the run, plus unlinked duplicates, work no PR can prove (it moves to Release checks), old delivery rules that conflict with the fleet, and deadlines.
    - Backlog tickets stay out of the run unless the user includes them.
    - Prefers section patches to full rewrites, so inline images and untouched text survive.
    - New `references/linear-notes.md` covers relations needing two flags, team `parentId`, label catalog gaps, Markdown normalization, chunked bulk writes, and write-once programs. It works with any Linear MCP host.
  - `project-run` 1.3.0: preflight first decides which tickets are in the run, then validates only those tickets. Backlog, Done, canceled, duplicate, and release-check tickets are out. An in-progress PR into the default branch is a blocker that is met when it merges there.
  - `issue-breakdown` 2.2.0: reads team label groups and treats a name-clash error as the final label check.

- Publish prep: CI and license badges in the README header, and neutral example workspace URLs in the validator tests.
- Evidence uploads go through `gh pr create|edit|comment --attach`, never a browser: `ticket-worker` 1.2.0, `project-run` 1.2.0 (the preflight checks `--attach`), the worker brief, the evidence packet, and the PR standard doc. Actions artifacts are now only the fallback.
- `panel-review` 1.0.0: an optional review by three flagship models from three providers. Each panelist works read-only and returns a score; findings are checked against the source and disagreements settled; scope additions are declined; fresh rounds run after fixes; a per-round score table goes in the PR.
- Skill names stay distinct from other collections: the planned multi-provider review is `panel-review`, and `project-run` no longer advertises a 'full send' trigger. AGENTS.md records the rule.
- `project-refresh` 1.0.0: `/project-refresh <Linear project URL>` audits an existing project against the issue-breakdown standard, proposes a change plan, asks one batch of questions, and rewrites the project in place. It keeps IDs, links, and history, saves old descriptions as comments, merges slivers as duplicates, sets Fleet labels, and ends at the readiness gate.
- Council review fixes (four cross-provider reviewers):
  - `project-run` 1.1.0:
    - No config file. Machines, providers, and per-machine projects are discovered through T3 Code at run time, and limits are set in the run request.
    - Preflight adds a smoke test per machine and checks CI and previews on `feat/**`, the evidence upload path, and the Linear branch rule.
    - The feature PR opens after the foundation merges.
    - Every attempt gets a unique `clientRequestId`, and a one-time `schedule_task` wake-up catches hung workers.
    - The orchestrator owns fix cycles. Escalations are batched only when nothing else can run.
  - `ticket-worker` 1.1.0: one-shot attempts that always push. Fix tasks and takeovers continue the existing branch without checking it out by name. The PR follows the repo format. It is the single canonical worker contract; the worker brief now appends it instead of repeating it.
  - `pr-gate` 1.1.0:
    - The ticket gate requires completed checks.
    - Squash messages are explicit.
    - Repair PRs are exempt from the freeze.
    - Evidence matches the feature type, and the feature PR is watched.
  - `review-loop` 1.1.0: 2 rounds for risky tickets; "stuck" means an unresolved dispute; the brief works on remote machines.
  - `issue-breakdown` 2.1.0:
    - The Fleet label group (`foundation`, `local-only`, `schema-change`, `risky`) at the workspace or top-most parent team.
    - An `Approved:` line and a cycle check.
    - A trimmed `linear-cli` reference with personal names removed.
  - The PR standard accepts GitHub Actions artifact links as UI evidence.
- `project-run` 1.0.0: the orchestrator. It runs preflight, creates the integration branch and a draft feature PR with a Run log, runs the foundation first, dispatches tickets on blockers across T3 Code machines and providers using the fleet config, merges through `pr-gate`, freezes on red CI, hands stuck tickets to fresh agents, batches escalations, runs the feature review and evidence agent, and stops for the human. Includes the worker brief, evidence packet, and example fleet config.
- `ticket-worker` 1.0.0: the brief a worker agent follows, from the intent restatement to a merged, green PR, with escalation to the orchestrator and a fixed final report line.
- `pr-gate` 1.0.0: the ticket and final merge gates, PR watching without polling, event routing, and the freeze on a red integration branch.
- `review-loop` 1.0.0: budgeted review by a different provider, with blocker / should / nit severity, a ledger, and checks for over-engineering and weakened tests.
- `issue-breakdown` 2.0.0: rewritten for unattended agents. It adds an intent brief, research before questions, a cold read by a fresh agent, one batch of questions (decisions with defaults, assumptions, non-code checklist), a foundation ticket for shared groundwork, three-part acceptance criteria (criterion, Verify, Evidence) that can be proven inside the PR with post-release checks moved to the brief, a readiness gate, and commit-level Linear linking. It keeps the STE100 wording, EARS requirements (now for behavioral tickets), the ISO 29148 quality checks (now in the readiness gate), REQ → AC → TEST traceability (combined with the Verify and Evidence lines), the Mermaid dependency diagram, and WARNING/CAUTION markers. It removes the 3-point split rule and makes the user-story format optional.
- Created the repo.
- Applied the Fantastic.Dev OSS standards: standard header with the official logo, Quick start with an agent setup prompt and manual steps, the PR standard v2 (commit-level Linear linking: optional ticket in titles, a magic word or `No-ticket:` on every commit, Summary declares every ticket the commits reference), and a `Repository quality gates` check that validates skills.
- Copied `issue-breakdown` from `kellykampen/agent-skills`, with its git history. The original stays in agent-skills unchanged. This copy will be rewritten for the fleet workflow and will diverge from the original.
