<!-- Title: type(scope): description. Scope and ticket ID are optional.
Example: fix(auth): correct session expiry.
Every commit needs a Linear magic word (Fixes JIF-65 / Refs JIF-65) or a
"No-ticket: <reason>" footer.
Keep the five required headings in this order and replace the guidance with real content.
See docs/pull-request-standard.md. -->

## Summary

<!-- Briefly describe the resulting behavior. Then declare every ticket the
commits reference, on standalone lines:
Fixes TICKET-1, TICKET-2 for completed tickets.
Refs TICKET-3 for partial work.
Relates to TICKET-4 for a relation without status automation.
Feature PRs also link the Linear project. With no ticket, write
"No ticket: <reason>". PR comments do not create links. -->

Refs TICKET-123

## What

<!-- Describe the concrete changes and their scope. -->

## Why

<!-- Explain the problem, impact, and reason for this approach. -->

## Evidence

UI changes: <!-- Replace with Yes or No. -->

<!-- Include commands/checks and results, plus reviewer-accessible HTTPS proof links
or pasted fenced test/log/API output. State what the evidence demonstrates.
For UI changes, Screenshot and/or Video proof below is required. At least one.
Upload media through GitHub attachments, or link a GitHub Actions artifact;
embed screenshots inline.
State verification limitations. No local-only evidence paths. -->

<!-- UI changes only:
- Screenshot: ![Affected flow](PASTE_GITHUB_ATTACHMENT_URL)
- Video: PASTE_GITHUB_ATTACHMENT_URL
-->

## Agent

- Agent: <!-- Name the agent or automation that created the PR. -->
- Session/thread ID: <!-- Actual chat/thread ID or automation run ID. -->
- Session link: <!-- Link to the chat or run when available. -->

<!-- Optional: model/version, GitHub submitter, parent/delegating thread ID.
Only record known values. For a human-only PR, identify the author and use
"human-authored" as the session/thread ID. -->

## Acceptance checklist

- [ ] Linked ticket acceptance criteria are satisfied.
- [ ] `node scripts/check.mjs` passed on the current changes.
- [ ] Evidence above covers the affected behavior and any verification limitations.
