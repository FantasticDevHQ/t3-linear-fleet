# Changelog

## Unreleased

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
