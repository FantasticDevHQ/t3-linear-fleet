# Changelog

## Unreleased

- `issue-breakdown` 2.0.0: rewritten for unattended agents. It adds an intent brief, research before questions, a cold read by a fresh agent, one batch of questions (decisions with defaults, assumptions, non-code checklist), a foundation ticket for shared groundwork, three-part acceptance criteria (criterion, Verify, Evidence) that can be proven inside the PR with post-release checks moved to the brief, a readiness gate, and commit-level Linear linking. It removes the 3-point split rule, the mandatory user-story format, and the EARS, STE100, and traceability requirements.
- Created the repo.
- Applied the Fantastic.Dev OSS standards: standard header with the official logo, Quick start with an agent setup prompt and manual steps, the PR standard v2 (commit-level Linear linking: optional ticket in titles, a magic word or `No-ticket:` on every commit, Summary declares every ticket the commits reference), and a `Repository quality gates` check that validates skills.
- Copied `issue-breakdown` from `kellykampen/agent-skills`, with its git history. The original stays in agent-skills unchanged. This copy will be rewritten for the fleet workflow and will diverge from the original.
