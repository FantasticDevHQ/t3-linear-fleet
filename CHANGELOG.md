# Changelog

## Unreleased

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
